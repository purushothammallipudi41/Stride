import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import socket from '../../services/socket';
import CreateStoryModal from './CreateStoryModal';
import VerificationBadge from '../common/VerificationBadge';
import Avatar from '../common/Avatar';
import { BASE_URL } from '../../utils/api';
import { getStoredUser } from '../../utils/storage';
import './StoriesRail.css';

const StoriesRail = () => {
    const [friendStories, setFriendStories] = useState([]);
    const [hasStory, setHasStory] = useState(false);
    const [activeStory, setActiveStory] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const user = getStoredUser();
    const username = user?.username || 'guest';

    const loadStories = () => {
        fetch(`${BASE_URL}/api/stories`)
            .then(res => res.json())
            .then(data => {
                setFriendStories(data);
            })
            .catch(err => console.error("Failed to fetch stories:", err));
    };

    useEffect(() => {
        loadStories();
        
        const handleUpdate = (event) => {
            if (event.type === 'story') {
                loadStories();
            }
        };
        
        socket.on('content_updated', handleUpdate);
        return () => socket.off('content_updated', handleUpdate);
    }, []);

    const handleAddStory = (e) => {
        if (e) e.stopPropagation();
        setIsCreateModalOpen(true);
    };

    const handleConfirmUpload = async (contentUrl, musicTrack) => {
        if (username === 'guest') return;

        setIsUploading(true);
        try {
            const response = await fetch(`${BASE_URL}/api/stories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    contentUrl,
                    metadata: musicTrack // musicTrack now holds { track, poll }
                })
            });
            if (response.ok) {
                setHasStory(true);
                setIsCreateModalOpen(false);
            }
        } catch (err) {
            console.error("Failed to post story:", err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="stories-rail">
            {/* User's Add Story Button */}
            <div className="story-item" onClick={handleAddStory}>
                <div className={`story-avatar-container ${hasStory ? 'has-story' : ''}`}>
                    <Avatar 
                        src={user.avatar} 
                        alt="Your Story" 
                        size={72} 
                    />
                    
                    {!hasStory && (
                        <div className="add-story-badge">
                            <Plus size={14} color="white" strokeWidth={3} />
                        </div>
                    )}
                </div>
                <span className="story-username">Your Story</span>
            </div>

            {/* Friends' Stories */}
            {friendStories.map(story => (
                <div key={story.id} className="story-item" onClick={() => setActiveStory(story)}>
                    <div className="story-avatar-container has-story">
                        <Avatar 
                            src={story.avatar} 
                            alt={story.username} 
                            size={72} 
                        />
                    </div>
                    <div className="story-username-container" style={{ display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>
                        <span className="story-username" style={{ margin: 0 }}>{story.username}</span>
                        {story.isVerified && <VerificationBadge size={10} />}
                    </div>
                </div>
            ))}

            <CreateStoryModal 
                key={isCreateModalOpen}
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onConfirm={handleConfirmUpload}
                isUploading={isUploading}
            />

            {/* Story Viewer Modal */}
            {activeStory && (
                <div className="story-viewer-modal">
                    <div className="story-viewer-content">
                        <button className="close-story-btn" onClick={() => setActiveStory(null)}>
                            <X size={24} />
                        </button>
                        <div className="story-progress-bar">
                            <div className="story-progress-fill animate-story-progress" />
                        </div>
                        <div className="story-viewer-header">
                            <img src={activeStory.avatar} alt={activeStory.username} className="viewer-avatar" loading="lazy" />
                            <span className="viewer-username">{activeStory.username}</span>
                            {activeStory.isVerified && <VerificationBadge size={14} />}
                        </div>
                        <div className="story-viewer-media">
                            <img src={activeStory.contentUrl} alt="Story Content" loading="lazy" />
                            
                            {/* Render Stickers */}
                            {activeStory.metadata?.track && (
                                <div className="sticker-item music-sticker viewer-sticker">
                                    <img src={activeStory.metadata.track.cover} alt="Cover" className="sticker-cover" loading="lazy" />
                                    <div className="sticker-info">
                                        <span className="sticker-title font-bold">{activeStory.metadata.track.title}</span>
                                        <span className="sticker-artist">{activeStory.metadata.track.artist}</span>
                                    </div>
                                </div>
                            )}

                            {activeStory.metadata?.poll && (
                                <div className="sticker-item poll-sticker viewer-sticker glass-panel animate-scale-in">
                                    <div className="poll-question-viewer">{activeStory.metadata.poll.question}</div>
                                    <div className="poll-options">
                                        <button className="poll-option-btn">{activeStory.metadata.poll.option1}</button>
                                        <button className="poll-option-btn">{activeStory.metadata.poll.option2}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoriesRail;
