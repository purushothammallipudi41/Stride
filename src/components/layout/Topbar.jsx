import { useState } from 'react';
import { MessageCircle, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../hooks/useUI';
import NotificationCenter from '../social/NotificationCenter';
import logo from '../../assets/stride-logo.png';
import './Topbar.css';

const Topbar = () => {
    const navigate = useNavigate();
    const { unreadNotifications, unreadMessages } = useUI();
    const [showNotifPopover, setShowNotifPopover] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <header className="topbar">
            <div className="topbar-logo-section">
                <img src={logo} alt="Stride" className="topbar-logo" />
                <span className="topbar-logo-text">Stride</span>
            </div>

            <div className="topbar-search-container">
                <div className="topbar-search-wrapper">
                    <input 
                        type="text" 
                        placeholder="Search Stride..." 
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>
            </div>

            <div className="topbar-actions">
                <div style={{ position: 'relative' }}>
                    <button 
                        className={`topbar-btn ${showNotifPopover ? 'active' : ''}`}
                        onClick={() => setShowNotifPopover(!showNotifPopover)}
                        aria-label="Activity Feed"
                    >
                        <Heart size={24} />
                        {unreadNotifications > 0 && <span className="notification-badge-v2">{unreadNotifications}</span>}
                    </button>
                    <NotificationCenter 
                        isOpen={showNotifPopover} 
                        onClose={() => setShowNotifPopover(false)} 
                    />
                </div>
                <button 
                    className="topbar-btn"
                    onClick={() => navigate('/messages')}
                    aria-label="Direct Messages"
                >
                    <MessageCircle size={24} />
                    {unreadMessages > 0 && <span className="notification-badge-v2">{unreadMessages}</span>}
                </button>
            </div>
        </header>
    );
};


export default Topbar;
