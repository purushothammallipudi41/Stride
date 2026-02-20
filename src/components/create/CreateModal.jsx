import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Image, Music, MapPin, Users, Share2, Film, Search, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import './CreateModal.css';
import { audiusService } from '../../services/audiusService';
import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';
import { useMusic } from '../../context/MusicContext';
import MediaCapture from '../common/MediaCapture';
import StoryEditor from './StoryEditor';
import ImageCropper from './ImageCropper';

const CreateModal = ({ isOpen, onClose, initialTab = 'post', lockTab = false, remixData = null }) => {
    const { addPost, fetchStories, addStory } = useContent();
    const { user } = useAuth();
    const { playTrack } = useMusic();
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync activeTab when initialTab changes (e.g. when opening from different triggers)
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            if (remixData) {
                setSelections(prev => ({
                    ...prev,
                    music: remixData.music,
                    parentPostId: remixData.parentPostId
                }));
                setCaption(`Remix with @${remixData.originalUsername} #VibeBattle`);
            }
        }
    }, [isOpen, initialTab, remixData]);
    const [caption, setCaption] = useState('');
    const [capturedMedia, setCapturedMedia] = useState(null);
    const [activeSearch, setActiveSearch] = useState(null); // 'location', 'people', 'music'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selections, setSelections] = useState({
        location: null,
        music: null,
        people: [],
        parentPostId: null
    });
    const [isSensitive, setIsSensitive] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isCropping, setIsCropping] = useState(false);
    const [tempMedia, setTempMedia] = useState(null);

    useEffect(() => {
        if (!searchQuery) {
            if (activeSearch === 'music') {
                const fetchTrending = async () => {
                    setIsSearching(true);
                    try {
                        const results = await audiusService.getTrending();
                        setSearchResults(results);
                    } catch (err) {
                        console.error("Trending fetch failed:", err);
                    } finally {
                        setIsSearching(false);
                    }
                };
                fetchTrending();
            } else if (activeSearch === 'people') {
                // Fetch initial users or show empty
                setSearchResults([]);
            } else {
                setSearchResults([]);
            }
            return;
        }

        const debounce = setTimeout(async () => {
            setIsSearching(true);
            try {
                if (activeSearch === 'music') {
                    const results = await audiusService.search(searchQuery);
                    setSearchResults(results);
                } else if (activeSearch === 'location') {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=12&addressdetails=1`);
                    const data = await response.json();
                    const locations = data.map(item => {
                        const nameParts = item.display_name.split(',').map(p => p.trim());
                        // Join the first 3 parts for a balance of specificity and length
                        // Usually: [Building/Place, Road/Neighborhood, City, ...]
                        return nameParts.slice(0, 3).join(', ');
                    });
                    setSearchResults([...new Set(locations)]); // Unique results
                } else if (activeSearch === 'people') {
                    const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
                    const users = await response.json();
                    setSearchResults(users);
                }
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(debounce);
    }, [searchQuery, activeSearch]);

    // When media is captured, if it's a story, enable editing mode
    useEffect(() => {
        if (capturedMedia && activeTab === 'story') {
            setIsEditing(true);
        } else {
            setIsEditing(false);
        }
    }, [capturedMedia, activeTab]);

    const handleShare = async (editedMediaUrl = null) => {
        let mediaUrl = editedMediaUrl || capturedMedia?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format';
        const isBlob = mediaUrl.startsWith('blob:');

        // Always convert blob URL to base64 to ensure persistence on backend
        if (isBlob) {
            try {
                const response = await fetch(mediaUrl);
                const blob = await response.blob();
                mediaUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.error("Failed to convert blob to base64", e);
                alert("Failed to process media. Please try again.");
                return;
            }
        }

        if (mediaUrl.startsWith('blob:')) {
            alert("Failed to process image. Please try again.");
            return;
        }

        const posterUrl = capturedMedia?.posterUrl || null; // Assuming posterUrl might be available for videos

        const postData = {
            username: user.username,
            userId: user.id || user._id || user.email, // Use user.id or _id if available, fallback to email
            userAvatar: user.avatar,
            type: activeTab,
            contentUrl: mediaUrl,
            posterUrl: posterUrl,
            caption,
            musicTrack: selections.music ? `${selections.music.title} - ${selections.music.artist}` : '',
            location: selections.location,
            taggedUsers: selections.people.map(u => u.username),
            isSensitive,
            isRemix: !!selections.parentPostId,
            parentPostId: selections.parentPostId
        };

        const success = await (activeTab === 'story' ? addStory({
            userId: user.email,
            username: user.username,
            userAvatar: user.avatar,
            content: mediaUrl,
            type: capturedMedia?.type === 'video' ? 'video' : 'image'
        }) : addPost(postData));

        if (success) {
            if (activeTab === 'story') fetchStories();
            onClose();
        } else {
            alert("Failed to share post. Please try again.");
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className={`create-modal ${capturedMedia ? 'full-flow' : ''}`} onClick={e => e.stopPropagation()}>

                {/* Story Editor Mode */}
                {isEditing && capturedMedia ? (
                    <StoryEditor
                        mediaSrc={capturedMedia.url}
                        mediaType={capturedMedia.type}
                        onFinish={(editedUrl) => handleShare(editedUrl)}
                        onCancel={() => { setCapturedMedia(null); setIsEditing(false); }}
                    />
                ) : (
                    <>
                        <div className="modal-header">
                            <button className="close-btn" onClick={() => activeSearch ? setActiveSearch(null) : onClose()}>
                                {activeSearch ? <ArrowLeft size={24} /> : <X size={24} />}
                            </button>
                            <h3>{activeSearch ? `Search ${activeSearch}` : `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}</h3>
                            {capturedMedia && !activeSearch && <button className="share-btn-top" onClick={() => handleShare()}><ChevronRight size={24} /></button>}
                        </div>

                        {!activeSearch ? (
                            <>
                                {!lockTab && (
                                    <div className="modal-tabs">
                                        {(initialTab === 'story' ? ['story'] : ['post', 'reel']).map(tab => (
                                            <button
                                                key={tab}
                                                className={`tab ${activeTab === tab ? 'active' : ''}`}
                                                onClick={() => { setActiveTab(tab); setCapturedMedia(null); }}
                                            >
                                                {tab === 'post' && <Image size={20} />}
                                                {tab === 'story' && <Camera size={20} />}
                                                {tab === 'reel' && <Film size={20} />}
                                                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="modal-body">
                                    {isCropping ? (
                                        <div className="cropper-boundary animate-in">
                                            <ImageCropper
                                                src={tempMedia.url}
                                                onCrop={(croppedUrl) => {
                                                    setCapturedMedia({ ...tempMedia, url: croppedUrl });
                                                    setIsCropping(false);
                                                }}
                                                onCancel={() => {
                                                    setCapturedMedia(tempMedia);
                                                    setIsCropping(false);
                                                }}
                                            />
                                        </div>
                                    ) : !capturedMedia ? (
                                        <div className="media-capture-boundary">
                                            <MediaCapture
                                                type={activeTab === 'post' || activeTab === 'story' ? 'image' : activeTab === 'reel' ? 'video' : 'all'}
                                                onCapture={(url, type) => {
                                                    if (type === 'image' && activeTab === 'post') {
                                                        setTempMedia({ url, type });
                                                        setIsCropping(true);
                                                    } else {
                                                        setCapturedMedia({ url, type });
                                                    }
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="post-finalizing animate-in">
                                            <div className="preview-small">
                                                {capturedMedia.type === 'video' ?
                                                    <video src={capturedMedia.url} muted autoPlay loop /> :
                                                    <img src={capturedMedia.url} alt="" />
                                                }
                                            </div>
                                            <div className="post-options">
                                                <textarea placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} />
                                                <div className="options-list">
                                                    <div className="option-item" onClick={() => setActiveSearch('location')}>
                                                        <MapPin size={20} /> <span>{selections.location || 'Add Location'}</span>
                                                    </div>
                                                    <div className="option-item" onClick={() => setActiveSearch('music')}>
                                                        <Music size={20} /> <span>{selections.music?.title || 'Add Music'}</span>
                                                    </div>
                                                    <div className="option-item" onClick={() => setActiveSearch('people')}>
                                                        <Users size={20} /> <span>{selections.people.length > 0 ? `${selections.people.length} People Tagged` : 'Tag People'}</span>
                                                    </div>
                                                    <div className="option-item sensitivity-toggle" onClick={() => setIsSensitive(!isSensitive)}>
                                                        <AlertCircle size={20} style={{ color: isSensitive ? '#ff4b4b' : '#888' }} />
                                                        <div className="toggle-label">
                                                            <span>Mark as Sensitive</span>
                                                            <p>Hide content behind a warning for others</p>
                                                        </div>
                                                        <div className={`toggle-switch ${isSensitive ? 'active' : ''}`}>
                                                            <div className="knob" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {capturedMedia && (
                                    <div className="modal-footer">
                                        <button className="main-share-btn" onClick={() => handleShare()}>Share to {activeTab}</button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="search-layer">
                                <div className="search-bar">
                                    <Search size={20} />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder={`Search ${activeSearch}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="search-results">
                                    {isSearching && (
                                        <div className="search-loading" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                                            <div className="loading-spinner-small" style={{ margin: '0 auto 10px' }}></div>
                                            <span>Searching {activeSearch}...</span>
                                        </div>
                                    )}
                                    {!isSearching && searchQuery && searchResults.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            No {activeSearch} found for "{searchQuery}"
                                        </div>
                                    )}
                                    {searchResults.map((result, i) => (
                                        <div key={i} className="search-result-item" onClick={() => {
                                            if (activeSearch === 'music') {
                                                setSelections({ ...selections, music: result });
                                                playTrack(result);
                                                setActiveSearch(null);
                                                setSearchQuery('');
                                            }
                                            else if (activeSearch === 'location') {
                                                setSelections({ ...selections, location: result });
                                                setActiveSearch(null);
                                                setSearchQuery('');
                                            }
                                            else if (activeSearch === 'people') {
                                                const isTagged = selections.people.some(p => p.username === result.username);
                                                if (isTagged) {
                                                    setSelections({
                                                        ...selections,
                                                        people: selections.people.filter(p => p.username !== result.username)
                                                    });
                                                } else {
                                                    setSelections({
                                                        ...selections,
                                                        people: [...selections.people, result]
                                                    });
                                                }
                                                // Keep search open for more tagging
                                            }
                                        }}>
                                            {activeSearch === 'music' ? (
                                                <>
                                                    <img src={result.cover} alt="" />
                                                    <div className="item-info">
                                                        <span className="item-title">{result.title}</span>
                                                        <span className="item-subtitle">{result.artist}</span>
                                                    </div>
                                                </>
                                            ) : activeSearch === 'people' ? (
                                                <div className="user-search-item">
                                                    <img src={result.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${result.username}`} alt="" className="user-avatar-mini" />
                                                    <div className="item-info">
                                                        <span className="item-title">@{result.username}</span>
                                                        <span className="item-subtitle">{result.name}</span>
                                                    </div>
                                                    {selections.people.some(p => p.username === result.username) && (
                                                        <div className="tagged-badge">Tagged</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span>{result}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};

export default CreateModal;
