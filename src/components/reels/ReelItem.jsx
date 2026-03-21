import { useRef, useEffect, useState } from 'react';
import { Heart, MessageSquare, Share2, Music2, Volume2, VolumeX } from 'lucide-react';
import { useMusic } from '../../hooks/useMusic';
import './Reels.css';

const ReelItem = ({ video, isActive }) => {
    const videoRef = useRef(null);
    const { analyzer, isPlaying } = useMusic();
    const [isMuted, setIsMuted] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [beatScale, setBeatScale] = useState(1);
    const lastTap = useRef(0);
    const requestRef = useRef();

    useEffect(() => {
        const animate = () => {
            if (isPlaying && analyzer) {
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(dataArray);
                
                // Get average of lower frequencies for bass-driven pulse
                const lowFreqs = dataArray.slice(0, 10);
                const average = lowFreqs.reduce((a, b) => a + b, 0) / lowFreqs.length;
                
                // Scale from 1 to 1.3 based on intensity
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
            // Use a self-invoking async function to handle await within useEffect
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

            {showHeart && (
                <div className="heart-animation-overlay">
                    <Heart fill="white" size={100} />
                </div>
            )}

            <div className="reel-overlay">
                <div className="reel-sidebar">
                    <div className="sidebar-action" onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}>
                        <div className="heart-wrapper" style={{ transform: `scale(${isLiked ? beatScale : 1})` }}>
                            <Heart size={28} fill={isLiked ? "#ec4899" : "none"} color={isLiked ? "#ec4899" : "white"} />
                        </div>
                        <span>{video.likes + (isLiked ? 1 : 0)}</span>
                    </div>
                    <div className="sidebar-action" onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}>
                        <MessageSquare size={28} />
                        <span>{video.comments}</span>
                    </div>
                    <div className="sidebar-action" onClick={(e) => e.stopPropagation()}>
                        <Share2 size={28} />
                    </div>
                    <div className="sidebar-action" onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}>
                        {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
                    </div>
                </div>

                <div className="reel-content">
                    <h3 className="reel-username">@{video.username}</h3>
                    <p className="reel-description">{video.description}</p>
                    <div className="reel-music">
                        <Music2 size={16} />
                        <div className="music-scroll">
                            <span>{video.music}</span>
                        </div>
                    </div>
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
                            <strong>@music_lover</strong> This beat is 🔥
                        </div>
                        <div className="comment-item">
                            <strong>@dance_crew</strong> Insane production quality!
                        </div>
                        <div className="comment-item">
                            <strong>@producer_jay</strong> Audius integration is smooth.
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
