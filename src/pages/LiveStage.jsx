import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Users, MessageCircle, Heart, Share2, Music, Zap, BadgeCheck, FireExtinguisher as Fire } from 'lucide-react';
import socket from '../services/socket';
import { BASE_URL } from '../utils/api';
import { getStoredUser } from '../utils/storage';
import Avatar from '../components/common/Avatar';
import './LiveStage.css';

const LiveStage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const user = getStoredUser();
    
    const [streamData, setStreamData] = useState(null);
    const [viewers, setViewers] = useState(0);
    const [stageMembers, setStageMembers] = useState([]);
    const [comments, setComments] = useState([]);
    const [reactions, setReactions] = useState([]);
    const [commentInput, setCommentInput] = useState('');
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [isConfirmingEnd, setIsConfirmingEnd] = useState(false);
    const localVideoRef = useRef(null);
    const chatEndRef = useRef(null);
    const isOwnStream = user?.username === username;

    const handleEndStream = async () => {
        if (!isOwnStream) return;
        
        try {
            // Update backend - use standardized studio endpoint
            await fetch(`${BASE_URL}/api/studio/live/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username })
            });

            // Notify via socket - Sync with StoriesRail.jsx listener name
            socket.emit('live_pulse_updated', { 
                username: user.username, 
                isLive: false 
            });

            // Navigate home
            navigate('/');
        } catch (err) {
            console.error("End stream failed:", err);
            navigate('/'); // Force leave anyway
        }
    };

    useEffect(() => {
        // Fetch stream metadata
        fetch(`${BASE_URL}/api/profile/${username}`)
            .then(res => res.json())
            .then(data => {
                if (!data.isLive) {
                    alert("This stage has gone dark. 🎧");
                    navigate('/');
                }
                setStreamData(data);
                
                // Join the stage room
                socket.emit('join_stage', { stageId: data.liveStreamId, username: user.username });
            });

        const handleNewReaction = (reaction) => {
            setReactions(prev => [...prev, { ...reaction, left: Math.random() * 80 + 10 }]);
            // Auto-cleanup reaction after animation
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== reaction.id));
            }, 3000);
        };

        const handleNewComment = (comment) => {
            setComments(prev => [...prev.slice(-20), comment]);
        };

        const handleViewerChange = ({ count }) => {
            if (count !== undefined) setViewers(count);
        };

        const handleMembersUpdate = ({ roomId, members }) => {
            if (roomId === `stage_${streamData?.liveStreamId || username}`) {
                setStageMembers(members);
                setViewers(members.length);
            }
        };

        socket.on('new_reaction', handleNewReaction);
        socket.on('new_stage_comment', handleNewComment);
        socket.on('stage_viewers_updated', handleViewerChange);
        socket.on('room_members_updated', handleMembersUpdate);

        return () => {
            if (streamData) {
                socket.emit('leave_stage', { stageId: streamData.liveStreamId, username: user.username });
            }
            socket.off('new_reaction', handleNewReaction);
            socket.off('new_stage_comment', handleNewComment);
            socket.off('stage_viewers_updated', handleViewerChange);
            socket.off('room_members_updated', handleMembersUpdate);
        };
    }, [username, navigate, user.username, streamData]); // Added streamData dependency

    useEffect(() => {
        let activeStream = null;

        const startLocalStream = async () => {
            if (isOwnStream) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: 'user', width: 1280, height: 720 }, 
                        audio: true 
                    });
                    activeStream = stream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("Critical: Failed to access broadcast hardware:", err);
                }
            }
        };

        startLocalStream();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOwnStream]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const sendReaction = (type) => {
        if (!streamData) return;
        socket.emit('stage_reaction', { stageId: streamData.liveStreamId, type, username: user.username });
    };

    const sendComment = (e) => {
        e.preventDefault();
        if (!commentInput.trim() || !streamData) return;
        socket.emit('stage_comment', { stageId: streamData.liveStreamId, message: commentInput, username: user.username });
        setCommentInput('');
    };

    const handleTip = async (amount) => {
        if (!user || user.balance < amount) {
            alert("Insufficient Vibe Tokens ⚡");
            return;
        }
        // Integration with existing subscription/tip logic
        try {
            const res = await fetch(`${BASE_URL}/api/creator/subscribe/${username}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriberUsername: user.username, amount, type: 'tip' })
            });
            const data = await res.json();
            if (data.success) {
                sendReaction('fire');
                window.dispatchEvent(new CustomEvent('balance_updated', { detail: data.balance }));
            }
        } catch (err) {
            console.error("Tip failed:", err);
        }
    };

    if (!streamData) return <div className="loading-screen">Entering the Stage...</div>;

    return (
        <div className="live-stage-container">
            <div className="live-bg-visuals">
                <img src={streamData.avatar} alt="Vibe Source" className="vibe-bg-blur" />
                <div className="vibe-glimmer-overlay" />
            </div>

            <header className="stage-header">
                <div className="stage-u-info">
                    <Avatar src={streamData.avatar} size={44} frame="gold" />
                    <div className="stage-meta">
                        <div className="stage-badge">LIVE</div>
                        <div className="stage-name-wrap">
                            <h2>@{streamData.username}</h2>
                            {(streamData.isVerified || isOwnStream) && <BadgeCheck size={18} fill="var(--theme-accent)" color="white" />}
                        </div>
                    </div>
                </div>
                <div className="stage-actions-top">
                    {isOwnStream && (
                        <button className="end-stream-btn" onClick={() => setIsConfirmingEnd(true)}>
                            End Stream
                        </button>
                    )}
                    <button className="viewer-pill" onClick={() => setIsMembersModalOpen(true)}>
                        <Users size={16} /> <span>{viewers || 1}</span>
                    </button>
                    <button className="stage-close" onClick={() => navigate('/')}><X /></button>
                </div>
            </header>

            {/* Members View Modal */}
            {isMembersModalOpen && (
                <div className="members-modal-overlay animate-fade-in" onClick={() => setIsMembersModalOpen(false)}>
                    <div className="members-modal glass-panel animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="members-header">
                            <h3>Stage Members</h3>
                            <button className="close-modal" onClick={() => setIsMembersModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="members-list">
                            {stageMembers.map(member => (
                                <div key={member.username} className="stage-member-item">
                                    <Avatar 
                                        src={member.avatar} 
                                        size={28} 
                                        frame={member.username === username ? "gold" : "none"} 
                                    />
                                    <div className="stage-member-info">
                                        <span className="stage-member-name">@{member.username}</span>
                                        <span className={`stage-member-status ${member.username === username ? 'streamer' : ''}`}>
                                            {member.username === username ? 'Streamer' : 'Vibing'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {stageMembers.length === 0 && (
                                <div className="stage-member-item">
                                    <Avatar src={streamData.avatar} size={28} frame="gold" />
                                    <div className="stage-member-info">
                                        <span className="stage-member-name">@{streamData.username}</span>
                                        <span className="stage-member-status streamer">Streamer</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="reaction-stream">
                {reactions.map(r => (
                    <div key={r.id} className={`floating-reaction ${r.type}`} style={{ left: `${r.left}%` }}>
                        {r.type === 'heart' ? <Heart fill="#ec4899" /> : <Zap fill="#ffd700" />}
                    </div>
                ))}
            </div>

            <div className="stage-main">
                {isOwnStream ? (
                    <div className="live-broadcast-container">
                        <video 
                            ref={localVideoRef}
                            autoPlay 
                            playsInline 
                            muted 
                            className="live-broadcast-video"
                        />
                        <div className="broadcast-on-air">ON AIR</div>
                    </div>
                ) : (
                    <div className="vibe-visualizer">
                        <div className="vibe-circle pulse-slow" />
                        <div className="vibe-circle pulse-fast" />
                        <Music size={64} className="vibe-icon" />
                    </div>
                )}

                {/* Floating Engagement Overlay */}
                <div className="stage-engagement-overlay animate-fade-in-up">
                    <div className="stage-chat-area">
                        <div className="stage-messages">
                            {comments.map(c => (
                                <div key={c.id} className="stage-msg animate-fade-in">
                                    <span className="msg-u">@{c.username}:</span> 
                                    <span className="msg-t">{c.message}</span>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <form className="stage-input-wrap" onSubmit={sendComment}>
                            <input 
                                placeholder="Echo your vibe..." 
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                            />
                            <button type="submit" className="stage-send-btn">
                                <Zap size={18} />
                            </button>
                        </form>
                    </div>

                    <div className="stage-engagement">
                        <button className="stage-btn react" onClick={() => sendReaction('heart')}>
                            <Heart size={24} />
                        </button>
                        <button className="stage-btn react" onClick={() => sendReaction('zap')}>
                            <Zap size={24} />
                        </button>
                        <div className="tip-trigger-wrap">
                            <button className="tip-btn-premium" onClick={() => handleTip(50)}>
                                Tip 50 <Zap size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {isConfirmingEnd && (
                    <div className="live-confirmation-overlay animate-fade-in" style={{ zIndex: 2000 }}>
                        <div className="live-confirm-card glass-panel animate-pop-in">
                            <div className="live-confirm-icon end-icon">
                                <Zap size={40} fill="#ff4757" color="#ff4757" />
                                <div className="pulse-ring red" />
                            </div>
                            <h3>End Stream?</h3>
                            <p>Are you sure you want to end your broadcast? This action is permanent.</p>
                            
                            <div className="confirm-actions">
                                <button className="confirm-start-btn" style={{ background: '#ff4757', boxShadow: '0 10px 25px rgba(255, 71, 87, 0.4)' }} onClick={handleEndStream}>
                                    Confirm & End
                                </button>
                                <button className="confirm-cancel-btn" onClick={() => setIsConfirmingEnd(false)}>
                                    Go Back
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveStage;
