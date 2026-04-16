import { useState, useEffect } from 'react';
import { ChevronLeft, Heart, MessageCircle, Send, MoreHorizontal } from 'lucide-react';
import Avatar from '../common/Avatar';
import { BASE_URL } from '../../utils/api';
import './CommunityBoard.css';

const ThreadDetail = ({ threadId, user, onBack }) => {
    const [thread, setThread] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    const fetchThread = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/threads/${threadId}`);
            // Note: Since I didn't add the specific GET /api/threads/:id yet, 
            // I'll update index.cjs later or use a workaround.
            // For now, I'll assume it exists or fetch from the list.
            const data = await res.json();
            if (data.success) {
                setThread(data.thread);
                setLikes(data.thread.likes);
                setIsLiked(data.thread.likedBy.includes(user.username));
            }
        } catch (err) {
            console.error("Fetch thread failed:", err);
        }
    };

    useEffect(() => {
        fetchThread();
    }, [threadId]);

    const handleLike = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/threads/${threadId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username })
            });
            const data = await res.json();
            if (data.success) {
                setLikes(data.likes);
                setIsLiked(!isLiked);
            }
        } catch (err) {
            console.error("Like failed:", err);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyContent || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`${BASE_URL}/api/threads/${threadId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    author: user.username,
                    avatar: user.avatar,
                    content: replyContent
                })
            });
            const data = await res.json();
            if (data.success) {
                setThread(data.thread);
                setReplyContent('');
            }
        } catch (err) {
            console.error("Reply failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!thread) return <div className="loading-v2">Hardening the thread...</div>;

    return (
        <div className="thread-detail-container animate-slide-up">
            <header className="thread-detail-header">
                <button className="back-btn-v2" onClick={onBack}><ChevronLeft size={20} /> Boards</button>
                <div className="thread-meta-actions">
                    <button className="notif-action-btn"><MoreHorizontal size={20} /></button>
                </div>
            </header>

            <div className="thread-main-content">
                <div className="thread-op-v2">
                    <div className="op-header">
                        <Avatar src={thread.authorAvatar} size={48} />
                        <div className="op-info">
                            <span className="op-username">{thread.author}</span>
                            <span className="op-time">{new Date(thread.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                    <h1 className="thread-full-title">{thread.title}</h1>
                    <div className="thread-body-text">{thread.content}</div>
                    
                    <div className="thread-tags-v2">
                        {thread.tags?.map(tag => <span key={tag} className="vibe-tag-v2">#{tag}</span>)}
                    </div>

                    <div className="thread-interactions-v2">
                        <button className={`interact-btn ${isLiked ? 'active' : ''}`} onClick={handleLike}>
                            <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                            <span>{likes}</span>
                        </button>
                        <div className="interact-btn">
                            <MessageCircle size={20} />
                            <span>{thread.replies?.length || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="thread-replies-section">
                    <h4>REPLIES ({thread.replies?.length || 0})</h4>
                    <div className="replies-list">
                        {thread.replies?.map((reply, idx) => (
                            <div key={idx} className="reply-card-v2 animate-fade-in">
                                <Avatar src={reply.avatar} size={32} />
                                <div className="reply-content-v2">
                                    <div className="reply-header">
                                        <span className="reply-author">{reply.author}</span>
                                        <span className="reply-time">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="reply-text">{reply.content}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <footer className="thread-reply-footer">
                <form className="reply-input-wrapper-v2 glass-panel" onSubmit={handleReply}>
                    <input 
                        type="text" 
                        placeholder="Reply to this rhythm..." 
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                    />
                    <button type="submit" disabled={isSubmitting}>
                        <Send size={18} />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ThreadDetail;
