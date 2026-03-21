import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Hash } from 'lucide-react';
import { useServer } from '../hooks/useServer';
import PageHeader from '../components/layout/PageHeader';
import './Servers.css';

const Servers = () => {
    const { servers, addCommunity, realTimeActivity } = useServer();
    const navigate = useNavigate();
    const [newServerName, setNewServerName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // For now, let's show the most recent global activity on all relevant cards 
    // or specifically on "Lo-Fi Lounge" for demo purposes.
    // In a real app, this would be filtered by server room.
    const latestActivity = realTimeActivity.length > 0 ? realTimeActivity[realTimeActivity.length - 1] : null;

    const handleCreateServer = (e) => {
        e.preventDefault();
        if (!newServerName.trim()) return;

        addCommunity({ name: newServerName });
        setNewServerName('');
        setIsCreating(false);
    };

    return (
        <div className="servers-page">
            <PageHeader 
                title="Servers" 
                rightElement={
                    <button
                        className="create-server-btn"
                        onClick={() => setIsCreating(!isCreating)}
                        style={{ padding: '6px' }}
                    >
                        <Plus size={24} />
                    </button>
                }
            />
            {isCreating && (
                <div className="create-server-panel glass-panel">
                    <h3>Create a New Community</h3>
                    <form onSubmit={handleCreateServer} className="create-server-form">
                        <input
                            type="text"
                            value={newServerName}
                            onChange={(e) => setNewServerName(e.target.value)}
                            placeholder="Enter community name..."
                            autoFocus
                        />
                        <button type="submit" className="submit-btn highlight">
                            Create
                        </button>
                    </form>
                </div>
            )}

            <div className="servers-grid">
                {servers.map(server => (
                    <div
                        key={server.id}
                        className="server-card glass-card"
                        onClick={() => navigate(`/servers/${server.id}`)}
                    >
                        <div className="server-icon-large">
                            {server.icon}
                        </div>
                        <div className="server-info">
                            <h3>{server.name}</h3>
                            <div className="server-members">
                                <Users size={14} />
                                <span>{server.members} members</span>
                            </div>
                            {latestActivity && (
                                <div className="server-now-playing">
                                    <div className="pulse-dot"></div>
                                    <span className="playing-text">
                                        @{latestActivity.username}: {latestActivity.track.title}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Servers;
