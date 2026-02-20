import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

import config from '../config';

const SocketContext = createContext({ socket: null });

export const useSocket = () => useContext(SocketContext) || { socket: null };

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const { user } = useAuth();

    useEffect(() => {
        // Connect to the backend
        const newSocket = io(config.API_URL);
        setSocket(newSocket);

        // Debug connection
        newSocket.on('connect', () => {
            console.log('[SOCKET] Connected to server:', newSocket.id);
            if (user?.id) {
                newSocket.emit('join-room', user.id);
            }
        });

        newSocket.on('user-status-change', ({ userId, status }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                if (status === 'online') next.add(userId);
                else next.delete(userId);
                return next;
            });
        });

        // Initial fetch of online users
        fetch(`${config.API_URL}/api/online-users`)
            .then(res => res.json())
            .then(users => setOnlineUsers(new Set(users)))
            .catch(console.error);

        return () => newSocket.close();
    }, [user?.id]); // Re-connect/re-join if user changes (or just on mount)

    const isUserOnline = (userId) => onlineUsers.has(userId);

    return (
        <SocketContext.Provider value={{ socket, isUserOnline, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};
