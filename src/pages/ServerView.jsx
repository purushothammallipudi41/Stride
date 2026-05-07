import { useState, useEffect, useMemo } from 'react';
import SEO from '../components/common/SEO';
import { useParams, useNavigate } from 'react-router-dom';
import { useServer } from '../hooks/useServer';
import { useActivity } from '../hooks/useActivity';
import { useContext } from 'react';
import MusicContextObject from '../context/MusicContextObject';
import { useUI } from '../hooks/useUI';


import { Hash, Settings, Bell, Search, Menu, Users, Music, Plus, Play, MoreVertical, Volume2, Trophy, History, BarChart3, ChevronLeft, ChevronRight, Phone, Video, Lock, MessageSquare, Sparkles, Gavel, Zap, Clock, X } from 'lucide-react';
import ChatWindow from '../components/chat/ChatWindow';
import VibePulse from '../components/chat/VibePulse';
import CommunityBoard from '../components/community/CommunityBoard';
import AnalyticsDashboard from '../components/content/AnalyticsDashboard';
import TrackCard from '../components/chat/TrackCard';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Avatar from '../components/common/Avatar';
import socket from '../services/socket';
import VoiceService from '../services/VoiceService';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import NodeShiftModal from '../components/community/NodeShiftModal';
import ModToolsModal from '../components/community/ModToolsModal';
import MemberProfileModal from '../components/community/MemberProfileModal';
import CommunityActionsModal from '../components/community/CommunityActionsModal';
import './ServerView.css';
import '../components/community/NodeShiftModal.css';

const voiceService = new VoiceService(socket);

