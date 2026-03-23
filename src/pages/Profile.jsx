import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Grid, Film, User, Plus, Settings, DollarSign, Camera, Upload, Image, Sparkles } from 'lucide-react';

import { useMusic } from '../hooks/useMusic';
import PageHeader from '../components/layout/PageHeader';
import Avatar from '../components/common/Avatar';
import socket from '../services/socket';
import VerificationBadge from '../components/common/VerificationBadge';
import './Profile.css';

const Profile = () => {
    const { username } = useMusic();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('posts');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    const isOwnProfile = (username || 'admin') === (user?.username);

    const loadProfile = useCallback(() => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const targetUser = username || currentUser.username || 'admin';
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/profile/${targetUser}`)
            .then(res => res.json())
            .then(data => {
                setUser(data);
                setIsLoading(false);
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                setIsFollowing(data.followers?.some(f => f._id === currentUser._id || f === currentUser._id));
            })
            .catch(err => {
                console.error("Failed to fetch profile:", err);
                setIsLoading(false);
            });
    }, [username]);



    useEffect(() => {
        loadProfile();

        const handleUpdate = (event) => {
            if (event.type === 'follow' && event.username === (username || 'admin')) {
                setUser(prev => ({ ...prev, followers: event.followers }));
            }
        };
        socket.on('content_updated', handleUpdate);
        return () => socket.off('content_updated', handleUpdate);
    }, [username, loadProfile]);


    const handleFollow = async () => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/profile/${user.username}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentUserId: currentUser._id })
            });
            const data = await res.json();
            setIsFollowing(data.following);
            loadProfile(); // Refresh for follower count
        } catch (err) {
            console.error("Failed to follow user:", err);
        }
    };

    const handleTip = async () => {
        const amount = prompt(`Enter tip amount for ${user.username}:`, "5.00");
        if (!amount || isNaN(amount)) return;

        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/monetization/tip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fromId: currentUser._id, 
                    toId: user._id, 
                    amount: parseFloat(amount)
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Tip of $${amount} sent to ${user.username}!`);
            }
        } catch (err) {
            console.error("Tip failed:", err);
        }
    };



    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [selectedFrame, setSelectedFrame] = useState('gold');
    const [editData, setEditData] = useState({ username: '', name: '', bio: '', avatar: '', banner: '', accentColor: '' });

    const openEditModal = useCallback(() => {
        setEditData({ 
            username: user.username,
            name: user.name || '', 
            bio: user.bio || '', 
            avatar: user.avatar || '', 
            banner: user.banner || '', 
            accentColor: user.accentColor || '#8b5cf6' 
        });
        setIsEditModalOpen(true);
    }, [user]);

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        if (location.search.includes('edit=true')) {
            navigate('/profile', { replace: true });
        }
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditData(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (location.search.includes('edit=true') && user && isOwnProfile && !isEditModalOpen) {
            const timer = setTimeout(() => {
                openEditModal();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [location.search, user, isOwnProfile, isEditModalOpen, openEditModal]);

    const handleUpdateProfile = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/profile/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
                // Update local storage to reflect theme changes immediately
                localStorage.setItem('user', JSON.stringify(data.user));
                closeEditModal();
                // Refresh to apply CSS variables in App.jsx
                window.location.reload(); 
            } else {
                console.error("Failed to update:", data.message);
            }
        } catch (err) {
            console.error("Failed to update profile:", err);
        }
    };

    const handleGiftFrame = async () => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/monetization/gift-frame`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fromId: currentUser._id, 
                    toId: user._id, 
                    frameType: selectedFrame,
                    amount: 50.0
                })
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
                setIsGiftModalOpen(false);
                alert(`You gifted a ${selectedFrame} frame to ${user.username}!`);
            }
        } catch (err) {
            console.error("Gifting failed:", err);
        }
    };


    if (isLoading) return <div className="loading-screen">Resonating...</div>;
    if (!user) return <div className="error-screen">User not found</div>;

    return (
        <div className="ig-profile-container">
            {/* Top Header */}
            <PageHeader title={user.username} isVerified={user.isVerified} />

            {/* Profile Info */}
            <div className="ig-profile-bio-block">
                <div className="profile-banner-container">
                    <img src={user.banner || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070'} alt="" className="profile-banner" />
                </div>
                
                <div className="ig-bio-top-row">
                    <Avatar 
                        src={user?.avatar} 
                        alt="Profile" 
                        size={80} 
                        className="ig-avatar-actual" 
                        frame={user?.avatarFrame || 'none'}
                        isVerified={user?.isVerified}
                    />
                    <div className="ig-stats-row">
                        <div className="ig-stat">
                            <span className="ig-stat-num">{user.posts?.length || 0}</span>
                            <span className="ig-stat-label">posts</span>
                        </div>
                        <div className="ig-stat">
                            <span className="ig-stat-num">{user.followers?.length || 0}</span>
                            <span className="ig-stat-label">followers</span>
                        </div>
                        <div className="ig-stat">
                            <span className="ig-stat-num">{user.following?.length || 0}</span>
                            <span className="ig-stat-label">following</span>
                        </div>
                    </div>
                </div>

                <div className="ig-bio-text-block">
                    <div className="ig-bio-name-row" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <h3 className="ig-bio-name">{user.name || user.username}</h3>
                        {user.isVerified && <VerificationBadge size={18} />}
                    </div>
                    <p className="ig-bio-desc">{user.bio}</p>
                </div>

                {/* Top Tracks Section */}
                {user.topTracks?.length > 0 && (
                    <div className="top-tracks-vibe">
                        <h4 className="vibe-label">Top Rotation</h4>
                        <div className="tracks-scroll">
                            {user.topTracks.map(track => (
                                <div key={track.id} className="vibe-track-card">
                                    <img src={track.artwork} alt="" />
                                    <div className="vibe-meta">
                                        <span className="vibe-title">{track.title}</span>
                                        <span className="vibe-artist">{track.artist}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}


                <div className="ig-action-buttons">
                    {isOwnProfile ? (
                        <>
                            <button className="ig-action-btn-main" onClick={openEditModal}>Edit profile</button>
                            <button className="ig-action-btn-main">Share profile</button>
                        </>
                    ) : (
                        <>
                            <button 
                                className={`ig-action-btn-main ${isFollowing ? 'following' : ''}`} 
                                onClick={handleFollow}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button className="ig-action-btn-main">Message</button>
                            <button className="ig-action-btn-main tip-btn" onClick={handleTip}><DollarSign size={16} /> Tip</button>
                            <button className="ig-action-btn-main gift-btn" onClick={() => setIsGiftModalOpen(true)}><Sparkles size={16} /> Gift Frame</button>

                        </>
                    )}
                    <button className="ig-action-btn-main icon-btn"><User size={18} /></button>
                </div>

                {/* Story Highlights Wrapper */}
                <div className="ig-story-highlights">
                    {(user.highlights || []).map(h => (
                        <div key={h.id} className="ig-highlight-item">
                            <div className="ig-highlight-ring">
                                <span className="ig-highlight-icon">{h.icon}</span>
                            </div>
                            <span className="ig-highlight-label">{h.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Tabs */}
            <div className="ig-profile-tabs">
                <button 
                    className={`ig-tab ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    <Grid size={24} />
                </button>
                <button 
                    className={`ig-tab ${activeTab === 'reels' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reels')}
                >
                    <Film size={24} />
                </button>
                <button 
                    className={`ig-tab ${activeTab === 'tagged' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tagged')}
                >
                    <User size={24} />
                </button>
            </div>

            {/* Grid Content */}
            <div className="ig-profile-grid">
                {user.posts.map((post, i) => (
                    <div key={i} className="ig-grid-item">
                        <img src={post.contentUrl || post.image} alt="Post" loading="lazy" />
                    </div>
                ))}
            </div>

            {/* Premium Glassmorphic Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="ig-modal-overlay">
                    <div className="ig-modal-glass">
                        <div className="ig-modal-header">
                            <h2>Edit Profile</h2>
                            <button className="ig-modal-close" onClick={closeEditModal}>✕</button>
                        </div>
                        <div className="ig-modal-body">
                            
                            {/* Banner Upload */}
                            <div className="ig-edit-field ig-file-field">
                                <label>Profile Banner</label>
                                <div className="ig-upload-preview banner-preview" onClick={() => document.getElementById('banner-upload').click()}>
                                    {editData.banner ? <img src={editData.banner} alt="Banner Preview" className="preview-img" /> : <div className="ig-upload-placeholder"><Image size={24}/></div>}
                                    <div className="ig-upload-overlay"><Upload size={20} /> <span>Change Banner</span></div>
                                </div>
                                <input id="banner-upload" type="file" accept="image/*" onChange={e => handleFileChange(e, 'banner')} style={{ display: 'none' }} />
                            </div>

                            {/* Avatar Upload */}
                            <div className="ig-edit-field ig-file-field">
                                <label>Profile Picture</label>
                                <div className="ig-upload-preview avatar-preview" onClick={() => document.getElementById('avatar-upload').click()}>
                                    {editData.avatar ? <img src={editData.avatar} alt="Avatar Preview" className="preview-img" /> : <div className="ig-upload-placeholder"><Camera size={24}/></div>}
                                    <div className="ig-upload-overlay"><Upload size={24} /></div>
                                </div>
                                <input id="avatar-upload" type="file" accept="image/*" onChange={e => handleFileChange(e, 'avatar')} style={{ display: 'none' }} />
                            </div>

                            <div className="ig-edit-field">
                                <label>Name</label>
                                <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Your display name" />
                            </div>
                            
                             <div className="ig-edit-field">
                                <label>Bio</label>
                                <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} placeholder="Tell the community about yourself..." rows={3} />
                            </div>

                            {user.avatarFrame !== 'none' && (
                                <div className="ig-edit-field">
                                    <label>Premium Accent Color</label>
                                    <div className="theme-picker">
                                        {['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                                            <div 
                                                key={color} 
                                                className={`color-swatch ${editData.accentColor === color ? 'active' : ''}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setEditData({...editData, accentColor: color})}
                                            />
                                        ))}
                                    </div>
                                    <p className="field-hint">Your selection will change the app's glow and highlights.</p>
                                </div>
                            )}

                        </div>
                        <div className="ig-modal-footer">
                            <button className="ig-btn-cancel" onClick={closeEditModal}>Cancel</button>
                            <button className="ig-btn-save" onClick={handleUpdateProfile}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Premium Gifting Modal */}
            {isGiftModalOpen && (
                <div className="ig-modal-overlay">
                    <div className="ig-modal-glass gift-modal">
                        <div className="ig-modal-header">
                            <h2>Gift a Premium Frame</h2>
                            <button className="ig-modal-close" onClick={() => setIsGiftModalOpen(false)}>✕</button>
                        </div>
                        <div className="ig-modal-body">
                            <p className="gift-intro">Surprise {user.username} with a premium profile look!</p>
                            
                            <div className="frame-options-grid">
                                {['gold', 'neon', 'holographic'].map(frame => (
                                    <div 
                                        key={frame} 
                                        className={`frame-option-card ${selectedFrame === frame ? 'active' : ''}`}
                                        onClick={() => setSelectedFrame(frame)}
                                    >
                                        <div className={`frame-preview-circle avatar-frame-${frame}`}>
                                            <div className="inner-circle" />
                                        </div>
                                        <span className="frame-label">{frame.charAt(0).toUpperCase() + frame.slice(1)}</span>
                                        <span className="frame-price">$50.00</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="ig-modal-footer">
                            <button className="ig-btn-cancel" onClick={() => setIsGiftModalOpen(false)}>Cancel</button>
                            <button className="ig-btn-save gift-confirm-btn" onClick={handleGiftFrame}>Confirm Gift</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default Profile;
