import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Hash, Play } from 'lucide-react';
import { useServer } from '../hooks/useServer';
import { useUI } from '../hooks/useUI';
import PageHeader from '../components/layout/PageHeader';
import './Servers.css';

const Servers = () => {
    const { servers, addCommunity, realTimeActivity } = useServer();
    const { setLiveInfo } = useUI();
    const navigate = useNavigate();
    const [newServerName, setNewServerName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Filter activity by current server
    const getActivityForServer = (server) => {
        const activity = realTimeActivity.find(a => String(a.communityId) === String(server._id));
        if (activity) return activity;
        
        // Mock activity for "Stride Official" to showcase the feature if no real activity exists
        if (server.name === 'Stride Official') {
            return {
                username: 'StrideBot',
                track: { title: 'Social Nexus Launch Event' }
            };
        }
        return null;
    };

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
                {servers.map(server => {
                    const activity = getActivityForServer(server);
                    return (
                        <div
                            key={server.id}
                            className="server-card glass-card"
                            onClick={() => navigate(`/community/${server._id}`)}
                        >
                            <div className="server-icon-large">
                                {server.icon}
                            </div>
                            <div className="server-info">
                                <h3>{server.name}</h3>
                                <div className="server-members">
                                    <Users size={14} />
                                    <span>{server.memberCount || server.members?.length || 0} members</span>
                                </div>
                                {activity && (
                                    <div className="server-now-playing">
                                        <div className="pulse-dot"></div>
                                        <span className="playing-text">
                                            @{activity.username}: {activity.track.title}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {activity && (
                                <button 
                                    className="join-stream-mini-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setLiveInfo({ 
                                            isOpen: true, 
                                            streamerName: activity.username, 
                                            communityName: server.name,
                                            streamId: server._id 
                                        });
                                    }}
                                >
                                    <Play size={12} fill="currentColor" />
                                    <span>Join</span>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Servers;
