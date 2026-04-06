import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Grid, Film, User, Plus, Settings, DollarSign, Camera, Upload, Image, Sparkles } from 'lucide-react';

import { useMusic } from '../hooks/useMusic';
import PageHeader from '../components/layout/PageHeader';
import Avatar from '../components/common/Avatar';
import SubscribeButton from '../components/profile/SubscribeButton';
import socket from '../services/socket';
import VerificationBadge from '../components/common/VerificationBadge';
import { BASE_URL } from '../utils/api';
import './Profile.css';

const Profile = () => {
    const { username: routeUsername } = useParams();
    const { username: loggedUser } = useMusic();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('posts');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isOwnProfile = !routeUsername || routeUsername === currentUser.username;

    const loadProfile = useCallback(() => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const targetUser = routeUsername || loggedUser || currentUser.username || 'admin';
        fetch(`${BASE_URL}/api/profile/${targetUser}`)
            .then(res => res.json())
            .then(data => {
                setUser(data);
                setIsLoading(false);
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                setIsFollowing(Array.isArray(data.followers) && data.followers.some(f => f._id === currentUser._id || f === currentUser._id));
            })
            .catch(err => {
                console.error("Failed to fetch profile:", err);
                setIsLoading(false);
            });
    }, [routeUsername, loggedUser]);



    useEffect(() => {
        loadProfile();

        const handleUpdate = (event) => {
            const currentTarget = routeUsername || loggedUser || JSON.parse(localStorage.getItem('user') || '{}').username;
            if (event.type === 'follow' && event.username === currentTarget) {
                setUser(prev => prev ? { ...prev, followerCount: event.followerCount } : prev);
            }
        };
        socket.on('content_updated', handleUpdate);
        return () => socket.off('content_updated', handleUpdate);
    }, [routeUsername, loggedUser, loadProfile]);


    const handleFollow = async () => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await fetch(`${BASE_URL}/api/profile/${user.username}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    currentUserId: currentUser._id,
                    followerUsername: currentUser.username
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsFollowing(true);
                setUser(prev => ({ ...prev, followerCount: data.followerCount }));
            }
        } catch (err) {
            console.error("Failed to follow user:", err);
        }
    };

    const handleSendTip = async () => {
        if (!tipAmount || isNaN(tipAmount) || parseInt(tipAmount) <= 0) return;
        setTipStatus('sending');
        try {
            const currentUserUsername = localStorage.getItem('stride_user_username') || 'puru';
            const res = await fetch(`${BASE_URL}/api/wallet/tip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-username': currentUserUsername },
                body: JSON.stringify({ targetUsername: user.username, amount: parseInt(tipAmount) })
            });
            const data = await res.json();
            setTipStatus(data.success ? 'success' : 'error');
            if (data.success) setTimeout(() => { setIsTipModalOpen(false); setTipStatus(''); setTipAmount('10'); }, 1500);
        } catch { setTipStatus('error'); }
    };


    const handleShare = () => {
        const url = `${window.location.origin}/profile/${user.username}`;
        if (navigator.share) {
            navigator.share({ title: `${user.username} on Stride`, url });
        } else {
            navigator.clipboard.writeText(url);
            alert('Profile link copied to clipboard!');
        }
    };

    const handleMessage = () => {
        navigate('/messages');
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [isTipModalOpen, setIsTipModalOpen] = useState(false);
    const [tipAmount, setTipAmount] = useState('10');
    const [tipStatus, setTipStatus] = useState('');
    const [selectedFrame, setSelectedFrame] = useState('gold');
    const [editData, setEditData] = useState({ username: '', name: '', bio: '', avatar: '', banner: '', accentColor: '' });

    const openEditModal = useCallback(() => {
        setEditData({ 
            username: user.username,
            name: user.name || '', 
            bio: user.bio || '', 
            avatar: user.avatar || '', 
            banner: user.banner || '', 
            accentColor: user.accentColor || '#8b5cf6',
            avatarFrame: user.avatarFrame || 'none'
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
            const res = await fetch(`${BASE_URL}/api/profile/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            const data = await res.json();
            if (data.success) {
                // Update local storage and DOM immediately for instant feedback and E2E stability
                localStorage.setItem('user', JSON.stringify(data.user));
                if (data.user.accentColor) {
                    localStorage.setItem('stride_theme_color', data.user.accentColor);
                    document.documentElement.style.setProperty('--theme-primary', data.user.accentColor);
                }
                
                setUser(data.user);
                
                // Deterministic reload: use a very short delay to ensure browser paints/saves if needed
                // but keep it fast enough for E2E speed
                requestAnimationFrame(() => {
                    window.location.reload();
                });
            } else {
                console.error("Failed to update:", data.message);
            }
        } catch (err) {
            console.error("Failed to update profile:", err);
        }
    };

    const handleGiftFrame = async () => {
        try {
            const currentUserUsername = localStorage.getItem('stride_user_username') || 'puru';
            
            // First, process the payment via wallet
            const paymentRes = await fetch(`${BASE_URL}/api/wallet/tip`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-username': currentUserUsername
                },
                body: JSON.stringify({ 
                    targetUsername: user.username, 
                    amount: 50,
                    description: `Gifted ${selectedFrame} frame`
                })
            });
            const paymentData = await paymentRes.json();
            
            if (!paymentData.success) {
                alert(paymentData.error || "Insufficient credits for this gift.");
                return;
            }

            // Then, update the profile frame
            const res = await fetch(`${BASE_URL}/api/profile/update-frame`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: user.username, 
                    frameType: selectedFrame 
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
            alert("Gifting process failed.");
        }
    };


    if (isLoading) return <div className="loading-screen">Resonating...</div>;
    if (!user) return <div className="error-screen">User not found</div>;

    // Last-ditch safety for nested properties
    const safeUser = {
        posts: [],
        topTracks: [],
        followers: [],
        highlights: [],
        ...user
    };

    return (
        <div className="ig-profile-container">
            {/* Top Header */}
            <PageHeader title={user.username} />

            {/* Profile Info */}
            <div className="ig-profile-bio-block">
                <div className="profile-banner-container">
                    <img src={user.banner || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070'} alt="" className="profile-banner" />
                </div>
                
                <div className="ig-bio-top-row">
                    <Avatar 
                        src={safeUser?.avatar} 
                        alt="Profile" 
                        size={80} 
                        className="ig-avatar-actual" 
                        frame={safeUser?.avatarFrame || 'none'}
                        isVerified={safeUser?.isVerified}
                    />
                    <div className="ig-stats-row">
                        <div className="ig-stat">
                            <span className="ig-stat-num">{safeUser.posts?.length || 0}</span>
                            <span className="ig-stat-label">posts</span>
                        </div>
                        <div className="ig-stat">
                            <span className="ig-stat-num">{(safeUser.followerCount || 0).toLocaleString()}</span>
                            <span className="ig-stat-label">followers</span>
                        </div>
                        <div className="ig-stat">
                            <span className="ig-stat-num">{(safeUser.followingCount || 0).toLocaleString()}</span>
                            <span className="ig-stat-label">following</span>
                        </div>
                    </div>
                </div>

                <div className="ig-bio-text-block">
                    <div className="ig-bio-name-row" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <h3 className="ig-bio-name">{safeUser.name || safeUser.username}</h3>
                        {safeUser.isVerified && <VerificationBadge size={18} />}
                    </div>
                    <p className="ig-bio-desc">{safeUser.bio}</p>
                </div>

                {/* Top Tracks Section */}
                {safeUser.topTracks?.length > 0 && (
                    <div className="top-tracks-vibe">
                        <h4 className="vibe-label">Top Rotation</h4>
                        <div className="ig-top-tracks">
                            {safeUser.topTracks?.map(track => (
                                <div key={track.id} className="ig-track-item">
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
                            <button className="ig-action-btn-main" onClick={handleShare}>Share profile</button>
                        {!isOwnProfile && (
                            <SubscribeButton 
                                creatorUsername={user?.username} 
                                subscriberUsername={JSON.parse(localStorage.getItem('user') || '{}').username} 
                                price={user?.subscriptionPrice || 50} 
                            />
                        )}
                            <button 
                                className={`ig-action-btn-main ${isFollowing ? 'following' : ''}`} 
                                onClick={handleFollow}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button className="ig-action-btn-main" onClick={handleMessage}>Message</button>
                            <button className="ig-action-btn-main tip-btn" onClick={() => setIsTipModalOpen(true)}><DollarSign size={16} /> Tip</button>
                            <button className="ig-action-btn-main gift-btn" onClick={() => setIsGiftModalOpen(true)}><Sparkles size={16} /> Gift Frame</button>

                        </>
                    )}

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
                {user.posts?.map((post, i) => (
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
                                    {editData?.banner ? <img src={editData?.banner} alt="Banner Preview" className="preview-img" /> : <div className="ig-upload-placeholder"><Image size={24}/></div>}
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
                                <label>Bio ({(editData.bio || '').length}/150)</label>
                                <textarea value={editData.bio || ''} onChange={e => setEditData({...editData, bio: e.target.value.slice(0, 150)})} placeholder="Tell the community about yourself..." rows={3} />
                            </div>

                            <div className="ig-edit-field">
                                <label>Profile Frame</label>
                                <div className="frame-selection-row">
                                    {['none', 'gold', 'neon', 'holographic'].map(frame => (
                                        <div 
                                            key={frame} 
                                            className={`frame-select-option ${editData.avatarFrame === frame ? 'active' : ''}`}
                                            data-testid={`frame-option-${frame}`}
                                            onClick={() => setEditData({...editData, avatarFrame: frame})}
                                        >
                                            <div className={`frame-preview avatar-frame-${frame}`}>
                                                <div className="inner-preview" />
                                            </div>
                                            <span>{frame}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {editData.avatarFrame !== 'none' && (
                                <div className="ig-edit-field">
                                    <label>Premium Accent Color</label>
                                    <div className="theme-picker">
                                        {['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                                            <div 
                                                key={color} 
                                                className={`color-swatch ${editData.accentColor === color ? 'active' : ''}`}
                                                style={{ backgroundColor: color }}
                                                data-color={color}
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
            {/* Tip Modal */}
            {isTipModalOpen && (
                <div className="ig-modal-overlay">
                    <div className="ig-modal-glass gift-modal">
                        <div className="ig-modal-header">
                            <h2><DollarSign size={20} style={{display:'inline',marginRight:6}} />Send a Tip</h2>
                            <button className="ig-modal-close" onClick={() => { setIsTipModalOpen(false); setTipStatus(''); setTipAmount('10'); }}>✕</button>
                        </div>
                        <div className="ig-modal-body">
                            <p className="gift-intro">Support <strong>{user.username}</strong> with credits!</p>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', margin: '16px 0' }}>
                                {['10', '25', '50', '100'].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setTipAmount(amt)}
                                        style={{
                                            padding: '8px 18px',
                                            borderRadius: '20px',
                                            border: tipAmount === amt ? '2px solid var(--theme-primary)' : '2px solid rgba(255,255,255,0.15)',
                                            background: tipAmount === amt ? 'var(--theme-primary)' : 'rgba(255,255,255,0.07)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.9rem'
                                        }}
                                    >{amt}¢</button>
                                ))}
                            </div>
                            <div className="ig-edit-field" style={{ marginTop: '12px' }}>
                                <label>Custom amount</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={tipAmount}
                                    onChange={e => setTipAmount(e.target.value)}
                                    placeholder="Enter amount..."
                                    style={{ textAlign: 'center', fontSize: '1.2rem' }}
                                />
                            </div>
                            {tipStatus === 'success' && <p style={{ color: '#10b981', textAlign: 'center', marginTop: '12px', fontWeight: 600 }}>✓ Tip sent successfully!</p>}
                            {tipStatus === 'error' && <p style={{ color: '#ef4444', textAlign: 'center', marginTop: '12px' }}>Failed — check your balance.</p>}
                        </div>
                        <div className="ig-modal-footer">
                            <button className="ig-btn-cancel" onClick={() => { setIsTipModalOpen(false); setTipStatus(''); setTipAmount('10'); }}>Cancel</button>
                            <button className="ig-btn-save gift-confirm-btn" onClick={handleSendTip} disabled={tipStatus === 'sending'}>
                                {tipStatus === 'sending' ? 'Sending...' : `Send ${tipAmount}¢`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default Profile;
