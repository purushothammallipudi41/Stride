import { useState } from 'react';
import { Grid, Film, Bookmark, Settings, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import './Profile.css';

const Profile = () => {
    const [activeTab, setActiveTab] = useState('posts');
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);

    const avatarUrl = 'https://i.pravatar.cc/300?u=alex';

    const stats = [
        { label: 'Posts', value: '42' },
        { label: 'Followers', value: '12.5k' },
        { label: 'Following', value: '450' }
    ];

    const posts = [1, 2, 3, 4, 5, 6]; // Placeholders

    return (
        <>
            <div className="profile-container">
                {/* Header */}
                <div className="profile-header">
                    <div
                        className="profile-avatar-large"
                        onClick={() => setIsAvatarOpen(true)}
                        style={{ backgroundImage: `url(${avatarUrl})`, cursor: 'zoom-in' }}
                    />
                    <div className="profile-info">
                        <div className="profile-top">
                            <h2 className="profile-username">alex_beats</h2>
                            <button className="edit-profile-btn">Edit Profile</button>
                            <button className="settings-btn"><Settings size={20} /></button>
                        </div>
                        <div className="profile-stats">
                            {stats.map(s => (
                                <div key={s.label} className="stat-item">
                                    <span className="stat-value">{s.value}</span>
                                    <span className="stat-label">{s.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="profile-bio">
                            <p>Music Producer 🎹 | LA-Based <br /> Creating vibes daily. Check out my new single! 👇</p>
                            <a href="#" className="bio-link">linktr.ee/alexbeats</a>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <Grid size={20} />
                        <span>Posts</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'reels' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reels')}
                    >
                        <Film size={20} />
                        <span>Reels</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
                        onClick={() => setActiveTab('saved')}
                    >
                        <Bookmark size={20} />
                        <span>Saved</span>
                    </button>
                </div>

                {/* Content Grid */}
                <div className="profile-grid">
                    {posts.map(post => (
                        <div key={post} className="grid-item">
                            {/* Placeholder content */}
                        </div>
                    ))}
                </div>
            </div>

            {isAvatarOpen && createPortal(
                <div className="avatar-modal-overlay" onClick={() => setIsAvatarOpen(false)}>
                    <div className="avatar-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setIsAvatarOpen(false)}>
                            <X size={24} />
                        </button>
                        <img src={avatarUrl} alt="Profile Full" className="full-avatar-img" />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default Profile;
