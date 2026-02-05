import { Heart } from 'lucide-react';
import Feed from '../components/feed/Feed';
import StoriesRail from '../components/feed/StoriesRail';
import { useNotifications } from '../context/NotificationContext';

const Home = () => {
    const { unreadCount } = useNotifications();

    return (
        <div className="home-page-container">
            <div className="home-content">
                <StoriesRail />
                <Feed />
            </div>
        </div>
    );
};

export default Home;
