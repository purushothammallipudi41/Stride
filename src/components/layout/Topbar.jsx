import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Heart, Users, BadgeCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../hooks/useUI';
import NotificationCenter from '../social/NotificationCenter';
import logo from '../../assets/vyx-logo.png';
import { BASE_URL } from '../../utils/api';
import './Topbar.css';

const Topbar = () => {
    const navigate = useNavigate();
    const { unreadNotifications, unreadMessages } = useUI();
    const [showNotifPopover, setShowNotifPopover] = useState(false);
    const navigateTo = (path) => {
        navigate(path);
        setShowNotifPopover(false);
    };

    return (
        <header className="topbar">
            <div className="topbar-logo-section" onClick={() => navigate('/')}>
                <img src={logo} alt="Vyx" className="topbar-logo" />
                <span className="topbar-logo-text">Vyx</span>
            </div>


            <div className="topbar-actions">
                <div style={{ position: 'relative' }}>
                    <button 
                        className={`topbar-btn ${showNotifPopover ? 'active' : ''}`}
                        onClick={() => {
                            if (window.innerWidth < 768) {
                                navigate('/notifications');
                            } else {
                                setShowNotifPopover(!showNotifPopover);
                            }
                        }}
                        aria-label="Notifications"
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
