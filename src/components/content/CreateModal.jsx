import { X, Image, Film, Music, Send } from 'lucide-react';
import { useState } from 'react';
import { useUI } from '../../hooks/useUI';
import './CreateModal.css';

const CreateModal = () => {
    const { closeCreateModal } = useUI();
    const [type, setType] = useState('post');
    const [caption, setCaption] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handlePublish = async () => {
        console.log(`Publishing ${type}: ${caption}`);
        
        try {
            const endpoint = type === 'post' ? '/api/feed' : '/api/stories';
            const payload = {
                content: caption,
                username: "hotham_user", // Simple mock user
                likes: 0,
                comments: 0
            };
            
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            closeCreateModal();
        } catch (error) {
            console.error("Failed to publish:", error);
            alert("Failed to publish content");
        }
    };

    return (
        <div className="modal-overlay" onClick={closeCreateModal}>
            <div className="create-modal glass-panel" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h2>Share a new <span className="text-gradient">Stride</span></h2>
                    <button className="close-btn" onClick={closeCreateModal}>
                        <X size={24} />
                    </button>
                </header>

                <div className="modal-body">
                    <div className="type-selector">
                        <button 
                            className={`type-btn ${type === 'post' ? 'active' : ''}`}
                            onClick={() => setType('post')}
                        >
                            <Image size={20} />
                            <span>Post</span>
                        </button>
                        <button 
                            className={`type-btn ${type === 'reel' ? 'active' : ''}`}
                            onClick={() => setType('reel')}
                        >
                            <Film size={20} />
                            <span>Reel</span>
                        </button>
                        <button 
                            className={`type-btn ${type === 'music' ? 'active' : ''}`}
                            onClick={() => setType('music')}
                        >
                            <Music size={20} />
                            <span>Music</span>
                        </button>
                    </div>

                    <div className="upload-area">
                        {previewUrl ? (
                            <div className="preview-container">
                                {type === 'reel' ? (
                                    <video src={previewUrl} autoPlay muted loop className="content-preview" />
                                ) : (
                                    <img src={previewUrl} alt="Preview" className="content-preview" />
                                )}
                                <button className="remove-preview" onClick={() => setPreviewUrl(null)}>
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <label className="upload-placeholder">
                                <PlusIcon />
                                <span>Click to upload media</span>
                                <input type="file" onChange={handleFileChange} hidden accept="image/*,video/*" />
                            </label>
                        )}
                    </div>

                    <textarea 
                        className="caption-input"
                        placeholder="What's on your mind? #strides #stride"
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                    />
                </div>

                <footer className="modal-footer">
                    <button className="cancel-publish" onClick={closeCreateModal}>Cancel</button>
                    <button className="publish-btn highlight" onClick={handlePublish}>
                        <Send size={18} />
                        Publish
                    </button>
                </footer>
            </div>
        </div>
    );
};

const PlusIcon = () => (
    <div className="plus-icon-container">
        <div className="plus-vertical" />
        <div className="plus-horizontal" />
    </div>
);

export default CreateModal;
