import { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Upload, Loader2, Sparkles, Palette } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ImageCropper from '../common/ImageCropper';
import MediaCapture from '../common/MediaCapture';

import { getImageUrl } from '../../utils/imageUtils';
import UserAvatar from '../common/UserAvatar';
import './EditProfileModal.css';

const EditProfileModal = ({ onClose }) => {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const bannerInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        bio: user?.bio || '',
        avatar: user?.avatar || '',
        bannerUrl: user?.bannerUrl || '',
        status: user?.status || ''
    });

    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [loadingAI, setLoadingAI] = useState(false);
    const [themeVibe, setThemeVibe] = useState('');

    const [cropperConfig, setCropperConfig] = useState({
        isOpen: false,
        image: null,
        type: 'avatar',
        aspectRatio: 1
    });

    const handleTextChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e, type = 'avatar') => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropperConfig({
                    isOpen: true,
                    image: reader.result,
                    type,
                    aspectRatio: type === 'banner' ? 16 / 9 : 1
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraCapture = (capturedImage) => {
        setCropperConfig({
            isOpen: true,
            image: capturedImage,
            type: 'avatar',
            aspectRatio: 1
        });
        setIsCameraOpen(false);
    };

    const handleCropDone = (croppedImage) => {
        const type = cropperConfig.type;
        if (type === 'banner') {
            setFormData(prev => ({ ...prev, bannerUrl: croppedImage }));
        } else {
            setFormData(prev => ({ ...prev, avatar: croppedImage }));
        }
        setCropperConfig({ ...cropperConfig, isOpen: false });
    };

    const generateAIBio = async () => {
        setLoadingAI(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('/api/ai/tone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: formData.bio || "I love music and technology",
                    tone: "Excited and professional"
                })
            });
            const data = await res.json();
            if (data.rewrittenText) {
                setFormData(prev => ({ ...prev, bio: data.rewrittenText }));
            }
        } catch (e) {
            console.error('AI Bio failed', e);
        } finally {
            setLoadingAI(false);
        }
    };

    const generateTheme = async () => {
        if (!themeVibe) return;
        setLoadingAI(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('/api/ai/profile-theme', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ vibe: themeVibe })
            });
            const data = await res.json();
            // Apply theme as inline styles or save to user settings
            console.log('AI Theme generated:', data);
            alert(`New theme "${data.themeName}" applied!`);
            // Implementation: We could save this to a new 'theme' field in user model
        } catch (e) {
            console.error('AI Theme failed', e);
        } finally {
            setLoadingAI(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(formData);
            onClose();
        } catch (error) {
            console.error('Update profile error:', error);
            alert(`Failed to update profile: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-card edit-profile-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Edit Profile</h3>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="edit-profile-form">
                    <div className="form-body">
                        <div className="banner-edit-section" style={{ position: 'relative', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {formData.bannerUrl ? (
                                <img src={getImageUrl(formData.bannerUrl)} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                    <ImageIcon size={32} />
                                </div>
                            )}
                            <button
                                type="button"
                                className="banner-upload-btn"
                                onClick={() => bannerInputRef.current.click()}
                                style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                            >
                                <Upload size={18} />
                            </button>
                            <input
                                type="file"
                                ref={bannerInputRef}
                                onChange={(e) => handleImageUpload(e, 'banner')}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />

                            <div className="avatar-preview-overlay" style={{ position: 'absolute', bottom: '-35px', left: '20px' }}>
                                <UserAvatar
                                    user={{ ...user, avatar: formData.avatar }}
                                    size="lg"
                                />
                                <button
                                    type="button"
                                    className="avatar-edit-icon"
                                    onClick={() => fileInputRef.current.click()}
                                    style={{ position: 'absolute', bottom: '0', right: '0', background: '#3b82f6', border: '2px solid #1a1a1a', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                                >
                                    <Camera size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '10px' }}>
                            <label>Avatar Gallery/Camera</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" className="icon-btn image-action-btn" onClick={() => fileInputRef.current.click()} title="Upload Avatar">
                                    <ImageIcon size={20} />
                                </button>
                                <button type="button" className="icon-btn image-action-btn" onClick={() => setIsCameraOpen(true)} title="Take Avatar Photo">
                                    <Camera size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleTextChange}
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleTextChange}
                                placeholder="Username"
                            />
                        </div>

                        <div className="form-group">
                            <label>Status message</label>
                            <input
                                type="text"
                                name="status"
                                value={formData.status}
                                onChange={handleTextChange}
                                placeholder="Set a status..."
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                Bio
                                <button type="button" className="ai-assist-btn" onClick={generateAIBio} disabled={loadingAI}>
                                    <Sparkles size={12} /> {loadingAI ? 'Polishing...' : 'AI Enhance'}
                                </button>
                            </label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleTextChange}
                                placeholder="Tell us about your vibe..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group theme-lab">
                            <label><Palette size={16} /> Theme Lab</label>
                            <div className="theme-input-group">
                                <input
                                    type="text"
                                    placeholder="Enter a vibe (e.g. Cyberpunk)"
                                    value={themeVibe}
                                    onChange={(e) => setThemeVibe(e.target.value)}
                                />
                                <button type="button" className="generate-theme-btn" onClick={generateTheme} disabled={loadingAI}>
                                    {loadingAI ? '...' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </form>

                {cropperConfig.isOpen && (
                    <ImageCropper
                        image={cropperConfig.image}
                        aspectRatio={cropperConfig.aspectRatio}
                        onCrop={handleCropDone}
                        onCancel={() => setCropperConfig({ ...cropperConfig, isOpen: false })}
                    />
                )}
                {isCameraOpen && (
                    <div className="modal-overlay ar-camera-overlay" style={{ zIndex: 2000 }}>
                        <div className="modal-content glass-card" style={{ padding: 0, overflow: 'hidden', maxWidth: '500px' }}>
                            <div className="modal-header" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}>
                                <h3 style={{ color: 'white' }}>AR Camera</h3>
                                <button className="close-btn" onClick={() => setIsCameraOpen(false)} style={{ color: 'white' }}><X size={24} /></button>
                            </div>
                            <MediaCapture
                                onCapture={handleCameraCapture}
                                onClose={() => setIsCameraOpen(false)}
                                type="image"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditProfileModal;
