import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useServer } from '../context/ServerContext';

const Servers = () => {
    const { servers, addServer } = useServer();
    const navigate = useNavigate();
    const [newServerName, setNewServerName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateServer = (e) => {
        e.preventDefault();
        if (!newServerName.trim()) return;

        addServer(newServerName);
        setNewServerName('');
        setIsCreating(false);
    };

    return (
        <div className="page-container" style={{ padding: '2rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <h1>Your Servers</h1>
                <button
                    className="btn-primary"
                    onClick={() => setIsCreating(!isCreating)}
                    style={{
                        background: 'var(--primary-gradient)',
                        border: 'none',
                        padding: '0.8rem 1.5rem',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Plus size={20} />
                    Create Server
                </button>
            </div>

            {isCreating && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    marginBottom: '2rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <h3 style={{ marginBottom: '1rem' }}>Create a New Community</h3>
                    <form onSubmit={handleCreateServer} style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            value={newServerName}
                            onChange={(e) => setNewServerName(e.target.value)}
                            placeholder="Server Name"
                            style={{
                                flex: 1,
                                padding: '0.8rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                background: 'rgba(0, 0, 0, 0.2)',
                                color: 'white'
                            }}
                            autoFocus
                        />
                        <button
                            type="submit"
                            style={{
                                background: 'white',
                                color: 'black',
                                border: 'none',
                                padding: '0 1.5rem',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Create
                        </button>
                    </form>
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {servers.map(server => (
                    <div
                        key={server.id}
                        onClick={() => navigate(`/servers/${server.id}`)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'var(--primary-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: 'white'
                        }}>
                            {server.icon}
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 0.2rem 0' }}>{server.name}</h3>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem'
                            }}>
                                <Users size={14} />
                                {server.members} members
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Servers;
