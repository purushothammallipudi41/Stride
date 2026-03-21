import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useServer } from '../hooks/useServer';
import { useActivity } from '../hooks/useActivity';


import { Hash, Settings, Bell, Search, Menu, Users, Music, Plus, Play, MoreVertical, Volume2 } from 'lucide-react';
import ChatWindow from '../components/chat/ChatWindow';
import Avatar from '../components/common/Avatar';
import socket from '../services/socket';

import './ServerView.css';

const CommunityView = () => {
    const { communityId } = useParams();
    const { servers, joinCommunity } = useServer();
    const { isUserListening } = useActivity();
    const [activeChannel, setActiveChannel] = useState('general');
    const [showModTools, setShowModTools] = useState(false);
    
    const community = servers.find(s => s._id === communityId);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const userRole = community?.roles?.find(r => r.user === user.username)?.role || (community?.owner === user._id ? 'owner' : 'member');
    const isMod = userRole === 'owner' || userRole === 'mod';

    useEffect(() => {
        if (communityId) {
            socket.emit('join_community', communityId);
        }
    }, [communityId]);

    if (!community) {
        return <div className="loading-screen">Finding community...</div>;
    }

    const isMember = community.members.includes(user._id);

    const handleJoin = async () => {
        await joinCommunity(communityId, user._id);
    };

    const handlePromote = async (memberId) => {
        alert(`Promoting member ${memberId} in ${community.name}... (Backend Logic Stub)`);
        // In a real app, this would be an API call to update community roles
    };

    const handleKick = async (memberId) => {
        if(window.confirm("Are you sure you want to kick this member?")) {
            alert(`Kicking member ${memberId} from ${community.name}... (Backend Logic Stub)`);
        }
    };

    const channels = [
        { id: 'general', name: 'general', type: 'text', icon: Hash },
        { id: 'announcements', name: 'announcements', type: 'text', icon: Bell },
        { id: 'jukebox', name: 'jukebox-live', type: 'music', icon: Music },
        { id: 'events', name: 'upcoming-events', type: 'text', icon: Hash },
    ];

    const activeChannelObj = channels.find(c => c.id === activeChannel);

    return (
        <div className="discord-layout animate-fade-in">
            {/* 1. Channel Sidebar (Discord-style) */}
            <div className="channel-sidebar">
                <header className="server-header">
                    <h2 className="server-name">{community.name}</h2>
                    <div className="server-header-actions">
                        {isMod && <Settings size={18} className="icon-btn" onClick={() => setShowModTools(true)} />}
                        <MoreVertical size={18} opacity={0.6} />
                    </div>
                </header>

                <div className="channel-list">
                    <div className="channel-group-label">Text Channels</div>
                    {channels.map(channel => (
                        <button 
                            key={channel.id}
                            className={`channel-btn ${activeChannel === channel.id ? 'active' : ''}`}
                            onClick={() => setActiveChannel(channel.id)}
                        >
                            <channel.icon size={20} className="channel-hash" />
                            <span className="channel-name">{channel.name}</span>
                        </button>
                    ))}
                </div>

                <div className="user-pod">
                    <div className="user-pod-info">
                        <div className="user-pod-avatar">
                            <Avatar 
                                src={user.avatar} 
                                alt="" 
                                size={32} 
                                frame={user.avatarFrame || 'none'}
                                isListening={isUserListening(user.username)}
                            />
                            <div className="status-indicator online"></div>
                        </div>
                        <div className="user-pod-meta">
                            <span className="user-pod-name">{user.username}</span>
                            <span className="user-pod-status">Online</span>
                        </div>
                    </div>
                    <div className="user-pod-actions">
                        <Settings size={18} />
                    </div>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="main-chat-area">
                <header className="chat-header">
                    <div className="header-left">
                        {activeChannelObj?.icon && <activeChannelObj.icon size={24} className="icon-muted" />}
                        <h3>{activeChannelObj?.name}</h3>
                    </div>
                    <div className="header-right">
                        <Volume2 size={20} />
                        <Users size={20} />
                        <div className="header-search">
                            <input type="text" placeholder="Search" />
                            <Search size={14} />
                        </div>
                    </div>
                </header>

                <div className="chat-content">
                    {activeChannel === 'jukebox' ? (
                        <div className="jukebox-container">
                             <div className="jukebox-hero">
                                <Music size={48} className="pulse-icon" />
                                <h2>Community Jukebox</h2>
                                <p>Listeners are currently vibing to the shared queue</p>
                                {!isMember && <button className="join-overlay-btn" onClick={handleJoin}>Join to Add Beats</button>}
                             </div>
                             
                             <div className="jukebox-queue">
                                <div className="queue-header">
                                    <span>UP NEXT</span>
                                    <button className="add-btn-small" disabled={!isMember}><Plus size={16} /> Add Song</button>
                                </div>
                                {community.jukeboxQueue?.map((t, i) => (
                                    <div key={i} className="queue-card">
                                        <img src={t.artwork} alt="" />
                                        <div className="card-meta">
                                            <span className="t-title">{t.title}</span>
                                            <span className="t-artist">{t.artist}</span>
                                        </div>
                                        <Play size={18} className="hover-play" />
                                    </div>
                                ))}
                                {(!community.jukeboxQueue || community.jukeboxQueue.length === 0) && (
                                    <div className="empty-state-music">Queue is empty.</div>
                                )}
                             </div>
                        </div>
                    ) : (
                        <ChatWindow 
                            activeChat={{ username: `# ${activeChannel}`, messages: [{text: `Welcome to the ${activeChannel} channel!`, time: 'System'}] }} 
                            isDisabled={!isMember} 
                        />
                    )}
                </div>
            </div>

            {/* 3. Member List (Right Sidebar) */}
            <div className="member-sidebar">
                <div className="member-group-label">Members — {community.members?.length || 0}</div>
                <div className="member-list">
                    {community.members?.map((m, i) => (
                        <div key={i} className="member-item">
                            <div className="member-avatar-wrapper">
                                <Avatar 
                                    src={m.username?.[0] || 'U'} 
                                    alt="" 
                                    size={32} 
                                    frame={m.avatarFrame || 'none'}
                                    isListening={isUserListening(m.username)}
                                />
                                <div className="status-indicator online"></div>
                            </div>
                            <span className="member-name">User {i + 1}</span>
                        </div>
                    ))}
                </div>
            </div>
            {/* Moderation Modal */}
            {showModTools && (
                <div className="modal-overlay" onClick={() => setShowModTools(false)}>
                    <div className="glass-panel mod-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Community Management</h3>
                            <button onClick={() => setShowModTools(false)}>✕</button>
                        </div>
                        <div className="mod-content">
                            <h4>Members ({community.members?.length || 0})</h4>
                            <div className="mod-member-list">
                                {community.members?.map(m => (
                                    <div key={m._id} className="mod-member-item">
                                        <span>{m.username}</span>
                                        <div className="mod-actions">
                                            <button className="mod-btn promote" onClick={() => handlePromote(m._id)}>Promote</button>
                                            <button className="mod-btn kick" onClick={() => handleKick(m._id)}>Kick</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default CommunityView;


