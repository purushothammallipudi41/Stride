import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useServer } from '../hooks/useServer';


import { Hash, Settings, Bell, Search, Menu, Users, Music, Plus, Play, MoreVertical, Volume2 } from 'lucide-react';
import ChatWindow from '../components/chat/ChatWindow';
import socket from '../services/socket';

import './ServerView.css';

const CommunityView = () => {
    const { communityId } = useParams();
    const { servers, joinCommunity } = useServer();
    const [activeChannel, setActiveChannel] = useState('general');
    
    const community = servers.find(s => s._id === communityId);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

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
                <header className="server-header" onClick={() => console.log("Server Settings")}>
                    <h2 className="server-name">{community.name}</h2>
                    <MoreVertical size={18} opacity={0.6} />
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
                            <img src={user.avatar || 'https://i.pravatar.cc/150'} alt="" />
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
                                <div className="m-avatar" style={{background: `hsl(${i * 40}, 70%, 50%)`}}>
                                    {m.username?.[0] || 'U'}
                                </div>
                                <div className="status-indicator online"></div>
                            </div>
                            <span className="member-name">User {i + 1}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default CommunityView;


