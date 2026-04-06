import { useState, useEffect, useMemo } from 'react';
import SEO from '../components/common/SEO';
import { useParams, useNavigate } from 'react-router-dom';
import { useServer } from '../hooks/useServer';
import { useActivity } from '../hooks/useActivity';
import { useContext } from 'react';
import MusicContextObject from '../context/MusicContextObject';
import { useUI } from '../hooks/useUI';


import { Hash, Settings, Bell, Search, Menu, Users, Music, Plus, Play, MoreVertical, Volume2, Trophy, History, BarChart3, ChevronLeft, Phone, Video, Lock } from 'lucide-react';
import ChatWindow from '../components/chat/ChatWindow';
import AnalyticsDashboard from '../components/content/AnalyticsDashboard';
import TrackCard from '../components/chat/TrackCard';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Avatar from '../components/common/Avatar';
import socket from '../services/socket';
import VoiceService from '../services/VoiceService';
import { BASE_URL } from '../utils/api';

import './ServerView.css';

const voiceService = new VoiceService(socket);

const CommunityView = () => {
    const { communityId, channelId } = useParams();
    const navigate = useNavigate();
    const { servers, updateMemberRole, kickMember } = useServer();
    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            return {};
        }
    }, []);
    const { addNotification } = useUI();
    const { isUserListening } = useActivity();
    const { joinMusicRoom, leaveMusicRoom } = useContext(MusicContextObject);
    const [activeChannel, setActiveChannel] = useState(channelId || 'general');

    useEffect(() => {
        if (channelId) setActiveChannel(channelId);
    }, [channelId]);

    const [showModTools, setShowModTools] = useState(false);
    const [channelMessages, setChannelMessages] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showMemberSidebar, setShowMemberSidebar] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [voiceParticipants, setVoiceParticipants] = useState([]);
    const [isInVoice, setIsInVoice] = useState(false);
    const [events, setEvents] = useState([]);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [activeGift, setActiveGift] = useState(null);
    const [targetMember, setTargetMember] = useState(null);
    const [hasVibePass, setHasVibePass] = useState(false);
    const [isMinting, setIsMinting] = useState(false);
    const [showMintModal, setShowMintModal] = useState(false);
    const [newEventData, setNewEventData] = useState({
        title: '',
        description: '',
        startTime: '',
        type: 'general'
    });

    const communityIdTarget = String(communityId);
    const community = useMemo(() => {
        const found = servers.find(s => 
            String(s._id) === communityIdTarget || 
            (s.id && String(s.id) === communityIdTarget) || 
            (s.name && s.name === communityId)
        );
        return found;
    }, [servers, communityIdTarget, communityId]);
    
    const isMember = useMemo(() => {
        if (!user?._id || !community?.members) {
            return false;
        }
        const memberIds = community.members.map(m => {
            if (m && typeof m === 'object' && m !== null) return String(m._id || m);
            return String(m);
        });
        return memberIds.includes(String(user._id));
    }, [user?._id, community?.members]);

    const userRole = community?.roles?.find(r => r.user === user?.username)?.role || (community?.owner === user?._id ? 'owner' : 'member');
    const isMod = userRole === 'owner' || userRole === 'mod';

    const handleStartCall = (member, type = 'video') => {
        if (!member?.username || member.username === user.username) return;
        socket.emit('start-direct-call', {
            username: member.username,
            name: member.name || member.username,
            type
        });
    };

    const handlePromote = async (memberId) => {
        const result = await updateMemberRole(community?._id || communityId, memberId, 'mod');
        if (result?.message) addNotification({ title: 'Success', message: 'Member promoted to Moderator!', type: 'success' });
    };

    const handleKick = async (memberId) => {
        if(window.confirm("Are you sure you want to kick this member?")) {
            const result = await kickMember(community?._id || communityId, memberId);
            if (result?.message) addNotification({ title: 'Success', message: 'Member kicked from community.', type: 'info' });
        }
    };

    useEffect(() => {
        if (community?._id) {
            socket.emit('join_community', community._id);
            socket.emit('join_room', `community_${community._id}_${activeChannel}`);
            
            if (joinMusicRoom) joinMusicRoom(`community_${community._id}`);
        }
    }, [community?._id, activeChannel, joinMusicRoom]);


    useEffect(() => {
        const handleNewMessage = (msg) => {
            setChannelMessages(prev => ({
                ...prev,
                [msg.roomId]: [...(prev[msg.roomId] || []), msg]
            }));
        };

        socket.on('new_channel_message', handleNewMessage);
        
        socket.on('voice_room_updated', (data) => {
            setVoiceParticipants(data.participants || []);
        });

        socket.on('user-joined-voice', ({ username: joinedUser }) => {
            if (isInVoice) {
                voiceService.initiateConnection(joinedUser, user.username);
            }
        });

        socket.on('voice-offer', async ({ from, offer }) => {
            await voiceService.handleOffer(offer, from, user.username);
        });

        socket.on('voice-answer', async ({ from, answer }) => {
            await voiceService.handleAnswer(answer, from);
        });

        socket.on('ice-candidate', async ({ from, candidate }) => {
            await voiceService.handleCandidate(candidate, from);
        });

        voiceService.onTrackCallback = (participantUsername, stream) => {
            const audio = document.getElementById(`audio-${participantUsername}`) || document.createElement('audio');
            audio.id = `audio-${participantUsername}`;
            audio.srcObject = stream;
            audio.autoplay = true;
            if (!document.getElementById(`audio-${participantUsername}`)) {
                document.body.appendChild(audio);
            }
        };

        const fetchEvents = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/communities/${communityId}/events`);
                const data = await res.json();
                setEvents(data);
            } catch (err) {
                console.error("Fetch events failed:", err);
            }
        };

        const checkVibePass = async () => {
            if (!user._id || !communityId) return;
            try {
                const res = await fetch(`${BASE_URL}/api/communities/${communityId}/check-gate?userId=${user._id}`);
                const data = await res.json();
                setHasVibePass(data.hasAccess);
            } catch (err) {
                console.error("Check pass failed:", err);
            }
        };

        if (activeChannel === 'events') {
            fetchEvents();
        }
        checkVibePass();

        socket.on('new_gift', (payload) => {
            setActiveGift(payload);
            setTimeout(() => setActiveGift(null), 5000);
        });

        socket.on('content_updated', (payload) => {
            if (payload.type === 'event_created') {
                setEvents(prev => [...prev, payload.data].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
            }
            if (payload.type === 'event_rsvp') {
                setEvents(prev => prev.map(e => e._id === payload.eventId ? { ...e, rsvps: payload.rsvps } : e));
            }
        });

        return () => {
             if (leaveMusicRoom) leaveMusicRoom();
             socket.off('new_channel_message', handleNewMessage);
             socket.off('voice_room_updated');
             socket.off('user-joined-voice');
             socket.off('voice-offer');
             socket.off('voice-answer');
             socket.off('ice-candidate');
             socket.off('content_updated');
             socket.off('new_gift');
             voiceService.stopLocalStream();
        };
    }, [communityId, activeChannel, community?._id, isInVoice, joinMusicRoom, leaveMusicRoom, user._id, user.username]);

    const handleToggleVoice = async () => {
        if (!isMember) return;
        const newState = !isInVoice;
        setIsInVoice(newState);
        if (newState) {
            const stream = await voiceService.startLocalStream();
            if (stream) {
                socket.emit('join_voice', { communityId, username: user.username });
            } else {
                alert("Microphone access denied or unavailable.");
                setIsInVoice(false);
            }
        } else {
            voiceService.stopLocalStream();
            socket.emit('leave_voice', { communityId, username: user.username });
        }
    };

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
        
        setChannelMessages(prev => ({
            ...prev,
            [roomId]: [...(prev[roomId] || []), { ...newMessage.message, isMe: true, id: Date.now() }]
        }));
    };

    if (!community) {
        return (
            <div className="loading-screen" id="debug-loading-screen">
                <div className="loading-spinner"></div>
                <h2>Finding community...</h2>
            </div>
        );
    }



    const handleCreateEvent = async () => {
        if (!isMod || !newEventData.title || !newEventData.startTime) return;
        try {
            await fetch(`${BASE_URL}/api/communities/${communityId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newEventData, createdBy: user._id })
            });
            setShowEventModal(false);
            setNewEventData({ title: '', description: '', startTime: '', type: 'general' });
        } catch (err) {
            console.error("Create event failed:", err);
        }
    };

    const handleRSVP = async (eventId) => {
        if (!isMember) return;
        try {
            await fetch(`${BASE_URL}/api/events/${eventId}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id })
            });
        } catch (err) {
            console.error("RSVP failed:", err);
        }
    };

    const handleSendGift = async (giftType, amount, frameType = null) => {
        if (!targetMember) return;
        try {
            const endpoint = giftType === 'tip' ? '/api/monetization/send-tip' : '/api/monetization/gift-frame';
            const body = {
                fromId: user._id,
                toId: targetMember._id || targetMember.id,
                amount,
                roomId: `community_${communityId}`,
                frameType,
                message: giftType === 'tip' ? `Enjoy this ${amount} VP tip! ❤️` : `Gifted you a ${frameType} frame!`
            };
            
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                setShowGiftModal(false);
                setTargetMember(null);
            }
        } catch (err) {
            console.error("Send gift failed:", err);
        }
    };

    const handleMintPass = async () => {
        if (!user._id || isMinting) return;
        setIsMinting(true);
        try {
            const res = await fetch(`${BASE_URL}/api/communities/${communityId}/mint-pass`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user._id })
            });
            const data = await res.json();
            if (data.success) {
                setHasVibePass(true);
                setShowMintModal(false);
                alert("Vibe Pass Minted! Welcome to the inner circle. 🎟️");
            }
        } catch {
            alert("Minting failed. Unstable connection to chain.");
        } finally {
            setIsMinting(false);
        }
    };

    const channels = [
        { id: 'general', name: 'general', type: 'text', icon: Hash },
        { id: 'announcements', name: 'announcements', type: 'text', icon: Bell },
        { id: 'events', name: 'upcoming-events', type: 'text', icon: Hash },
        { id: 'backstage', name: 'backstage-lounge', type: 'text', icon: Lock, isGated: true },
        ...(isMod ? [{ id: 'analytics', name: 'insights', type: 'analytics', icon: BarChart3 }] : [])
    ];

    const activeChannelObj = channels.find(c => c.id === activeChannel);
    const isGatedChannel = activeChannelObj?.isGated;

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
                    {channels.map(channel => {
                        const isLocked = channel.isGated && !hasVibePass && !isMod;
                        return (
                            <button 
                                key={channel.id}
                                className={`channel-btn ${activeChannel === channel.id ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                                onClick={() => {
                                    if (isLocked) {
                                        setShowMintModal(true);
                                    } else {
                                        setActiveChannel(channel.id);
                                    }
                                }}
                            >
                                <channel.icon size={20} className="channel-hash" />
                                <span className="channel-name">{channel.name}</span>
                                {isLocked && <Lock size={12} className="lock-tag" />}
                            </button>
                        );
                    })}

                    <div className="channel-group-label" style={{ marginTop: '20px' }}>Voice Channels</div>
                    <button 
                        className={`channel-btn voice-room-btn ${isInVoice ? 'active' : ''}`}
                        onClick={handleToggleVoice}
                    >
                        <Phone size={20} className="channel-hash" />
                        <span className="channel-name">Community Lounge</span>
                        {voiceParticipants.length > 0 && <span className="voice-count-badge">LIVE</span>}
                    </button>
                    {voiceParticipants.length > 0 && (
                        <div className="voice-participants-list">
                            {voiceParticipants.map(participant => (
                                <div key={participant} className="voice-participant-item animate-scale-in">
                                    <Avatar size={20} src={null} frame="neon" />
                                    <span className="participant-name">{participant}</span>
                                    <div className="speaking-indicator"></div>
                                </div>
                            ))}
                        </div>
                    )}
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
                    {activeChannel === 'analytics' ? (
                        <AnalyticsDashboard communityId={communityId} />
                    ) : activeChannel === 'events' ? (
                        <div className="events-calendar-view">
                            <div className="calendar-header">
                                <div className="header-info">
                                    <h2>Upcoming Vibes</h2>
                                    <p>Schedule your presence for community highlights</p>
                                </div>
                                {isMod && (
                                    <button className="create-event-btn" onClick={() => setShowEventModal(true)}>
                                        <Plus size={18} /> Schedule Event
                                    </button>
                                )}
                            </div>

                            <div className="events-grid">
                                {events.map(event => (
                                    <div key={event._id} className="event-card glass-panel animate-fade-in">
                                        <div className={`event-type-tag ${event.type}`}>
                                            {event.type === 'voice' ? <Phone size={14} /> : event.type === 'jukebox' ? <Music size={14} /> : <Users size={14} />}
                                            {event.type.toUpperCase()}
                                        </div>
                                        <div className="event-content">
                                            <h3>{event.title}</h3>
                                            <p className="event-desc">{event.description}</p>
                                            <div className="event-meta-info">
                                                <div className="meta-item">
                                                    <span className="meta-label">START</span>
                                                    <span className="meta-value">{new Date(event.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="meta-item">
                                                    <span className="meta-label">RSVPs</span>
                                                    <span className="meta-value">{event.rsvps?.length || 0}</span>
                                                </div>
                                            </div>
                                            <button 
                                                className={`rsvp-btn ${event.rsvps?.includes(user._id) ? 'active' : ''}`}
                                                onClick={() => handleRSVP(event._id)}
                                                disabled={!isMember}
                                            >
                                                {event.rsvps?.includes(user._id) ? 'Interested ✅' : 'Count me in!'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {events.length === 0 && (
                                    <div className="empty-events animate-fade-in">
                                        <Bell size={48} opacity={0.3} />
                                        <p>No upcoming events yet. Check back later!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (isGatedChannel && !hasVibePass && !isMod) ? (
                        <div className="locked-channel-overlay animate-fade-in">
                            <div className="lock-content">
                                <div className="lock-icon-wrapper">
                                    <Lock size={48} className="lock-main" />
                                    <div className="lock-glow"></div>
                                </div>
                                <h2>Exclusive Backstage Access</h2>
                                <p>This channel is reserved for <b>Vibe Pass</b> holders. Mint your pass to join the inner circle, chat with artists, and unlock premium community perks.</p>
                                <div className="mint-perks">
                                    <div className="perk"><Trophy size={14} /> Artist Q&As</div>
                                    <div className="perk"><Music size={14} /> Unreleased Tracks</div>
                                    <div className="perk"><Users size={14} /> Private Voice Rooms</div>
                                </div>
                                <button className="mint-action-btn" onClick={() => setShowMintModal(true)}>
                                    Mint Vibe Pass <span className="price-tag">500 VP</span>
                                </button>
                            </div>
                        </div>
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
                                        <button className="member-item-btn" title="Send Gift" onClick={() => { setTargetMember(memberData); setShowGiftModal(true); }}><Trophy size={14} className="member-gift-icon" /></button>
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

            {/* Event Creation Modal */}
            {showEventModal && (
                <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                    <div className="glass-panel event-create-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Schedule Community Event</h3>
                            <button onClick={() => setShowEventModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label>Event Title</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Weekly Lo-Fi Lounge"
                                    value={newEventData.title}
                                    onChange={(e) => setNewEventData({...newEventData, title: e.target.value})}
                                />
                            </div>
                            <div className="input-group">
                                <label>Description</label>
                                <textarea 
                                    placeholder="What's the vibe?"
                                    value={newEventData.description}
                                    onChange={(e) => setNewEventData({...newEventData, description: e.target.value})}
                                />
                            </div>
                            <div className="row">
                                <div className="input-group">
                                    <label>Type</label>
                                    <select 
                                        value={newEventData.type}
                                        onChange={(e) => setNewEventData({...newEventData, type: e.target.value})}
                                    >
                                        <option value="general">General</option>
                                        <option value="voice">Voice Lounge</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Start Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={newEventData.startTime}
                                        onChange={(e) => setNewEventData({...newEventData, startTime: e.target.value})}
                                    />
                                </div>
                            </div>
                            <button className="confirm-create-btn" onClick={handleCreateEvent}>
                                Launch Event
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Virtual Gifting Modal */}
            {showGiftModal && (
                <div className="modal-overlay" onClick={() => setShowGiftModal(false)}>
                    <div className="glass-panel gift-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{targetMember ? `Gift to ${targetMember.username}` : 'Community Love'}</h3>
                            <button onClick={() => setShowGiftModal(false)}>✕</button>
                        </div>
                        <div className="gift-options">
                            <div className="gift-section">
                                <label>Send Vibe Points</label>
                                <div className="gift-grid">
                                    {[50, 100, 500].map(amt => (
                                        <button key={amt} className="gift-select-btn" onClick={() => handleSendGift('tip', amt)}>
                                            <span className="amt">{amt} VP</span>
                                            <span className="desc">Support Vibe</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="gift-section">
                                <label>Premium Avatar Frames</label>
                                <div className="gift-grid">
                                    <button className="gift-select-btn gold" onClick={() => handleSendGift('frame', 1000, 'gold')}>
                                        <span className="amt">1,000 VP</span>
                                        <span className="desc">Gold Frame</span>
                                    </button>
                                    <button className="gift-select-btn neon" onClick={() => handleSendGift('frame', 500, 'neon')}>
                                        <span className="amt">500 VP</span>
                                        <span className="desc">Neon Pulse</span>
                                    </button>
                                    <button className="gift-select-btn holo" onClick={() => handleSendGift('frame', 2500, 'holographic')}>
                                        <span className="amt">2,500 VP</span>
                                        <span className="desc">Holo Cosmic</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Real-time Gift Overlay */}
            {activeGift && (
                <div className="gift-broadcast-overlay animate-slide-up">
                    <div className="gift-announcement">
                        <Trophy size={24} className="gift-icon-sparkle" />
                        <div className="gift-text">
                            <span className="gift-sender">{activeGift.data.from}</span>
                            <span className="gift-desc">
                                {activeGift.type === 'TIP_SENT' 
                                    ? `sent a ${activeGift.data.amount} VP tip!` 
                                    : `gifted a ${activeGift.data.frameType} frame!`}
                            </span>
                        </div>
                        <div className="gift-confetti"></div>
                    </div>
                </div>
            )}

            {/* Vibe Pass Minting Modal */}
            {showMintModal && (
                <div className="modal-overlay" onClick={() => setShowMintModal(false)}>
                    <div className="glass-panel mint-pass-modal" onClick={e => e.stopPropagation()}>
                        <div className="mint-pass-hero">
                            <div className="pass-visual-card animate-float">
                                <div className="logo-mini">STRIDE</div>
                                <div className="pass-type">VIBE PASS</div>
                                <div className="pass-id">#{Math.floor(Math.random() * 9999)}</div>
                            </div>
                            <div className="glow-effect"></div>
                        </div>
                        <div className="mint-pass-body">
                            <h3>Join the Inner Circle</h3>
                            <p>Unlock the <b>Backstage Lounge</b> and exclusive community events with a seasonal Vibe Pass.</p>
                            
                            <div className="benefits-list">
                                <div className="benefit-item">
                                    <div className="icon-circle"><Lock size={12} /></div>
                                    <span>Access to Gated Channels</span>
                                </div>
                                <div className="benefit-item">
                                    <div className="icon-circle"><Trophy size={12} /></div>
                                    <span>2x Vibe Multiplier</span>
                                </div>
                                <div className="benefit-item">
                                    <div className="icon-circle"><Music size={12} /></div>
                                    <span>Premium Profile Badge</span>
                                </div>
                            </div>

                            <button 
                                className="mint-action-btn" 
                                onClick={handleMintPass}
                                disabled={isMinting}
                            >
                                {isMinting ? 'Minting on Chain...' : 'Mint Pass (500 VP)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default CommunityView;


