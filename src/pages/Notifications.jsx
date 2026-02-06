import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import './Notifications.css';

const Notifications = () => {
    const navigate = useNavigate();
    const { notifications, markAllRead } = useNotifications();

    return (
        <div className="notifications-page">
            <header className="notifications-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1>Notifications</h1>
                </div>
                <button className="mark-read-btn" onClick={markAllRead}>
                    <CheckCircle size={18} />
                    Mark all read
                </button>
            </header>

            <div className="notifications-list">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                            <img src={notification.user?.avatar || 'https://i.pravatar.cc/100'} alt="" className="notif-avatar" />
                            <div className="notif-content">
                                <p>
                                    <span className="notif-username">{notification.user?.name}</span>
                                    {' '}
                                    {notification.content}
                                </p>
                                <span className="notif-time">{notification.time || 'now'}</span>
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
        </div>
    );
};

export default Notifications;
