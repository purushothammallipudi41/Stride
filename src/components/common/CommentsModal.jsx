import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Heart, Reply } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageUtils';
import './CommentsModal.css';

const CommentsModal = ({ isOpen, onClose, postId, comments = [], username }) => {
    const { addComment, toggleLike } = useContent();
    const { user } = useAuth();
    const [commentText, setCommentText] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [isOpen, comments]);

    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        await addComment(postId, commentText);
        setCommentText('');
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="comments-modal glass-blur animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-info">
                        <h3>Comments</h3>
                        <span className="count">{comments.length}</span>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="comments-body premium-scrollbar" ref={scrollRef}>
                    {comments.length === 0 ? (
                        <div className="empty-comments">
                            <div className="empty-icon">💬</div>
                            <p>No comments yet. Start the conversation!</p>
                        </div>
                    ) : (
                        comments.map((comment, i) => (
                            <div key={i} className="comment-item animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                <img
                                    src={getImageUrl(comment.avatar)}
                                    alt={comment.user}
                                    className="comment-avatar"
                                />
                                <div className="comment-content">
                                    <div className="comment-header">
                                        <span className="comment-user">{comment.user}</span>
                                        <span className="comment-time">Just now</span>
                                    </div>
                                    <p className="comment-text">{comment.text}</p>
                                    <div className="comment-actions">
                                        <button className="action-btn"><Heart size={14} /> <span>Like</span></button>
                                        <button className="action-btn"><Reply size={14} /> <span>Reply</span></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="modal-footer">
                    <div className="comment-input-wrap">
                        <img
                            src={getImageUrl(user?.avatar)}
                            alt="Me"
                            className="my-avatar"
                        />
                        <input
                            type="text"
                            placeholder={`Reply to ${username}...`}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                            autoFocus
                        />
                        <button className={`send-btn ${commentText.trim() ? 'active' : ''}`} onClick={handleSendComment}>
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CommentsModal;
