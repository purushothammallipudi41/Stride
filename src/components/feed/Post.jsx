import { useState, useEffect, useCallback, useRef } from 'react';
import { getStoredUser } from '../../utils/storage';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, ArrowUpRight, Bookmark, MoreHorizontal } from 'lucide-react';
import { BASE_URL } from '../../utils/api';
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
    const user = getStoredUser();
    const postRef = useRef(null);
    const optionsRef = useRef(null);
    const [showOptions, setShowOptions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [tempCaption, setTempCaption] = useState(post.caption || post.content || "");

    const fetchComments = useCallback(async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/posts/${postId}/comments`);
            const data = await res.json();
            setComments(data);
        } catch (err) {
            console.error("Failed to fetch comments:", err);
        }
    }, [postId]);

    const trackView = useCallback(async () => {
        if (hasViewed) return;
        try {
            await fetch(`${BASE_URL}/api/posts/${postId}/view`, {
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
        const handleClickOutside = (event) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            const res = await fetch(`${BASE_URL}/api/posts/${postId}/comments`, {
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
            const res = await fetch(`${BASE_URL}/api/feed/${postId}/like`, {
                method: 'POST',
                headers: { 'x-user-username': user.username }
            });
            const data = await res.json();
            if (data.success) {
                if (navigator.vibrate) navigator.vibrate(10); setLikes(data.likes);
            }
        } catch (err) {
            console.error("Failed to like post:", err);
        }
    };

    const [shareStatus, setShareStatus] = useState('Share');
    const handleShare = () => {
        const postUrl = `${window.location.origin}/post/${postId}`;
        navigator.clipboard.writeText(postUrl);
        setShareStatus('Copied!');
        setTimeout(() => setShareStatus('Share'), 2000);
        setShowOptions(false);
    };

    const handleDelete = () => {
        if (window.confirm("Delete this vibe permanently?")) {
            alert("Post removed from your record.");
            setShowOptions(false);
        }
    };

    const handleSaveEdit = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-username': user.username 
                },
                body: JSON.stringify({ caption: tempCaption })
            });

            if (res.ok) {
                const updatedPost = await res.json();
                // Optionally update local state if needed, but the socket will likely handle it
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Failed to update post:", err);
        }
    };

    const handleCancelEdit = () => {
        setTempCaption(post.caption || post.content || "");
        setIsEditing(false);
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
                <Link to={`/profile/${post.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="post-user-info">
                        <Avatar 
                            src={post.avatar} 
                            alt={post.username} 
                            size={32} 
                            className="post-avatar" 
                            frame={post.avatarFrame || 'none'}
                        />
                        <div className="user-details" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="username">{post.username}</span>
                            {post.isVerified && <VerificationBadge size={14} />}
                        </div>
                    </div>
                </Link>
                <div className="post-header-actions" ref={optionsRef}>
                    <button className="more-btn" onClick={() => setShowOptions(!showOptions)}>
                        <MoreHorizontal size={20} />
                    </button>
                    
                    {showOptions && (
                        <div className="post-options-dropdown glass-card animate-scale-in">
                            <Link to={`/profile/${post.username}`} className="option-item" onClick={() => setShowOptions(false)}>
                                <span className="option-label">View Profile</span>
                            </Link>
                                <button className="option-item" onClick={handleShare}>
                                    <span className="option-label">Copy Link</span>
                                </button>
                                <button className="option-item report" onClick={() => { alert('Reported to the Council.'); setShowOptions(false); }}>
                                    <span className="option-label">Report Post</span>
                                </button>
                                {(post.username === user.username) && (
                                    <>
                                        <button className="option-item edit" onClick={() => { setIsEditing(true); setShowOptions(false); }}>
                                            <span className="option-label">Edit Post</span>
                                        </button>
                                        <button className="option-item delete" onClick={handleDelete}>
                                            <span className="option-label">Delete</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            <div className="post-media">
                {!mediaError ? (
                    (post.contentUrl || post.imageUrl || post.url)?.endsWith('.mp4') ? (
                        <video 
                            src={post.contentUrl || post.imageUrl || post.url} 
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
                            src={post.contentUrl || post.imageUrl || post.url} 
                            alt="Post content" 
                            loading="lazy" 
                            onError={() => setMediaError(true)}
                        />
                    )
                ) : (
                    <div className="post-media-placeholder glass-panel" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>Vibe unavailable</span>
                            <code style={{ fontSize: '10px', opacity: 0.5 }}>{post.contentUrl || post.imageUrl || post.url || 'No URL'}</code>
                        </div>
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

                        <button className="action-btn" onClick={handleShare} title={shareStatus}>
                            <ArrowUpRight className="icon-gradient" size={26} />
                            {shareStatus === 'Copied!' && <span className="share-toast animate-fade-in">Copied</span>}
                        </button>
                    </div>
                    <div className="actions-right">
                        <button className="action-btn" title="Save" onClick={() => alert('Post saved to your collection!')}>
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
                    {isEditing ? (
                        <div className="post-edit-container animate-fade-in">
                            <textarea 
                                className="post-edit-input glass-card"
                                value={tempCaption}
                                onChange={(e) => setTempCaption(e.target.value)}
                                autoFocus
                            />
                            <div className="post-edit-actions">
                                <button className="edit-btn cancel" onClick={handleCancelEdit}>Cancel</button>
                                <button className="edit-btn save" onClick={handleSaveEdit}>Save Changes</button>
                            </div>
                        </div>
                    ) : (
                        <span className="caption-text">{tempCaption}</span>
                    )}
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
                                <Link to={`/profile/${c.username}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <span className="comment-username">{c.username}</span>
                                </Link>
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
