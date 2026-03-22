import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Check, ChevronRight, Heart, UserPlus, MessageSquare, Music, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import { useUI } from '../hooks/useUI';
import socket from '../services/socket';
import './Notifications.css';

const Notifications = () => {
    const navigate = useNavigate();
    const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
    const username = userProfile.username || 'guest';
    const { resetNotifications } = useUI();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!username) return;
        resetNotifications();

        const fetchNotifications = () => {
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/notifications/${username}`)
                .then(res => res.json())
                .then(data => {
                    setNotifications(data.notifications || []);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch notifications:", err);
                    setIsLoading(false);
                });
        };

        fetchNotifications();

        const handleUpdate = (event) => {
            if (['like', 'follow', 'message', 'gift', 'comment'].includes(event.type)) {
                fetchNotifications();
            }
        };

        socket.on('content_updated', handleUpdate);
        socket.on('new_private_message', fetchNotifications);

        return () => {
            socket.off('content_updated', handleUpdate);
            socket.off('new_private_message', fetchNotifications);
        };
    }, [username, resetNotifications]);

    const groupedNotifications = useMemo(() => {
        const groups = {
            'Now': [],
            'Today': [],
            'This Week': [],
            'This Month': []
        };

        notifications.forEach(n => {
            if (n.time?.includes('m') || n.time?.includes('s')) groups['Now'].push(n);
            else if (n.time?.includes('h')) groups['Today'].push(n);
            else if (n.time?.includes('d')) groups['This Week'].push(n);
            else groups['This Month'].push(n);
        });

        return Object.entries(groups).filter(([, items]) => items.length > 0);
    }, [notifications]);

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={14} fill="#ff3b30" color="#ff3b30" />;
            case 'follow': return <UserPlus size={14} />;
            default: return <Bell size={14} />;
        }
    };

    if (isLoading) return <div className="loading-screen">Intercepting waves...</div>;

    return (
        <div className="notifications-container">
            <header className="notifications-header">
                <ChevronLeft size={28} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 className="notifications-title">Notifications</h1>
            </header>

            <div className="notifications-content" style={{ paddingTop: '60px' }}>
                <div className="caught-up-section">
                <div className="caught-up-icon">
                    <Check size={32} strokeWidth={3} />
                </div>
                <span style={{ fontWeight: 600 }}>You're all caught up</span>
                <span style={{ fontSize: '0.85rem', color: '#3797f0' }}>See new activity for {username}</span>
            </div>

            <div className="notifications-list">
                {groupedNotifications.map(([group, items]) => (
                    <div key={group} className="time-group">
                        <div className="time-group-header">{group}</div>
                        {items.map(notif => (
                            <div key={notif.id} className="notification-item-v2">
                                <div className="notif-v2-avatar-group">
                                    <Avatar src={notif.fromAvatar} size={44} frame={notif.senderFrame} />
                                    <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#000', borderRadius: '50%', padding: 2, border: '2px solid var(--color-bg-primary)' }}>
                                        {getIcon(notif.type)}
                                    </div>
                                </div>
                                <div className="notif-v2-main-text">
                                    <span className="notif-v2-username">{notif.from}</span>
                                    {` ${notif.content || 'is following you'}`}
                                    <span className="notif-v2-time">{notif.time || '4d'}</span>
                                </div>
                                {notif.type === 'like' || notif.type === 'comment' ? (
                                    <div className="notif-v2-media-preview">
                                        <img src={notif.postImage || 'https://picsum.photos/100'} alt="post preview" />
                                    </div>
                                ) : (
                                    <button className="notif-v2-action-btn">Follow</button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {notifications.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                        <Bell size={48} style={{ marginBottom: '16px' }} />
                        <p>No new notifications yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
