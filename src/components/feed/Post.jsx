import { useState } from 'react';
import config from '../../config';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import './Post.css';
import ShareModal from '../common/ShareModal';

import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';
import CommentsModal from '../common/CommentsModal';

const Post = ({ post }) => {
    const { toggleLike, deletePost } = useContent();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [showMore, setShowMore] = useState(false);

    // MongoDB uses _id, local new posts might use id
    const postId = post._id || post.id;
    const isLiked = user && post.likes?.includes(user?.email);

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
            if (res.ok) alert(`Post shared with ${targetUser.name}!`);
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
                    <button className="more-btn" onClick={() => setShowMore(!showMore)}>
                        <MoreHorizontal size={20} />
                    </button>
                    {showMore && (
                        <div className="post-more-dropdown glass-card">
                            {(post.userId === user?.email || post.userEmail === user?.email || (user?.id && post.userId === user.id)) && (
                                <button className="delete-btn" onClick={async () => {
                                    if (window.confirm('Are you sure you want to delete this post?')) {
                                        const success = await deletePost(postId);
                                        if (success) setShowMore(false);
                                        else alert('Failed to delete post');
                                    }
                                }} style={{ color: '#ff4b4b' }}>Delete Post</button>
                            )}
                            <button onClick={() => { setShowMore(false); navigate(`/messages?user=${post.userEmail || post.userId || post.username}`); }}>Message User</button>
                            <button onClick={async () => {
                                setShowMore(false);
                                if (!user) return alert('Please login to report.');
                                try {
                                    await fetch(`${config.API_URL}/api/report`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            reporterId: user.id || user._id,
                                            targetId: postId,
                                            targetType: 'post',
                                            reason: 'offensive_content' // Hardcoded for MVP menu
                                        })
                                    });
                                    alert('Post Reported. Thank you for making Stride safer.');
                                } catch (e) {
                                    console.error(e);
                                    alert('Failed to report post.');
                                }
                            }}>Report Post</button>
                            <button onClick={() => { setShowMore(false); navigator.clipboard.writeText(`${window.location.origin}/profile/${post.username}`); alert('Link Copied'); }}>Copy Link</button>
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
