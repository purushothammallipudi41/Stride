import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Hash, Music, Send, Loader2, Camera, FolderOpen, X, ChevronRight, Zap, Plus, Play } from 'lucide-react';
import { useUI } from '../hooks/useUI';
import { getStoredUser } from '../utils/storage';
import { BASE_URL } from '../utils/api';
import GlobalModal from './common/GlobalModal';
import MediaStudio from './studio/MediaStudio';
import './CreatePostModal.css';

const CreatePostModal = () => {
    const navigate = useNavigate();
    const { isCreateModalOpen, closeCreateModal, createType } = useUI();
    const user = getStoredUser();
    const [caption, setCaption] = useState('');
    const [tags, setTags] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [step, setStep] = useState('SELECT'); // SELECT, EDIT, POST
    const [editData, setEditData] = useState({ filter: 'normal', isHD: true, cssFilter: 'none' });
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [creationType, setCreationType] = useState('POST'); // POST, COMMUNITY
    const [communityName, setCommunityName] = useState('');
    const [communityDesc, setCommunityDesc] = useState('');
    const [communityAccent, setCommunityAccent] = useState('#0066ff');

    // Ensure state is fresh on mount
    useEffect(() => {
        if (isCreateModalOpen) {
            setCaption('');
            setTags('');
            setMediaPreview(null);
            setStep('SELECT');
            setIsSuccess(false);
            setError(null);
            setCreationType(createType || 'POST');
            setCommunityName('');
            setCommunityDesc('');
        }
    }, [isCreateModalOpen, createType]);

    const handleCreateCommunity = async (e) => {
        e.preventDefault();
        if (!communityName.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const communityData = {
                name: communityName,
                description: communityDesc,
                accentColor: communityAccent,
                owner: user._id || user.username
            };

            const response = await fetch(`${BASE_URL}/api/communities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(communityData)
            });

            if (response.ok) {
                const newCmd = await response.json();
                setIsSuccess(true);
                setTimeout(() => {
                    closeCreateModal();
                    window.location.href = `/community/${newCmd._id || newCmd.id}`;
                }, 1500);
            } else {
                setError('Failed to create community node.');
            }
        } catch (err) {
            setError('Nexus connection failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        if (creationType === 'COMMUNITY') return handleCreateCommunity(e);
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
                content: trimmedCaption || (creationType === 'REEL' ? 'Shared a reel' : 'Shared a moment'),
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
                contentUrl: mediaPreview || null,
                isHD: editData.isHD,
                filterApplied: editData.filter,
                type: creationType === 'REEL' ? 'reel' : 'post',
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
                setStep('EDIT');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStudioSave = (data) => {
        setEditData(data);
        setStep('POST');
    };

    const handleMediaClick = () => {
        fileInputRef.current?.click();
    };

    const handleCameraClick = () => {
        closeCreateModal();
        navigate('/studio');
    };

    const handleMusicClick = () => {
        closeCreateModal();
        navigate('/music');
    };

    return (
        <GlobalModal 
            isOpen={isCreateModalOpen} 
            onClose={closeCreateModal}
            title={
                creationType === 'COMMUNITY' ? 'Establish New Community' : 
                creationType === 'REEL' ? 'Create New Reel' : 
                'Create New Post'
            }
            maxWidth="550px"
            className="create-post-standardized"
        >
            <form onSubmit={handleSubmit} className="modal-content-wrapper">
                {step === 'EDIT' && mediaPreview && (
                    <MediaStudio 
                        media={mediaPreview} 
                        onSave={handleStudioSave} 
                        onCancel={() => setStep('SELECT')} 
                    />
                )}

                <div className="modal-body-scroll">
                    <div className="user-indicator" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <img src={user?.avatar || '🎧'} alt="User" className="mini-avatar" />
                        <span className="username">@{user?.username || 'user'}</span>
                    </div>

                    {creationType === 'COMMUNITY' ? (
                        <div className="community-creation-stage animate-fade-in" style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="input-field-premium">
                                <label style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Community Name</label>
                                <input 
                                    type="text" 
                                    placeholder="The Node Name..." 
                                    value={communityName} 
                                    onChange={(e) => setCommunityName(e.target.value)}
                                    style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                                />
                            </div>
                            <div className="input-field-premium">
                                <label style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Manifesto / Description</label>
                                <textarea 
                                    placeholder="What's this node about?" 
                                    value={communityDesc} 
                                    onChange={(e) => setCommunityDesc(e.target.value)}
                                    style={{ width: '100%', minHeight: '100px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '0.9rem', outline: 'none', resize: 'none' }}
                                />
                            </div>

                            <div className="branding-section">
                                <label style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Branding Accent</label>
                                <div className="accent-picker" style={{ display: 'flex', gap: '10px' }}>
                                    {['#0066ff', '#ec4899', '#f43f5e', '#10b981', '#3b82f6'].map(color => (
                                        <button 
                                            key={color}
                                            type="button" 
                                            onClick={() => setCommunityAccent(color)}
                                            style={{ 
                                                width: '30px', 
                                                height: '30px', 
                                                borderRadius: '50%', 
                                                background: color, 
                                                border: communityAccent === color ? '2px solid white' : 'none',
                                                cursor: 'pointer' 
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="post-creation-nexus">
                            {step === 'SELECT' ? (
                        <div className="select-stage animate-fade-in">
                            <div className="welcome-editor">
                                <h3>Create something amazing</h3>
                                <p>Select a photo to start editing with Vision Studio</p>
                            </div>
                            
                            <div className="attachment-section">
                                <div className="attachment-grid">
                                    <button type="button" className="attachment-tile" onClick={handleMediaClick}>
                                        <div className="tile-icon gallery-bg"><FolderOpen size={20} /></div>
                                        <span>Gallery</span>
                                    </button>
                                    <button type="button" className="attachment-tile" onClick={handleCameraClick}>
                                        <div className="tile-icon camera-bg"><Camera size={20} /></div>
                                        <span>Camera</span>
                                    </button>
                                    <button type="button" className="attachment-tile" onClick={() => { setCreationType('REEL'); handleMediaClick(); }}>
                                        <div className="tile-icon reels-bg" style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}><Play size={20} /></div>
                                        <span>Reel</span>
                                    </button>
                                    <button type="button" className="attachment-tile" onClick={handleMusicClick}>
                                        <div className="tile-icon music-bg"><Music size={20} /></div>
                                        <span>Music</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="post-stage animate-fade-in">
                            <textarea 
                                placeholder={creationType === 'REEL' ? "Write a caption for your reel..." : "What's the frequency today?"} 
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                autoFocus
                            />

                            {mediaPreview && (
                                <div className="media-preview edit-preview" onClick={() => setStep('EDIT')}>
                                    <img src={mediaPreview} alt="Preview" style={{ filter: editData.cssFilter }} />
                                    <div className="edit-overlay">
                                        <div className="edit-badge">VISION STUDIO ACTIVE</div>
                                        <button type="button" className="remove-media" onClick={(e) => { e.stopPropagation(); setMediaPreview(null); setStep('SELECT'); }}><X size={14} /></button>
                                    </div>
                                    {editData.isHD && <div className="hd-badge-corner">4K HD</div>}
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
                        </div>
                    )}
                </div>
            )}

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
                                <p>{creationType === 'COMMUNITY' ? 'Node Established! 🌐' : 'Post Synced! 🚀'}</p>
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
                    
                    {creationType === 'COMMUNITY' ? (
                        <button 
                            type="submit" 
                            className="submit-post-btn text-gradient-bg"
                            disabled={isSubmitting || !communityName.trim()}
                            style={{ background: communityAccent }}
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <><Zap size={18} /> Establish Community</>
                            )}
                        </button>
                    ) : (
                        step === 'POST' && (
                            <button 
                                type="submit" 
                                className="submit-post-btn text-gradient-bg"
                                disabled={isSubmitting || (!caption.trim() && !mediaPreview)}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <><Send size={18} /> {creationType === 'REEL' ? 'Share Reel' : 'Share to Feed'}</>
                                )}
                            </button>
                        )
                    )}
                </div>
            </form>
        </GlobalModal>
    );
};

export default CreatePostModal;
