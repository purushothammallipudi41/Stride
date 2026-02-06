import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Send, ChevronLeft, ChevronRight, MoreHorizontal, Plus, Trash2, User, MessageSquare } from 'lucide-react';
import './StoryViewer.css';
import { useAuth } from '../../context/AuthContext';
import ShareModal from '../common/ShareModal';

import config from '../../config';
import { getImageUrl } from '../../utils/imageUtils';

const StoryViewer = ({ stories, initialStoryId, onClose, onStoryLiked, onAddStory }) => {
    const { user } = useAuth();
    const [currentStoryIndex, setCurrentStoryIndex] = useState(() => {
        const index = stories.findIndex(s => s.id === initialStoryId);
        return index !== -1 ? index : 0;
    });
    const [progress, setProgress] = useState(0);
    const [reply, setReply] = useState('');
    const [isLiked, setIsLiked] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [viewingUsers, setViewingUsers] = useState(null); // 'likes' or 'viewers'
    const [allUsers, setAllUsers] = useState([]);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const currentStory = stories[currentStoryIndex];
    if (!currentStory) return null;

    const isOwner = user?.email === currentStory.userId;

    useEffect(() => {
        setIsLiked(currentStory.likes?.includes(user?.email));
    }, [currentStoryIndex, currentStory, user]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch(`${config.API_URL}/api/users`);
                if (res.ok) {
                    const data = await res.json();
                    setAllUsers(data);
                }
            } catch (err) {
                console.error('Failed to fetch users:', err);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + 1;
            });
        }, 50);

        // Record view if not owner
        if (currentStory && user && !isOwner && !currentStory.viewers?.includes(user.email)) {
            fetch(`${config.API_URL}/api/stories/${currentStory.id}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email })
            }).then(res => {
                if (res.ok && onStoryLiked) onStoryLiked();
            }).catch(err => console.error('Failed to record view:', err));
        }

        return () => clearInterval(timer);
    }, [currentStoryIndex, currentStory?.id]);

    const handleNext = () => {
        if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            setProgress(0);
            setViewingUsers(null);
            setShowMoreMenu(false);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
            setProgress(0);
            setViewingUsers(null);
            setShowMoreMenu(false);
        }
    };

    const handleLike = async () => {
        try {
            const res = await fetch(`${config.API_URL}/api/stories/${currentStory.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email })
            });
            if (res.ok) {
                setIsLiked(!isLiked);
                if (onStoryLiked) onStoryLiked();
            }
        } catch (error) {
            console.error('Failed to like story:', error);
        }
    };

    const handleDelete = async (storyId) => {
        if (!window.confirm("Delete this story?")) return;
        try {
            const res = await fetch(`${config.API_URL}/api/stories/${storyId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: user.email })
            });
            if (res.ok) {
                if (stories.length === 1) {
                    onClose();
                } else {
                    handleNext();
                }
                if (onStoryLiked) onStoryLiked(); // Refresh stories
            }
        } catch (error) {
            console.error('Failed to delete story:', error);
        }
    };

    const handleReply = async () => {
        if (!reply.trim()) return;
        try {
            const res = await fetch(`${config.API_URL}/api/stories/${currentStory.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: reply, user })
            });
            if (res.ok) {
                setReply('');
                alert('Reply sent!');
            }
        } catch (error) {
            console.error('Failed to reply to story:', error);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Stride Story by ${currentStory.username}`,
            text: `Check out ${currentStory.username}'s story on Stride!`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
        setShowMoreMenu(false);
    };

    const handleShareToUser = async (targetUser) => {
        try {
            const res = await fetch(`${config.API_URL}/api/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: user.email,
                    to: targetUser.email,
                    text: `Shared a story by ${currentStory.username}`,
                    sharedContent: {
                        type: 'story',
                        id: currentStory.id,
                        thumbnail: currentStory.content,
                        title: `${currentStory.username}'s Story`
                    }
                })
            });
            if (res.ok) alert(`Story shared with ${targetUser.name}!`);
        } catch (error) {
            console.error('Failed to share story:', error);
        }
    };

    const getUserDetails = (email) => {
        return allUsers.find(u => u.email === email) || {
            name: email.split('@')[0],
            username: email.split('@')[0],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        };
    };

    const renderUsersList = () => {
        const emails = viewingUsers === 'likes' ? (currentStory.likes || []) : (currentStory.viewers || []);
        const title = viewingUsers === 'likes' ? 'Likes' : 'Viewers';

        return (
            <div className="users-list-overlay">
                <div className="users-list-header">
                    <h3>{title}</h3>
                    <X className="story-icon" onClick={() => setViewingUsers(null)} size={20} />
                </div>
                <div className="users-list-content">
                    {emails.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: '20px' }}>No {title.toLowerCase()} yet.</p>
                    ) : (
                        emails.map(email => {
                            const details = getUserDetails(email);
                            return (
                                <div key={email} className="user-item">
                                    <img src={getImageUrl(details.avatar)} alt="" />
                                    <div className="user-details">
                                        <span className="user-name">{details.name}</span>
                                        <span className="user-handle">@{details.username}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    return createPortal(
        <div className="story-viewer-overlay">
            <div className="story-viewer-container" onClick={() => setShowMoreMenu(false)}>
                {/* Progress Bars */}
                <div className="story-progress-container">
                    {stories.map((_, index) => (
                        <div key={index} className="story-progress-bar">
                            <div
                                className="story-progress-fill"
                                style={{
                                    width: index === currentStoryIndex ? `${progress}%` :
                                        index < currentStoryIndex ? '100%' : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="story-header" onClick={(e) => e.stopPropagation()}>
                    <div className="story-user-info">
                        <img src={getImageUrl(currentStory.userAvatar) || 'https://i.pravatar.cc/100'} alt="" className="story-avatar" />
                        <span className="story-username">{currentStory.username}</span>
                        <span className="story-time">2h</span>
                    </div>
                    <div className="story-actions">
                        <div className="menu-container">
                            <MoreHorizontal
                                className="story-icon"
                                onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
                            />
                            {showMoreMenu && (
                                <div className="more-options-dropdown" onClick={(e) => e.stopPropagation()}>
                                    {isOwner && (
                                        <div className="dropdown-item danger" onClick={() => { handleDelete(currentStory.id); setShowMoreMenu(false); }}>
                                            <Trash2 size={18} /> Delete Story
                                        </div>
                                    )}
                                    <div className="dropdown-item" onClick={() => { setIsShareModalOpen(true); setShowMoreMenu(false); }}>
                                        <MessageSquare size={18} /> Share via DM
                                    </div>
                                    <div className="dropdown-item" onClick={handleShare}>
                                        <Send size={18} /> Share via...
                                    </div>
                                    <div className="dropdown-item" onClick={() => { alert('Muted'); setShowMoreMenu(false); }}>
                                        <User size={18} /> Mute {currentStory.username}
                                    </div>
                                </div>
                            )}
                        </div>
                        <X className="story-icon" onClick={onClose} />
                    </div>
                </div>

                {/* Content */}
                <div className="story-content" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    if (x < rect.width / 3) handlePrev();
                    else if (x > (rect.width * 2) / 3) handleNext();
                }}>
                    <img src={currentStory.content} alt="" className="story-media" />
                    <button className="nav-btn prev" onClick={(e) => { e.stopPropagation(); handlePrev(); }}><ChevronLeft /></button>
                    <button className="nav-btn next" onClick={(e) => { e.stopPropagation(); handleNext(); }}><ChevronRight /></button>
                </div>

                {/* Footer */}
                <div onClick={(e) => e.stopPropagation()}>
                    {!isOwner && (
                        <div className="story-footer">
                            <input
                                type="text"
                                className="story-reply-input"
                                placeholder={`Reply to ${currentStory.username}...`}
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                            />
                            <div className="story-footer-actions">
                                <Heart
                                    className={`story-icon ${isLiked ? 'liked' : ''}`}
                                    onClick={handleLike}
                                />
                                <Send className="story-icon" onClick={handleReply} />
                            </div>
                        </div>
                    )}

                    {isOwner && (
                        <div className="story-footer owner">
                            <span className="stats-item" onClick={() => setViewingUsers('likes')}>
                                {currentStory.likes?.length || 0} likes
                            </span>
                            <span className="stats-item" onClick={() => setViewingUsers('viewers')}>
                                {currentStory.viewers?.length || 0} viewers
                            </span>
                        </div>
                    )}
                </div>

                {/* Users List Overlay */}
                {viewingUsers && renderUsersList()}

                {/* Share Modal */}
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    onShare={handleShareToUser}
                    contentTitle={`${currentStory.username}'s Story`}
                />
            </div>
        </div>,
        document.body
    );
};

export default StoryViewer;
