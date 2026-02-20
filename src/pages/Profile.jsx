
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Share2, Grid, Film, Bookmark, Settings as SettingsIcon, X, MoreHorizontal, BadgeCheck, ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import { createPortal } from 'react-dom';
import config from '../config';
import './Profile.css';

import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { useNotifications } from '../context/NotificationContext';
import UserListModal from '../components/profile/UserListModal';
import EditProfileModal from '../components/profile/EditProfileModal';
import ShareModal from '../components/common/ShareModal';
import PostDetailModal from '../components/profile/PostDetailModal';
import { useMusic } from '../context/MusicContext';
import { useSocket } from '../context/SocketContext';
import { Radio } from 'lucide-react';

const Profile = () => {
    const { user: currentUser, refreshUser, logout } = useAuth();
    const { identifier } = useParams();
    const navigate = useNavigate();
    const { posts: allPosts, savedPosts, fetchPosts } = useContent();
    const { addNotification, unreadCount } = useNotifications();
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [userReels, setUserReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState(null); // { title: string, ids: string[] }
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

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


                // If checking own profile, assume success with current data first to speed up UI
                // If checking own profile, assume success with current data first for speed
                if ((!identifier || identifier === currentUser?.email || identifier === currentUser?.username) && currentUser) {
                    setProfileUser(currentUser);

                    // Fetch fresh data in background to ensure badges etc are up to date
                    try {
                        const res = await fetch(targetUrl);
                        if (res.ok) {
                            const data = await res.json();
                            // Only update if data is different/newer to avoid flicker (optional, but good)
                            // For now, just set it to ensure we get the badge
                            // For now, just set it to ensure we get the badge
                            setProfileUser(data);
                        }
                    } catch (e) {
                        console.error('[Profile] Background fetch failed', e);
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
            const targetId = profileUser._id || profileUser.id || profileUser.email;
            const res = await fetch(`${config.API_URL}/api/users/${targetId}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ followerEmail: currentUser.email })
            });
            if (res.ok) {
                // Notification Logic
                addNotification({
                    type: 'follow',
                    user: {
                        name: currentUser.name || currentUser.username,
                        avatar: currentUser.avatar,
                        email: currentUser.email
                    },
                    content: 'started following you',
                    targetUserEmail: profileUser.email
                });

                // Refresh local user and current profile
                await refreshUser();
                const updatedRes = await fetch(`${config.API_URL}/api/users/${targetId}`);
                if (updatedRes.ok) {
                    const updatedData = await updatedRes.json();
                    setProfileUser(updatedData);
                }
            }
        } catch (error) {
            console.error('Follow failed:', error);
        }
    };

    useEffect(() => {
        if (profileUser?.username) {
            const loadUserContent = async () => {
                const posts = await fetchPosts({ username: profileUser.username, type: 'post' });
                const reels = await fetchPosts({ username: profileUser.username, type: 'reel' });
                setUserPosts(posts || []);
                setUserReels(reels || []);
            };
            loadUserContent();
        }
    }, [profileUser?.username]);

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

    // UNIFY ID CHECK: Backend stores _id strings in followers array
    const currentUserId = currentUser?._id || currentUser?.id;
    const isFollowing = profileUser.followers?.includes(currentUserId);

    const stats = [
        { label: 'Posts', value: userPosts.length + userReels.length, clickable: false },
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

    const { liveVibes } = useSocket();
    const { joinVibeSession, sessionHost } = useMusic();

    const isLive = liveVibes?.has(profileUser.email);
    const isSyncedWithThisUser = sessionHost === profileUser.email;

    return (
        <>
            <div className="profile-container">
                <div className="profile-header-content">
                    {/* New Integrated Header (One step below top nav) */}
                    <div className="profile-top-controls">
                        <div className="controls-left">
                            {!isOwnProfile && (
                                <button
                                    className="nav-btn-back"
                                    onClick={() => navigate(-1)}
                                >
                                    <ArrowLeft size={20} />
                                </button>
                            )}
                            <h2 className="nav-username">
                                {profileUser.username}
                                {profileUser.isOfficial && <BadgeCheck size={16} color="var(--color-primary)" fill="var(--color-primary-glow)" />}
                            </h2>
                        </div>
                        <div className="controls-right">
                            {isOwnProfile ? (
                                <>
                                    <button className="nav-icon-btn" onClick={() => setShareModalOpen(true)}>
                                        <Share2 size={20} />
                                    </button>
                                    <button className="nav-icon-btn settings-btn" onClick={() => navigate('/settings')} title="Settings">
                                        <SettingsIcon size={20} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="nav-icon-btn" onClick={() => setShareModalOpen(true)}>
                                        <Share2 size={20} />
                                    </button>
                                    <button className="nav-icon-btn" onClick={() => setShowMoreMenu(!showMoreMenu)}>
                                        <MoreHorizontal size={20} />
                                    </button>
                                    {showMoreMenu && (
                                        <div className="more-dropdown glass-card">
                                            <button onClick={async () => {
                                                setShowMoreMenu(false);
                                                if (!currentUser) return alert('Login required');
                                                if (window.confirm(`Are you sure you want to block ${profileUser.username}? Their content will be hidden.`)) {
                                                    try {
                                                        const res = await fetch(`${config.API_URL}/api/users/${profileUser.id || profileUser._id}/block`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ currentUserId: currentUser.id || currentUser._id })
                                                        });
                                                        if (res.ok) {
                                                            alert('User blocked');
                                                            await refreshUser();
                                                            navigate('/');
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
                                </>
                            )}
                        </div>
                    </div>
                    {/* Top Row: Avatar + Stats */}
                    <div className="profile-top-row">
                        <div className={`profile-avatar-container ${isLive ? 'live' : ''}`} onClick={() => setIsAvatarOpen(true)}>
                            {profileUser.avatar ? (
                                <img
                                    src={getImageUrl(profileUser.avatar)}
                                    alt={profileUser.username}
                                    className="profile-avatar-large"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = getImageUrl(null, 'user');
                                    }}
                                />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    {profileUser.username[0].toUpperCase()}
                                </div>
                            )}
                            {isLive && <div className="live-badge-small">Live</div>}
                        </div>

                        <div className="profile-stats">
                            {stats.map((stat, i) => (
                                <div
                                    key={i}
                                    className={`stat-item ${stat.clickable ? 'clickable' : ''}`}
                                    onClick={() => stat.clickable && setModalConfig({ title: stat.label, ids: stat.ids })}
                                >
                                    <span className="stat-value">{stat.value}</span>
                                    <span className="stat-label">{stat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Middle Row: Name + Bio */}
                    <div className="profile-bio-section">
                        <p className="profile-name">{profileUser.name || profileUser.username}</p>
                        <p className="profile-bio-text">{profileUser.bio}</p>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="profile-actions-row">
                        {isOwnProfile ? (
                            <>
                                <button className="edit-profile-btn" onClick={() => setIsEditProfileOpen(true)}>
                                    Edit Profile
                                </button>
                                <button className="dashboard-link-btn" onClick={() => navigate('/dashboard')}>
                                    Professional Dashboard
                                </button>
                            </>
                        ) : (
                            <>
                                {isLive && !isSyncedWithThisUser && (
                                    <button className="join-vibe-btn animate-in" onClick={() => joinVibeSession(profileUser.email)}>
                                        <Radio size={18} /> Join Vibe
                                    </button>
                                )}
                                <button
                                    className={`follow-btn ${isFollowing ? 'following' : 'primary-btn'}`}
                                    onClick={handleFollow}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                                <button className="message-btn" onClick={() => navigate(`/messages?user=${profileUser.email}`)}>
                                    Message
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Tabs, same as before */}
                <div className="profile-tabs">
                    <button className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                        <Grid size={22} />
                    </button>
                    <button className={`tab-btn ${activeTab === 'reels' ? 'active' : ''}`} onClick={() => setActiveTab('reels')}>
                        <Film size={22} />
                    </button>
                    <button className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
                        <Bookmark size={22} />
                    </button>
                </div>

                <div className="profile-grid">
                    {(activeTab === 'posts' ? userPosts : activeTab === 'reels' ? userReels : activeTab === 'saved' ? savedPosts : []).length > 0 ? (
                        (activeTab === 'posts' ? userPosts : activeTab === 'reels' ? userReels : activeTab === 'saved' ? savedPosts : []).map(post => (
                            <div key={post._id || post.id} className="grid-item glass-card" onClick={() => setSelectedPost(post)} style={{ cursor: 'pointer' }}>
                                {post.type === 'video' || post.type === 'reel' ? (
                                    <video
                                        src={getImageUrl(post.contentUrl)}
                                        poster={getImageUrl(post.posterUrl || post.contentUrl, 'media')}
                                        className="grid-img"
                                        muted
                                        loop
                                        playsInline
                                        onMouseOver={e => e.target.play()}
                                        onMouseOut={e => e.target.pause()}
                                    />
                                ) : (post.type === 'image' || post.type === 'post' || post.contentUrl) ? (
                                    <img
                                        src={getImageUrl(post.contentUrl)}
                                        alt={post.caption}
                                        className="grid-img"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = getImageUrl(null, 'media');
                                        }}
                                    />
                                ) : (
                                    <div className="placeholder-content">Post {post.id}</div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="profile-empty-state">
                            {activeTab === 'posts' && (
                                <div className="empty-state-content">
                                    <Grid size={48} />
                                    <p>No posts yet</p>
                                </div>
                            )}
                            {activeTab === 'reels' && (
                                <div className="empty-state-content">
                                    <Film size={48} />
                                    <p>No reels yet</p>
                                </div>
                            )}
                            {activeTab === 'saved' && (
                                <div className="empty-state-content">
                                    <Bookmark size={48} />
                                    <p>Save posts to watch later</p>
                                </div>
                            )}
                        </div>
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

            {selectedPost && (
                <PostDetailModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                />
            )}
        </>
    );
};

export default Profile;
