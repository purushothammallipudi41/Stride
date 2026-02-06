import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useServer } from '../context/ServerContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Hash, Settings, Bell, Search, Menu, Users, ArrowLeft } from 'lucide-react';
import ChatWindow from '../components/chat/ChatWindow';
import { ServerMenu, MembersList, SearchModal } from '../components/server/ServerInteractions';
import { InviteModal, CreateChannelModal, ServerSettingsModal } from '../components/server/ServerModals';
import '../components/common/IconBtn.css';

const ServerView = () => {
    const { serverId } = useParams();
    const { servers, fetchMessages, sendServerMessage, createChannel, leaveServer } = useServer();
    const navigate = useNavigate(); // For redirecting after leave
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activeChannel, setActiveChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI States
    const [showMenu, setShowMenu] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    // Feature Modal States
    const [showInvite, setShowInvite] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showCreateChannel, setShowCreateChannel] = useState(false);

    const server = servers.find(s => s.id === parseInt(serverId));

    useEffect(() => {
        if (server && !activeChannel) {
            setActiveChannel(server.channels[0]);
        }
    }, [server, activeChannel]);

    useEffect(() => {
        if (server && activeChannel) {
            setLoading(true);
            const loadMessages = async () => {
                const data = await fetchMessages(serverId, activeChannel);
                setMessages(data);
                setLoading(false);
            };
            loadMessages();

            // Simple polling for "real-time" updates
            const interval = setInterval(async () => {
                const data = await fetchMessages(serverId, activeChannel);
                setMessages(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [serverId, activeChannel]);

    if (!server) {
        return <Navigate to="/servers" />;
    }

    const handleSendMessage = async (text, type = 'text') => {
        if (!user || !activeChannel) return;
        const msgData = {
            userEmail: user.email,
            username: user.username,
            text,
            type
        };
        const newMsg = await sendServerMessage(serverId, activeChannel, msgData);
        if (newMsg) {
            setMessages(prev => [...prev, newMsg]);
        }
    };

    const activeChatData = {
        username: `# ${activeChannel}`,
        messages: messages.map(m => ({
            ...m,
            isMe: m.userEmail === user?.email,
            gif: m.type === 'gif' ? m.text : null
        }))
    };

    return (
        <div className="page-container" style={{ display: 'flex', height: '100%', padding: 0 }}>
            {/* Server Sidebar (Channels) */}
            <div className={`server-sidebar ${activeChannel ? 'mobile-hidden' : ''}`} style={{
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
                    <button className="icon-btn" onClick={() => setShowMenu(!showMenu)} title="Server Options">
                        <Menu size={18} style={{ color: showMenu ? 'var(--color-primary)' : 'var(--text-secondary)' }} />
                    </button>
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
                            onClick={() => setActiveChannel(channel)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '0.6rem 0.8rem',
                                borderRadius: '6px',
                                color: activeChannel === channel ? 'var(--text-primary)' : 'var(--text-secondary)',
                                background: activeChannel === channel ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginBottom: '2px'
                            }}
                            onMouseEnter={(e) => {
                                if (activeChannel !== channel) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeChannel !== channel) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }
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
                        {user?.username?.charAt(0).toUpperCase() || 'Me'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user?.username || 'Guest'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Online</div>
                    </div>
                    <button className="icon-btn" onClick={() => { console.log('Settings clicked'); showToast('User Settings', 'info'); }} title="User Settings">
                        <Settings size={18} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`server-chat-area ${!activeChannel ? 'mobile-hidden' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>
                <div style={{
                    height: '60px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1.5rem',
                    alignItems: 'center',
                    padding: '0 1.5rem',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.2)',
                    position: 'relative',
                    zIndex: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="icon-btn mobile-only" onClick={() => setActiveChannel(null)} style={{ marginRight: '8px' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <Hash size={24} style={{ color: 'var(--text-secondary)' }} />
                        <h3 style={{ margin: 0 }}>{activeChannel}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)' }}>
                        <button className="icon-btn" onClick={() => showToast('Notifications enabled', 'success')} title="Notifications">
                            <Bell size={20} />
                        </button>
                        <button className="icon-btn" onClick={() => setShowMembers(!showMembers)} title="Toggle Member List">
                            <Users size={20} style={{ color: showMembers ? 'var(--color-primary)' : 'currentColor' }} />
                        </button>
                        <button className="icon-btn" onClick={() => setShowSearch(true)} title="Search">
                            <Search size={20} />
                        </button>
                    </div>
                </div>

                <div className="animate-fade-in" style={{ flex: 1, position: 'relative' }}>
                    {loading ? (
                        <div className="flex-center" style={{ height: '100%' }}>
                            <div className="loading-spinner"></div>
                        </div>
                    ) : (
                        <ChatWindow
                            activeChat={activeChatData}
                            onSendMessage={handleSendMessage}
                        />
                    )}
                </div>
            </div>

            {/* Interaction Overlays */}
            {/* Interaction Overlays */}
            <ServerMenu
                isOpen={showMenu}
                onClose={() => setShowMenu(false)}
                serverName={server.name}
                onInvite={() => setShowInvite(true)}
                onSettings={() => setShowSettings(true)}
                onCreateChannel={() => setShowCreateChannel(true)}
                onLeave={async () => {
                    if (window.confirm(`Are you sure you want to leave ${server.name}?`)) {
                        const success = await leaveServer(server.id, user.email);
                        if (success) {
                            showToast('Left server', 'success');
                            navigate('/servers'); // Redirect to server list
                        } else {
                            showToast('Failed to leave server', 'error');
                        }
                    }
                }}
            />
            <MembersList
                isOpen={showMembers}
                onClose={() => setShowMembers(false)}
            />
            <SearchModal
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
            />

            {/* Action Modals */}
            <InviteModal
                isOpen={showInvite}
                onClose={() => setShowInvite(false)}
                serverName={server.name}
            />
            <ServerSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                server={server}
            />
            <CreateChannelModal
                isOpen={showCreateChannel}
                onClose={() => setShowCreateChannel(false)}
                onCreate={async (newChannel) => {
                    console.log('ServerView: Creating channel:', newChannel);
                    const success = await createChannel(server.id, newChannel.name, newChannel.type);
                    if (success) {
                        showToast(`Channel #${newChannel.name} created!`, 'success');
                        setActiveChannel(newChannel.name); // Switch to new channel
                    } else {
                        showToast('Failed to create channel', 'error');
                    }
                }}
            />
        </div>
    );
};

export default ServerView;
