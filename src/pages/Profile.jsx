
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Share2, Grid, Film, Bookmark, Settings as SettingsIcon, X, MoreHorizontal } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import { createPortal } from 'react-dom';
import config from '../config';
import './Profile.css';

import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import UserListModal from '../components/profile/UserListModal';
import EditProfileModal from '../components/profile/EditProfileModal';
import ShareModal from '../components/common/ShareModal';

const Profile = () => {
    const { user: currentUser, refreshUser, logout } = useAuth();
    const { identifier } = useParams();
    const navigate = useNavigate();
    const { posts: allPosts } = useContent();

    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState(null); // { title: string, ids: string[] }
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    const isOwnProfile = !identifier || identifier === currentUser?.username || identifier === currentUser?.email || identifier === currentUser?.id;

    useEffect(() => {
        const fetchProfile = async () => {
            // Priority: URL Param -> Current User Email -> Current User ID
            const id = identifier || currentUser?.email || currentUser?.id;

            if (!id) {
                if (currentUser === null) {
                    // Auth finished loading and still no user -> truly not logged in
                    setLoading(false);
                }
                return;
            }

            setLoading(true);
            try {
                const targetUrl = `${config.API_URL}/api/users/${id}`;
                // TEMPORARY DEBUGGING
                console.log(`[Profile] Fetching: ${targetUrl}`);

                // If checking own profile, assume success with current data first to speed up UI
                if ((!identifier || identifier === currentUser?.email || identifier === currentUser?.username) && currentUser) {
                    setProfileUser(currentUser);
                    // Still fetch fresh data in background
                    const res = await fetch(targetUrl);
                    if (res.ok) {
                        const data = await res.json();
                        setProfileUser(data);
                    }
                } else {
                    const res = await fetch(targetUrl);
                    if (res.ok) {
                        const data = await res.json();
                        setProfileUser(data);
                    } else {
                        setProfileUser(null);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);

                // Fallback to local user if it's me
                if (currentUser && (!identifier || identifier === currentUser.email)) {
                    setProfileUser(currentUser);
                } else {
                    setProfileUser(null);
                }
            } finally {
                setLoading(false);
            }
        };

        if (currentUser !== undefined) {
            fetchProfile();
        }
    }, [identifier, currentUser]);

    const handleFollow = async () => {
        if (!currentUser || !profileUser) return;
        try {
            const res = await fetch(`${config.API_URL}/api/users/${profileUser.id || profileUser.email}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ followerEmail: currentUser.email })
            });
            if (res.ok) {
                // Refresh local user and current profile
                await refreshUser();
                const updatedRes = await fetch(`${config.API_URL}/api/users/${profileUser.id || profileUser.email}`);
                if (updatedRes.ok) {
                    const updatedData = await updatedRes.json();
                    setProfileUser(updatedData);
                }
            }
        } catch (error) {
            console.error('Follow failed:', error);
        }
    };

    if (loading) return (
        <div className="profile-loading glass-card">
            <div className="loading-spinner"></div>
            <p>Gathering the vibe...</p>
        </div>
    );

    if (!profileUser) return (
        <div className="profile-error glass-card">
            <h2>User Not Found</h2>
            <p>The profile you are looking for doesn't exist.</p>
            <button onClick={() => navigate('/')} className="primary-btn">Go Home</button>
            <button onClick={() => { logout(); navigate('/login'); }} className="secondary-btn" style={{ marginTop: '12px' }}>Logout (Reset)</button>
        </div>
    );

    const isFollowing = profileUser.followers?.includes(currentUser?.id || currentUser?.email);

    const stats = [
        { label: 'Posts', value: profileUser.stats.posts || 0, clickable: false },
        {
            label: 'Followers',
            value: (profileUser.followers?.length || 0).toLocaleString(),
            ids: profileUser.followers || [],
            clickable: true
        },
        {
            label: 'Following',
            value: (profileUser.following?.length || 0).toLocaleString(),
            ids: profileUser.following || [],
            clickable: true
        }
    ];

    const userPosts = allPosts.filter(p => p.username === profileUser.username);

    return (
        <>
            <div className="profile-container">
                {/* Header */}
                <div className="profile-header">
                    <div className="profile-avatar-container" onClick={() => setIsAvatarOpen(true)}>
                        {profileUser.avatar ? (
                            <img
                                src={getImageUrl(profileUser.avatar)}
                                alt={profileUser.username}
                                className="profile-avatar-large"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.username}`;
                                }}
                            />
                        ) : (
                            <div className="profile-avatar-placeholder" style={{ backgroundColor: '#333' }}>
                                {profileUser.username[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="profile-info">
                        <div className="profile-top">
                            <h2 className="profile-username">{profileUser.username}</h2>
                            {isOwnProfile ? (
                                <div className="profile-actions">
                                    <button className="edit-profile-btn" onClick={() => setIsEditProfileOpen(true)}>
                                        Edit Profile
                                    </button>
                                    <button className="settings-btn" onClick={() => navigate('/settings')}>
                                        <SettingsIcon size={20} />
                                    </button>
                                    <button className="settings-btn" onClick={() => setShareModalOpen(true)}>
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="profile-actions">
                                    <button
                                        className={`follow-btn ${isFollowing ? 'following' : 'primary-btn'}`}
                                        onClick={handleFollow}
                                    >
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                    <button className="message-btn" onClick={() => navigate(`/messages?user=${profileUser.email}`)}>Message</button>
                                    <button className="settings-btn" onClick={() => setShareModalOpen(true)}>
                                        <Share2 size={20} />
                                    </button>
                                    <div className="profile-more-container">
                                        <button className="more-btn" onClick={() => setShowMoreMenu(!showMoreMenu)}>
                                            <MoreHorizontal size={20} />
                                        </button>
                                        {showMoreMenu && (
                                            <div className="more-dropdown glass-card">
                                                <button onClick={async () => {
                                                    setShowMoreMenu(false);
                                                    if (!currentUser) return alert('Login required');
                                                    if (confirm(`Are you sure you want to block ${profileUser.username}? Their content will be hidden.`)) {
                                                        try {
                                                            const res = await fetch(`${config.API_URL}/api/users/${profileUser.id || profileUser._id}/block`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ currentUserId: currentUser.id || currentUser._id })
                                                            });
                                                            if (res.ok) {
                                                                alert('User blocked');
                                                                await refreshUser(); // Update local blocked list
                                                                navigate('/'); // Return home
                                                            }
                                                        } catch (e) { alert('Failed to block user'); }
                                                    }
                                                }}>Block User</button>
                                                <button onClick={async () => {
                                                    setShowMoreMenu(false);
                                                    if (!currentUser) return alert('Login required');
                                                    await fetch(`${config.API_URL}/api/report`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            reporterId: currentUser.id || currentUser._id,
                                                            targetId: profileUser.id || profileUser._id,
                                                            targetType: 'user',
                                                            reason: 'spam_or_abuse'
                                                        })
                                                    });
                                                    alert('User reported');
                                                }}>Report User</button>
                                                <button onClick={() => { setShowMoreMenu(false); navigator.clipboard.writeText(window.location.href); alert('Link Copied'); }}>Copy Link</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="profile-stats">
                            {stats.map(s => (
                                <div
                                    key={s.label}
                                    className={`stat-item ${s.clickable ? 'clickable' : ''}`}
                                    onClick={() => s.clickable && setModalConfig({ title: s.label, ids: s.ids })}
                                >
                                    <span className="stat-value">{s.value}</span>
                                    <span className="stat-label">{s.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="profile-bio">
                            <p className="profile-name">{profileUser.name}</p>
                            <p>{profileUser.bio}</p>
                            {/* <a href="#" className="bio-link">linktr.ee/{profileUser.username}</a> */}
                        </div>
                    </div>
                </div>

                {/* Tabs, same as before */}
                <div className="profile-tabs">
                    <button className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                        <Grid size={20} /><span>Posts</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'reels' ? 'active' : ''}`} onClick={() => setActiveTab('reels')}>
                        <Film size={20} /><span>Reels</span>
                    </button>
                    <button className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
                        <Bookmark size={20} /><span>Saved</span>
                    </button>
                </div>

                <div className="profile-grid">
                    {userPosts.length > 0 ? (
                        userPosts.map(post => (
                            <div key={post.id} className="grid-item glass-card">
                                {post.type === 'image' || post.contentUrl ? (
                                    <img src={post.contentUrl} alt={post.caption} className="grid-img" />
                                ) : (
                                    <div className="placeholder-content">Post {post.id}</div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="no-posts">No posts yet.</div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {isAvatarOpen && createPortal(
                <div className="avatar-modal-overlay" onClick={() => setIsAvatarOpen(false)}>
                    <div className="avatar-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setIsAvatarOpen(false)}><X size={24} /></button>
                        <img src={getImageUrl(profileUser.avatar)} alt="Profile Full" className="full-avatar-img" />
                    </div>
                </div>,
                document.body
            )}

            {isEditProfileOpen && (
                <EditProfileModal onClose={() => setIsEditProfileOpen(false)} />
            )}

            {modalConfig && (
                <UserListModal
                    title={modalConfig.title}
                    userIds={modalConfig.ids}
                    onClose={() => setModalConfig(null)}
                />
            )}

            {shareModalOpen && (
                <ShareModal
                    isOpen={shareModalOpen}
                    onClose={() => setShareModalOpen(false)}
                    type="profile"
                    data={{
                        id: profileUser.id || profileUser.email,
                        title: profileUser.name,
                        subtitle: profileUser.username,
                        image: getImageUrl(profileUser.avatar),
                        username: profileUser.username
                    }}
                />
            )}
        </>
    );
};

export default Profile;
