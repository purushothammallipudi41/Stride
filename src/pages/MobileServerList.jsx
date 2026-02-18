import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useServer } from '../context/ServerContext';
import { Plus, ChevronRight, Hash } from 'lucide-react';
import './MobileServerList.css';

const MobileServerList = () => {
    const { servers, setIsCreateModalOpen } = useServer();
    const navigate = useNavigate();

    return (
        <div className="mobile-server-list-page">
            <header className="mobile-server-header">
                <h1>Servers</h1>
                <button className="create-server-btn" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus size={20} />
                </button>
            </header>

            <div className="mobile-server-grid">
                {servers.map(server => (
                    <div
                        key={server.id}
                        className="mobile-server-card"
                        onClick={() => navigate(`/servers/${server.id}`)}
                    >
                        <div className="mobile-server-icon">
                            {server.icon && (server.icon.startsWith('http') || server.icon.startsWith('/')) ? (
                                <img src={server.icon} alt={server.name} />
                            ) : (
                                <span>{server.icon || server.name[0]}</span>
                            )}
                        </div>
                        <div className="mobile-server-info">
                            <h3>{server.name}</h3>
                            <p>{server.members?.length || 0} Members</p>
                        </div>
                        <ChevronRight size={20} className="arrow-icon" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MobileServerList;
