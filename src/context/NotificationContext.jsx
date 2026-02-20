import { createContext, useState, useContext, useEffect } from 'react';
import config from '../config';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        if (!user?.email) return;
        try {
            const res = await fetch(`${config.API_URL}/api/notifications?email=${encodeURIComponent(user.email)}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        if (!user?.email) return;

        fetchNotifications();

        if (socket) {
            socket.on('new-notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            });

            return () => socket.off('new-notification');
        }
    }, [user?.email, socket]);

    const addNotification = async (notification) => {
        try {
            const res = await fetch(`${config.API_URL}/api/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(notification)
            });
            if (res.ok) fetchNotifications();
        } catch (error) {
            console.error('Failed to add notification:', error);
        }
    };

    const markAllRead = async () => {
        if (!user?.email) return;
        try {
            // Local update for speed
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);

            // Backend sync
            const unread = notifications.filter(n => !n.read);
            await Promise.all(unread.map(n =>
                fetch(`${config.API_URL}/api/notifications/${n._id || n.id}/read`, { method: 'POST' })
            ));
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    const clearAll = async () => {
        if (!user?.email) return false;
        try {
            const res = await fetch(`${config.API_URL}/api/notifications/clear?email=${encodeURIComponent(user.email)}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setNotifications([]);
                setUnreadCount(0);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to clear notifications:', error);
            return false;
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, addNotification, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
};
