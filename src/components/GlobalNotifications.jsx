import { useUI } from '../hooks/useUI';
import { Bell, X } from 'lucide-react';
import './GlobalNotifications.css';

const GlobalNotifications = () => {
    const { notifications, removeNotification } = useUI();

    if (notifications.length === 0) return null;

    return (
        <div className="global-notifications-container">
            {notifications.map(notification => (
                <div key={notification.id} className="notification-toast animate-slide-in">
                    <div className="notification-icon">
                        <Bell size={18} className="text-vyx-primary" />
                    </div>
                    <div className="notification-content">
                        <p>{notification.message}</p>
                    </div>
                    <button 
                        className="notification-close" 
                        onClick={() => removeNotification(notification.id)}
                    >
                        <X size={14} />
                    </button>
                    <div className="notification-progress" />
                </div>
            ))}
        </div>
    );
};

export default GlobalNotifications;
