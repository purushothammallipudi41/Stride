import React, { useState, useEffect } from 'react';
import socket from '../../services/socket';
import { Wifi, WifiOff } from 'lucide-react';

const ServerStatus = () => {
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    return (
        <div className={`server-status-pill ${isConnected ? 'online' : 'offline'}`}>
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isConnected ? 'Backend Online' : 'Backend Offline'}</span>
        </div>
    );
};

export default ServerStatus;
