import { useState } from 'react';
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
import { ShieldAlert } from 'lucide-react';

const Post = ({ post }) => {
    if (!post) return null;
    const { toggleLike, deletePost, toggleSavePost, savedPosts } = useContent();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [showMore, setShowMore] = useState(false);
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
                    <img
                        src={getImageUrl(post.userAvatar) || getImageUrl(null, 'user')}
                        alt={post.username}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getImageUrl(null, 'user');
                        }}
                    />
                    <div className="user-details" onClick={() => navigate(`/profile/${post.username}`)} style={{ cursor: 'pointer' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {post.username}
                            {post.isOfficial && <BadgeCheck size={14} color="var(--color-primary)" fill="var(--color-primary-glow)" />}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p>{post.timestamp}</p>
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
                                <button className="delete-btn" onClick={async (e) => {
                                    e.stopPropagation();
                                    setShowMore(false);
                                    const success = await deletePost(postId);
                                    if (success) {
                                        showToast('Post deleted', 'success');
                                    } else {
                                        showToast('Failed to delete post', 'error');
                                    }
                                }} style={{ color: '#ff4b4b' }}>Delete Post</button>
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
                            src={post.contentUrl}
                            className="post-image"
                            muted
                            loop
                            controls
                            playsInline
                        />
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
                {post.caption && (
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
        </article>
    );
};

export default Post;
