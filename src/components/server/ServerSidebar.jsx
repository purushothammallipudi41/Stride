import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, Home, ArrowLeft, MessageSquare } from 'lucide-react';
import { useServer } from '../../context/ServerContext';
import { CreateServerModal } from './ServerModals';
import './ServerSidebar.css';

const ServerSidebar = () => {
    const { servers, setIsCreateModalOpen, isMobileSidebarOpen, setIsMobileSidebarOpen } = useServer();
    const { serverId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const activeId = parseInt(serverId);
    const isMessagesActive = location.pathname.startsWith('/messages');

    // Close sidebar on navigation (mobile)
    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileSidebarOpen(false);
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`server-sidebar-overlay ${isMobileSidebarOpen ? 'visible' : ''}`}
                onClick={() => setIsMobileSidebarOpen(false)}
            />

            <aside className={`server-icon-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
                <div
                    className="server-icon-wrapper exit-link"
                    onClick={() => handleNavigation('/')}
                    title="Back to Stride Home"
                >
                    <div className="active-indicator" />
                    <div className="server-icon-circle stride-home-btn">
                        <ArrowLeft size={22} className="exit-arrow" />
                        <Home size={18} className="exit-home" />
                    </div>
                </div>

                <div className="sidebar-divider" />

                <div className="server-icons-list">
                    {servers.map(server => (
                        <div
                            key={server.id}
                            className={`server-icon-wrapper ${activeId === server.id ? 'active' : ''}`}
                            onClick={() => handleNavigation(`/servers/${server.id}`)}
                            title={server.name}
                        >
                            <div className="active-indicator" />
                            <div className="server-icon-circle">
                                {server.icon && (server.icon.startsWith('http') || server.icon.startsWith('/')) ? (
                                    <img src={server.icon} alt={server.name} />
                                ) : (
                                    <span>{server.icon || server.name[0]}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="server-icon-wrapper create-trigger" onClick={() => { setIsCreateModalOpen(true); setIsMobileSidebarOpen(false); }} title="Create a Server">
                    <div className="server-icon-circle plus-icon">
                        <Plus size={24} />
                    </div>
                </div>
            </aside>
        </>
    );
};

export default ServerSidebar;
