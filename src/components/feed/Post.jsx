import { useState, useEffect, useCallback, useRef } from 'react';

import { Heart, MessageCircle, ArrowUpRight, Bookmark, MoreHorizontal } from 'lucide-react';
import Avatar from '../common/Avatar';
import VerificationBadge from '../common/VerificationBadge';
import socket from '../../services/socket';
import './Post.css';

const Post = ({ post }) => {
    const [likes, setLikes] = useState(post.likes || 0);
    const [viewCount, setViewCount] = useState(post.viewCount || 0);
    const [comments, setComments] = useState([]);
    const [commentCount, setCommentCount] = useState(post.commentCount || (Array.isArray(post.comments) ? post.comments.length : 0));
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [mediaError, setMediaError] = useState(false);
    const [hasViewed, setHasViewed] = useState(false);
    
    const postId = post._id || post.id;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const postRef = useRef(null);

    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/posts/${postId}/comments`);
            const data = await res.json();
            setComments(data);
        } catch (err) {
            console.error("Failed to fetch comments:", err);
        }
    }, [postId]);

    const trackView = useCallback(async () => {
        if (hasViewed) return;
        try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/posts/${postId}/view`, {
                method: 'POST'
            });
            setHasViewed(true);
        } catch (err) {
            console.error("Failed to track view:", err);
        }
    }, [postId, hasViewed]);

    useEffect(() => {
        const handleUpdate = (event) => {
            if (event.postId === postId) {
                if (event.type === 'like') setLikes(event.likes);
                if (event.type === 'view') setViewCount(event.viewCount);
                if (event.type === 'comment') {
                    setCommentCount(event.commentCount);
                    // Optionally fetch if comments are showing
                    if (showComments) fetchComments();
                }
            }
        };
        socket.on('content_updated', handleUpdate);
        return () => socket.off('content_updated', handleUpdate);
    }, [postId, showComments, fetchComments]);

    useEffect(() => {
        const currentRef = postRef.current;
        if (!currentRef) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    trackView();
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(currentRef);
        return () => observer.disconnect();
    }, [trackView]);


    const handleToggleComments = () => {
        if (!showComments) fetchComments();
        setShowComments(!showComments);
    };

    const handleAddComment = async (e) => {
        if (e.key && e.key !== 'Enter') return;
        if (!newComment.trim()) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-username': user.username 
                },
                body: JSON.stringify({ username: user.username, content: newComment })
            });
            if (res.ok) {
                setNewComment('');
                fetchComments();
            }
        } catch (err) {
            console.error("Failed to add comment:", err);
        }
    };

    const handleLike = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/feed/${postId}/like`, {
                method: 'POST',
                headers: { 'x-user-username': user.username }
            });
            const data = await res.json();
            if (data.success) {
                setLikes(data.likes);
            }
        } catch (err) {
            console.error("Failed to like post:", err);
        }
    };

    return (
        <article className="instagram-post" id={`post-${postId}`} ref={postRef}>
            {/* SVG Gradient Definition for icons to use if needed */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id="stride-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
            </svg>

            <div className="post-header">
                <div className="post-user-info">
                    <Avatar 
                        src={post.avatar} 
                        alt={post.username} 
                        size={32} 
                        className="post-avatar" 
                        frame={post.avatarFrame || 'none'}
                        isVerified={post.isVerified}
                    />
                    <div className="user-details" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="username">{post.username}</span>
                        {post.isVerified && <VerificationBadge size={14} />}
                    </div>
                </div>
                <button className="more-btn">
                    <MoreHorizontal size={20} />
                </button>
            </div>

            <div className="post-media">
                {!mediaError ? (
                    post.contentUrl?.endsWith('.mp4') ? (
                        <video 
                            src={post.contentUrl} 
                            controls={false}
                            autoPlay 
                            muted 
                            loop 
                            playsInline
                            className="post-video"
                            style={{ width: '100%', borderRadius: '4px' }}
                            onError={() => setMediaError(true)}
                        />
                    ) : (
                        <img 
                            src={post.contentUrl} 
                            alt="Post content" 
                            loading="lazy" 
                            onError={() => setMediaError(true)}
                        />
                    )
                ) : (
                    <div className="post-media-placeholder glass-panel" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Vibe unavailable</span>
                    </div>
                )}
            </div>

            <div className="post-footer">
                <div className="post-actions-bar">
                    <div className="actions-left">
                        <button className="action-btn" onClick={handleLike} title="Like">
                            <Heart size={26} className="icon-heart" />
                        </button>
                        <button className="action-btn" onClick={handleToggleComments} title="Comment">
                            <MessageCircle size={26} className="icon-comment" />
                        </button>

                        <button className="action-btn" title="Share">
                            <ArrowUpRight className="icon-gradient" size={26} />
                        </button>
                    </div>
                    <div className="actions-right">
                        <button className="action-btn" title="Save">
                            <Bookmark size={26} className="icon-save" />
                        </button>
                    </div>
                </div>

                <div className="post-engagement-stats">
                    <span className="post-likes">{likes.toLocaleString()} likes</span>
                    <span className="post-views">{viewCount.toLocaleString()} views</span>
                </div>

                <div className="post-caption-area">
                    <div className="caption-header" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle', marginRight: '6px' }}>
                        <span className="caption-username" style={{ margin: 0 }}>{post.username}</span>
                        {post.isVerified && <VerificationBadge size={12} />}
                    </div>
                    <span className="caption-text">{post.caption || post.content}</span>
                </div>

                {commentCount > 0 && (
                    <div className="post-comments-view" onClick={handleToggleComments}>
                        {showComments ? 'Hide comments' : `View all ${commentCount} comments`}
                    </div>
                )}

                {showComments && (
                    <div className="comments-list">
                        {comments.map(c => (
                            <div key={c._id || c.id} className="comment-item">
                                <span className="comment-username">{c.username}</span>
                                <span className="comment-text">{c.content}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="post-timestamp-bottom">
                    {(post.time || post.timestamp || '').toUpperCase()}
                </div>

                <div className="post-comment-input-area">
                    <input 
                        className="comment-input" 
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={handleAddComment}
                    />
                    <button 
                        className="post-comment-btn" 
                        disabled={!newComment.trim()}
                        onClick={handleAddComment}
                    >
                        Post
                    </button>
                </div>

            </div>
        </article>
    );
};

export default Post;
