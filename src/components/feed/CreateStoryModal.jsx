import React, { useRef, useState } from 'react';
import { X, Send, Camera, Music, Image as ImageIcon, Type } from 'lucide-react';
import './CreateStoryModal.css';

const CreateStoryModal = ({ isOpen, onClose, onConfirm, isUploading }) => {
    const [previewImage, setPreviewImage] = useState(null);
    const [textMode, setTextMode] = useState(false);
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
                setTextMode(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryClick = () => {
        galleryInputRef.current.click();
    };

    const handleCameraClick = () => {
        cameraInputRef.current.click();
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
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={galleryInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange} 
                    />
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        ref={cameraInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleFileChange} 
                    />
                    <div className="story-options-pills">
                        <button className="pill-btn" onClick={handleCameraClick}><Camera size={18} /><span>Camera</span></button>
                        <button className="pill-btn" onClick={handleGalleryClick}><ImageIcon size={18} /><span>Gallery</span></button>
                    </div>
                    <button 
                        className="instagram-share-btn text-gradient-bg" 
                        onClick={() => onConfirm(previewImage)}
                        disabled={isUploading || (!previewImage && !textMode)}
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
