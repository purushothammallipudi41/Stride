import { useState, useEffect, useRef } from 'react';
import { useMusic } from '../../context/MusicContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import {
    Music, Users, Heart, Share2, MessageCircle,
    Mic2, Play, Pause, SkipForward, SkipBack,
    Volume2, Radio, Sparkles
} from 'lucide-react';
import './LiveStage.css';

const LiveStage = ({ channelId, channelName, onClose }) => {
    const {
        currentTrack, isPlaying, progress,
        playTrack, togglePlay, playNext, playPrevious,
        sessionHost, isHosting, startVibeSession, joinVibeSession, leaveVibeSession
    } = useMusic();
    const { user } = useAuth();
    const { socket } = useSocket();
    const [reactions, setReactions] = useState([]);
    const [listeners, setListeners] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleReaction = (data) => {
            setReactions(prev => [...prev, { ...data, id: Math.random() }]);
            // Auto-remove reaction after 3s
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== data.id));
            }, 3000);
        };

        const handleUpdateListeners = (data) => {
            setListeners(data.listeners || []);
        };

        socket.on('new-vibe-reaction', handleReaction);
        socket.on('update-stage-listeners', handleUpdateListeners);

        // Join the stage room
        socket.emit('join-vibe-session', { hostEmail: channelId }); // Use channelId as host identifier for stages

        return () => {
            socket.off('new-vibe-reaction', handleReaction);
            socket.off('update-stage-listeners', handleUpdateListeners);
            socket.emit('leave-vibe-session', { hostEmail: channelId });
        };
    }, [socket, channelId]);

    const sendReaction = (type) => {
        if (socket) {
            socket.emit('send-vibe-reaction', {
                hostEmail: channelId,
                reaction: type,
                username: user.username
            });
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        // In a real app, this would go through a server message endpoint
        // For the demo, we'll just local sync if possible or use socket
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            username: user.username,
            text: newMessage,
            timestamp: new Date()
        }]);
        setNewMessage('');
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    return (
        <div className="live-stage-container animate-fade-in">
            <div className="stage-main-content">
                <div className="stage-header">
                    <div className="stage-title">
                        <Radio className="pulse-red" size={20} />
                        <h2>{channelName}</h2>
                        <div className="listener-count">
                            <Users size={14} />
                            <span>{listeners.length + 1} listening</span>
                        </div>
                    </div>
                </div>

                <div className="stage-visualizer-area">
                    {currentTrack ? (
                        <div className="vibe-card glass-card">
                            <div className="vibe-art-container">
                                <img src={currentTrack.cover} alt="" className={`vibe-art ${isPlaying ? 'spinning' : ''}`} />
                                <div className="vibe-overlay">
                                    <Sparkles className="shine" />
                                </div>
                            </div>
                            <div className="vibe-info">
                                <h3>{currentTrack.title}</h3>
                                <p>{currentTrack.artist}</p>
                            </div>

                            {/* Floating Reactions Area */}
                            <div className="floating-reactions">
                                {reactions.map(r => (
                                    <div key={r.id} className="reaction-bubble animate-float-up">
                                        <span className="reaction-emoji">{r.reaction === 'heart' ? '❤️' : '🔥'}</span>
                                        <span className="reaction-user">{r.username}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-stage flex-center flex-col">
                            <Music size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <p>The stage is quiet. Start the vibe!</p>
                            {!isHosting && (
                                <button className="primary-btn mt-4" onClick={startVibeSession}>
                                    Go Live
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="stage-controls glass-card">
                    <div className="reaction-bar">
                        <button className="reaction-btn heart" onClick={() => sendReaction('heart')}>
                            <Heart size={24} />
                        </button>
                        <button className="reaction-btn fire" onClick={() => sendReaction('fire')}>
                            <Sparkles size={24} />
                        </button>
                    </div>

                    {currentTrack && (
                        <div className="playback-mini">
                            <button className="control-btn" onClick={playPrevious}><SkipBack size={20} /></button>
                            <button className="play-btn-large" onClick={togglePlay}>
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <button className="control-btn" onClick={playNext}><SkipForward size={20} /></button>
                        </div>
                    )}
                </div>
            </div>

            <aside className="stage-chat glass-card">
                <div className="chat-header">
                    <h3>Live Chat</h3>
                </div>
                <div className="chat-messages premium-scrollbar">
                    {chatMessages.map(m => (
                        <div key={m.id} className="chat-msg">
                            <span className="msg-user">{m.username}: </span>
                            <span className="msg-text">{m.text}</span>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        placeholder="Say something..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit"><MessageCircle size={18} /></button>
                </form>
            </aside>
        </div>
    );
};

export default LiveStage;
