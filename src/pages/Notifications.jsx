import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';
import { getImageUrl } from '../utils/imageUtils';
import UserAvatar from '../components/common/UserAvatar';
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
                    <button className="mark-read-btn" onClick={markAllRead} aria-label="Mark all as read" title="Mark all as read">
                        <CheckCircle size={20} />
                    </button>
                    <button className="clear-btn" onClick={() => setIsConfirmOpen(true)} aria-label="Clear all notifications" title="Clear all notifications">
                        <Trash2 size={20} />
                    </button>
                </div>
            </header>

            <div className="notifications-list">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div key={notification._id || notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                            <UserAvatar user={notification.user} size="sm" />
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
