import { useState, useEffect, useCallback } from 'react';
import SEO from '../components/common/SEO';
import { useParams, useNavigate } from 'react-router-dom';
import { useServer } from '../hooks/useServer';
import { useActivity } from '../hooks/useActivity';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import MusicContextObject from '../context/MusicContextObject';


import { Hash, Settings, Bell, Search, Menu, Users, Music, Plus, Play, MoreVertical, Volume2, Trophy, History, BarChart3, ChevronLeft, Phone, Video } from 'lucide-react';
import ChatWindow from '../components/chat/ChatWindow';
import AnalyticsDashboard from '../components/content/AnalyticsDashboard';
import Avatar from '../components/common/Avatar';
import socket from '../services/socket';

import './ServerView.css';

const CommunityView = () => {
    const { communityId } = useParams();
    const navigate = useNavigate();
    const { servers, joinCommunity, updateMemberRole, kickMember } = useServer();
    const { isUserListening } = useActivity();
    const { allSongs, currentTrack, isPlaying, playTrack, joinMusicRoom, leaveMusicRoom, roomListeners, voteSong } = useContext(MusicContextObject);
    const { t } = useTranslation();
    const [activeChannel, setActiveChannel] = useState('general');
    const [showModTools, setShowModTools] = useState(false);
    const [channelMessages, setChannelMessages] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showMemberSidebar, setShowMemberSidebar] = useState(true);
    const [isMuted, setIsMuted] = useState(false);

    console.log("[ServerView] Rendering for communityId:", communityId);
    console.log("[ServerView] Servers available:", servers?.length);
    
    const community = servers.find(s => s._id === communityId);
    console.log("[ServerView] Found community:", community?.name);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Derived state
    const isMember = community?.members?.includes(user._id);

    const handleAddSong = useCallback(async () => {
        if (!isMember || !allSongs?.length) return;
        const randomSong = allSongs[Math.floor(Math.random() * allSongs.length)];
        
        try {
            const trackData = {
                id: randomSong.id,
                title: randomSong.title,
                artist: randomSong.artist || 'Unknown Artist',
                artwork: randomSong.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=480&q=80'
            };
            
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/communities/${communityId}/jukebox`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track: trackData, userId: user._id })
            });
        } catch (err) {
            console.error("Add song failed:", err);
        }
    }, [isMember, allSongs, communityId, user._id]);

    const userRole = community?.roles?.find(r => r.user === user?.username)?.role || (community?.owner === user?._id ? 'owner' : 'member');
    const isMod = userRole === 'owner' || userRole === 'mod';

    useEffect(() => {
        if (communityId) {
            socket.emit('join_community', communityId);
            // Join specific channel room
            socket.emit('join_room', `community_${communityId}_${activeChannel}`);
            
            if (joinMusicRoom) joinMusicRoom(`community_${communityId}`);
        }

        const handleNewMessage = (msg) => {
            console.log("[ServerView] New channel message:", msg);
            setChannelMessages(prev => ({
                ...prev,
                [msg.roomId]: [...(prev[msg.roomId] || []), msg]
            }));
        };

        socket.on('new_channel_message', handleNewMessage);

        return () => {
             if (leaveMusicRoom) leaveMusicRoom();
             socket.off('new_channel_message', handleNewMessage);
        };
    }, [communityId, activeChannel, joinMusicRoom, leaveMusicRoom]);

    const handleSendMessage = (content, type = 'text') => {
        if (!isMember) return;
        const roomId = `community_${communityId}_${activeChannel}`;
        const newMessage = {
            roomId,
            message: {
                text: content,
                type,
                username: user.username,
                avatar: user.avatar,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        };
        socket.emit('channel_message', newMessage);
        
        // Optimistic update
        setChannelMessages(prev => ({
            ...prev,
            [roomId]: [...(prev[roomId] || []), { ...newMessage.message, isMe: true, id: Date.now() }]
        }));
    };

    const handleStartCall = (member, type = 'video') => {
        if (!member?.username || member.username === user.username) return;
        socket.emit('start-direct-call', {
            username: member.username,
            name: member.name || member.username,
            type
        });
    };

    if (!community) {
        return <div className="loading-screen">Finding community...</div>;
    }

    const handleJoin = async () => {
        if (user?._id) await joinCommunity(communityId, user._id);
    };

    const handlePromote = async (memberId) => {
        const result = await updateMemberRole(communityId, memberId, 'mod');
        if (result?.message) alert("Member promoted to Moderator!");
    };

    const handleKick = async (memberId) => {
        if(window.confirm("Are you sure you want to kick this member?")) {
            const result = await kickMember(communityId, memberId);
            if (result?.message) alert("Member kicked from community.");
        }
    };
    

    const channels = [
        { id: 'general', name: 'general', type: 'text', icon: Hash },
        { id: 'announcements', name: 'announcements', type: 'text', icon: Bell },
        { id: 'jukebox', name: t('jukebox.jukebox_live'), type: 'music', icon: Music },
        { id: 'events', name: 'upcoming-events', type: 'text', icon: Hash },
        ...(isMod ? [{ id: 'analytics', name: 'insights', type: 'analytics', icon: BarChart3 }] : [])
    ];

    const activeChannelObj = channels.find(c => c.id === activeChannel);

    const brandStyle = {
        '--color-primary': community?.primaryColor || '#8b5cf6',
        '--color-primary-glow': (community?.primaryColor || '#8b5cf6') + '44',
        '--color-accent': community?.accentColor || '#d946ef',
    };

    return (
        <div className="discord-layout animate-fade-in" style={brandStyle}>
            <SEO 
                title={community?.name || 'Community'} 
                description={`Join the ${community?.name} community on Stride. Connect with fellow listeners and vibers.`} 
            />
            {/* 1. Channel Sidebar (Discord-style) */}
            <div className="channel-sidebar">
                <header className="server-header">
                    <button className="server-back-btn" onClick={() => navigate('/explore')} title="Back to Explore" aria-label="Back to Explore">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="server-name">{community.name}</h2>
                    <div className="server-header-actions">
                        {isMod && <Settings size={18} className="icon-btn" onClick={() => setShowModTools(true)} aria-label="Community Settings" />}
                        <MoreVertical size={18} opacity={0.6} className="icon-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Invite link copied!"); }} aria-label="Copy Invite Link" />
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
                                src={user?.avatar} 
                                alt="" 
                                size={32} 
                                frame={user?.avatarFrame || 'none'}
                                isListening={isUserListening && isUserListening(user?.username)}
                            />
                            <div className="status-indicator online"></div>
                        </div>
                        <div className="user-pod-meta">
                            <span className="user-pod-name">{user?.username || 'Guest'}</span>
                            <span className="user-pod-status">Online</span>
                        </div>
                    </div>
                     <div className="user-pod-actions">
                        <Settings size={18} className="icon-btn" onClick={() => navigate('/settings')} aria-label="Account Settings" />
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
                        <Volume2 size={20} className={`icon-btn ${isMuted ? 'muted' : ''}`} onClick={() => setIsMuted(!isMuted)} aria-label={isMuted ? "Unmute" : "Mute"} />
                        <Users size={20} className={`icon-btn ${showMemberSidebar ? 'active' : ''}`} onClick={() => setShowMemberSidebar(!showMemberSidebar)} aria-label="Toggle Member List" />
                        <div className="header-search">
                            <input type="text" placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <Search size={14} />
                        </div>
                    </div>
                </header>

                <div className="chat-content">
                    {activeChannel === 'jukebox' ? (
                        <div className="jukebox-container">
                             <div className="jukebox-hero">
                                <Music size={48} className="pulse-icon" />
                                <h2>{t('jukebox.jukebox_live')}</h2>
                                <p>Listeners are currently vibing to the shared queue</p>
                                 {!isMember && <button className="join-overlay-btn" onClick={handleJoin}>{t('jukebox.join_to_add')}</button>}
                             </div>

                             {roomListeners?.length > 0 && (
                                <div className="live-listeners-tray">
                                    <div className="tray-header">
                                        <Users size={16} /> <span>{t('jukebox.listeners_count', { count: roomListeners.length })}</span>
                                    </div>
                                    <div className="listener-pills">
                                        {roomListeners.map(listener => (
                                            <div key={listener.username} className="listener-pill animate-fade-in">
                                                <Avatar 
                                                    src={listener.avatar} 
                                                    alt="" 
                                                    size={20} 
                                                    frame={listener.avatarFrame || 'none'} 
                                                />
                                                <span>{listener.username}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )}
                             
                             <div className="jukebox-queue">
                                 <div className="queue-header">
                                    <span>{t('jukebox.up_next')}</span>
                                    <button className="add-btn-small" onClick={handleAddSong} disabled={!isMember}><Plus size={16} /> {t('jukebox.add_song')}</button>
                                </div>
                                {isPlaying && (
                                    <div className="sync-status-bar">
                                        <div className="jukebox-sync-indicator">{t('jukebox.live')}</div>
                                        <span>Everyone is currently listening to <b>{currentTrack?.title}</b></span>
                                    </div>
                                )}
                                {community.jukeboxQueue?.map((t, i) => (
                                    <div key={i} className="queue-card">
                                        <img src={t?.artwork || ''} alt="" />
                                         <div className="card-meta">
                                            <span className="t-title">{t?.title}</span>
                                            <span className="t-artist">{t?.artist}</span>
                                            <div className="t-votes-badge">
                                                <button onClick={(e) => { e.stopPropagation(); voteSong(communityId, t.trackId || t.id, 1); }} className="vote-btn up"><Plus size={12} /></button>
                                                <span>{t?.votes || 0}</span>
                                                <button onClick={(e) => { e.stopPropagation(); voteSong(communityId, t.trackId || t.id, -1); }} className="vote-btn down"><Plus size={12} style={{transform: 'rotate(45deg)'}} /></button>
                                            </div>
                                         </div>
                                        <button 
                                            className={`play-btn-circle ${currentTrack?.id === (t?.trackId || t?.id) && isPlaying ? 'playing' : ''}`}
                                            onClick={() => playTrack && playTrack(t)}
                                        >
                                            <Play size={18} />
                                        </button>
                                    </div>
                                ))}
                                {(!community.jukeboxQueue || community.jukeboxQueue.length === 0) && (
                                    <div className="empty-state-music">Queue is empty.</div>
                                )}
                             </div>

                             <div className="jukebox-social-sidebar">
                                {community.vibeLeaderboard?.length > 0 && (
                                    <div className="vibe-leaderboard glass-panel">
                                        <div className="section-header">
                                            <Trophy size={18} color="gold" />
                                            <h3>TOP DJs</h3>
                                        </div>
                                        <div className="leaderboard-list">
                                            {community.vibeLeaderboard.slice(0, 5).map((entry, idx) => (
                                                <div key={idx} className="leaderboard-item">
                                                    <span className="rank">#{idx + 1}</span>
                                                    <span className="l-username">{entry.username}</span>
                                                    <span className="l-points">{entry.points} pts</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {community.pastQueue?.length > 0 && (
                                    <div className="past-vibes glass-panel">
                                        <div className="section-header">
                                            <History size={18} />
                                            <h3>RECENTLY PLAYED</h3>
                                        </div>
                                        <div className="history-list">
                                            {community.pastQueue.slice(0, 5).map((t, i) => (
                                                <div key={i} className="history-item">
                                                    <img src={t.artwork} alt="" />
                                                    <div className="h-meta">
                                                        <span className="h-title">{t.title}</span>
                                                        <span className="h-artist">{t.artist}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                             </div>
                        </div>
                    ) : activeChannel === 'analytics' ? (
                        <AnalyticsDashboard communityId={communityId} />
                    ) : (
                         <ChatWindow 
                            activeChat={{ 
                                username: activeChannelObj?.name, 
                                name: activeChannelObj?.name,
                                avatar: '', 
                                messages: channelMessages[`community_${communityId}_${activeChannel}`] || [
                                    { text: `Welcome to the ${activeChannel} channel!`, time: 'System', username: 'System' }
                                ] 
                            }} 
                            roomId={`community_${communityId}_${activeChannel}`}
                            currentUser={user.username}
                            onSendMessage={handleSendMessage}
                            onStartCall={(type) => handleStartCall({ username: activeChannelObj?.name }, type)}
                            isDisabled={!isMember}
                            hideCallButtons={true}
                        />
                    )}
                </div>
            </div>

             {/* 3. Member List (Right Sidebar) */}
            {showMemberSidebar && (
                <div className="member-sidebar">
                    <div className="member-group-label">Members — {community.members?.length || 0}</div>
                    <div className="member-list">
                        {community.members?.filter(m => {
                            const username = typeof m === 'object' ? m.username : m;
                            return username?.toLowerCase().includes(searchTerm.toLowerCase());
                        }).map((m, i) => {
                            const memberData = typeof m === 'object' ? m : { username: m, avatar: 'U', avatarFrame: 'none' };
                        const isMe = memberData.username === user.username;
                        return (
                            <div key={i} className="member-item">
                                <div className="member-item-left">
                                    <div className="member-avatar-wrapper">
                                        <Avatar 
                                            src={memberData.avatar || memberData.username?.[0] || 'U'} 
                                            alt="" 
                                            size={32} 
                                            frame={memberData.avatarFrame || 'none'}
                                            isListening={isUserListening && isUserListening(memberData.username)}
                                        />
                                        <div className="status-indicator online"></div>
                                    </div>
                                    <span className="member-name">
                                        {memberData.username || `Member ${i+1}`}
                                        {((memberData.username?.length || 0) % 3 === 0) && (
                                            <span className="vibe-streak-badge" title="Vibe Streak">
                                                🔥 {(memberData.username?.length || 0) % 7 + 1}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                 {!isMe && (
                                    <div className="member-actions">
                                        <button className="member-item-btn" onClick={() => handleStartCall(memberData, 'audio')} aria-label={`Start audio call with ${memberData.username}`}><Phone size={14} className="member-call-icon" /></button>
                                        <button className="member-item-btn" onClick={() => handleStartCall(memberData, 'video')} aria-label={`Start video call with ${memberData.username}`}><Video size={14} className="member-call-icon" /></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
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


