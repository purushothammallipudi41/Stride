import { useState, useEffect, useMemo, useRef } from 'react';
import { Check, Heart, UserPlus, Bell, X, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/common/Avatar';
import PageHeader from '../components/layout/PageHeader';
import { useUI } from '../hooks/useUI';
import { BASE_URL } from '../utils/api';
import socket from '../services/socket';
import { getStoredUser } from '../utils/storage';
import { requestPushPermission } from '../components/notifications/PushManager';
import './Notifications.css';

const Notifications = () => {
    const navigate = useNavigate();
    const userProfile = getStoredUser();
    const username = userProfile.username || 'guest';
    const { resetNotifications } = useUI();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [swipingId, setSwipingId] = useState(null);
    const [swipeX, setSwipeX] = useState(0);
    const [showPushInvite, setShowPushInvite] = useState(false);
    const touchStartRef = useRef(0);

    useEffect(() => {
        if (!username) return;
        resetNotifications();

        const fetchNotifications = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/notifications/${username}`);
                const data = await res.json();
                const fetchedNotifs = Array.isArray(data?.notifications) ? data.notifications : [];
                setNotifications(fetchedNotifs);
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();

        const handleUpdate = (event) => {
            if (['like', 'follow', 'message', 'gift', 'comment'].includes(event.type)) {
                fetchNotifications();
            }
        };

        socket.on('content_updated', handleUpdate);
        socket.on('new_private_message', fetchNotifications);

        // Check for push permission
        if ('Notification' in window && Notification.permission === 'default') {
            const timer = setTimeout(() => setShowPushInvite(true), 0);
            return () => clearTimeout(timer);
        }

        return () => {
            socket.off('content_updated', handleUpdate);
            socket.off('new_private_message', fetchNotifications);
        };
    }, [username, resetNotifications]);

    const handleEnablePush = async () => {
        const success = await requestPushPermission(userProfile._id);
        if (success) {
            setShowPushInvite(false);
        }
    };

    const handleTouchStart = (e, id) => {
        touchStartRef.current = e.touches[0].clientX;
        setSwipingId(id);
    };

    const handleTouchMove = (e) => {
        if (!swipingId) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartRef.current;
        if (diff < 0) { // Only swipe left to dismiss
            setSwipeX(diff);
        }
    };

    const handleTouchEnd = () => {
        if (swipeX < -150) {
            handleDismiss(swipingId);
        }
        setSwipeX(0);
        setSwipingId(null);
    };

    const handleDismiss = async (id) => {
        // Optimistic UI
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            await fetch(`${BASE_URL}/api/notifications/${id}/dismiss`, { method: 'POST' });
        } catch (err) {
            console.error("Failed to dismiss notification:", err);
        }
    };

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
            <PageHeader title="Notifications" hideBack={true} />

            <div className="notifications-back-action-area" style={{ padding: '0 16px', marginTop: '12px', marginBottom: '16px', display: 'flex', gap: '12px' }}>
                <button 
                    className="back-btn-content"
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '14px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '56px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>
            </div>

            <div className="notifications-content">
                <div className="caught-up-section">
                <div className="caught-up-icon">
                    <Check size={32} strokeWidth={3} />
                </div>
                <span style={{ fontWeight: 600 }}>You're all caught up</span>
                <span style={{ fontSize: '0.85rem', color: '#3797f0' }}>See new activity for {username}</span>
            </div>

            <div className="notifications-list">
                {showPushInvite && (
                    <div className="push-invite-banner glass-card animate-slide-up">
                        <div className="push-invite-icon">
                            <Bell size={24} className="pulse-icon-purple" />
                        </div>
                        <div className="push-invite-text">
                            <h3>Never Miss a Rhythm</h3>
                            <p>Enable system alerts for mentions, follows, and community broadcasts.</p>
                        </div>
                        <div className="push-invite-actions">
                            <button className="enable-push-btn" onClick={handleEnablePush}>Enable</button>
                            <button className="dismiss-push-btn" onClick={() => setShowPushInvite(false)}><X size={16} /></button>
                        </div>
                    </div>
                )}
                {groupedNotifications?.map(([group, items]) => (
                    <div key={group} className="time-group">
                        <div className="time-group-header">{group}</div>
                        {items?.map(notif => (
                            <div 
                                key={notif.id} 
                                className="notification-swipe-wrapper"
                                onTouchStart={(e) => handleTouchStart(e, notif.id)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                style={{ 
                                    transform: swipingId === notif.id ? `translateX(${swipeX}px)` : 'none',
                                    opacity: swipingId === notif.id ? 1 + (swipeX / 300) : 1,
                                    transition: swipingId === notif.id ? 'none' : 'all 0.3s ease'
                                }}
                            >
                                <div className="notification-item-v2 glass-card">
                                    <div className="notif-v2-avatar-group">
                                        <Avatar 
                                            src={notif.fromAvatar || ""} 
                                            size={48} 
                                            frame={notif.senderFrame} 
                                        />
                                        <div className="notif-type-icon-wrapper" style={{ 
                                            background: notif.type === 'like' ? 'var(--color-accent)' : 'var(--color-primary)' 
                                        }}>
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
                                            <img src={notif.postImage || ""} alt="post preview" />
                                        </div>
                                    ) : (
                                        <button className="notif-v2-action-btn">Follow</button>
                                    )}
                                </div>
                                <div className="dismiss-background">
                                    <X size={24} color="white" />
                                </div>
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
    </div>
);
};

export default Notifications;
