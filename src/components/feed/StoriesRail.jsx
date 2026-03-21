import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import socket from '../../services/socket';
import CreateStoryModal from './CreateStoryModal';
import './StoriesRail.css';

const StoriesRail = () => {
    const [friendStories, setFriendStories] = useState([]);
    const [hasStory, setHasStory] = useState(false);
    const [activeStory, setActiveStory] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = user.username || 'guest';

    const loadStories = () => {
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/stories`)
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

    const handleConfirmUpload = async () => {
        if (username === 'guest') return;

        setIsUploading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/stories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username
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
                    {/* Placeholder for user's actual avatar */}
                    <div className="user-avatar-placeholder" />
                    
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
                        <img src={story.avatar} alt={story.username} className="story-img" />
                    </div>
                    <span className="story-username">{story.username}</span>
                </div>
            ))}

            <CreateStoryModal 
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
                            <img src={activeStory.avatar} alt={activeStory.username} className="viewer-avatar" />
                            <span className="viewer-username">{activeStory.username}</span>
                        </div>
                        <div className="story-viewer-media">
                            <img src={activeStory.contentUrl} alt="Story Content" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoriesRail;
