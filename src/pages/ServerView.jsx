import { useParams, Navigate } from 'react-router-dom';
import { useServer } from '../context/ServerContext';
import { Hash, Settings, Bell, Search, Menu, Users } from 'lucide-react';
import ChatWindow from '../components/chat/ChatWindow';

const ServerView = () => {
    const { serverId } = useParams();
    const { servers } = useServer();

    const server = servers.find(s => s.id === parseInt(serverId));

    if (!server) {
        return <Navigate to="/servers" />;
    }

    // Mock chat data for server view
    const mockChannelChat = {
        username: `# ${server.channels[0]}`, // Display channel name as "username" for ChatWindow
        messages: [
            { text: `Welcome to #${server.channels[0]}!`, isMe: false, time: "Today" }
        ]
    };

    return (
        <div className="page-container" style={{ display: 'flex', height: '100%', padding: 0 }}>
            {/* Server Sidebar (Channels) */}
            <div style={{
                width: '240px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>{server.name}</h2>
                    <Menu size={18} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
                </div>

                <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                    <div style={{
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        color: 'var(--text-secondary)',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        paddingLeft: '0.5rem'
                    }}>
                        Text Channels
                    </div>
                    {server.channels.map(channel => (
                        <div
                            key={channel}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '6px',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                        >
                            <Hash size={18} />
                            <span>{channel}</span>
                        </div>
                    ))}
                </div>

                <div style={{
                    padding: '1rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem'
                    }}>
                        Me
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>My Account</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Online</div>
                    </div>
                    <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                    height: '60px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1.5rem',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Hash size={24} style={{ color: 'var(--text-secondary)' }} />
                        <h3 style={{ margin: 0 }}>{server.channels[0]}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)' }}>
                        <Bell size={20} />
                        <Users size={20} />
                        <Search size={20} />
                    </div>
                </div>

                <div className="animate-fade-in" style={{ flex: 1, position: 'relative' }}>
                    <ChatWindow activeChat={mockChannelChat} />
                </div>
            </div>

            {/* Members List (Right Sidebar) - Simplified */}
            <div style={{
                width: '240px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '1.5rem',
                display: 'none' // Hidden on smaller screens
            }} className="members-sidebar">
                <h3 style={{
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem'
                }}>
                    Members — {server.members}
                </h3>
                {/* Mock members */}
                {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', opacity: 0.7 }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333' }} />
                        <span>Member {i}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServerView;
