import { useState, useEffect, useRef, useCallback } from 'react';

import { Bell, User, Heart, MessageSquare, UserPlus, Music, Check } from 'lucide-react';
import { useUI } from '../../hooks/useUI';
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
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/notifications/${user.username}`);
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
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/notifications/mark-read/${user.username}`, {
                method: 'POST'
            });
            onClose();
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={16} fill="var(--color-primary)" />;
            case 'follow': return <UserPlus size={16} color="var(--color-accent)" />;
            case 'message': return <MessageSquare size={16} color="var(--color-primary)" />;
            case 'playlist_invite': return <Music size={16} color="var(--color-accent)" />;
            default: return <Bell size={16} />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="notification-popover animate-scale-in" ref={containerRef}>
            <div className="popover-header">
                <h3>Notifications</h3>
                <button className="mark-read-btn" onClick={markAsRead}>
                    <Check size={16} /> Mark all read
                </button>
            </div>
            
            <div className="notifications-list">
                {loading ? (
                    <div className="notif-loading">Silencing the noise...</div>
                ) : notifications.length === 0 ? (
                    <div className="notif-empty">All quiet on the social front.</div>
                ) : (
                    notifications.map((notif) => (
                        <div key={notif._id} className={`notification-item ${notif.readStatus ? 'read' : 'unread'}`}>
                            <div className="notif-icon-circle">
                                {getIcon(notif.type)}
                            </div>
                            <div className="notif-content">
                                <p><b>{notif.from}</b> {notif.content}</p>
                                <span className="notif-time">{notif.time}</span>
                            </div>
                            {!notif.readStatus && <div className="unread-dot" />}
                        </div>
                    ))
                )}
            </div>
            
            <div className="popover-footer" onClick={() => { markAsRead(); window.location.href = '/notifications'; }}>
                View all activity
            </div>
        </div>
    );
};

export default NotificationCenter;
