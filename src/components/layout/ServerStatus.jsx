import React, { useState, useEffect } from 'react';
import socket from '../../services/socket';
import { Wifi, WifiOff } from 'lucide-react';

const ServerStatus = () => {
    const [status, setStatus] = useState(socket.connected ? 'online' : 'reconnecting');

    useEffect(() => {
        const onConnect = () => setStatus('online');
        const onDisconnect = () => setStatus('offline');
        const onReconnectAttempt = () => setStatus('reconnecting');
        const onConnectError = () => setStatus('reconnecting');

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('reconnect_attempt', onReconnectAttempt);
        socket.on('connect_error', onConnectError);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('reconnect_attempt', onReconnectAttempt);
            socket.off('connect_error', onConnectError);
        };
    }, []);

    const getStatusContent = () => {
        switch (status) {
            case 'online':
                return { icon: <Wifi size={14} />, text: 'Backend Online', className: 'online' };
            case 'reconnecting':
                return { icon: <div className="loading-spinner-tiny" />, text: 'Waking up server...', className: 'waking-up' };
            case 'offline':
            default:
                return { icon: <WifiOff size={14} />, text: 'Backend Offline', className: 'offline' };
        }
    };

    const { icon, text, className } = getStatusContent();

    return (
        <div className={`server-status-pill ${className}`}>
            {icon}
            <span>{text}</span>
        </div>
    );
};

export default ServerStatus;
