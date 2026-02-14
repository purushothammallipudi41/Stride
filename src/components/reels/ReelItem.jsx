import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Music2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import './Reels.css';
import { useAuth } from '../../context/AuthContext';
import { useMusic } from '../../context/MusicContext';
import CommentsModal from '../common/CommentsModal';
import ShareModal from '../common/ShareModal';
import config from '../../config';

const ReelItem = ({ reel }) => {
    const { user, refreshUser } = useAuth();
    const { pauseTrack } = useMusic();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(parseInt(reel.likes) || 0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showHeartAnim, setShowHeartAnim] = useState(false);
    const [showStatusIcon, setShowStatusIcon] = useState(null); // 'play', 'pause', 'mute', 'unmute'
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    const handleShareToUser = async (targetUser) => {
        try {
            const res = await fetch(`${config.API_URL}/api/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: user.email,
                    to: targetUser.email,
                    text: `Shared a reel by ${reel.username}`,
                    sharedContent: {
                        type: 'reel',
                        id: reel.id,
                        thumbnail: `https://api.dicebear.com/7.x/shapes/svg?seed=${reel.musicTrack}`,
                        title: `${reel.username}'s Reel`
                    }
                })
            });
            if (res.ok) alert(`Reel shared with ${targetUser.name}!`);
        } catch (error) {
            console.error('Failed to share reel:', error);
        }
    };
    // ... rest of the component

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoRef.current?.play().then(() => {
                        setIsPlaying(true);
                        // If playing with sound, pause global music
                        if (!isMuted) pauseTrack();
                    }).catch(() => setIsPlaying(false));
                } else {
                    videoRef.current?.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.8 }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isMuted, pauseTrack]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
            setShowStatusIcon('pause');
        } else {
            videoRef.current.play();
            setIsPlaying(true);
            setShowStatusIcon('play');
            if (!isMuted) pauseTrack();
        }
        setTimeout(() => setShowStatusIcon(null), 800);
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        if (videoRef.current) videoRef.current.muted = newMuted;
        if (!newMuted) pauseTrack(); // Pause global music if unmuting reel
        setShowStatusIcon(newMuted ? 'mute' : 'unmute');
        setTimeout(() => setShowStatusIcon(null), 800);
    };

    const handleLike = (e) => {
        if (e) e.stopPropagation();
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    };

    const handleDoubleTap = () => {
        if (!isLiked) handleLike();
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 800);
    };

    const handleAction = (e, callback) => {
        e.stopPropagation();
        callback();
    };

    const handleFollow = async (e) => {
        handleAction(e, async () => {
            if (!user) {
                alert("Please login to follow creators. You can log in via the Settings page.");
                return;
            }
            try {
                const res = await fetch(`${config.API_URL}/api/users/${reel.userId || '2'}/follow`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ followerEmail: user.email })
                });
                if (res.ok) {
                    setIsFollowing(!isFollowing);
                    await refreshUser();
                }
            } catch (error) {
                console.error('Follow failed:', error);
            }
        });
    };

    return (
        <div className="reel-item" ref={containerRef} onClick={togglePlay} onDoubleClick={handleDoubleTap}>
            <div className="reel-video-bg">
                <video
                    ref={videoRef}
                    src={reel.videoUrl}
                    loop
                    muted={isMuted}
                    playsInline
                    className="reel-video-element"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onError={(e) => console.error("Video Playback Error:", e.target.error, "URL:", reel.videoUrl)}
                />
                <div className="reel-overlay" />

                {showHeartAnim && (
                    <div className="status-icon-anim heart">
                        <Heart size={80} fill="white" stroke="white" />
                    </div>
                )}

                {showStatusIcon && (
                    <div className="status-icon-anim status">
                        {showStatusIcon === 'play' && <Play size={60} fill="white" />}
                        {showStatusIcon === 'pause' && <Pause size={60} fill="white" />}
                        {showStatusIcon === 'mute' && <VolumeX size={60} fill="white" />}
                        {showStatusIcon === 'unmute' && <Volume2 size={60} fill="white" />}
                    </div>
                )}

                <button className="mute-toggle-btn" onClick={toggleMute}>
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
            </div>

            <div className="reel-content">
                <div className="reel-info">
                    <div className="reel-user">
                        <div className="reel-avatar" style={{ backgroundImage: `url(https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.username})`, backgroundSize: 'cover' }} />
                        <span className="reel-username">{reel.username}</span>
                        <button
                            className={`follow-btn ${isFollowing ? 'following' : ''}`}
                            onClick={handleFollow}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>
                    <p className="reel-caption">{reel.caption}</p>
                    <div className="reel-music-tag">
                        <Music2 size={16} className="rotate-music" />
                        <span>{reel.musicTrack}</span>
                    </div>
                </div>
            </div>

            <div className="reel-actions">
                <button
                    className={`reel-action-btn ${isLiked ? 'liked' : ''}`}
                    onClick={handleLike}
                >
                    <Heart size={36} fill={isLiked ? "var(--color-danger)" : "none"} stroke={isLiked ? "var(--color-danger)" : "currentColor"} strokeWidth={2.5} />
                    <span>{likeCount > 999 ? (likeCount / 1000).toFixed(1) + 'K' : likeCount}</span>
                </button>
                <button className="reel-action-btn" onClick={(e) => handleAction(e, () => setIsCommentsOpen(true))}>
                    <MessageCircle size={36} strokeWidth={2.5} />
                    <span>{reel.comments}</span>
                </button>
                <button className="reel-action-btn" onClick={(e) => handleAction(e, () => setIsShareModalOpen(true))}>
                    <Share2 size={36} strokeWidth={2.5} />
                </button>
                <button className="reel-action-btn" onClick={(e) => handleAction(e, () => alert('Options menu opening...'))}>
                    <MoreHorizontal size={36} strokeWidth={2.5} />
                </button>
                <div className="music-disc-anim">
                    <div className="disc-inner" style={{ backgroundImage: `url(https://api.dicebear.com/7.x/shapes/svg?seed=${reel.musicTrack})`, backgroundSize: 'cover' }} />
                </div>
            </div>

            <CommentsModal
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}
                postId={reel.id}
                comments={[]} // Reels comments are currently mock but can use context if connected
                username={reel.username}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onShare={handleShareToUser}
                contentTitle={`${reel.username}'s Reel`}
            />
        </div>
    );
};

export default ReelItem;
