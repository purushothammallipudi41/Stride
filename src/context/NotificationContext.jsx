import { createContext, useState, useContext, useEffect } from 'react';
import config from '../config';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`${config.API_URL}/api/notifications`);
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
        fetchNotifications();
        // Polling for demo purposes, in real app use websockets
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

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
        try {
            // Local update for speed
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);

            // Backend sync
            const unread = notifications.filter(n => !n.read);
            await Promise.all(unread.map(n =>
                fetch(`${config.API_URL}/api/notifications/${n.id}/read`, { method: 'POST' })
            ));
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, addNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};
