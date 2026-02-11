import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../utils/imageUtils';
import ConfirmModal from '../components/common/ConfirmModal';
import './Notifications.css';

const Notifications = () => {
    const navigate = useNavigate();
    const { notifications, markAllRead, clearAll } = useNotifications();
    const { showToast } = useToast();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    return (
        <div className="notifications-page">
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={async () => {
                    const success = await clearAll();
                    if (success) showToast('Notifications cleared!', 'success');
                    else showToast('Failed to clear notifications', 'error');
                }}
                title="Clear All Notifications"
                message="Are you sure you want to permanently clear all notifications? This cannot be undone."
                confirmText="Clear All"
                type="danger"
            />
            <header className="notifications-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1>Notifications</h1>
                </div>
                <div className="header-actions">
                    <button className="mark-read-btn" onClick={markAllRead}>
                        <CheckCircle size={18} />
                        Mark read
                    </button>
                    <button className="clear-btn" onClick={() => setIsConfirmOpen(true)} style={{ marginLeft: '12px', color: '#ff4b4b', border: '1px solid rgba(255, 75, 75, 0.3)', padding: '6px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(255, 75, 75, 0.1)' }}>
                        Clear all
                    </button>
                </div>
            </header>

            <div className="notifications-list">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div key={notification._id || notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                            <img src={getImageUrl(notification.user?.avatar) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + notification.user?.name} alt="" className="notif-avatar" />
                            <div className="notif-content">
                                <p>
                                    <span className="notif-username">{notification.user?.name}</span>
                                    {' '}
                                    {notification.content}
                                </p>
                                <span className="notif-time">{new Date(notification.timestamp).toLocaleString()}</span>
                            </div>
                            {!notification.read && <div className="unread-dot" />}
                        </div>
                    ))
                ) : (
                    <div className="empty-notifications">
                        <p>No notifications yet</p>
                    </div>
                )}
            </div>
        </div >
    );
};

export default Notifications;
