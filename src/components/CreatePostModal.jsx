import { Image, Hash, Music, Send, Loader2, Camera, FolderOpen } from 'lucide-react';
import { useUI } from '../hooks/useUI';
import { getStoredUser } from '../utils/storage';
import { BASE_URL } from '../utils/api';
import GlobalModal from './common/GlobalModal';
import './CreatePostModal.css';

const CreatePostModal = () => {
    const { isCreateModalOpen, closeCreateModal } = useUI();
    const user = getStoredUser();
    const [caption, setCaption] = useState('');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const fileInputRef = React.useRef(null);
    const cameraInputRef = React.useRef(null);

    // Ensure state is fresh on mount
    React.useEffect(() => {
        setCaption('');
        setTags('');
        setMediaPreview(null);
        setIsSuccess(false);
        setError(null);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedCaption = caption.trim();
        if (!trimmedCaption && !mediaPreview) return;

        setIsSubmitting(true);
        setError(null);
        
        console.log(`[CreatePost] Attempting post for user: ${user?.username}`);

        try {
            const postData = {
                username: user?.username || 'user',
                name: user?.name || user?.username || 'user',
                avatar: user?.avatar || '🎧',
                caption: trimmedCaption || '',
                content: trimmedCaption || 'Shared a moment',
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
                contentUrl: mediaPreview || null,
                time: 'Just now'
            };

            const response = await fetch(`${BASE_URL}/api/feed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            if (response.ok) {
                console.log('[CreatePost] Status: Success');
                setIsSuccess(true);
                setTimeout(() => {
                    closeCreateModal();
                }, 1500);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('[CreatePost] Status: Failed', response.status, errorData);
                setError(errorData.message || 'Failed to share post. Please try again.');
            }
        } catch (err) {
            console.error('[CreatePost] Network Error:', err);
            setError('Connection error. Check your internet or try later.');
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

    const handleCameraClick = () => {
        cameraInputRef.current?.click();
    };

    return (
        <GlobalModal 
            isOpen={isCreateModalOpen} 
            onClose={closeCreateModal}
            title="Create New Post"
            maxWidth="550px"
            className="create-post-standardized"
        >
            <form onSubmit={handleSubmit} className="modal-content-wrapper">
                <div className="modal-body-scroll">
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

                    <div className="attachment-section">
                        <p className="section-label">ADD TO YOUR POST</p>
                        <div className="attachment-grid">
                            <button type="button" className="attachment-tile" onClick={handleMediaClick}>
                                <div className="tile-icon gallery-bg"><FolderOpen size={20} /></div>
                                <span>Gallery</span>
                            </button>
                            <button type="button" className="attachment-tile" onClick={handleCameraClick}>
                                <div className="tile-icon camera-bg"><Camera size={20} /></div>
                                <span>Camera</span>
                            </button>
                            <button type="button" className="attachment-tile">
                                <div className="tile-icon music-bg"><Music size={20} /></div>
                                <span>Music</span>
                            </button>
                        </div>
                    </div>

                    {isSubmitting && (
                        <div className="syncing-overlay animate-fade-in">
                            <div className="syncing-content">
                                <Loader2 className="animate-spin" size={40} />
                                <p>Syncing to Cloud...</p>
                            </div>
                        </div>
                    )}

                    {isSuccess && (
                        <div className="success-overlay animate-fade-in">
                            <div className="success-content">
                                <div className="check-icon">✓</div>
                                <p>Post Synced! 🚀</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-message animate-shake">
                            {error}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <input 
                        type="file" 
                        hidden 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                    <input 
                        type="file" 
                        hidden 
                        ref={cameraInputRef} 
                        onChange={handleFileChange}
                        accept="image/*"
                        capture="environment"
                    />
                    <button 
                        type="submit" 
                        className="submit-post-btn text-gradient-bg"
                        disabled={isSubmitting || (!caption.trim() && !mediaPreview)}
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <><Send size={18} /> Post</>
                        )}
                    </button>
                </div>
            </form>
        </GlobalModal>
    );
};

export default CreatePostModal;
