import { useState } from 'react';
import config from '../../config';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import './Post.css';
import ShareModal from '../common/ShareModal';

import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CommentsModal from '../common/CommentsModal';

const Post = ({ post }) => {
    const { toggleLike, deletePost } = useContent();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [showMore, setShowMore] = useState(false);

    // MongoDB uses _id, local new posts might use id
    const postId = post._id || post.id;
    const isLiked = user && post.likes?.includes(user?.email);

    const isOwner = user && (
        String(post.userId) === String(user.id || user._id) ||
        String(post.userEmail) === String(user.email) ||
        String(post.userId) === String(user.email) ||
        String(post.username) === String(user.username)
    );

    const handleShareToUser = async (targetUser) => {
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

    return (
        <article className="post-card">
            <div className="post-header">
                <div className="post-user">
                    <img src={getImageUrl(post.userAvatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} alt={post.username} />
                    <div className="user-details" onClick={() => navigate(`/profile/${post.username}`)} style={{ cursor: 'pointer' }}>
                        <h4>{post.username}</h4>
                        <p>{post.timestamp}</p>
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
                                    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
                                    if (confirmDelete) {
                                        const success = await deletePost(postId);
                                        if (success) {
                                            setShowMore(false);
                                            showToast('Post deleted', 'success');
                                        } else {
                                            showToast('Failed to delete post', 'error');
                                        }
                                    }
                                }} style={{ color: '#ff4b4b' }}>Delete Post</button>
                            )}
                            <button onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/messages?user=${post.userEmail || post.userId || post.username}`);
                                setShowMore(false);
                            }}>Message User</button>
                            <button onClick={async (e) => {
                                e.stopPropagation();
                                if (!user) return showToast('Please login to report.', 'error');
                                try {
                                    const res = await fetch(`${config.API_URL}/api/report`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            reporterId: user.id || user._id || user.email,
                                            targetId: postId,
                                            targetType: 'post',
                                            reason: 'offensive_content'
                                        })
                                    });
                                    if (res.ok) {
                                        showToast('Post Reported. Thank you for making Stride safer.', 'success');
                                        setShowMore(false);
                                    } else {
                                        const errData = await res.json();
                                        showToast(`Failed to report: ${errData.error || 'Server error'}`, 'error');
                                    }
                                } catch (err) {
                                    console.error(err);
                                    showToast('Failed to report post. Please check your connection.', 'error');
                                }
                            }}>Report Post</button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                const shareUrl = `${window.location.origin}/profile/${post.username || post.userId}`;
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                    navigator.clipboard.writeText(shareUrl)
                                        .then(() => showToast('Link Copied', 'success'))
                                        .catch(() => showToast('Copy failed. Manual URL: ' + shareUrl, 'error'));
                                } else {
                                    // Fallback for older browsers
                                    const textArea = document.createElement("textarea");
                                    textArea.value = shareUrl;
                                    document.body.appendChild(textArea);
                                    textArea.select();
                                    try {
                                        document.execCommand('copy');
                                        showToast('Link Copied', 'success');
                                    } catch (err) {
                                        showToast('Copy failed. Manual URL: ' + shareUrl, 'error');
                                    }
                                    document.body.removeChild(textArea);
                                }
                                setShowMore(false);
                            }}>Copy Link</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="post-content">
                {(post.type === 'image' || post.type === 'post' || !post.type) && post.contentUrl && (
                    <img
                        src={getImageUrl(post.contentUrl)}
                        alt="Post content"
                        className="post-image"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format';
                        }}
                    />
                )}
                {post.caption && <div className="post-text">{post.caption}</div>}
            </div>

            <div className="post-footer">
                <button
                    className={`post-action ${isLiked ? 'liked' : ''}`}
                    onClick={() => toggleLike(postId, user?.email)}
                >
                    <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
                    <span>{post.likes?.length || 0}</span>
                </button>
                <button className="post-action" onClick={() => setIsCommentsOpen(true)}>
                    <MessageCircle size={22} />
                    <span>{post.comments?.length || 0}</span>
                </button>
                <button className="post-action" onClick={() => setIsShareModalOpen(true)}>
                    <Share2 size={22} />
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
                onShare={handleShareToUser}
                contentTitle={`${post.username}'s Post`}
            />
        </article>
    );
};

export default Post;
