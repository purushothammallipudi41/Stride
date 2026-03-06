import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useServer } from '../context/ServerContext';

const ServerNavigation = () => {
    const serverContext = useServer();

    useEffect(() => {
        if (serverContext?.setIsMobileSidebarOpen) {
            serverContext.setIsMobileSidebarOpen(true);
        }
    }, [serverContext]);

    if (!serverContext) {
        console.warn('[ServerNavigation] ServerContext is null');
        return <div className="flex-center h-screen bg-black">Loading Context...</div>;
    }

    const { servers, loading } = serverContext;

    if (loading) {
        return (
            <div className="flex-center h-screen bg-black" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    console.log('[ServerNavigation] Servers list:', servers);

    if (servers && servers.length > 0) {
        console.log(`[ServerNavigation] Redirecting to first joined server: /servers/${servers[0].id}`);
        return <Navigate to={`/servers/${servers[0].id}`} replace />;
    }

    console.log('[ServerNavigation] No joined servers found. Redirecting to official server /servers/0');
    return <Navigate to="/servers/0" replace />;
};

export default ServerNavigation;
