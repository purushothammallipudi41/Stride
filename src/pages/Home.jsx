import { Heart } from 'lucide-react';
import Feed from '../components/feed/Feed';
import StoriesRail from '../components/feed/StoriesRail';
import { useNotifications } from '../context/NotificationContext';

const Home = () => {
    const { unreadCount } = useNotifications();

    return (
        <div className="home-page-container">
            <header className="home-header">
                <div className="header-left">
                    <h1 className="logo-text">Stride</h1>
                </div>
                <div className="header-right">
                    <a href="/#/notifications" className="notification-btn">
                        <Heart size={24} />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </a>
                </div>
            </header>

            <div className="home-content">
                <StoriesRail />
                <Feed />
            </div>
        </div>
    );
};

export default Home;
