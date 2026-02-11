import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Image, Music, MapPin, Users, Share2, Film, Search, ChevronRight, AlertCircle } from 'lucide-react';
import './CreateModal.css';
import { audiusService } from '../../services/audiusService';
import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';
import { useMusic } from '../../context/MusicContext';
import MediaCapture from '../common/MediaCapture';

const CreateModal = ({ isOpen, onClose }) => {
    const { addPost, fetchStories } = useContent();
    const { user } = useAuth();
    const { playTrack } = useMusic();
    const [activeTab, setActiveTab] = useState('post');
    const [caption, setCaption] = useState('');
    const [capturedMedia, setCapturedMedia] = useState(null);
    const [activeSearch, setActiveSearch] = useState(null); // 'location', 'people', 'music'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selections, setSelections] = useState({
        location: null,
        music: null,
        people: []
    });
    const [isSensitive, setIsSensitive] = useState(false);

    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }

        const debounce = setTimeout(async () => {
            if (activeSearch === 'music') {
                const results = await audiusService.search(searchQuery);
                setSearchResults(results);
            } else if (activeSearch === 'location') {
                const locations = ['New York, NY', 'London, UK', 'Tokyo, Japan', 'Paris, France', 'Los Angeles, CA']
                    .filter(l => l.toLowerCase().includes(searchQuery.toLowerCase()));
                setSearchResults(locations);
            } else if (activeSearch === 'people') {
                const people = ['alex_rivers', 'jordan_sky', 'sarah_beats', 'mike_travels']
                    .filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
                setSearchResults(people);
            }
        }, 300);

        return () => clearTimeout(debounce);
    }, [searchQuery, activeSearch]);

    const handleShare = async () => {
        let mediaUrl = capturedMedia?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format';

        // Convert blob URL to base64 if needed
        if (mediaUrl.startsWith('blob:')) {
            try {
                const response = await fetch(mediaUrl);
                const blob = await response.blob();
                mediaUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                console.error("Failed to convert blob to base64", e);
            }
        }

        const success = await addPost({
            userId: user.email,
            username: user.username,
            userAvatar: user.avatar,
            contentUrl: mediaUrl,
            caption,
            location: selections.location,
            musicTrack: selections.music?.title,
            type: activeTab,
            isSensitive
        });

        if (success) {
            onClose();
        } else {
            alert("Failed to share post. Please try again.");
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className={`create-modal ${capturedMedia ? 'full-flow' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                    <h3>{activeSearch ? `Search ${activeSearch}` : `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}</h3>
                    {capturedMedia && !activeSearch && <button className="share-btn-top" onClick={handleShare}><ChevronRight size={24} /></button>}
                </div>

                {!activeSearch ? (
                    <>
                        <div className="modal-tabs">
                            {['post', 'reel'].map(tab => (
                                <button
                                    key={tab}
                                    className={`tab ${activeTab === tab ? 'active' : ''}`}
                                    onClick={() => { setActiveTab(tab); setCapturedMedia(null); }}
                                >
                                    {tab === 'post' && <Image size={20} />}
                                    {tab === 'reel' && <Film size={20} />}
                                    <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                                </button>
                            ))}
                        </div>

                        <div className="modal-body">
                            {!capturedMedia ? (
                                <div className="media-capture-boundary">
                                    <MediaCapture
                                        type={activeTab === 'post' ? 'image' : activeTab === 'reel' ? 'video' : 'all'}
                                        onCapture={(url, type) => setCapturedMedia({ url, type })}
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
                                <button className="main-share-btn" onClick={handleShare}>Share to {activeTab}</button>
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
                            {searchResults.map((result, i) => (
                                <div key={i} className="search-result-item" onClick={() => {
                                    if (activeSearch === 'music') {
                                        setSelections({ ...selections, music: result });
                                        playTrack(result);
                                    }
                                    else if (activeSearch === 'location') setSelections({ ...selections, location: result });
                                    else if (activeSearch === 'people') setSelections({ ...selections, people: [...selections.people, result] });
                                    setActiveSearch(null);
                                    setSearchQuery('');
                                }}>
                                    {activeSearch === 'music' ? (
                                        <>
                                            <img src={result.cover} alt="" />
                                            <div className="item-info">
                                                <span className="item-title">{result.title}</span>
                                                <span className="item-subtitle">{result.artist}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <span>{result}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default CreateModal;
