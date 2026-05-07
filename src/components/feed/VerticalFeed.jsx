import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Heart, Share2, Music, X, Volume2, VolumeX } from 'lucide-react';
import Avatar from '../common/Avatar';
import VerificationBadge from '../common/VerificationBadge';
import { BASE_URL } from '../../utils/api';
import './VerticalFeed.css';

const VerticalFeed = ({ posts, onClose }) => {
    const [muted, setMuted] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);

    // Filter only valid video posts
    const videoPosts = (posts || []).filter(p => 
        (p.type === 'video' || p.contentUrl?.endsWith('.mp4')) && 
        p.contentUrl && 
        p.contentUrl.trim() !== ""
    );

    const handleScroll = () => {
        if (!containerRef.current) return;
        const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
        if (index !== activeIndex) setActiveIndex(index);
    };

    return (
        <div className="vertical-feed-overlay animate-fade-in" ref={containerRef} onScroll={handleScroll}>
            <button className="close-clips-btn" onClick={onClose}><X size={28} /></button>
            <button className="mute-toggle-btn" onClick={() => setMuted(!muted)}>
                {muted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            {videoPosts.map((post, index) => {
                // Adaptive Viewport Culling: Only render active and neighbor clips
                const isVisible = Math.abs(index - activeIndex) <= 1;
                
                if (!isVisible) return <div key={post._id || post.id} className="video-clip-placeholder" />;

                return (
                    <VideoClip 
                        key={post._id || post.id} 
                        post={post} 
                        isActive={index === activeIndex} 
                        muted={muted}
                    />
                );
            })}

            {videoPosts.length === 0 && (
                <div className="empty-clips">
                    <Music size={48} opacity={0.2} />
                    <h3>No frequencyic clips yet...</h3>
                    <p>Start the frequency by uploading a video!</p>
                </div>
            )}
        </div>
    );
};

const VideoClip = ({ post, isActive, muted }) => {
    const videoRef = useRef(null);
    const [liked, setLiked] = useState(false);

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play().catch(e => console.log("Autoplay blocked:", e));
        } else if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isActive]);

    return (
        <div className="video-clip-item">
            <video 
                ref={videoRef}
                className="clip-source"
                src={post.contentUrl}
                loop
                muted={muted}
                playsInline
            />
            
            <div className="clip-overlay">
                <div className="clip-left-info">
                    <div className="clip-author-row">
                        <Avatar src={post.avatar} size={40} frame={post.avatarFrame || 'none'} />
                        <span className="clip-username">{post.username}</span>
                        {post.isVerified && <VerificationBadge size={14} />}
                        <button className="follow-btn-v2">Follow</button>
                    </div>
                    <p className="clip-caption">{post.caption || post.content}</p>
                    <div className="clip-music-tag">
                        <div className="music-icon-scroller">
                            <Music size={14} />
                            <span className="music-scrolling-text">{post.music || "Original Frequency - " + post.username}</span>
                        </div>
                    </div>
                </div>

                <div className="clip-right-actions">
                    <div className="clip-action" onClick={() => setLiked(!liked)}>
                        <div className={`action-circle ${liked ? 'active-heart' : ''}`}>
                            <Heart size={28} fill={liked ? "#f43f5e" : "none"} color={liked ? "#f43f5e" : "white"} />
                        </div>
                        <span>{post.likes + (liked ? 1 : 0)}</span>
                    </div>

                    <div className="clip-action">
                        <div className="action-circle">
                            <MessageSquare size={28} />
                        </div>
                        <span>{post.commentCount || 0}</span>
                    </div>

                    <div className="clip-action">
                        <div className="action-circle">
                            <Share2 size={28} />
                        </div>
                        <span>Share</span>
                    </div>

                    <div className="music-disc-record animate-spin-slow">
                        <Avatar 
                            src={post.avatar} 
                            alt={post.username} 
                            size={40} 
                            className="record-center" 
                        />
                    </div>
                </div>
            </div>
            
            <div className="clip-vignette"></div>
        </div>
    );
};

export default VerticalFeed;
