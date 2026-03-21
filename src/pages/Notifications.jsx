import { useState, useEffect } from 'react';
import { Bell, Heart, UserPlus, MessageSquare, Music } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import Avatar from '../components/common/Avatar';
import { useMusic } from '../hooks/useMusic';
import socket from '../services/socket';

const Notifications = () => {
    const { username, markNotifsRead } = useMusic();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!username) return;
        markNotifsRead();

        const fetchNotifications = () => {
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/notifications/${username}`)
                .then(res => res.json())
                .then(data => {
                    setNotifications(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch notifications:", err);
                    setIsLoading(false);
                });
        };

        fetchNotifications();

        // Listen for real-time notification triggers
        const handleUpdate = (event) => {
            if (event.type === 'like' || event.type === 'follow' || event.type === 'message' || event.type === 'gift') {
                fetchNotifications();
            }
        };

        socket.on('content_updated', handleUpdate);
        socket.on('new_private_message', fetchNotifications);

        return () => {
            socket.off('content_updated', handleUpdate);
            socket.off('new_private_message', fetchNotifications);
        };
    }, [username, markNotifsRead]);

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={20} className="text-red-500" fill="currentColor" />;
            case 'follow': return <UserPlus size={20} className="text-blue-500" />;
            case 'message': return <MessageSquare size={14} className="text-purple-500" fill="currentColor" />;
            case 'gift': return <Music size={14} className="text-yellow-500" fill="currentColor" />;
            case 'music': return <Music size={14} className="text-orange-500" />;
            default: return <Bell size={14} />;
        }
    };

    return (
        <div className="page-container" style={{ background: 'var(--color-bg-primary)', minHeight: '100vh' }}>
            <PageHeader title="Activity" />
            
            <div className="notifications-list" style={{ padding: '10px 16px' }}>
                {isLoading ? (
                    <div className="flex-center" style={{ height: '50vh' }}>
                        <div className="loading-spinner" />
                    </div>
                ) : notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <div key={notif.id} className="notification-item animate-fade-in" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div className="notif-avatar-wrapper" style={{ position: 'relative' }}>
                                <Avatar 
                                    src={notif.from?.[0] || '?'} 
                                    alt={notif.from} 
                                    size={44} 
                                    frame={notif.senderFrame || 'none'}
                                />
                                <div className="notif-badge" style={{
                                    position: 'absolute',
                                    bottom: '-2px',
                                    right: '-2px',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'var(--color-surface)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid var(--color-bg-primary)',
                                    zIndex: 5
                                }}>
                                    {getIcon(notif.type)}
                                </div>
                            </div>
                            <div className="notif-content" style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.95rem', margin: 0, color: 'var(--color-text-primary)' }}>
                                    <span style={{ fontWeight: 700 }}>{notif.from}</span> {notif.content}
                                </p>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{notif.time}</span>
                            </div>
                            {notif.type === 'follow' && (
                                <button className="follow-btn-small" style={{
                                    background: 'var(--color-accent)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 16px',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600
                                }}>Follow back</button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex-center" style={{ height: '60vh', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
                         <div className="glass-panel" style={{ padding: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)' }}>
                            <Bell size={64} className="text-gradient" />
                        </div>
                        <h2 className="text-gradient">No Activity Yet</h2>
                        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '280px' }}>
                            When people like your tracks or follow you, you'll see it here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
