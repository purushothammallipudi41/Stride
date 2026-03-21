import { useState, useEffect, useCallback } from 'react';
import { Grid, Film, User, Plus, Settings, DollarSign } from 'lucide-react';

import { useMusic } from '../hooks/useMusic';
import PageHeader from '../components/layout/PageHeader';
import socket from '../services/socket';
import './Profile.css';

const Profile = () => {
    const { username } = useMusic();
    const [activeTab, setActiveTab] = useState('posts');
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

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
    const [editData, setEditData] = useState({ name: '', bio: '', avatar: '' });

    const openEditModal = () => {
        setEditData({ name: user.name || '', bio: user.bio || '', avatar: user.avatar || '' });
        setIsEditModalOpen(true);
    };

    const handleUpdateProfile = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/profile/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            const updatedUser = await res.json();
            setUser(updatedUser);
            setIsEditModalOpen(false);
        } catch (err) {
            console.error("Failed to update profile:", err);
        }
    };


    if (isLoading) return <div className="loading-screen">Resonating...</div>;
    if (!user) return <div className="error-screen">User not found</div>;

    const isOwnProfile = (username || 'admin') === user.username;

    return (
        <div className="ig-profile-container">
            {/* Top Header */}
            <PageHeader 
                title={user.username} 
                rightElement={
                    <button className="settings-btn" style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)' }}>
                        <Settings size={28} />
                    </button>
                }
            />

            {/* Profile Info */}
            <div className="ig-profile-bio-block">
                <div className="profile-banner-container">
                    <img src={user.banner || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070'} alt="" className="profile-banner" />
                </div>
                
                <div className="ig-bio-top-row">
                    <div className="ig-avatar-wrapper">
                        <img src={user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} alt="Profile" className="ig-avatar" />
                    </div>
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
                    <h3 className="ig-bio-name">{user.name || user.username}</h3>
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

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="edit-modal-overlay">
                    <div className="edit-modal-content">
                        <h2>Edit Profile</h2>
                        <div className="edit-field">
                            <label>Name</label>
                            <input 
                                type="text" 
                                value={editData.name} 
                                onChange={e => setEditData({...editData, name: e.target.value})} 
                            />
                        </div>
                        <div className="edit-field">
                            <label>Bio</label>
                            <textarea 
                                value={editData.bio} 
                                onChange={e => setEditData({...editData, bio: e.target.value})} 
                            />
                        </div>
                        <div className="edit-field">
                            <label>Avatar URL</label>
                            <input 
                                type="text" 
                                value={editData.avatar} 
                                onChange={e => setEditData({...editData, avatar: e.target.value})} 
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                            <button className="save-btn" onClick={handleUpdateProfile}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default Profile;
