import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Heart, Reply, Sticker, Edit2, Trash2, Check } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageUtils';
import UserAvatar from './UserAvatar';
import GifPicker from './GifPicker';
import './CommentsModal.css';

const CommentsModal = ({ isOpen, onClose, postId, comments = [], username }) => {
    const { addComment, likeComment, deleteComment, editComment } = useContent();
    const { user } = useAuth();
    const [commentText, setCommentText] = useState('');
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [selectedGif, setSelectedGif] = useState(null);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentText, setEditCommentText] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        if (isOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [isOpen, comments]);

    const handleSendComment = async () => {
        if (!commentText.trim() && !selectedGif) return;
        await addComment(postId, commentText, selectedGif);
        setCommentText('');
        setSelectedGif(null);
        setShowGifPicker(false);
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
                        comments.map((comment, i) => {
                            const isLiked = comment.likes?.includes(user?.email);
                            const isMyComment = comment.username === user?.username || comment.userId === user?.email;
                            const isEditing = editingCommentId === comment.id;

                            return (
                                <div key={comment.id || i} className="comment-item animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <UserAvatar
                                        user={{
                                            username: comment.username || comment.user,
                                            avatar: comment.userAvatar || comment.avatar,
                                            activeAvatarFrame: comment.userActiveAvatarFrame
                                        }}
                                        size="sm"
                                    />
                                    <div className="comment-content">
                                        <div className="comment-header">
                                            <span className="comment-user">{comment.username || comment.user}</span>
                                            <span className="comment-time">
                                                {comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>

                                        {isEditing ? (
                                            <div className="edit-comment-form">
                                                <input
                                                    type="text"
                                                    value={editCommentText}
                                                    onChange={e => setEditCommentText(e.target.value)}
                                                    className="edit-comment-input"
                                                    autoFocus
                                                />
                                                <div className="edit-actions">
                                                    <button onClick={() => {
                                                        editComment(postId, comment.id, editCommentText);
                                                        setEditingCommentId(null);
                                                    }} className="save-edit-btn"><Check size={14} /> Save</button>
                                                    <button onClick={() => setEditingCommentId(null)} className="cancel-edit-btn"><X size={14} /> Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {comment.text && <p className="comment-text">{comment.text}</p>}
                                                {comment.gif && <img src={comment.gif} alt="Comment GIF" className="comment-gif" style={{ maxWidth: '200px', borderRadius: '8px', marginTop: '4px' }} />}

                                                <div className="comment-actions">
                                                    <button
                                                        className={`action-btn ${isLiked ? 'liked' : ''}`}
                                                        onClick={() => likeComment(postId, comment.id)}
                                                    >
                                                        <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                                                        <span>{comment.likes?.length || 0}</span>
                                                    </button>
                                                    <button className="action-btn" onClick={() => setCommentText(`@${comment.username || comment.user} `)}><Reply size={14} /> <span>Reply</span></button>

                                                    {isMyComment && (
                                                        <>
                                                            <button className="action-btn edit-btn" onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.text); }}><Edit2 size={12} /> Edit</button>
                                                            <button className="action-btn delete-btn" onClick={() => deleteComment(postId, comment.id)}><Trash2 size={12} /> Delete</button>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="modal-footer" style={{ position: 'relative' }}>
                    {showGifPicker && (
                        <GifPicker onSelect={(url) => { setSelectedGif(url); setShowGifPicker(false); }} onClose={() => setShowGifPicker(false)} />
                    )}
                    {selectedGif && (
                        <div className="selected-gif-preview" style={{ position: 'absolute', bottom: '100%', left: '16px', padding: '8px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '8px' }}>
                            <button onClick={() => setSelectedGif(null)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                            <img src={selectedGif} alt="Selected GIF preview" style={{ height: '80px', borderRadius: '4px' }} />
                        </div>
                    )}
                    <div className="comment-input-wrap">
                        <UserAvatar user={user} size="sm" />
                        <input
                            type="text"
                            placeholder={`Reply to ${username}...`}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                            autoFocus
                        />
                        <button className={`input-tool-btn ${showGifPicker ? 'active' : ''}`} onClick={() => setShowGifPicker(!showGifPicker)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                            <Sticker size={20} />
                        </button>
                        <button className={`send-btn ${commentText.trim() || selectedGif ? 'active' : ''}`} onClick={handleSendComment}>
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
