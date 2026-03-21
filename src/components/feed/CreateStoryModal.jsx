import React from 'react';
import { X, Send, Camera, Music, Image as ImageIcon } from 'lucide-react';
import './CreateStoryModal.css';

const CreateStoryModal = ({ isOpen, onClose, onConfirm, isUploading }) => {
    if (!isOpen) return null;

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="modal-overlay story-modal-overlay animate-fade-in" onClick={onClose}>
            <div className="story-create-full glass-panel" onClick={e => e.stopPropagation()}>
                <div className="story-top-actions">
                    <button className="icon-btn-round" onClick={onClose}><X size={24} /></button>
                    <div className="top-tools">
                        <button className="icon-btn-round"><Music size={20} /></button>
                        <button className="icon-btn-round">Aa</button>
                    </div>
                </div>

                <div className="story-preview-main">
                    <div className="preview-user-info">
                        <img src={user.avatar} alt="User" className="mini-avatar" />
                        <span className="username">Your Story</span>
                    </div>
                    <img 
                        src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=1000&q=80" 
                        alt="Story Preview" 
                        className="full-preview-img"
                    />
                </div>

                <div className="story-bottom-actions">
                    <div className="story-options-pills">
                        <button className="pill-btn"><Camera size={18} /><span>Camera</span></button>
                        <button className="pill-btn"><ImageIcon size={18} /><span>Gallery</span></button>
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
