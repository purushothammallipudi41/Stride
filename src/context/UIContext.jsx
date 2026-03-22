import { useState, useCallback, useEffect } from 'react';
import UIContext from './UIContextObject';
import socket from '../services/socket';

export const UIProvider = ({ children }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = user.username || 'guest';

    // Fetch initial counts
    useEffect(() => {
        if (username === 'guest') return;

        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/notifications/unread-count/${username}`)
            .then(res => res.json())
            .then(data => setUnreadNotifications(data.count))
            .catch(err => console.error("Unread notifs fetch error:", err));

        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/messages/unread-count/${username}`)
            .then(res => res.json())
            .then(data => setUnreadMessages(data.count))
            .catch(err => console.error("Unread msgs fetch error:", err));
    }, [username]);

    // Socket listeners for real-time updates
    useEffect(() => {
        const handleGlobalEvent = (event) => {
            if (event.type === 'NEW_MESSAGE' && event.recipient === username) {
                setUnreadMessages(prev => prev + 1);
            }
        };

        const handleContentUpdated = (event) => {
            if (['like', 'follow', 'comment'].includes(event.type) && event.targetUser === username) {
                setUnreadNotifications(prev => prev + 1);
            }
        };

        socket.on('global_event', handleGlobalEvent);
        socket.on('content_updated', handleContentUpdated);

        return () => {
            socket.off('global_event', handleGlobalEvent);
            socket.off('content_updated', handleContentUpdated);
        };
    }, [username]);
    
    const openCreateModal = () => setIsCreateModalOpen(true);
    const closeCreateModal = () => setIsCreateModalOpen(false);

    const openExplorer = () => setIsExplorerOpen(true);
    const closeExplorer = () => setIsExplorerOpen(false);

    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((noti) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications(prev => [...prev, { ...noti, id }]);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    }, [removeNotification]);

    const incrementNotifications = useCallback(() => setUnreadNotifications(prev => prev + 1), []);
    const resetNotifications = useCallback(async () => {
        setUnreadNotifications(0);
        if (username !== 'guest') {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/notifications/mark-all-read/${username}`, { method: 'POST' });
        }
    }, [username]);

    const incrementMessages = useCallback(() => setUnreadMessages(prev => prev + 1), []);
    const resetMessages = useCallback(async () => {
        setUnreadMessages(0);
        if (username !== 'guest') {
            socket.emit('mark_messages_read', { username });
        }
    }, [username]);


    const value = {
        isCreateModalOpen,
        openCreateModal,
        closeCreateModal,
        isExplorerOpen,
        openExplorer,
        closeExplorer,
        notifications,
        addNotification,
        removeNotification,
        unreadNotifications,
        incrementNotifications,
        resetNotifications,
        unreadMessages,
        incrementMessages,
        resetMessages
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};


