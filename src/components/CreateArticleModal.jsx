import React, { useState, useEffect, useRef } from 'react';
import { PenTool, Image, Hash, Send, Loader2, Camera, FolderOpen, X, Globe, Sparkles, BookOpen } from 'lucide-react';
import { useUI } from '../hooks/useUI';
import { getStoredUser } from '../utils/storage';
import { BASE_URL } from '../utils/api';
import GlobalModal from './common/GlobalModal';
import './CreateArticleModal.css';

const CreateArticleModal = () => {
    const { isArticleModalOpen, closeArticleModal } = useUI();
    const user = getStoredUser();
    
    // Form State
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [tags, setTags] = useState('');
    const [mediaPreview, setMediaPreview] = useState(null);
    
    // Status State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    
    const fileInputRef = useRef(null);

    // Reset when opened
    useEffect(() => {
        if (isArticleModalOpen) {
            setTitle('');
            setBody('');
            setTags('');
            setMediaPreview(null);
            setIsSuccess(false);
            setError(null);
        }
    }, [isArticleModalOpen]);

    const handlePublish = async (e) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const articleData = {
                title: title.trim(),
                body: body.trim(),
                coverImage: mediaPreview,
                author: user.username,
                authorName: user.name || user.username,
                authorAvatar: user.avatar,
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
                createdAt: new Date().toISOString()
            };

            const response = await fetch(`${BASE_URL}/api/articles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(articleData)
            });

            if (response.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    closeArticleModal();
                    // Optional: navigate to the new article or reload
                    if (window.location.pathname === '/articles') {
                        window.location.reload();
                    }
                }, 1500);
            } else {
                const errData = await response.json().catch(() => ({}));
                setError(errData.message || 'Failed to publish your story.');
            }
        } catch (err) {
            setError('Connection failed. Nexus is unreachable.');
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

    return (
        <GlobalModal 
            isOpen={isArticleModalOpen} 
            onClose={closeArticleModal}
            title="Compose Vyx Article"
            maxWidth="700px"
            className="create-article-standardized"
        >
            <form onSubmit={handlePublish} className="article-modal-wrapper">
                <div className="article-modal-body">
                    {/* User Info Header */}
                    <div className="article-editor-user">
                        <img src={user?.avatar || '🎧'} alt={user?.username} className="editor-avatar" />
                        <div className="editor-meta">
                            <span className="editor-name">Drafting as {user?.name || user?.username}</span>
                            <span className="editor-badge">PREMIUM CREATOR</span>
                        </div>
                    </div>

                    {/* Cover Image Sector */}
                    <div 
                        className={`article-cover-sector ${mediaPreview ? 'has-media' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {mediaPreview ? (
                            <>
                                <img src={mediaPreview} alt="Cover" className="cover-img-preview" />
                                <div className="cover-overlay">
                                    <div className="edit-badge"><Sparkles size={14} /> TAP TO CHANGE COVER</div>
                                    <button 
                                        type="button" 
                                        className="clear-cover" 
                                        onClick={(e) => { e.stopPropagation(); setMediaPreview(null); }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="cover-placeholder">
                                <div className="placeholder-icon-circle">
                                    <Image size={32} />
                                </div>
                                <span className="placeholder-text">Add a compelling cover image</span>
                                <span className="placeholder-subtext">Recommended: 1200x630 (landscape)</span>
                            </div>
                        )}
                        <input 
                            type="file" 
                            hidden 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                        />
                    </div>

                    {/* Editor Fields */}
                    <div className="article-fields-nexus">
                        <div className="field-group">
                            <label className="field-label-premium">HEADLINE</label>
                            <input 
                                type="text" 
                                className="headline-input-premium"
                                placeholder="Enter your article title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="field-group">
                            <label className="field-label-premium">STORY CONTENT</label>
                            <textarea 
                                className="body-textarea-premium"
                                placeholder="Start writing your masterpiece..."
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                            />
                        </div>

                        <div className="field-group">
                            <label className="field-label-premium">TAGS & DISCOVERY</label>
                            <div className="tag-input-container-premium glass-panel">
                                <Hash size={18} className="tag-icon-v3" />
                                <input 
                                    type="text" 
                                    className="tag-input-v3"
                                    placeholder="music, web3, artist-spotlight..."
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overlays */}
                {isSubmitting && (
                    <div className="article-status-overlay syncing">
                        <Loader2 className="animate-spin" size={48} color="#0066ff" />
                        <p>Syncing nodes across Vyx...</p>
                    </div>
                )}

                {isSuccess && (
                    <div className="article-status-overlay success">
                        <div className="success-lottie-mock">
                            <Sparkles size={64} color="#10b981" className="animate-pulse" />
                        </div>
                        <p>Article Published successfully!</p>
                    </div>
                )}

                {error && (
                    <div className="article-error-banner animate-shake">
                        <Globe size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="article-modal-footer">
                    <button 
                        type="button" 
                        className="btn-cancel-article"
                        onClick={closeArticleModal}
                    >
                        Discard
                    </button>
                    <button 
                        type="submit" 
                        className="btn-publish-article premium-gradient-bg"
                        disabled={isSubmitting || !title.trim() || !body.trim()}
                    >
                        <PenTool size={18} />
                        <span>Publish Story</span>
                    </button>
                </div>
            </form>
        </GlobalModal>
    );
};

export default CreateArticleModal;
