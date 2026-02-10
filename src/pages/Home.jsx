import { Heart, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Feed from '../components/feed/Feed';
import StoriesRail from '../components/feed/StoriesRail';
import { useNotifications } from '../context/NotificationContext';
import { useContent } from '../context/ContentContext';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    const { fetchPosts } = useContent();

    return (
        <div className="home-page">
            <header className="home-header glass-blur">
                <h1 className="home-title text-gradient">Stride</h1>

                {/* Search Bar */}
                <div
                    onClick={() => navigate('/search')}
                    style={{
                        flex: 1,
                        maxWidth: '400px',
                        margin: '0 20px',
                        background: 'rgba(255,255,255,0.05)',
                        height: '40px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 15px',
                        gap: '10px',
                        cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <Search size={18} color="var(--text-secondary)" />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Search users...</span>
                </div>

                <div className="header-actions">
                    <div className="notification-btn glass-card" onClick={() => navigate('/notifications')}>
                        <Heart size={20} className="header-icon" />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </div>
                </div>
            </header>
            <div className="home-content">
                <div className="pull-to-refresh" onClick={() => fetchPosts()} style={{ textAlign: 'center', padding: '10px', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    Pull down or click to refresh feed
                </div>
                <StoriesRail />
                <Feed />
            </div>
        </div>
    );
};

export default Home;
