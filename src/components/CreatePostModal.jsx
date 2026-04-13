import React, { useState } from 'react';
import { X, Image, Hash, Music, Send, Loader2 } from 'lucide-react';
import { useUI } from '../hooks/useUI';
import { getStoredUser } from '../utils/storage';
import { BASE_URL } from '../utils/api';
import './CreatePostModal.css';

const CreatePostModal = () => {
    const { closeCreateModal } = useUI();
    const user = getStoredUser();
    const [caption, setCaption] = useState('');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mediaPreview, setMediaPreview] = useState(null);
    const fileInputRef = React.useRef(null);

    // Ensure state is fresh on mount
    React.useEffect(() => {
        setCaption('');
        setTags('');
        setMediaPreview(null);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!caption.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/api/feed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user?.username || 'user',
                    name: user?.name || user?.username || 'user',
                    avatar: user?.avatar || '🎧',
                    caption,
                    content: caption,
                    tags: tags.split(',').map(t => t.trim()).filter(t => t),
                    contentUrl: mediaPreview || null, // No default mock image
                    time: 'Just now'
                })
            });

            if (response.ok) {
                closeCreateModal();
            }
        } catch (err) {
            console.error('Post creation error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMediaClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="modal-overlay animate-fade-in" onClick={closeCreateModal}>
            <div className="create-post-modal glass-panel" onClick={e => e.stopPropagation()}>
                <div className="modal-top">
                    <h3>Create New Post</h3>
                    <button className="close-btn" onClick={closeCreateModal}><X size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="user-indicator">
                        <img src={user?.avatar || '🎧'} alt="User" className="mini-avatar" />
                        <span className="username">@{user?.username || 'user'}</span>
                    </div>

                    <textarea 
                        placeholder="What's the rhythm today?" 
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        autoFocus
                    />

                    {mediaPreview && (
                        <div className="media-preview">
                            <img src={mediaPreview} alt="Preview" />
                            <button type="button" className="remove-media" onClick={() => setMediaPreview(null)}><X size={14} /></button>
                        </div>
                    )}

                    <div className="tag-input-wrapper">
                        <Hash size={16} className="tag-icon" />
                        <input 
                            type="text" 
                            placeholder="Add tags (comma separated)" 
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>

                    <div className="modal-actions">
                        <input 
                            type="file" 
                            hidden 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                        <div className="attach-options">
                            <button type="button" className="attach-btn" onClick={handleMediaClick} title="Add Image">
                                <Image size={20} />
                            </button>
                            <button type="button" className="attach-btn" title="Add Track">
                                <Music size={20} />
                            </button>
                        </div>
                        <button 
                            type="submit" 
                            className="submit-post-btn text-gradient-bg"
                            disabled={isSubmitting || !caption.trim()}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Post</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
