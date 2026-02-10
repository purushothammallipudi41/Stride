import { useState, useEffect } from 'react';
import config from '../../config';
import { Plus, X, Send, Camera } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import './StoriesRail.css';
import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';
import StoryViewer from './StoryViewer';
import MediaCapture from '../common/MediaCapture';

const StoriesRail = () => {
    const { stories, fetchStories, addStory } = useContent();
    const { user } = useAuth();
    const [viewingStoryId, setViewingStoryId] = useState(null);
    const [isAddingStory, setIsAddingStory] = useState(false);

    useEffect(() => {
        fetchStories();
    }, []);

    const handleAddStory = async (content, type = 'image') => {
        let mediaUrl = content;

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
                console.error("Failed to convert story blob to base64", e);
            }
        }

        const success = await addStory({
            userId: user.email,
            username: user.name || user.username,
            userAvatar: user.avatar,
            content: mediaUrl,
            type: type
        });

        if (success) {
            setIsAddingStory(false);
        } else {
            alert("Failed to add story.");
        }
    };

    const userStory = stories.find(s => s.userId === user?.email);
    const otherStories = stories.filter(s => s.userId !== user?.email);

    return (
        <div className="stories-section">
            {/* User's Add/View Story */}
            <div className="story-card user-story-card">
                <div
                    className={`story-avatar-wrap ${userStory ? '' : 'viewed'}`}
                    onClick={userStory ? () => setViewingStoryId(userStory.id) : () => setIsAddingStory(true)}
                >
                    <img src={getImageUrl(user?.avatar) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=me'} alt="Me" />
                </div>
                <div className="add-story-button-overlay" onClick={() => setIsAddingStory(true)}>
                    <div className="add-story-badge-persistent">
                        <Plus size={14} color="white" strokeWidth={3} />
                    </div>
                </div>
                <span className="story-username">Your Story</span>
            </div>

            {/* Friends' Stories */}
            {otherStories.map(story => (
                <div key={story.id} className="story-card" onClick={() => setViewingStoryId(story.id)}>
                    <div className={`story-avatar-wrap ${story.viewed ? 'viewed' : ''}`}>
                        <img src={getImageUrl(story.userAvatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.username}`} alt={story.username} />
                    </div>
                    <span className="story-username">{story.username}</span>
                </div>
            ))}

            {/* Add Story Overlay - Replaced with MediaCapture */}
            {isAddingStory && (
                <div className="story-input-overlay" onClick={() => setIsAddingStory(false)}>
                    <div className="story-capture-modal animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add to Story</h3>
                            <button className="close-btn" onClick={() => setIsAddingStory(false)}><X size={24} /></button>
                        </div>
                        <div className="capture-wrap">
                            <MediaCapture
                                onCapture={(content, type) => handleAddStory(content, type)}
                                onClose={() => setIsAddingStory(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {viewingStoryId && (
                <StoryViewer
                    stories={stories}
                    initialStoryId={viewingStoryId}
                    onClose={() => setViewingStoryId(null)}
                    onStoryLiked={fetchStories}
                    onAddStory={() => {
                        setViewingStoryId(null);
                        setIsAddingStory(true);
                    }}
                />
            )}
        </div>
    );
};

export default StoriesRail;
