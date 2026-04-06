import { useState, useEffect, useRef, useCallback } from 'react';

import { Bell, User, Heart, MessageSquare, UserPlus, Music, Check, ChevronLeft, Plus } from 'lucide-react';
import Avatar from '../common/Avatar';
import { useUI } from '../../hooks/useUI';
import { BASE_URL } from '../../utils/api';
import './NotificationCenter.css';

const NotificationCenter = ({ isOpen, onClose }) => {
    const { resetNotifications } = useUI();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef(null);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchNotifications = useCallback(async () => {
        if (!user.username) return;
        try {
            const res = await fetch(`${BASE_URL}/api/notifications/${user.username}`);
            const data = await res.json();
            setNotifications(data.notifications || []);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
            setLoading(false);
        }
    }, [user.username]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                fetchNotifications();
                resetNotifications();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen, fetchNotifications, resetNotifications]);




    const markAsRead = async () => {
        try {
            await fetch(`${BASE_URL}/api/notifications/mark-read/${user.username}`, {
                method: 'POST'
            });
            onClose();
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={16} fill="#ed4956" color="#ed4956" />;
            case 'follow': return <UserPlus size={16} color="#0095f6" />;
            case 'message': return <MessageSquare size={16} color="#8b5cf6" />;
            case 'playlist_invite': return <Music size={16} color="#d946ef" />;
            case 'gift': return <Plus size={16} color="#fbbf24" />;
            default: return <Bell size={16} />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="notification-popover-v2 animate-scale-in" ref={containerRef}>
            <div className="popover-header-v2">
                <button className="mobile-close-btn" onClick={onClose}>
                    <ChevronLeft size={28} />
                </button>
                <h3>Activity</h3>
                <button className="mark-read-btn-v2" onClick={markAsRead}>
                    Mark All as Read
                </button>
            </div>
            
            <div className="notifications-list-v2">
                {loading ? (
                    <div className="notif-loading-v2">
                        <div className="loading-shimmer"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notif-empty-v2">
                        <Heart size={48} opacity={0.2} />
                        <p>No activity yet. When someone likes your tracks or follows you, you'll see it here.</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div key={notif._id} className={`notification-item-v2 ${notif.readStatus ? 'read' : 'unread'}`}>
                            <div className="notif-avatar-v2">
                                <Avatar 
                                    src={notif.avatar || `https://i.pravatar.cc/150?u=${notif.from}`} 
                                    size={44} 
                                    frame={notif.senderFrame || 'none'} 
                                />
                                <div className="notif-type-icon">
                                    {getIcon(notif.type)}
                                </div>
                            </div>
                            <div className="notif-content-v2">
                                <p>
                                    <span className="notif-username">{notif.from}</span>
                                    {" "}{notif.content}
                                    <span className="notif-time-v2">{notif.time}</span>
                                </p>
                            </div>
                            {notif.type === 'follow' && (
                                <button className="notif-action-btn follow-btn">Follow</button>
                            )}
                            {notif.type === 'message' && (
                                <button className="notif-action-btn reply-btn" onClick={() => window.location.href='/messages'}>Reply</button>
                            )}
                        </div>
                    ))
                )}
            </div>
            
            <div className="popover-footer-v2" onClick={() => { markAsRead(); window.location.href = '/notifications'; }}>
                View older notifications
            </div>
        </div>
    );
};

export default NotificationCenter;
