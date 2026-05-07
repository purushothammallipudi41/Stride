import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Grid, Film, User, Plus, Settings, DollarSign, Camera, Upload, Image, Sparkles, Music, Users, Zap, Lock, CreditCard, ArrowLeft, ChevronDown } from 'lucide-react';
import { useUI } from '../hooks/useUI';

import { useMusic } from '../hooks/useMusic';
import PageHeader from '../components/layout/PageHeader';
import Avatar from '../components/common/Avatar';
import SubscribeButton from '../components/profile/SubscribeButton';
import socket from '../services/socket';
import VerificationBadge from '../components/common/VerificationBadge';
import ConnectionsModal from '../components/social/ConnectionsModal';
import SEO from '../components/common/SEO';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import './Profile.css';
import { useTranslation } from 'react-i18next';

const Profile = () => {
    const { username: routeUsername } = useParams();
    const { username: loggedUser } = useMusic();
    const navigate = useNavigate();
    const location = useLocation();
    const { addNotification } = useUI();
    const [activeTab, setActiveTab] = useState('posts');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [purchaseTarget, setPurchaseTarget] = useState(null);

    const currentUser = getStoredUser();
    const isOwnProfile = !routeUsername || routeUsername === currentUser.username;

    const loadProfile = useCallback(() => {
        const currentUser = getStoredUser();
        const targetUser = routeUsername || currentUser.username || 'admin';
        const viewerParam = currentUser.username ? `?viewer=${currentUser.username}` : '';
        
        setIsLoading(true);
        fetch(`${BASE_URL}/api/profile/${targetUser}${viewerParam}`)
            .then(res => res.json())
            .then(data => {

                setUser(data);
                setIsLoading(false);
                // Use server-computed isFollowing (reliable) if available
                if (typeof data.isFollowing === 'boolean') {
                    setIsFollowing(data.isFollowing);
                } else {
                    // Fallback: client-side check using followers array
                    const cu = JSON.parse(localStorage.getItem('user') || '{}');
                    setIsFollowing(Array.isArray(data.followers) && data.followers.some(
                        f => f.toString() === cu._id?.toString()
                    ));
                }
            })
            .catch(err => {
                console.error('Failed to fetch profile:', err);
                setIsLoading(false);
            });
    }, [routeUsername, loggedUser]);



    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const touchStartRef = useRef(0);

    const handleTouchStart = (e) => {
        if (e.currentTarget.scrollTop <= 0) {
            touchStartRef.current = e.touches[0].clientY;
        } else {
            touchStartRef.current = 0;
        }
    };

    const handleTouchMove = (e) => {
        if (touchStartRef.current === 0) return;
        const touchY = e.touches[0].clientY;
        const distance = touchY - touchStartRef.current;
        if (distance > 0 && e.currentTarget.scrollTop <= 0) {
            setPullDistance(Math.min(distance * 0.5, 80));
            if (distance > 10) e.preventDefault();
        }
    };

    const handleTouchEnd = () => {
        if (pullDistance > 60) {
            triggerRefresh();
        }
        setPullDistance(0);
        touchStartRef.current = 0;
    };

    const triggerRefresh = () => {
        setIsRefreshing(true);
        loadProfile();
        setTimeout(() => setIsRefreshing(false), 1200);
    };

    useEffect(() => {
        const handleAuthUpdate = () => {
            loadProfile();
        };
        window.addEventListener('vyx_auth_update', handleAuthUpdate);
        return () => window.removeEventListener('vyx_auth_update', handleAuthUpdate);
    }, [loadProfile]);

    const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
    const [connectionType, setConnectionType] = useState('followers');

    const openConnections = (type) => {
        setConnectionType(type);
        setIsConnectionsModalOpen(true);
    };

    useEffect(() => {
        loadProfile();

        const handleUpdate = (event) => {
            const currentTarget = routeUsername || loggedUser || JSON.parse(localStorage.getItem('user') || '{}').username;
            console.log(`[Profile/Socket] Received ${event.type} event:`, event);
            
            // Reload if post shared by this user OR follow count changed
            if (event.type === 'post') {
                // Check if the new post belongs to this profile
                if (event.data?.username === currentTarget) {
                    console.log(`[Profile/Socket] Auto-refreshing stats for ${currentTarget}`);
                    loadProfile();
                }
            } else if (event.type === 'follow' && event.username === currentTarget) {
                loadProfile();
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
                body: JSON.stringify({ followerUsername: currentUser.username })
            });
            const data = await res.json();
            if (data.success) {
                setIsFollowing(data.isFollowing);
                setUser(prev => ({ ...prev, followerCount: data.followerCount }));
            }
        } catch (err) {
            console.error('Failed to follow/unfollow user:', err);
        }
    };

    const handleSendTip = async () => {
        if (!tipAmount || isNaN(tipAmount) || parseInt(tipAmount) <= 0) return;
        setTipStatus('sending');
        try {
            const currentUserUsername = localStorage.getItem('vyx_user_username') || 'puru';
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
            navigator.share({ title: `${user.username} on Vyx`, url });
        } else {
            navigator.clipboard.writeText(url).then(() => {
                addNotification({ title: 'Link Copied!', message: `Profile link for @${user.username} copied to clipboard.`, type: 'success' });
            });
        }
    };

    const handleMessage = () => {
        navigate('/messages', { state: { openUsername: user.username } });
    };

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [isTipModalOpen, setIsTipModalOpen] = useState(false);
    const [tipAmount, setTipAmount] = useState('10');
    const [tipStatus, setTipStatus] = useState('');
    const [selectedFrame, setSelectedFrame] = useState('gold');
    const [editData, setEditData] = useState({ 
        username: '', 
        name: '', 
        bio: '', 
        avatar: '', 
        banner: '', 
        accentColor: '', 
        pronouns: '', 
        gender: '', 
        links: [], 
        banners: [] 
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
    const [linkInput, setLinkInput] = useState('');

    const openEditModal = useCallback(() => {
        setEditData({ 
            username: user.username,
            name: user.name || '', 
            bio: user.bio || '', 
            avatar: user.avatar || '', 
            banner: user.banner || '', 
            accentColor: user.accentColor || '#0066ff',
            avatarFrame: user.avatarFrame || 'none',
            pronouns: user.pronouns || '',
            gender: user.gender || '',
            links: user.links || [],
            banners: user.banners || []
        });
        setIsEditModalOpen(true);
    }, [user, setIsEditModalOpen]);

    const handlePurchaseFrame = async (frame) => {
        if (isUpdating) return;
        setIsUpdating(true);
        setError('');
        try {
            const res = await fetch(`${BASE_URL}/api/wallet/purchase-frame`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, frame })
            });
            const data = await res.json();
            if (data.success) {
                // Refresh profile to get updated ownedFrames
                loadProfile();
                setIsSuccess(true);
                setPurchaseTarget(null);
                setTimeout(() => setIsSuccess(false), 2000);
            } else {
                setError(data.message || 'Purchase failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setIsUpdating(false);
        }
    };

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
        setIsUpdating(true);
        setError('');
        try {
            const res = await fetch(`${BASE_URL}/api/profile/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            const data = await res.json();
            if (data.success) {
                setIsSuccess(true);
                console.log("[Profile] Profile updated successfully:", data.user.username);
                // Force sync local storage and DOM for zero-latency feedback
                localStorage.setItem('user', JSON.stringify(data.user));
                if (data.user.accentColor) {
                    localStorage.setItem('vyx_theme_color', data.user.accentColor);
                    document.documentElement.style.setProperty('--theme-primary', data.user.accentColor);
                }
                
                setUser(data.user);
                
                // Deterministic reload: wait for the success overlay to be seen
                setTimeout(() => {
                    setIsEditModalOpen(false);
                    setIsSuccess(false);
                    window.location.reload();
                }, 1500);
            } else {
                setError(data.message || "Failed to update profile");
                setIsUpdating(false);
            }
        } catch (err) {
            console.error("Failed to update profile:", err);
            setError("Connection error. Please try again.");
            setIsUpdating(false);
        }
    };

    const handleGiftFrame = async () => {
        try {
            const currentUserUsername = localStorage.getItem('vyx_user_username') || 'puru';
            
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


    if (isLoading) return <div className="loading-screen" /> ;

    if (!user) return (
        <div className="error-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
            <div>User not found</div>
            <button 
                onClick={() => { localStorage.clear(); window.location.href='/login'; }} 
                style={{ padding: '8px 16px', background: 'var(--color-primary)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
            >
                Return to Login
            </button>
        </div>
    );

    // Last-ditch safety for nested properties
    const safeUser = {
        posts: [],
        topTracks: [],
        followers: [],
        highlights: [],
        ...user
    };

    return (
        <div 
            className="ig-profile-container"
            onScroll={(e) => {}} // Keep default for scroll tracking if needed
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <SEO 
                title={`${user.name || user.username} (@${user.username})`}
                description={user.bio || `Discover ${user.username}'s frequency on Vyx.`}
                image={user.avatar}
                type="profile"
            />
            {/* Top Header */}
            <PageHeader title={user.username} hideBack={true} />

            {/* Pull-to-Refresh Indicator */}
            <div 
                className="ptr-indicator" 
                style={{ 
                    height: isRefreshing ? '60px' : `${pullDistance}px`,
                    opacity: (isRefreshing || pullDistance > 20) ? 1 : 0
                }}
            >
                <div className="ptr-spinner"></div>
            </div>

            {/* Profile Info */}
            <div className="ig-profile-bio-block">
                <div className={`profile-banner-container ${!user.banner ? 'empty-banner' : ''}`}>
                    {user.banner ? (
                        <img src={user.banner} alt="" className="profile-banner" />
                    ) : (
                        <div className="profile-banner placeholder-banner"></div>
                    )}
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
                        <div className="ig-stat clickable" onClick={() => openConnections('followers')}>
                            <span className="ig-stat-num">{(safeUser.followerCount || 0).toLocaleString()}</span>
                            <span className="ig-stat-label">followers</span>
                        </div>
                        <div className="ig-stat clickable" onClick={() => openConnections('following')}>
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
                    
                    {/* Badges Row */}
                    {safeUser.achievements?.length > 0 && (
                        <div className="profile-badges-row">
                            {safeUser.achievements.map((ach) => (
                                <div key={ach} className="profile-badge-pill" title={ach}>
                                    {ach === 'Music Maven' && <Music size={12} />}
                                    {ach === 'Influencer' && <Users size={12} />}
                                    {ach === 'Top Tipper' && <Zap size={12} />}
                                    <span>{ach}</span>
                                </div>
                            ))}
                        </div>
                    )}
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
                            <button className="ig-action-btn-main" onClick={handleShare}>Share profile</button>
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
                    <div key={i} className={`ig-grid-item ${post.isLocked ? 'locked-item' : ''}`}>
                        <img src={post.isLocked ? '' : (post.contentUrl || post.image)} alt="Post" loading="lazy" />

                        {post.isMemberOnly && (
                            <div className="grid-member-badge">
                                <Crown size={14} />
                            </div>
                        )}
                        {post.isLocked && (
                            <div className="grid-lock-overlay">
                                <Zap size={20} />
                            </div>
                        )}
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
                            
                            {/* Original Banner Upload Style */}
                            <div className="ig-edit-field ig-file-field">
                                <label>Profile Banner</label>
                                <div className="ig-upload-preview banner-preview" onClick={() => document.getElementById('banner-upload').click()}>
                                    {editData?.banner ? <img src={editData?.banner} alt="Banner Preview" className="preview-img" /> : <div className="ig-upload-placeholder"><Image size={24}/></div>}
                                    <div className="ig-upload-overlay"><Upload size={20} /> <span>Change Banner</span></div>
                                </div>
                                <input id="banner-upload" type="file" accept="image/*" onChange={e => handleFileChange(e, 'banner')} style={{ display: 'none' }} />
                            </div>

                            {/* Original Avatar Upload Style */}
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
                                <label>Username</label>
                                <input type="text" value={editData.username} onChange={e => setEditData({...editData, username: e.target.value})} placeholder="Username" />
                            </div>

                            <div className="ig-edit-field">
                                <label>Pronouns</label>
                                <input type="text" value={editData.pronouns} onChange={e => setEditData({...editData, pronouns: e.target.value})} placeholder="Pronouns" />
                            </div>
                            
                            <div className="ig-edit-field">
                                <label>Bio ({(editData.bio || '').length}/150)</label>
                                <textarea value={editData.bio || ''} onChange={e => setEditData({...editData, bio: e.target.value.slice(0, 150)})} placeholder="Tell the community about yourself..." rows={3} />
                            </div>

                            <div className="ig-edit-list-item" onClick={() => setIsLinksModalOpen(true)}>
                                <span>Links</span>
                                <span className="count">{editData.links?.length || 0}</span>
                            </div>

                            <div className="ig-edit-field">
                                <label>Gender</label>
                                <select value={editData.gender} onChange={e => setEditData({...editData, gender: e.target.value})}>
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                            </div>

                            {/* Links Management Sub-Modal */}
                            {isLinksModalOpen && (
                                <div className="ig-modal-overlay" style={{ zIndex: 10001 }}>
                                    <div className="ig-modal-glass" style={{ maxWidth: '400px' }}>
                                        <div className="ig-modal-header">
                                            <h3>Manage Links</h3>
                                            <button className="ig-modal-close" onClick={() => setIsLinksModalOpen(false)}>✕</button>
                                        </div>
                                        <div className="ig-modal-body">
                                            <div className="links-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {editData.links?.map((link, idx) => (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                                                        <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link}</span>
                                                        <button 
                                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                                            onClick={() => setEditData({...editData, links: editData.links.filter((_, i) => i !== idx)})}
                                                        >Delete</button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="ig-edit-field" style={{ marginTop: '20px' }}>
                                                <label>Add New Link</label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <input 
                                                        type="text" 
                                                        value={linkInput} 
                                                        onChange={e => setLinkInput(e.target.value)} 
                                                        placeholder="https://..." 
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button 
                                                        style={{ background: 'var(--theme-primary)', color: 'white', border: 'none', padding: '0 16px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
                                                        onClick={() => {
                                                            if (linkInput) {
                                                                setEditData({...editData, links: [...(editData.links || []), linkInput]});
                                                                setLinkInput('');
                                                            }
                                                        }}
                                                    >Add</button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ig-modal-footer">
                                            <button className="ig-btn-save" style={{ width: '100%' }} onClick={() => setIsLinksModalOpen(false)}>Done</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="ig-edit-field">
                                <label>Profile Frame</label>
                                <div className="frame-selection-row">
                                    {['none', 'gold', 'neon', 'holographic'].map(frame => {
                                        const isOwned = (user.ownedFrames || ['none']).includes(frame);
                                        return (
                                            <div 
                                                key={frame} 
                                                className={`frame-select-option ${editData.avatarFrame === frame ? 'active' : ''} ${!isOwned ? 'locked' : ''}`}
                                                onClick={() => {
                                                    if (isOwned) {
                                                        setEditData({...editData, avatarFrame: frame});
                                                    } else {
                                                        setPurchaseTarget(frame);
                                                    }
                                                }}
                                            >
                                                <div className={`frame-preview avatar-frame-${frame}`}>
                                                    <div className="inner-preview" />
                                                    {!isOwned && (
                                                        <div className="frame-lock-overlay">
                                                            <Lock size={12} />
                                                        </div>
                                                    )}
                                                </div>
                                                <span>{frame}</span>
                                                {!isOwned && <span className="frame-price-tag">$50</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {editData.avatarFrame !== 'none' && (
                                <div className="ig-edit-field">
                                    <label>Premium Accent Color</label>
                                    <div className="theme-picker">
                                        {['#0066ff', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map(color => (
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

                            {isUpdating && (
                                <div className="syncing-overlay animate-fade-in">
                                    <div className="syncing-content">
                                        <div className="check-icon animate-spin">⟳</div>
                                        <p>Syncing Profile...</p>
                                    </div>
                                </div>
                            )}

                            {isSuccess && (
                                <div className="success-overlay animate-fade-in">
                                    <div className="success-content">
                                        <div className="check-icon">✓</div>
                                        <p>Profile Synced! 🚀</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="error-message animate-shake">
                                    {error}
                                </div>
                            )}

                        </div>
                        <div className="ig-modal-footer">
                            <button className="ig-btn-cancel" onClick={closeEditModal} disabled={isUpdating}>Cancel</button>
                            <button className="ig-btn-save" onClick={handleUpdateProfile} disabled={isUpdating}>
                                {isUpdating ? "Saving..." : "Save Changes"}
                            </button>
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

            {/* Purchase Confirmation Modal */}
            {purchaseTarget && (
                <div className="ig-modal-overlay">
                    <div className="ig-modal-glass purchase-confirm-modal">
                        <div className="ig-modal-header">
                            <h2>Confirm Purchase</h2>
                            <button className="ig-modal-close" onClick={() => setPurchaseTarget(null)}>✕</button>
                        </div>
                        <div className="ig-modal-body">
                            <div className="purchase-preview-card" style={{display:'flex', flexDirection:'column', alignItems:'center', padding: '20px 0'}}>
                                <div className={`frame-preview-circle avatar-frame-${purchaseTarget}`}>
                                    <div className="inner-circle" />
                                </div>
                                <h3 style={{marginTop: 12, fontSize: '1.2rem', color: 'white'}}>{purchaseTarget.charAt(0).toUpperCase() + purchaseTarget.slice(1)} Frame</h3>
                                <p className="purchase-price" style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--theme-primary, #0066ff)', marginTop: 8}}>$50.00</p>
                            </div>
                            
                            <div className="payment-options-group" style={{marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12}}>
                                <button 
                                    className="pay-option-btn vibe-credits"
                                    onClick={() => handlePurchaseFrame(purchaseTarget)}
                                    style={{
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '14px 20px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{display:'flex', alignItems: 'center', gap: 10}}>
                                        <Zap size={18} className="text-yellow-400" />
                                        <span>Use Vibe Credits</span>
                                    </div>
                                    <span style={{fontWeight: 700}}>5000¢</span>
                                </button>

                                <button 
                                    className="pay-option-btn real-money"
                                    onClick={() => {
                                        navigate(`/checkout?item=Avatar+Frame&name=${purchaseTarget.charAt(0).toUpperCase() + purchaseTarget.slice(1)}+Frame&price=50.00`);
                                        setPurchaseTarget(null);
                                    }}
                                    style={{
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '14px 20px',
                                        background: 'var(--theme-primary, #0066ff)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{display:'flex', alignItems: 'center', gap: 10}}>
                                        <CreditCard size={18} />
                                        <span>Pay with Real Money</span>
                                    </div>
                                    <span style={{fontWeight: 700}}>$50.00</span>
                                </button>
                            </div>
                        </div>
                        <div className="ig-modal-footer">
                            <button className="ig-btn-cancel" style={{width: '100%'}} onClick={() => setPurchaseTarget(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            <ConnectionsModal 
                isOpen={isConnectionsModalOpen} 
                onClose={() => setIsConnectionsModalOpen(false)}
                username={safeUser?.username}
                type={connectionType}
                followerCount={safeUser?.followerCount || 0}
                followingCount={safeUser?.followingCount || 0}
                subscriptionCount={safeUser?.subscriptionCount || 0}
            />
        </div>
    );
};


export default Profile;
