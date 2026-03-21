import React, { useState } from 'react';
import { X, Image, Hash, Music, Send, Loader2 } from 'lucide-react';
import { useUI } from '../hooks/useUI';
import './CreatePostModal.css';

const CreatePostModal = () => {
    const { closeCreateModal } = useUI();
    const [caption, setCaption] = useState('');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mediaPreview, setMediaPreview] = useState(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!caption.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/feed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user.username,
                    name: user.name || user.username,
                    avatar: user.avatar,
                    caption,
                    content: caption,
                    tags: tags.split(',').map(t => t.trim()).filter(t => t),
                    contentUrl: mediaPreview || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
                    time: 'Just now'
                })
            });

            if (response.ok) {
                closeCreateModal();
                // We'll rely on socket for real-time update in feed
            }
        } catch (err) {
            console.error('Post creation error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMediaClick = () => {
        // Mock media selection
        const mockImages = [
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
            'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=80',
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80'
        ];
        const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
        setMediaPreview(randomImage);
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
                        <img src={user.avatar} alt="User" className="mini-avatar" />
                        <span className="username">@{user.username}</span>
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
