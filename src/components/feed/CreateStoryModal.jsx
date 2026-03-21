import React from 'react';
import { X, Send, Camera, Music, Image as ImageIcon, Type } from 'lucide-react';
import './CreateStoryModal.css';

const CreateStoryModal = ({ isOpen, onClose, onConfirm, isUploading }) => {
    const [previewImage, setPreviewImage] = React.useState(null);
    const [textMode, setTextMode] = React.useState(false);

    if (!isOpen) return null;

    const handleGalleryClick = () => {
        const mockImages = [
            'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1000&q=80',
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=100',
            'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=100'
        ];
        const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
        setPreviewImage(randomImage);
        setTextMode(false);
    };

    const handleCameraClick = () => {
        setPreviewImage('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1000&q=80');
        setTextMode(false);
    };

    const handleTextMode = () => {
        setTextMode(!textMode);
        if (!textMode) setPreviewImage(null);
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="modal-overlay story-modal-overlay animate-fade-in" onClick={onClose}>
            <div className="story-create-full glass-panel" onClick={e => e.stopPropagation()}>
                <div className="story-top-actions">
                    <button className="icon-btn-round" onClick={onClose}><X size={24} /></button>
                    <div className="top-tools">
                        <button className="icon-btn-round" onClick={() => alert('Music feature coming soon!')}><Music size={20} /></button>
                        <button className="icon-btn-round" onClick={handleTextMode} style={{ color: textMode ? 'var(--theme-accent)' : 'white' }}><Type size={20} /></button>
                    </div>
                </div>

                <div className={`story-preview-main ${textMode ? 'text-mode-bg' : ''}`}>
                    <div className="preview-user-info">
                        <img src={user.avatar} alt="User" className="mini-avatar" />
                        <span className="username">Your Story</span>
                    </div>
                    {previewImage ? (
                        <img 
                            src={previewImage} 
                            alt="Story Preview" 
                            className="full-preview-img animate-scale-in"
                        />
                    ) : (
                        <div className="empty-preview-placeholder">
                            {textMode ? (
                                <textarea className="story-text-input" placeholder="Type something..." autoFocus />
                            ) : (
                                <div className="placeholder-content">
                                    <ImageIcon size={48} className="opacity-20" />
                                    <p>Select a photo to start</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="story-bottom-actions">
                    <div className="story-options-pills">
                        <button className="pill-btn" onClick={handleCameraClick}><Camera size={18} /><span>Camera</span></button>
                        <button className="pill-btn" onClick={handleGalleryClick}><ImageIcon size={18} /><span>Gallery</span></button>
                    </div>
                    <button 
                        className="instagram-share-btn text-gradient-bg" 
                        onClick={onConfirm}
                        disabled={isUploading}
                    >
                        {isUploading ? "Sharing..." : "Share to Story"}
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateStoryModal;
