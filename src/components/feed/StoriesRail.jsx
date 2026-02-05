import { useState } from 'react';
import { Plus } from 'lucide-react';
import './StoriesRail.css';

const StoriesRail = () => {
    // Mock data for friends' stories
    const friendStories = [
        { id: 1, username: 'alex_beats', img: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=60' },
        { id: 2, username: 'sarah_j', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=60' },
        { id: 3, username: 'mike_p', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=60' },
        { id: 4, username: 'luna_s', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=60' },
        { id: 5, username: 'travel_dan', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=60' }
    ];

    const [hasStory, setHasStory] = useState(false);

    const handleAddStory = () => {
        // Simulating story upload
        const confirmed = window.confirm("Upload to your story?");
        if (confirmed) {
            setHasStory(true);
            alert("Story uploaded successfully!");
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
                <div key={story.id} className="story-item">
                    <div className="story-avatar-container has-story">
                        <img src={story.img} alt={story.username} className="story-img" />
                    </div>
                    <span className="story-username">{story.username}</span>
                </div>
            ))}
        </div>
    );
};

export default StoriesRail;
