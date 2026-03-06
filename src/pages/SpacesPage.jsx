import { useState, useEffect } from 'react';
import { Mic, MicOff, Hand, Users, Radio, Plus, X, Volume2, Crown, Heart, Gem, Rocket, Trophy } from 'lucide-react';
import GiftAnimation from '../components/chat/GiftAnimation';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { useVoice } from '../context/VoiceContext';
import config from '../config';
import './SpacesPage.css';

const SpacesPage = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showToast } = useToast();
    const { joinVoiceChannel, leaveVoiceChannel, toggleListener, isListener } = useVoice();
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSpace, setActiveSpace] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [handRaised, setHandRaised] = useState(false);
    const [activeGift, setActiveGift] = useState(null);
    const [showGifts, setShowGifts] = useState(false);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchSpaces = async () => {
        try {
            const res = await fetch(`${config.API_URL}/api/spaces/active`, { headers });
            const data = await res.json();
            setSpaces(Array.isArray(data) ? data : []);
        } catch (e) {
            setSpaces([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpaces();
        const interval = setInterval(fetchSpaces, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleUpdate = (space) => {
            setSpaces(prev => prev.map(s => s._id === space._id ? space : s));
            if (activeSpace?._id === space._id) setActiveSpace(space);
        };
        const handleCreated = (space) => setSpaces(prev => [space, ...prev]);
        const handleEnded = ({ id }) => {
            setSpaces(prev => prev.filter(s => s._id !== id));
            if (activeSpace?._id === id) { setActiveSpace(null); showToast('Space ended', 'info'); }
        };
        socket.on('space-updated', handleUpdate);
        socket.on('space-created', handleCreated);
        socket.on('space-ended', handleEnded);
        socket.on('gift_sent', (data) => {
            if (data.spaceId === activeSpace?._id) {
                setActiveGift(data);
            }
        });
        return () => {
            socket.off('space-updated', handleUpdate);
            socket.off('space-created', handleCreated);
            socket.off('space-ended', handleEnded);
            socket.off('gift_sent');
        };
    }, [socket, activeSpace]);

    const createSpace = async () => {
        if (!newTitle.trim()) return;
        try {
            const res = await fetch(`${config.API_URL}/api/spaces`, { method: 'POST', headers, body: JSON.stringify({ title: newTitle }) });
            const space = await res.json();
            setActiveSpace(space);
            setShowCreate(false);
            setNewTitle('');

            // Join voice as host (not listener)
            await joinVoiceChannel(space._id, false);

            showToast('Space started! 🎙️', 'success');
        } catch (e) { showToast('Failed to create space', 'error'); }
    };

    const joinSpace = async (space) => {
        try {
            const res = await fetch(`${config.API_URL}/api/spaces/${space._id}/join`, { method: 'POST', headers });
            const updated = await res.json();
            setActiveSpace(updated);

            // Join voice as listener initially
            await joinVoiceChannel(space._id, true);
        } catch (e) { showToast('Failed to join space', 'error'); }
    };

    const leaveSpace = async () => {
        if (!activeSpace) return;
        await fetch(`${config.API_URL}/api/spaces/${activeSpace._id}/leave`, { method: 'POST', headers });
        setActiveSpace(null);
        setHandRaised(false);

        // Leave voice
        leaveVoiceChannel();

        showToast('Left space', 'info');
    };

    const toggleHand = async () => {
        if (!activeSpace) return;
        const res = await fetch(`${config.API_URL}/api/spaces/${activeSpace._id}/hand`, { method: 'PATCH', headers });
        const data = await res.json();
        setHandRaised(data.raised);
        showToast(data.raised ? '✋ Hand raised!' : 'Hand lowered', 'info');
    };

    const approveAspirant = async (speakerEmail) => {
        await fetch(`${config.API_URL}/api/spaces/${activeSpace._id}/approve`, { method: 'PATCH', headers, body: JSON.stringify({ speakerEmail }) });
    };

    const sendGift = async (giftType) => {
        try {
            const res = await fetch(`${config.API_URL}/api/creator/gift`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    recipientEmail: activeSpace.hostEmail,
                    giftType,
                    spaceId: activeSpace._id
                })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`Sent ${giftType}! 🎁`, 'success');
                setShowGifts(false);
            } else {
                showToast(data.error || 'Failed to send gift', 'error');
            }
        } catch (e) {
            showToast('Gifting error', 'error');
        }
    };

    const endSpace = async () => {
        if (!activeSpace) return;
        await fetch(`${config.API_URL}/api/spaces/${activeSpace._id}`, { method: 'DELETE', headers });
        setActiveSpace(null);

        // Leave voice
        leaveVoiceChannel();

        showToast('Space ended', 'success');
    };

    // Effect to handle being promoted to speaker
    useEffect(() => {
        if (activeSpace && isListener && activeSpace.speakers.some(s => s.email === user?.email)) {
            showToast('You are now a speaker! 🎙️', 'success');
            toggleListener(); // Transition from listener to speaker in P2P mesh
        }
    }, [activeSpace?.speakers, isListener, user?.email]);

    const isHost = activeSpace?.hostEmail === user?.email;
    const isSpeaker = activeSpace?.speakers?.some(s => s.email === user?.email);

    return (
        <div className="spaces-page">
            {/* Live Room View */}
            {activeSpace ? (
                <div className="space-room glass-card">
                    <div className="space-room-header">
                        <div className="space-live-badge"><Radio size={14} /> LIVE</div>
                        <h2>{activeSpace.title}</h2>
                        <p className="space-host-line">Hosted by <strong>{activeSpace.hostUsername}</strong></p>
                    </div>

                    {/* Speakers */}
                    <div className="speakers-grid">
                        {activeSpace.speakers?.map(s => (
                            <div key={s.email} className="speaker-avatar-wrap">
                                <div className={`speaker-ring ${s.isSpeaking ? 'is-speaking' : ''}`}>
                                    <img src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.username}`} alt={s.username} className="speaker-img" />
                                    {s.email === activeSpace.hostEmail && <div className="host-crown"><Crown size={12} /></div>}
                                </div>
                                <span className="speaker-name">{s.username}</span>
                                <Mic size={14} className="speaker-mic" />
                            </div>
                        ))}
                    </div>

                    {/* Hand Raises (host only) */}
                    {isHost && activeSpace.handRaises?.length > 0 && (
                        <div className="hand-raises-panel glass-card">
                            <p className="panel-label">✋ Wants to speak</p>
                            {activeSpace.handRaises.map(u => (
                                <div key={u.email} className="hand-raise-row">
                                    <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="" />
                                    <span>{u.username}</span>
                                    <button className="approve-btn" onClick={() => approveAspirant(u.email)}>Invite to speak</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Listeners */}
                    <div className="listeners-row">
                        <Users size={14} /> <span>{activeSpace.listeners?.length || 0} listening</span>
                    </div>

                    {/* Controls */}
                    <div className="space-controls">
                        {!isSpeaker && (
                            <button className={`space-ctrl-btn ${handRaised ? 'raised' : ''}`} onClick={toggleHand}>
                                <Hand size={20} /> {handRaised ? 'Lower Hand' : 'Raise Hand'}
                            </button>
                        )}

                        <div className="gift-control-wrap">
                            <button className="space-ctrl-btn gift-btn" onClick={() => setShowGifts(!showGifts)}>
                                <Heart size={20} /> Gift
                            </button>
                            {showGifts && (
                                <div className="gift-picker glass-card animate-in">
                                    <button onClick={() => sendGift('heart')} title="Heart (10 🪙)"><Heart size={18} /> 10</button>
                                    <button onClick={() => sendGift('diamond')} title="Diamond (100 🪙)"><Gem size={18} /> 100</button>
                                    <button onClick={() => sendGift('rocket')} title="Rocket (500 🪙)"><Rocket size={18} /> 500</button>
                                    <button onClick={() => sendGift('trophy')} title="Trophy (1000 🪙)"><Trophy size={18} /> 1k</button>
                                </div>
                            )}
                        </div>

                        {isHost ? (
                            <button className="space-ctrl-btn danger" onClick={endSpace}>End Space</button>
                        ) : (
                            <button className="space-ctrl-btn" onClick={leaveSpace}>Leave</button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Spaces List */}
                    <div className="spaces-header">
                        <div>
                            <h1>🎙️ Spaces</h1>
                            <p>Live audio rooms — anyone can listen, raise hand to speak</p>
                        </div>
                        <button className="create-space-btn gradient-btn" onClick={() => setShowCreate(true)}>
                            <Plus size={16} /> Start a Space
                        </button>
                    </div>

                    {showCreate && (
                        <div className="create-space-panel glass-card">
                            <input
                                autoFocus
                                className="space-title-input"
                                placeholder="What do you want to talk about?"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && createSpace()}
                            />
                            <div className="create-space-actions">
                                <button className="space-ctrl-btn" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button className="create-space-btn gradient-btn" onClick={createSpace}>Go Live 🎙️</button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="spaces-loading">
                            {[1, 2, 3].map(i => <div key={i} className="space-card-skeleton skeleton-block" />)}
                        </div>
                    ) : spaces.length === 0 ? (
                        <div className="spaces-empty">
                            <Volume2 size={48} />
                            <h3>No active Spaces</h3>
                            <p>Start one! Your community is waiting.</p>
                        </div>
                    ) : (
                        <div className="spaces-list">
                            {spaces.map(space => (
                                <div key={space._id} className="space-card glass-card" onClick={() => joinSpace(space)}>
                                    <div className="space-card-top">
                                        <div className="space-live-badge sm"><Radio size={10} /> LIVE</div>
                                        <span className="space-listeners-count"><Users size={12} /> {(space.listeners?.length || 0) + (space.speakers?.length || 0)}</span>
                                    </div>
                                    <h3 className="space-card-title">{space.title}</h3>
                                    <div className="space-card-speakers">
                                        {space.speakers?.slice(0, 4).map(s => (
                                            <img key={s.email} src={s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.username}`} alt={s.username} className="space-speaker-pip" />
                                        ))}
                                        <span className="space-host-tag">by {space.hostUsername}</span>
                                    </div>
                                    <button className="join-space-btn">Join Space →</button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeGift && (
                <GiftAnimation
                    type={activeGift.giftType}
                    sender={activeGift.sender}
                    recipient={activeGift.recipient}
                    onComplete={() => setActiveGift(null)}
                />
            )}
        </div>
    );
};

export default SpacesPage;
