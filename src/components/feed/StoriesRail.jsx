import { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import './StoriesRail.css';
import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';
import StoryViewer from './StoryViewer';
import CreateModal from '../create/CreateModal';

const StoriesRail = () => {
    const { stories, fetchStories } = useContent();
    const { user } = useAuth();
    const [viewingStoryId, setViewingStoryId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [initialTab, setInitialTab] = useState('story');

    useEffect(() => {
        fetchStories();
    }, []);

    const handleYourStoryClick = () => {
        const userStories = stories.filter(s => s.userId === user?.email);
        if (userStories.length > 0) {
            setViewingStoryId(userStories[0]._id || userStories[0].id);
        } else {
            setInitialTab('story');
            setIsCreateModalOpen(true);
        }
    };

    const userStory = stories.find(s => s.userId === user?.email);
    const otherStories = stories.filter(s => s.userId !== user?.email);

    return (
        <div className="stories-section">
            {/* User's Add/View Story */}
            <div
                className="story-card user-story-card"
                onClick={handleYourStoryClick}
            >
                <div className={`story-avatar-wrap ${userStory ? '' : 'viewed'}`}>
                    <img src={getImageUrl(user?.avatar) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=me'} alt="Me" />
                </div>
                <span className="story-username">Your Story</span>
            </div>

            {/* Friends' Stories */}
            {otherStories.map(story => (
                <div key={story._id || story.id} className="story-card" onClick={() => setViewingStoryId(story._id || story.id)}>
                    <div className={`story-avatar-wrap ${story.viewed ? 'viewed' : ''}`}>
                        <img src={getImageUrl(story.userAvatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.username}`} alt={story.username} />
                    </div>
                    <span className="story-username">{story.username}</span>
                </div>
            ))}

            {isCreateModalOpen && (
                <CreateModal
                    isOpen={isCreateModalOpen}
                    initialTab={initialTab}
                    onClose={() => setIsCreateModalOpen(false)}
                />
            )}

            {viewingStoryId && (
                <StoryViewer
                    stories={stories}
                    initialStoryId={viewingStoryId}
                    onClose={() => setViewingStoryId(null)}
                    onStoryLiked={fetchStories}
                    onAddStory={() => {
                        setViewingStoryId(null);
                        setInitialTab('story');
                        setIsCreateModalOpen(true);
                    }}
                />
            )}
        </div>
    );
};

export default StoriesRail;
