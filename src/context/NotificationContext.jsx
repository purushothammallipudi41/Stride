import { createContext, useState, useContext, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'like', user: { name: 'Alex Rivers', avatar: 'https://i.pravatar.cc/150?u=alex' }, content: 'liked your post', time: '2m ago', read: false },
        { id: 2, type: 'follow', user: { name: 'Jordan Sky', avatar: 'https://i.pravatar.cc/150?u=jordan' }, content: 'started following you', time: '1h ago', read: false },
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
            {children}
        </NotificationContext.Provider>
    );
};
