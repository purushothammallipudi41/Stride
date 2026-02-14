import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

import config from '../config';

const SocketContext = createContext({ socket: null });

export const useSocket = () => useContext(SocketContext) || { socket: null };

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
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

        return () => newSocket.close();
    }, [user?.id]); // Re-connect/re-join if user changes (or just on mount)

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
