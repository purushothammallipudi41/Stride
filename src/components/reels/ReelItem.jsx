import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Music2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import './Reels.css';
import { useAuth } from '../../context/AuthContext';
import { useMusic } from '../../context/MusicContext';
import CommentsModal from '../common/CommentsModal';
import ShareModal from '../common/ShareModal';
import config from '../../config';
import { getImageUrl } from '../../utils/imageUtils';
import { Trash2, Flag, UserMinus, ShieldAlert, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useContent } from '../../context/ContentContext';

const OptionsModal = ({ isOpen, onClose, onAction }) => {
    if (!isOpen) return null;
    return (
        <div className="options-modal-overlay" onClick={onClose}>
            <div className="options-modal-content" onClick={e => e.stopPropagation()}>
                <button className="option-item" onClick={() => onAction('report')}>
                    <Flag size={20} /> Report Content
                </button>
                <button className="option-item" onClick={() => onAction('not-interested')}>
                    <ShieldAlert size={20} /> Not Interested
                </button>
                <button className="option-item" onClick={() => onAction('follow')}>
                    <UserMinus size={20} /> Unfollow Creator
                </button>
                <button className="option-item danger" onClick={() => onAction('cancel')} style={{ marginTop: '8px' }}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

const ReelItem = ({ reel, onRemix }) => {
    const { user, refreshUser, pauseTrack } = useAuth();
    const { toggleLike, addComment } = useContent();
    const [isLiked, setIsLiked] = useState(reel.likes?.includes(user?.email) || false);
    const [likeCount, setLikeCount] = useState(Array.isArray(reel.likes) ? reel.likes.length : 0);
    const [isFollowing, setIsFollowing] = useState(user?.following?.includes(reel.userId) || false);
    const [showCaption, setShowCaption] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [showHeartAnim, setShowHeartAnim] = useState(false);
    const [showStatusIcon, setShowStatusIcon] = useState(null); // 'play', 'pause', 'mute', 'unmute'
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [shouldLoad, setShouldLoad] = useState(false);
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
                        thumbnail: getImageUrl(null, 'track'),
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
        // Observer for actual playback (High threshold)
        const playbackObserver = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoRef.current?.play().then(() => {
                        setIsPlaying(true);
                        if (!isMuted) pauseTrack();
                    }).catch(() => setIsPlaying(false));
                } else {
                    videoRef.current?.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.8 }
        );

        // Observer for preloading (Large margin)
        const preloadObserver = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldLoad(true);
                    preloadObserver.disconnect(); // Once loaded, stay loaded
                }
            },
            { rootMargin: '100% 0px' }
        );

        if (containerRef.current) {
            playbackObserver.observe(containerRef.current);
            preloadObserver.observe(containerRef.current);
        }

        return () => {
            playbackObserver.disconnect();
            preloadObserver.disconnect();
        };
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
        if (!user) {
            showToast('Please login to like reels', 'info');
            return;
        }
        toggleLike(reel._id || reel.id, user.email);
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
                    src={shouldLoad ? (reel.contentUrl || reel.videoUrl) : ''}
                    poster={reel.posterUrl}
                    loop
                    muted={isMuted}
                    playsInline
                    preload={shouldLoad ? "auto" : "none"}
                    autoPlay={shouldLoad}
                    className="reel-video-element"
                    onWaiting={() => setIsLoading(true)}
                    onPlaying={() => setIsLoading(false)}
                    onCanPlay={() => setIsLoading(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onError={(e) => console.error("Video Playback Error:", e.target.error, "URL:", reel.contentUrl || reel.videoUrl)}
                />
                <div className="reel-overlay" />

                {isLoading && (
                    <div className="reel-loading-spinner">
                        <div className="loading-spinner"></div>
                    </div>
                )}

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

            <div className={`reel-content ${!showCaption ? 'hidden' : ''}`} onClick={(e) => {
                e.stopPropagation();
                setShowCaption(!showCaption);
            }}>
                <div className="reel-info">
                    <div className="reel-user">
                        <div className="reel-avatar" style={{ backgroundImage: `url(${getImageUrl(reel.userAvatar)})`, backgroundSize: 'cover' }} />
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
                    <span>{reel.comments?.length || 0}</span>
                </button>
                <button className="reel-action-btn" onClick={(e) => handleAction(e, () => setIsShareModalOpen(true))}>
                    <Share2 size={36} strokeWidth={2.5} />
                </button>
                <button className="reel-action-btn remix-btn" onClick={(e) => handleAction(e, () => onRemix && onRemix(reel))} title="Remix This Vibe">
                    <Sparkles size={36} strokeWidth={2.5} color="var(--color-primary)" />
                    <span className="premium-label">REMIX</span>
                </button>
                <button className="reel-action-btn" onClick={(e) => handleAction(e, () => setIsOptionsOpen(true))}>
                    <MoreHorizontal size={36} strokeWidth={2.5} />
                </button>
                <div className="music-disc-anim">
                    <div className="disc-inner" style={{ backgroundImage: `url(${getImageUrl(reel.userAvatar || null, 'track')})`, backgroundSize: 'cover' }} />
                </div>
            </div>

            <CommentsModal
                isOpen={isCommentsOpen}
                onClose={() => setIsCommentsOpen(false)}
                postId={reel._id || reel.id}
                comments={reel.comments || []}
                username={reel.username}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onShare={handleShareToUser}
                contentTitle={`${reel.username}'s Reel`}
            />

            <OptionsModal
                isOpen={isOptionsOpen}
                onClose={() => setIsOptionsOpen(false)}
                onAction={(action) => {
                    if (action === 'report') {
                        showToast('Thank you for reporting. Our team will review this reel.', 'info');
                    } else if (action === 'not-interested') {
                        showToast('We will show you fewer reels like this.', 'info');
                    } else if (action === 'follow') {
                        handleFollow();
                    }
                    setIsOptionsOpen(false);
                }}
            />
        </div >
    );
};

export default ReelItem;
