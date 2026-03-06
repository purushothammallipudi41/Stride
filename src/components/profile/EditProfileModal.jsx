import { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { getImageUrl } from '../../utils/imageUtils';
import UserAvatar from '../common/UserAvatar';
import './EditProfileModal.css';

const EditProfileModal = ({ onClose }) => {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        username: user?.username || '',
        bio: user?.bio || '',
        avatar: user?.avatar || ''
    });

    const handleTextChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {

            const reader = new FileReader();
            reader.onloadend = () => {

                setFormData(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {

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
                    <div className="profile-image-section">
                        <UserAvatar
                            user={{ ...user, avatar: formData.avatar }}
                            size="lg"
                        />
                        <div className="image-actions">
                            <button type="button" className="icon-btn image-action-btn" onClick={() => fileInputRef.current.click()} title="Upload from Gallery">
                                <ImageIcon size={20} />
                            </button>
                            <button type="button" className="icon-btn image-action-btn" onClick={() => cameraInputRef.current.click()} title="Take Photo">
                                <Camera size={20} />
                            </button>
                            {/* Hidden Inputs */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <input
                                type="file"
                                ref={cameraInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                capture="user"
                                style={{ display: 'none' }}
                            />
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
                        <label>Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleTextChange}
                            placeholder="Tell us about your vibe..."
                            rows="3"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