const CommunityView = () => {
    const { communityId, channelId } = useParams();
    const navigate = useNavigate();
    const { servers, setServers, updateMemberRole, kickMember } = useServer();
    const user = getStoredUser();
    const { addNotification, liveInfo, setLiveInfo, isCreateModalOpen, openCreateModal, closeCreateModal } = useUI();
    const { isUserListening } = useActivity();
    const { joinMusicRoom, leaveMusicRoom } = useContext(MusicContextObject);

    // --- State Initialization ---
    const [activeChannel, setActiveChannel] = useState(channelId || 'general');
    const [showModTools, setShowModTools] = useState(false);
    const [channelMessages, setChannelMessages] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showMemberSidebar, setShowMemberSidebar] = useState(window.innerWidth > 900);
    const [isChannelSidebarOpen, setIsChannelSidebarOpen] = useState(false);
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
    const [showPulse, setShowPulse] = useState(false);
    const [pulseData, setPulseData] = useState(null);
    const [localProposals, setLocalProposals] = useState([]);
    const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
    const [isLoadingGov, setIsLoadingGov] = useState(false);
    const [currentAccent, setCurrentAccent] = useState(null);
    const [newEventData, setNewEventData] = useState({ title: '', description: '', startTime: '', type: 'general' });
    const [sidebarTab, setSidebarTab] = useState('members');
    const [selectedMember, setSelectedMember] = useState(null);
    const [showCommunityActions, setShowCommunityActions] = useState(false);

    // --- Core Calculations ---
    const communityIdTarget = String(communityId);
    const community = useMemo(() => {
        if (!servers || servers.length === 0) return null;
        return servers.find(s => 
            String(s._id) === communityIdTarget || 
            (s.id && String(s.id) === communityIdTarget) || 
            (s.name && (s.name === communityId || s.name.toLowerCase().replace(/\s+/g, '-') === communityId))
        );
    }, [servers, communityIdTarget, communityId]);

    const isMember = useMemo(() => {
        if (!user?._id || !community) return false;
        
        // Owners and Admins are always members for functional gating
        const isOwner = (community.owner === user._id || (community.owner?._id && community.owner._id === user._id));
        const isAdmin = user.username === 'admin' || user.username === 'purushotham_m';
        
        if (isOwner || isAdmin) return true;
        
        if (!community.members) return false;
        const memberIds = community.members.map(m => String(m._id || m));
        return memberIds.includes(String(user._id));
    }, [user, community]);

    const userRole = useMemo(() => {
        const roleInList = community?.roles?.find(r => r.user === user?.username)?.role;
        if (roleInList) return roleInList;
        return (community?.owner === user?._id || (community?.owner?._id && community?.owner?._id === user?._id)) ? 'owner' : 'member';
    }, [community, user]);

    const isMod = userRole === 'owner' || userRole === 'mod' || user?.username === 'admin' || user?.username === 'purushotham_m';

    const handleModAction = (type, member) => {
        const mUsername = member.username || member.name;
        if (type === 'kick') {
            handleKick(member._id || member.id || member.userId);
            setSelectedMember(null);
        } else if (type === 'ban') {
            addNotification({ title: 'Gavel Dropped', message: `Banning ${mUsername}...`, type: 'info' });
            setSelectedMember(null);
        } else if (type === 'manage') {
            setShowModTools(true);
            setSelectedMember(null);
        } else if (type === 'gift') {
            setTargetMember({ ...member, username: mUsername });
            setShowGiftModal(true);
            setSelectedMember(null);
        }
    };

    // --- Social Handlers ---
    const handleStartCall = (member, type = 'video') => {
        if (!member?.username || member.username === user.username) return;
        
        addNotification({
            title: `Initializing ${type === 'video' ? 'Visual' : 'Audio'} Sync`,
            message: `Attempting to establish a peer-to-peer nexus with ${member?.username || 'user'}...`,
            type: 'info'
        });

        socket.emit('start-direct-call', {
            username: member.username,
            name: member.name || member.username,
            type
        });
    };

    const handleSendGift = async (giftType, amount, frameType = null) => {
        if (!targetMember) return;
        try {
            // Optimistic feedback & logging
            console.log(`[SOCIAL] Dispatching ${giftType} to ${targetMember.username}`);

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
            
            if (data.success || res.status === 200) {
                addNotification({
                    title: 'Gift Transmitted',
                    message: `Successfully sent ${amount} STRD to ${targetMember.username}.`,
                    type: 'success'
                });
                setShowGiftModal(false);
                setTargetMember(null);
            }
        } catch (err) {
            console.error("Send gift failed:", err);
            addNotification({ title: 'Gifting Nexus Offline', message: 'Unable to process gift. Re-syncing wallet...', type: 'error' });
        }
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

    const handleUpdateCommunity = (updated) => {
        // Real-time local shift
        setServers(prev => prev.map(s => String(s._id) === String(updated._id) ? updated : s));
        if (updated.accentColor) setCurrentAccent(updated.accentColor);
        addNotification({ title: 'Shift Confirmed', message: 'Community sovereignty metadata updated.', type: 'success' });
    };

    const handleCopyInvite = () => {
        const inviteLink = `${window.location.origin}/community/${communityId}`;
        navigator.clipboard.writeText(inviteLink);
        addNotification({ title: 'Nexus Link', message: 'Invite link copied to clipboard!', type: 'success' });
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(communityId);
        addNotification({ title: 'System Identifier', message: 'Server ID copied to clipboard.', type: 'info' });
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
            // CRITICAL: Filter out our own messages to prevent duplication (Optimistic UI handle it)
            if (msg.username === user.username) return;

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

        socket.on('community_update', (data) => {
            if (String(data.id) === String(community?._id || communityId)) {
                if (data.accentColor) setCurrentAccent(data.accentColor);
                addNotification({ 
                    title: 'Sovereignty Shift', 
                    message: 'Community node settings have been updated in real-time.', 
                    type: 'info' 
                });
            }
        });

        socket.on('governance_update', (data) => {
            setLocalProposals(prev => prev.map(p => p._id === data.proposalId ? { ...p, totalWeight: data.totalWeight, status: data.status || p.status } : p));
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
             socket.off('community_update');
             socket.off('governance_update');
             voiceService.stopLocalStream();
        };
    }, [communityId, activeChannel, community?._id, isInVoice, joinMusicRoom, leaveMusicRoom, user._id, user.username, addNotification]);

    useEffect(() => {
        if (activeChannel === 'governance' && community?._id) {
            const fetchLocalProposals = async () => {
                setIsLoadingGov(true);
                try {
                    const res = await fetch(`${BASE_URL}/api/governance/proposals?communityId=${community._id}`);
                    const data = await res.json();
                    setLocalProposals(data);
                } catch (err) {
                    console.error("Failed to sync node governance:", err);
                } finally {
                    setIsLoadingGov(false);
                }
            };
            fetchLocalProposals();
        }
    }, [activeChannel, community?._id]);

    const handleNodeVote = async (proposalId, optionLabel) => {
        try {
            const res = await fetch(`${BASE_URL}/api/governance/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-username': user.username
                },
                body: JSON.stringify({ proposalId, optionLabel })
            });
            const data = await res.json();
            if (data.success) {
                setLocalProposals(prev => prev.map(p => p._id === proposalId ? data.proposal : p));
                addNotification({ title: 'Vote Counted', message: `Contributed ${data.weight} Weight to node shift.`, type: 'success' });
            } else {
                addNotification({ title: 'Error', message: data.error, type: 'error' });
            }
        } catch (err) {
            console.error("Voting failed:", err);
        }
    };

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

    const handleGoLive = () => {
        if (!isMod) return;
        socket.emit('start_live_stream', { username: user.username, communityId: community._id || community.id });
        setLiveInfo({ 
            isOpen: true, 
            streamerName: user.username, 
            communityName: community.name, 
            streamId: `stream_${user.username}` 
        });
        addNotification({ title: 'Live Now!', message: 'Your community broadcast has started.', type: 'success' });
    };

    const handleFetchPulse = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/communities/${community._id}/pulse`);
            const data = await res.json();
            setPulseData(data);
            setShowPulse(true);
        } catch (err) {
            console.error("Pulse fetch failed:", err);
            addNotification({ title: 'Pulse Error', message: 'Intelligence recalibrating. Try again soon.', type: 'info' });
        }
    };

    const handleStopLive = () => {
        socket.emit('stop_live_stream', { username: user.username, communityId: community._id || community.id });
        setLiveInfo({ isOpen: false, streamerName: '', communityName: '', streamId: '' });
    };

    const channels = [
        { id: 'general', name: 'general', type: 'text', icon: Hash },
        { id: 'announcements', name: 'announcements', type: 'text', icon: Bell },
        { id: 'jukebox', name: 'jukebox', type: 'text', icon: Music },
        { id: 'board', name: 'discussion-board', type: 'text', icon: MessageSquare },
        { id: 'governance', name: 'node-sovereignty', type: 'governance', icon: Gavel },
        { id: 'events', name: 'upcoming-events', type: 'text', icon: Hash },
        { id: 'backstage', name: 'backstage-lounge', type: 'text', icon: Lock, isGated: true },
        ...(isMod ? [{ id: 'analytics', name: 'insights', type: 'analytics', icon: BarChart3 }] : [])
    ];

    const activeChannelObj = channels.find(c => c.id === activeChannel);
    const isGatedChannel = activeChannelObj?.isGated;

    const brandStyle = {
        '--color-primary': currentAccent || community?.accentColor || '#0066ff',
        '--color-primary-glow': (currentAccent || community?.accentColor || '#0066ff') + '44',
        '--color-accent': currentAccent || community?.accentColor || '#d946ef',
    };

    return (
        <div className="discord-layout animate-fade-in" style={brandStyle}>
            <SEO 
                title={community?.name || 'Community'} 
                description={`Join the ${community?.name} community on Vyx. Connect with fellow listeners and vibers.`} 
            />
            {/* Mobile Interaction Shroud */}
            {(isChannelSidebarOpen || (showMemberSidebar && window.innerWidth < 1100)) && (
                <div className="mobile-dimmer" onClick={() => { setIsChannelSidebarOpen(false); if(window.innerWidth < 1100) setShowMemberSidebar(false); }} />
            )}

            {/* 1. Channel Sidebar (Discord-style) */}
            <div className={`channel-sidebar ${isChannelSidebarOpen ? 'mobile-show' : ''}`}>
                <header className="server-header">
                    <button className="server-back-btn" onClick={(e) => { e.stopPropagation(); navigate('/explore'); }} title="Back to Explore" aria-label="Back to Explore">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="server-name">{community.name}</h2>
                    <div className="server-header-actions">
                        <Settings size={18} className="icon-btn" onClick={() => setShowModTools(true)} aria-label="Community Settings" />
                        <Plus size={18} className="icon-btn" onClick={(e) => { e.stopPropagation(); openCreateModal('COMMUNITY'); }} title="Establish New Node" />
                        <MoreVertical size={18} opacity={0.6} className="icon-btn" onClick={(e) => { e.stopPropagation(); handleCopyInvite(); }} aria-label="Copy Invite Link" />
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
            <div className="main-chat-area" onClick={() => { if(isChannelSidebarOpen) setIsChannelSidebarOpen(false); if(showMemberSidebar && window.innerWidth < 900) setShowMemberSidebar(false); }}>
                <header className="chat-header">
                    <div className="header-left">
                        <button className="mobile-nav-toggle" onClick={() => setIsChannelSidebarOpen(!isChannelSidebarOpen)}>
                            <Menu size={20} />
                        </button>
                        {activeChannelObj?.icon && <activeChannelObj.icon size={24} className="icon-muted" />}
                        <h3>{activeChannelObj?.name}</h3>
                    </div>
                    <div className="header-right">
                        <button className="vibe-pulse-trigger-btn" onClick={handleFetchPulse} title="Catch Up with AI Pulse">
                            <Sparkles size={18} /> <span>Vibe Pulse</span>
                        </button>
                        {isMod && (
                            <button className="go-live-action-btn" onClick={handleGoLive}>
                                <Video size={18} /> <span>Go Live</span>
                            </button>
                        )}
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
                    ) : activeChannel === 'jukebox' ? (
                        <div className="jukebox-viewer animate-fade-in" style={{ padding: '24px' }}>
                            <div className="jukebox-sync-indicator" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: 'var(--color-primary)' }}>
                                <Music size={24} className="pulse-icon" />
                                <h3>Jukebox Sync LIVE</h3>
                            </div>
                            <ChatWindow 
                                activeChat={{ 
                                    username: 'Jukebox', 
                                    name: 'Jukebox',
                                    avatar: '', 
                                    messages: channelMessages[`community_${communityId}_jukebox`] || [
                                        { text: `Welcome to the Jukebox! Request tracks and vibe with the community.`, time: 'System', username: 'System' }
                                    ] 
                                }} 
                                roomId={`community_${communityId}_jukebox`}
                                currentUser={user.username}
                                onSendMessage={handleSendMessage}
                                isDisabled={!isMember}
                                hideCallButtons={true}
                            />
                        </div>
                    ) : activeChannel === 'board' ? (
                        <CommunityBoard communityId={communityId} user={user} isMember={isMember} />
                    ) : activeChannel === 'governance' ? (
                        <div className="node-governance-view animate-fade-in" style={{ padding: '24px' }}>
                            <div className="node-gov-header">
                                <div className="text-content">
                                    <h2>Node Sovereignty</h2>
                                    <p>Local governance for {community?.name}. Your Vibe Weight applies here.</p>
                                </div>
                                {isMod && (
                                    <button className="initiate-shift-btn" onClick={() => setIsNodeModalOpen(true)}>
                                        <Plus size={18} /> Initiate Shift
                                    </button>
                                )}
                            </div>

                            <div className="node-proposals-grid" style={{ marginTop: '32px' }}>
                                {isLoadingGov ? (
                                    <div className="loading-gov flex-center" style={{ padding: '60px' }}>
                                        <div className="gov-spinner pulse-icon"><Gavel size={32} /></div>
                                        <p>Checking sentiment nexus...</p>
                                    </div>
                                ) : localProposals.length > 0 ? (
                                    localProposals.map(proposal => (
                                        <div key={proposal._id} className={`node-proposal-card glass-panel ${proposal.status}`}>
                                            <div className="p-header">
                                                <span className="p-status-tag">{proposal.status === 'active' ? 'ACTIVE' : 'PASSED'}</span>
                                                {proposal.status === 'active' && (
                                                    <span className="p-time-tag"><Clock size={12} /> 3d left</span>
                                                )}
                                            </div>
                                            <h3>{proposal.title}</h3>
                                            <p>{proposal.description}</p>
                                            
                                            <div className="p-options">
                                                {proposal.options.map((opt, i) => {
                                                    const percentage = proposal.totalWeight > 0 ? (opt.votes / proposal.totalWeight) * 100 : 0;
                                                    const isVoted = proposal.voters?.some(v => v.username === user.username && v.option === opt.label);
                                                    
                                                    return (
                                                        <button 
                                                            key={i} 
                                                            className={`p-opt-btn ${isVoted ? 'voted' : ''}`}
                                                            onClick={() => proposal.status === 'active' && !isVoted && handleNodeVote(proposal._id, opt.label)}
                                                        >
                                                            <div className="p-opt-info">
                                                                <span>{opt.label}</span>
                                                                <span>{percentage.toFixed(0)}%</span>
                                                            </div>
                                                            <div className="p-opt-progress">
                                                                <div className="p-opt-fill" style={{ width: `${percentage}%` }}></div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            
                                            <div className="p-footer">
                                                <div className="weight-cast">
                                                    <Zap size={12} /> {proposal.totalWeight?.toLocaleString()} weight
                                                </div>
                                                {proposal.status === 'active' && (
                                                    <div className="quorum-meter">
                                                        <span>Quorum: {((proposal.totalWeight / proposal.quorum) * 100).toFixed(0)}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-gov glass-panel" style={{ padding: '60px', textAlign: 'center', opacity: 0.7 }}>
                                        <Sparkles size={48} style={{ marginBottom: '16px', color: 'var(--color-primary)' }} />
                                        <h3>The Node is Stable</h3>
                                        <p>No active shifts pending. Community sentiment is currently at equilibrium.</p>
                                        {isMod && (
                                            <button className="mint-action-btn" onClick={() => setIsNodeModalOpen(true)} style={{ marginTop: '20px' }}>
                                                Initiate First Shift
                                            </button>
                                        )}
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
                            communityStats={{
                                memberCount: community.members?.length || 0,
                                activeProposals: localProposals.filter(p => p.status === 'active').length
                            }}
                        />
                    )}
                </div>
            </div>

             {/* 3. Member List (Right Sidebar) — Redesigned */}
            {showMemberSidebar && (
                <div className={`member-sidebar ${window.innerWidth < 900 ? 'mobile-show' : ''}`} style={{ padding: 0 }}>
                    {/* Sidebar Header & Tabs */}
                    <div className="member-sidebar-top-meta">
                        <h4 className="sidebar-channel-title">
                            <Hash size={18} style={{ color: community?.accentColor }} />
                            {activeChannelObj?.name || 'chat'}
                        </h4>
                        <span className="sidebar-channel-subtitle">Text Channel</span>
                    </div>

                    <div className="member-sidebar-tabs">
                        {[
                            { id: 'members', label: 'Vibes' },
                            { id: 'media', label: 'Media' },
                            { id: 'threads', label: 'Threads' },
                            { id: 'links', label: 'Links' }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                className={`sidebar-tab-btn ${sidebarTab === tab.id ? 'active' : ''}`}
                                onClick={() => setSidebarTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="members-scrollbox" style={{ padding: '0 0 100px 0' }}>
                        {sidebarTab === 'members' && (
                            <>
                                <div className="invite-members-card" onClick={() => {
                                    const inviteLink = `${window.location.origin}/community/${communityId}`;
                                    navigator.clipboard.writeText(inviteLink);
                                    addNotification({ title: 'Nexus Link', message: 'Invite link copied to clipboard!', type: 'success' });
                                }}>
                                    <div className="invite-card-left">
                                        <div className="invite-icon-box"><Plus size={20} /></div>
                                        <span>Invite Members</span>
                                    </div>
                                    <ChevronRight size={16} opacity={0.3} />
                                </div>

                                {(() => {
                                    const allMembers = community.members_list || community.members || [];
                                    const filtered = allMembers.filter(m => {
                                        const username = typeof m === 'object' ? (m.username || m.name) : m;
                                        return username?.toLowerCase().includes(searchTerm.toLowerCase());
                                    });

                                    const groups = {
                                        admins: filtered.filter(m => {
                                            const role = community.roles?.find(r => r.user === (m.username || m.name))?.role;
                                            return role === 'owner' || role === 'mod' || community.owner === (m._id || m.id || m);
                                        }),
                                        members: filtered.filter(m => {
                                            const role = community.roles?.find(r => r.user === (m.username || m.name))?.role;
                                            return !['owner', 'mod'].includes(role) && community.owner !== (m._id || m.id || m);
                                        })
                                    };

                                    return (
                                        <>
                                            {groups.admins.length > 0 && (
                                                <div className="member-group-container">
                                                    <div className="member-group-label" style={{ marginTop: '16px' }}>Admins — {groups.admins.length}</div>
                                                    {groups.admins.map((m, i) => (
                                                        <MemberItem key={`admin-${i}`} member={m} onClick={setSelectedMember} isUserListening={isUserListening} currentUser={user.username} />
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="member-group-container">
                                                <div className="member-group-label" style={{ marginTop: '24px' }}>Members — {groups.members.length}</div>
                                                {groups.members.map((m, i) => (
                                                    <MemberItem key={`member-${i}`} member={m} onClick={setSelectedMember} isUserListening={isUserListening} currentUser={user.username} />
                                                ))}
                                            </div>

                                            <div className="member-group-label" style={{ marginTop: '24px', opacity: 0.4 }}>Spectral (Offline) — 33</div>
                                        </>
                                    );
                                })()}
                            </>
                        )}

                        {sidebarTab !== 'members' && (
                            <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.5 }}>
                                <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.05)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    {sidebarTab === 'media' ? <Camera size={24} /> : sidebarTab === 'threads' ? <MessageSquare size={24} /> : <Hash size={24} />}
                                </div>
                                <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>No {sidebarTab} yet</h3>
                                <p style={{ fontSize: '0.8rem' }}>Be the first to share something with the frequency.</p>
                            </div>
                        )}
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
                                <div className="logo-mini">VYX</div>
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
            {showPulse && <VibePulse pulseData={pulseData} onClose={() => setShowPulse(false)} />}

            {/* Global Modals */}
            {showGiftModal && targetMember && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card animate-scale-in" style={{ maxWidth: '400px', padding: '30px', textAlign: 'center' }}>
                        <div className="title-with-icon" style={{ justifyContent: 'center', marginBottom: '15px' }}>
                            <Trophy className="text-vyx-primary" size={24} />
                            <h2 style={{ margin: 0 }}>Gift for {targetMember.username}</h2>
                        </div>
                        <p style={{ opacity: 0.7, marginBottom: '25px', fontSize: '0.9rem' }}>Select a balance amount to gift from your Vyx wallet.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                            <button className="vyx-gift-select-premium" onClick={() => handleSendGift('tip', 100)}>
                                <span className="amt">100</span>
                                <span className="currency">STRD</span>
                            </button>
                            <button className="vyx-gift-select-premium gold" onClick={() => handleSendGift('tip', 500)}>
                                <span className="amt">500</span>
                                <span className="currency">STRD</span>
                            </button>
                        </div>
                        <button className="create-event-btn" onClick={() => setShowGiftModal(false)} style={{ width: '100%', padding: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            
            <NodeShiftModal 
                isOpen={isNodeModalOpen} 
                onClose={() => setIsNodeModalOpen(false)} 
                communityId={community?._id || communityId}
                currentAccent={currentAccent || community?.accentColor}
                availableChannels={channels.filter(c => c.type === 'text')}
                onProposalCreated={(newProposal) => {
                    setLocalProposals(prev => [newProposal, ...prev]);
                    setIsNodeModalOpen(false);
                    addNotification({ title: 'Shift Initiated', message: 'A new sovereignty proposal is now live for voting.', type: 'success' });
                }}
            />

            <ModToolsModal 
                isOpen={showModTools}
                onClose={() => setShowModTools(false)}
                community={community}
                onUpdate={handleUpdateCommunity}
            />

            <MemberProfileModal 
                isOpen={!!selectedMember}
                onClose={() => setSelectedMember(null)}
                member={selectedMember}
                isMod={isMod}
                onModAction={handleModAction}
                communityAccent={community?.accentColor}
            />

            <CommunityActionsModal 
                isOpen={showCommunityActions}
                onClose={() => setShowCommunityActions(false)}
                community={community}
                isMod={isMod}
                onOpenSettings={() => { setShowCommunityActions(false); setShowModTools(true); }}
                onCopyId={handleCopyId}
                onTogglePreference={(key, value) => {
                    console.log(`[UI-BRIDGE] Preference Shift: ${key} -> ${value}`);
                    const updated = { 
                        ...community, 
                        prefs: { ...(community.prefs || {}), [key]: value } 
                    };
                    handleUpdateCommunity(updated);
                }}
            />
        </div>
    );
};

// --- Helper Components ---
const MemberItem = ({ member, onClick, isUserListening, currentUser }) => {
    const memberData = typeof member === 'object' ? member : { username: member, avatar: 'U', avatarFrame: 'none' };
    const mUsername = memberData.username || memberData.name || 'Member';
    const isMe = mUsername === currentUser;

    return (
        <div className="member-item" onClick={() => onClick(memberData)} style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <div className="member-avatar-wrapper">
                <Avatar 
                    src={memberData.avatar || mUsername[0]} 
                    size={32} 
                    frame={memberData.avatarFrame || 'none'}
                    isListening={isUserListening && isUserListening(mUsername)}
                />
                <div className="status-indicator online"></div>
            </div>
            <span className="member-name">
                {mUsername}
                {((mUsername.length) % 3 === 0) && (
                    <span className="vibe-streak-badge" title="Vibe Streak">
                        🔥 {(mUsername.length) % 7 + 1}
                    </span>
                )}
            </span>
        </div>
    );
};


export default CommunityView;


