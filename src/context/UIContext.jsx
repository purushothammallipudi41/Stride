import { useState, useCallback, useEffect } from 'react';
import UIContext from './UIContextObject';
import socket from '../services/socket';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';

export const UIProvider = ({ children }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createType, setCreateType] = useState('POST');
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [callInfo, setCallInfo] = useState({ isOpen: false, isIncoming: false, callerData: null, type: 'video' });
    const [liveInfo, setLiveInfo] = useState({ isOpen: false, streamerName: '', communityName: '', streamId: '' });
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

    const user = getStoredUser();
    const username = user?.username || 'guest';

    // Fetch initial counts
    useEffect(() => {
        if (username === 'guest') return;

        fetch(`${BASE_URL}/api/notifications/unread-count/${username}`)
            .then(res => res.json())
            .then(data => setUnreadNotifications(data.count))
            .catch(err => console.error("Unread notifs fetch error:", err));

        fetch(`${BASE_URL}/api/messages/unread-count/${username}`)
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
    
    const openCreateModal = (type = 'POST') => {
        setCreateType(type);
        setIsCreateModalOpen(true);
    };
    const closeCreateModal = () => setIsCreateModalOpen(false);

    const openArticleModal = () => setIsArticleModalOpen(true);
    const closeArticleModal = () => setIsArticleModalOpen(false);

    const openExplorer = () => setIsExplorerOpen(true);
    const closeExplorer = () => setIsExplorerOpen(false);

    const openVault = () => {
        setIsVaultOpen(true);
        setIsExplorerOpen(false); // Focus on vault
    };
    const closeVault = () => setIsVaultOpen(false);

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
            await fetch(`${BASE_URL}/api/notifications/mark-all-read/${username}`, { method: 'POST' });
        }
    }, [username]);

    const incrementMessages = useCallback(() => setUnreadMessages(prev => prev + 1), []);
    const resetMessages = useCallback(async () => {
        setUnreadMessages(0);
        const loggedInUser = getStoredUser();
        if (loggedInUser?.username) {
            socket.emit('mark_messages_read', { username: loggedInUser.username });
        }
    }, []);


    const value = {
        isCreateModalOpen,
        createType,
        openCreateModal,
        closeCreateModal,
        isArticleModalOpen,
        openArticleModal,
        closeArticleModal,
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
        resetMessages,
        isVaultOpen,
        openVault,
        closeVault,
        callInfo,
        setCallInfo,
        liveInfo,
        setLiveInfo,
        isStoryModalOpen,
        setIsStoryModalOpen
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};


