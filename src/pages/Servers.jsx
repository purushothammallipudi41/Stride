import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useServer } from '../context/ServerContext';

const Servers = () => {
    const { servers, addServer } = useServer();
    const navigate = useNavigate();
    const [newServerName, setNewServerName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateServer = async (e) => {
        e.preventDefault();
        if (!newServerName.trim()) return;

        await addServer(newServerName);
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
                        className="glass-card animate-in"
                        style={{
                            padding: '2rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            gap: '1.5rem',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: 'rgba(255, 255, 255, 0.02)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px var(--color-primary-glow)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '24px',
                            background: 'var(--primary-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
                        }}>
                            {server.icon && (server.icon.startsWith('http') || server.icon.startsWith('/')) ? (
                                <img
                                    src={server.icon}
                                    alt={server.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                server.icon
                            )}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: '700' }}>{server.name}</h3>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                color: 'var(--color-text-secondary)',
                                fontSize: '0.95rem'
                            }}>
                                <Users size={16} />
                                <span>{server.members} members</span>
                            </div>
                        </div>
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.6rem 1.2rem',
                            borderRadius: 'full',
                            background: 'rgba(255, 255, 255, 0.05)',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>
                            Explore Community
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Servers;
