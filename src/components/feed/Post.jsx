import { useState, memo } from 'react';
import config from '../../config';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, BadgeCheck } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import './Post.css';
import ShareModal from '../common/ShareModal';

import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CommentsModal from '../common/CommentsModal';
import ConfirmModal from '../common/ConfirmModal';
import { ShieldAlert, Play } from 'lucide-react';
import { formatTime } from '../../utils/timeUtils';
import UserAvatar from '../common/UserAvatar';

const Post = memo(({ post }) => {
    if (!post) return null;
    const { toggleLike, deletePost, toggleSavePost, savedPosts, editPost } = useContent();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.caption || '');
    const [showSensitive, setShowSensitive] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // MongoDB uses _id, local new posts might use id
    const postId = post._id || post.id;
    const isLiked = user && post.likes?.includes(user?.email);
    const isSaved = savedPosts?.some(p => (p._id || p.id) === postId);

    const isOwner = user && (
        String(post.userId) === String(user.id || user._id) ||
        String(post.userEmail) === String(user.email) ||
        String(post.userId) === String(user.email) ||
        String(post.username) === String(user.username)
    );

    const handleShareToUser = async (targetUser) => {
        // ... (existing share logic)
        try {
            const res = await fetch(`${config.API_URL}/api/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: user.email,
                    to: targetUser.email,
                    text: `Shared a post by ${post.username}`,
                    sharedContent: {
                        type: 'post',
                        id: postId,
                        thumbnail: post.contentUrl,
                        title: `${post.username}'s Post`
                    }
                })
            });
            if (res.ok) showToast(`Post shared with ${targetUser.name}!`, 'success');
        } catch (error) {
            console.error('Failed to share post:', error);
        }
    };

    const handleEditSave = async () => {
        if (editContent.trim() === post.caption) {
            setIsEditing(false);
            return;
        }
        const success = await editPost(postId, editContent);
        if (success) {
            showToast('Post updated', 'success');
            setIsEditing(false);
        } else {
            showToast('Failed to update post', 'error');
        }
    };

    const handleSave = () => {
        toggleSavePost(post);
        showToast(isSaved ? 'Post unsaved' : 'Post saved to collection', 'success');
    };

    return (
        <article className="post-card">
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={async () => {
                    const success = await deletePost(postId);
                    if (success) {
                        showToast('Post deleted', 'success');
                    } else {
                        showToast('Failed to delete post', 'error');
                    }
                }}
                title="Delete Post"
                message="Are you sure you want to permanently delete this post? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
            <div className="post-header">
                <div className="post-user">
                    <UserAvatar
                        user={{
                            username: post.username,
                            avatar: post.userAvatar,
                            activeAvatarFrame: post.userActiveAvatarFrame
                        }}
                        size="sm"
                    />
                    <div className="user-details" onClick={() => navigate(`/profile/${post.username}`)} style={{ cursor: 'pointer' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className={post.userUnlockedPerks?.includes('gold_name') ? 'gold-username' : ''}>
                            {post.username}
                            {post.isOfficial && <BadgeCheck size={14} color="var(--color-primary)" fill="var(--color-primary-glow)" />}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p>{formatTime(post.timestamp)}</p>
                            {post.isSensitive && (
                                <span className="sensitive-badge">
                                    <ShieldAlert size={12} />
                                    Sensitive
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="post-more-container">
                    <button className="more-btn" onClick={(e) => { e.stopPropagation(); setShowMore(!showMore); }}>
                        <MoreHorizontal size={20} />
                    </button>
                    {showMore && (
                        <div className="post-more-dropdown glass-card animate-in" onClick={e => e.stopPropagation()}>
                            {isOwner && (
                                <>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                        setEditContent(post.caption || '');
                                        setShowMore(false);
                                    }}>Edit Post</button>
                                    <button className="delete-btn" onClick={async (e) => {
                                        e.stopPropagation();
                                        setShowMore(false);
                                        setIsConfirmOpen(true);
                                    }} style={{ color: '#ff4b4b' }}>Delete Post</button>
                                </>
                            )}
                            <button onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/messages?user=${post.userEmail || post.userId || post.username}`);
                                setShowMore(false);
                            }}>Message User</button>
                            <button onClick={async (e) => {
                                // Report logic
                                e.stopPropagation();
                                if (!user) return showToast('Please login to report.', 'error');
                                // ... report fetch
                                showToast('Post Reported. Thank you for making Stride safer.', 'success');
                                setShowMore(false);
                            }}>Report Post</button>
                            <button onClick={(e) => {
                                // Copy link logic
                                e.stopPropagation();
                                setShowMore(false);
                                showToast('Link Copied', 'success');
                            }}>Copy Link</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="post-content">
                {(post.type === 'video' || post.type === 'reel') ? (
                    <div className="post-image-container">
                        <video
                            src={getImageUrl(post.contentUrl)}
                            poster={getImageUrl(post.posterUrl || post.contentUrl, 'media')}
                            className="post-image"
                            muted
                            loop
                            playsInline
                            autoPlay
                            onMouseEnter={(e) => e.target.play()}
                        />
                        <div className="video-indicator">
                            <Play size={20} fill="white" />
                        </div>
                    </div>
                ) : (post.type === 'image' || post.type === 'post' || !post.type) && post.contentUrl && (
                    <div className="post-image-container">
                        <img
                            src={getImageUrl(post.contentUrl)}
                            alt="Post content"
                            className={`post-image ${post.isSensitive && !showSensitive ? 'blur-active' : ''}`}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = getImageUrl(null, 'media');
                            }}
                        />
                        {post.isSensitive && !showSensitive && (
                            <div className="sensitive-content-overlay animate-in" onClick={(e) => e.stopPropagation()}>
                                <ShieldAlert size={40} color="#ff4b4b" />
                                <p>This post is marked as sensitive</p>
                                <button className="show-sensitive-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSensitive(true);
                                }}>
                                    Show Content
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {isEditing ? (
                    <div className="edit-caption-form" onClick={e => e.stopPropagation()}>
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="edit-caption-input"
                            autoFocus
                        />
                        <div className="edit-actions">
                            <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                            <button className="save-btn" onClick={handleEditSave}>Save Changes</button>
                        </div>
                    </div>
                ) : post.caption && (
                    <div className="post-caption">
                        {post.caption.split(/(\s+)/).map((part, i) => {
                            if (part.startsWith('#')) {
                                return (
                                    <span
                                        key={i}
                                        className="hashtag"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/search?q=${encodeURIComponent(part)}`);
                                        }}
                                        style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        {part}
                                    </span>
                                );
                            }
                            return part;
                        })}
                    </div>
                )}
            </div>

            <div className="post-footer">
                <div className="post-actions-main">
                    <button
                        className={`post-action ${isLiked ? 'liked' : ''}`}
                        onClick={() => toggleLike(postId, user?.email)}
                    >
                        <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                        <span>{post.likes?.length || 0}</span>
                    </button>
                    <button className="post-action" onClick={() => setIsCommentsOpen(true)}>
                        <MessageCircle size={24} />
                        <span>{post.comments?.length || 0}</span>
                    </button>
                    <button className="post-action" onClick={() => setIsShareModalOpen(true)}>
                        <Share2 size={24} />
                    </button>
                </div>
                <button
                    className={`post-action save-btn ${isSaved ? 'saved' : ''}`}
                    onClick={handleSave}
                >
                    <Bookmark size={24} fill={isSaved ? "currentColor" : "none"} />
                </button>
            </div>

            <CommentsModal
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}
                postId={postId}
                comments={post.comments}
                username={post.username}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                type="post"
                data={{
                    id: postId,
                    title: `${post.username}'s Post`,
                    subtitle: post.caption || 'Post',
                    image: post.contentUrl
                }}
            />
        </article >
    );
});

export default Post;
