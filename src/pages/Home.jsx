import { useState, useRef } from 'react';
import { Heart, Search, RefreshCw } from 'lucide-react';
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

    // Pull to Refresh Logic
    const [startY, setStartY] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const containerRef = useRef(null);

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) {
            setStartY(e.touches[0].pageY);
        }
    };

    const handleTouchMove = (e) => {
        if (startY === 0 || window.scrollY > 0) return;
        const currentY = e.touches[0].pageY;
        const distance = currentY - startY;

        if (distance > 0 && distance < 150) {
            setPullDistance(distance);
            if (distance > 100) e.preventDefault();
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance > 100) {
            setRefreshing(true);
            await fetchPosts();
            setTimeout(() => {
                setRefreshing(false);
                setPullDistance(0);
            }, 500);
        } else {
            setPullDistance(0);
        }
        setStartY(0);
    };

    return (
        <div
            className="home-page"
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
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
                <div
                    className={`pull-to-refresh-indicator ${refreshing ? 'refreshing' : ''}`}
                    style={{
                        height: `${pullDistance}px`,
                        opacity: pullDistance / 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        transition: refreshing ? 'height 0.3s' : 'none',
                        color: 'var(--accent-primary)'
                    }}
                >
                    <RefreshCw size={24} className={refreshing ? 'spin' : ''} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
                </div>
                <StoriesRail />
                <Feed />
            </div>
        </div>
    );
};

export default Home;
