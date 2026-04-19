import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import socket from '../../services/socket';
import CreateStoryModal from './CreateStoryModal';
import VerificationBadge from '../common/VerificationBadge';
import Avatar from '../common/Avatar';
import StoryViewer from '../social/StoryViewer';
import { BASE_URL } from '../../utils/api';
import { getStoredUser } from '../../utils/storage';
import { useUI } from '../../hooks/useUI';
import './StoriesRail.css';

const StoriesRail = () => {
    const [friendStories, setFriendStories] = useState([]);
    const [liveStreams, setLiveStreams] = useState([]);
    const [hasStory, setHasStory] = useState(false);
    const [activeStory, setActiveStory] = useState(null);
    const { isStoryModalOpen, setIsStoryModalOpen } = useUI();
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const user = getStoredUser();
    const navigate = useNavigate();
    const username = user?.username || 'guest';

    const loadStories = () => {
        fetch(`${BASE_URL}/api/stories`)
            .then(res => res.json())
            .then(data => {
                setFriendStories(data);
            })
            .catch(err => console.error("Failed to fetch stories:", err));
    };

    const loadLive = () => {
        fetch(`${BASE_URL}/api/feed/live`)
            .then(res => res.json())
            .then(data => setLiveStreams(data))
            .catch(err => console.error("Failed to fetch live streams:", err));
    };

    useEffect(() => {
        loadStories();
        loadLive();
        
        const handleUpdate = (event) => {
            if (event.type === 'story') {
                loadStories();
            }
        };

        const handlePulse = (data) => {
            setLiveStreams(prev => {
                if (data.isLive) {
                    const exists = prev.find(s => s.username === data.username);
                    if (exists) return prev;
                    return [data, ...prev];
                } else {
                    return prev.filter(s => s.username !== data.username);
                }
            });
        };
        
        socket.on('content_updated', handleUpdate);
        socket.on('live_pulse_updated', handlePulse);
        
        return () => {
            socket.off('content_updated', handleUpdate);
            socket.off('live_pulse_updated', handlePulse);
        };
    }, []);

    const handleAddStory = (e) => {
        if (e) e.stopPropagation();
        setIsStoryModalOpen(true);
    };

    const handleConfirmUpload = async (contentUrl, musicTrack) => {
        if (username === 'guest') return;

        setIsUploading(true);
        setError('');
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
                setIsSuccess(true);
                setHasStory(true);
                
                // Keep modal open for 1.5s to show success state
                setTimeout(() => {
                    setIsStoryModalOpen(false);
                    setIsSuccess(false);
                }, 1500);
            } else {
                const data = await response.json();
                setError(data.message || "Failed to post story");
            }
        } catch (err) {
            console.error("Failed to post story:", err);
            setError("Connection error. Please try again.");
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

            {/* Friends' Live Streams */}
            {liveStreams.map((stream) => (
                <div 
                    key={`live-${stream.username}`} 
                    className="story-item"
                    onClick={() => navigate(`/live/${stream.username}`)}
                >
                    <div className="story-avatar-container live-avatar-ring pulse">
                        <Avatar src={stream.avatar} size={72} alt={stream.username} />
                        <div className="live-overlay-tag">LIVE</div>
                    </div>
                    <span className="story-username">@{stream.username}</span>
                </div>
            ))}

            {/* Friends' Stories */}
            {friendStories.map(story => {
                // Skip if this user is already shown in LiveRail
                if (liveStreams.find(s => s.username === story.username)) return null;

                return (
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
                );
            })}

            <CreateStoryModal 
                key={isStoryModalOpen}
                isOpen={isStoryModalOpen}
                onClose={() => setIsStoryModalOpen(false)}
                onConfirm={handleConfirmUpload}
                isUploading={isUploading}
                isSuccess={isSuccess}
                error={error}
            />

            {activeStory && (
                <StoryViewer 
                    stories={friendStories}
                    initialStoryId={activeStory.id}
                    onClose={() => setActiveStory(null)}
                />
            )}
        </div>
    );
};

export default StoriesRail;
