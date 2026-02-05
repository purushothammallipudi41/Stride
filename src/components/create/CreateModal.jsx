import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Image, Music, MapPin, Users, Share2, Film } from 'lucide-react';
import './CreateModal.css';

const CreateModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('post');
    const [caption, setCaption] = useState('');

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="create-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                    <h3>New {activeTab === 'post' ? 'Post' : 'Reel'}</h3>
                    <button className="share-btn-top"><Share2 size={20} /></button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab ${activeTab === 'post' ? 'active' : ''}`}
                        onClick={() => setActiveTab('post')}
                    >
                        <Image size={20} />
                        <span>Post</span>
                    </button>
                    <button
                        className={`tab ${activeTab === 'reel' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reel')}
                    >
                        <Film size={20} />
                        <span>Reel</span>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="media-placeholder">
                        <Camera size={48} />
                        <p>Upload Photos or Videos</p>
                        <button className="select-btn">Select from device</button>
                    </div>

                    <div className="caption-section">
                        <textarea
                            placeholder="Write a caption..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                        />
                    </div>

                    <div className="options-list">
                        <div className="option-item">
                            <MapPin size={20} />
                            <span>Add Location</span>
                        </div>
                        <div className="option-item">
                            <Users size={20} />
                            <span>Tag People</span>
                        </div>
                        <div className="option-item">
                            <Music size={20} />
                            <span>Add Music</span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="main-share-btn">Share</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CreateModal;
