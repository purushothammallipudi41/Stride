import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useServer } from '../context/ServerContext';

const ServerNavigation = () => {
    const { servers, setIsMobileSidebarOpen } = useServer();

    useEffect(() => {
        setIsMobileSidebarOpen(true);
    }, [setIsMobileSidebarOpen]);

    if (servers && servers.length > 0) {
        return <Navigate to={`/servers/${servers[0].id}`} replace />;
    }

    return (
        <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
            <Navigate to="/servers/0" replace />
        </div>
    );
};

export default ServerNavigation;
