import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Share2, Music2, Volume2, VolumeX, Sparkles, Link2, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { useMusic } from '../../hooks/useMusic';
import './Reels.css';

const ReelItem = ({ video, isActive }) => {
    const videoRef = useRef(null);
    const navigate = useNavigate();
    const { analyzer, isPlaying } = useMusic();
    const [isMuted, setIsMuted] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [beatScale, setBeatScale] = useState(1);
    const lastTap = useRef(0);
    const requestRef = useRef();

    useEffect(() => {
        const animate = () => {
            if (isPlaying && analyzer) {
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(dataArray);
                
                const lowFreqs = dataArray.slice(0, 10);
                const average = lowFreqs.reduce((a, b) => a + b, 0) / lowFreqs.length;
                
                const scale = 1 + (average / 255) * 0.35;
                setBeatScale(scale);
            } else {
                setBeatScale(1);
            }
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, analyzer]);

    const handleDoubleTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            setIsLiked(true);
            setShowHeart(true);
            setTimeout(() => setShowHeart(false), 1000);
        }
        lastTap.current = now;
    };

    useEffect(() => {
        if (isActive && videoRef.current) {
            (async () => {
                try {
                    await videoRef.current.play();
                } catch {
                    console.error("Autoplay thwarted");
                }
            })();
        } else if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isActive]);

    return (
        <div className="reel-item" onClick={handleDoubleTap}>
            <video
                ref={videoRef}
                src={video.url}
                loop
                muted={isMuted}
                playsInline
                className="reel-video"
            />

            {/* Back Arrow Top Left */}
            <div className="reel-top-left-overlay">
                <button className="reel-back-btn" onClick={(e) => { e.stopPropagation(); navigate(-1); }}>
                    <ArrowLeft size={24} color="white" />
                </button>
            </div>

            {/* Double Tap Heart */}
            {showHeart && (
                <div className="heart-animation-overlay">
                    <Heart fill="white" size={100} />
                </div>
            )}

            <div className="reel-bottom-gradient"></div>

            <div className="reel-overlay">
                
                {/* Right Action Sidebar */}
                <div className="reel-sidebar-right">
                    <div className="sidebar-action" onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}>
                        <div className="heart-wrapper" style={{ transform: `scale(${isLiked ? beatScale : 1})` }}>
                            <Heart size={36} fill={isLiked ? "white" : "none"} color="white" strokeWidth={isLiked ? 0 : 2.5} />
                        </div>
                        <span className="action-count">{video.likes + (isLiked ? 1 : 0)}</span>
                    </div>
                    
                    <div className="sidebar-action" onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}>
                        <MessageSquare size={36} color="white" strokeWidth={2.5} />
                        <span className="action-count">{video.comments}</span>
                    </div>
                    
                    <div className="sidebar-action" onClick={(e) => e.stopPropagation()}>
                        <Share2 size={36} color="white" strokeWidth={2.5} />
                    </div>

                    <div className="sidebar-action-badge remix-badge" onClick={(e) => e.stopPropagation()}>
                        REMIX
                    </div>
                    
                    <div className="sidebar-action sparkles-action" onClick={(e) => e.stopPropagation()}>
                        <Sparkles size={32} color="#a855f7" strokeWidth={2.5} />
                    </div>
                </div>

                {/* Bottom Left Content */}
                <div className="reel-content-bottom-left">
                    <div className="reel-user-row">
                        <div className="reel-avatar-ring">
                            <img src={video.avatar || 'https://www.gravatar.com/avatar/0?d=mp'} alt="avatar" />
                        </div>
                        <h3 className="reel-username" onClick={(e) => { e.stopPropagation(); navigate(`/profile/${video.username}`); }}>
                            {video.username}
                        </h3>
                        <button 
                            className={`reel-follow-btn ${isFollowing ? 'following' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setIsFollowing(!isFollowing); }}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                        <button className="reel-more-btn" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal size={24} color="white" />
                        </button>
                    </div>
                    
                    <p className="reel-description">{video.description}</p>
                    
                    <div className="reel-bottom-controls-row">
                        <button className="reel-link-btn" onClick={(e) => e.stopPropagation()}>
                            <Link2 size={18} color="white" style={{ transform: 'scaleX(-1)' }} />
                        </button>
                    </div>
                </div>

                {/* Mute Toggle Bottom Right */}
                <div className="reel-mute-overlay">
                    <button className="reel-mute-btn" onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}>
                        {isMuted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}
                    </button>
                </div>
            </div>

            {showComments && (
                <div className="reel-comments-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="comments-header">
                        <h4>Comments</h4>
                        <button onClick={() => setShowComments(false)}>✕</button>
                    </div>
                    <div className="comments-list">
                        <div className="comment-item">
                            <strong>@user</strong> Looks amazing!
                        </div>
                    </div>
                    <div className="comment-input">
                        <input type="text" placeholder="Add a comment..." />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReelItem;
