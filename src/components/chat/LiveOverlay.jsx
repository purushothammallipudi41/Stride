import { useState, useEffect } from 'react';
import { X, Users, MessageCircle, Heart, Share2, Music } from 'lucide-react';
import Avatar from '../common/Avatar';
import './LiveOverlay.css';

const LiveOverlay = ({ streamId, streamerName, communityName, onClose }) => {
    const [viewers, setViewers] = useState(Math.floor(Math.random() * 50) + 12);
    const [likes, setLikes] = useState(0);
    const [showChat, setShowChat] = useState(true);

    // Placeholder simulated video for "WOW" effect
    const videoUrl = "https://assets.mixkit.co/videos/preview/mixkit-recording-studio-with-dj-mixing-music-23097-large.mp4";

    useEffect(() => {
        const interval = setInterval(() => {
            setViewers(prev => prev + (Math.random() > 0.5 ? 1 : -1));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleLike = () => {
        setLikes(prev => prev + 1);
        // Add a temporary animation effect or sound?
    };

    return (
        <div className="live-overlay-container animate-fade-in">
            <div className="live-media-background">
                <video 
                    src={videoUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="live-video-source"
                    id="live-broadcaster-vid"
                />
                <div className="live-vignette"></div>
            </div>

            <header className="live-header">
                <div className="live-header-left">
                    <div className="live-indicator-badge pulse">LIVE</div>
                    <div className="live-meta">
                        <h2 className="stream-title">{streamerName}'s Frequency Lounge</h2>
                        <p className="stream-community">Broadcasting in {communityName}</p>
                    </div>
                </div>

                <div className="live-header-right">
                    <div className="viewer-count">
                        <Users size={18} />
                        <span>{viewers}</span>
                    </div>
                    <button className="close-live-btn" onClick={onClose} aria-label="Exit Live Room">
                        <X size={24} />
                    </button>
                </div>
            </header>

            <div className="live-interactions-area">
                {showChat && (
                    <div className="live-chat-preview animate-slide-up">
                        <div className="chat-msg"><b>vibe_master:</b> This drop is insane! 🔥</div>
                        <div className="chat-msg"><b>neo_rythm:</b> Love the lo-fi vibes here. 🎹</div>
                        <div className="chat-msg"><b>vyx_fan:</b> How do I get that serum patch?</div>
                    </div>
                )}

                <div className="live-action-bar">
                    <div className="action-left">
                        <button className="action-btn-v3" onClick={() => setShowChat(!showChat)}>
                            <MessageCircle size={22} color={showChat ? "var(--color-primary)" : "white"} />
                        </button>
                        <button className="action-btn-v3" onClick={handleLike}>
                            <Heart size={22} fill={likes > 0 ? "var(--color-accent)" : "none"} color={likes > 0 ? "var(--color-accent)" : "white"} />
                            {likes > 0 && <span className="like-counter">{likes}</span>}
                        </button>
                    </div>
                    
                    <div className="action-center">
                        <div className="now-playing-pill glass-panel">
                            <Music size={14} className="spin-icon" />
                            <span>System Drop - Frequencyic Mix</span>
                        </div>
                    </div>

                    <div className="action-right">
                        <button className="action-btn-v3"><Share2 size={22} /></button>
                        <button className="support-stream-btn glass-panel">
                            Support <span className="vp-tag">VP</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="live-atmosphere-glow"></div>
        </div>
    );
};

export default LiveOverlay;
