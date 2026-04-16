import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Heart, MessageCircle, Send, MoreHorizontal, Volume2, VolumeX } from 'lucide-react';
import Avatar from '../common/Avatar';
import VerificationBadge from '../common/VerificationBadge';
import './StoryViewer.css';

const StoryViewer = ({ stories, initialStoryId, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(() => {
        const index = stories.findIndex(s => s.id === initialStoryId);
        return index !== -1 ? index : 0;
    });
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const progressInterval = useRef(null);
    const STORY_DURATION = 5000; // 5 seconds per story

    const currentStory = stories[currentIndex];

    const nextStory = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    }, [currentIndex, stories.length, onClose]);

    const prevStory = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        } else {
            setProgress(0); // Restart current
        }
    }, [currentIndex]);

    useEffect(() => {
        if (isPaused) {
            clearInterval(progressInterval.current);
            return;
        }

        const step = 100 / (STORY_DURATION / 50); // Update every 50ms
        progressInterval.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    nextStory();
                    return 0;
                }
                return prev + step;
            });
        }, 50);

        return () => clearInterval(progressInterval.current);
    }, [isPaused, nextStory]);

    const handleScreenClick = (e) => {
        const { clientX } = e;
        const screenWidth = window.innerWidth;
        if (clientX < screenWidth / 3) {
            prevStory();
        } else {
            nextStory();
        }
    };

    return (
        <div className="story-viewer-v2-container">
            <div className="story-viewer-backdrop" onClick={onClose} />
            
            <div className="story-viewer-main-v2 animate-scale-in">
                {/* Progress Segments */}
                <div className="story-progress-segments">
                    {stories.map((s, idx) => (
                        <div key={s.id} className="progress-track">
                            <div 
                                className="progress-fill" 
                                style={{ 
                                    width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%',
                                    transition: idx === currentIndex ? 'none' : 'width 0.2s linear'
                                }} 
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="story-viewer-header-v2">
                    <div className="viewer-user-info">
                        <Avatar src={currentStory.avatar} size={40} frame={currentStory.avatarFrame || 'none'} />
                        <div className="viewer-meta">
                            <span className="viewer-username">{currentStory.username}</span>
                            {currentStory.isVerified && <VerificationBadge size={14} />}
                            <span className="viewer-time">{currentStory.time || '1h'}</span>
                        </div>
                    </div>
                    <div className="viewer-actions-top">
                        <button onClick={() => setIsMuted(!isMuted)}>
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <button onClick={onClose}><X size={24} /></button>
                    </div>
                </div>

                {/* Media Content */}
                <div 
                    className="story-viewer-media-v2"
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                    onClick={handleScreenClick}
                >
                    <img src={currentStory.contentUrl} alt="Story" draggable="false" />
                    
                    {/* Stickers */}
                    {currentStory.metadata?.track && (
                        <div className="immersive-sticker music-sticker-v2 animate-float">
                            <div className="music-sticker-content glass-panel">
                                <img src={currentStory.metadata.track.cover} alt="Cover" />
                                <div className="music-details">
                                    <span className="song-title">{currentStory.metadata.track.title}</span>
                                    <span className="song-artist">{currentStory.metadata.track.artist}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStory.metadata?.poll && (
                        <div className="immersive-sticker poll-sticker-v2 glass-card">
                            <div className="poll-question-v2">{currentStory.metadata.poll.question}</div>
                            <div className="poll-options-v2">
                                <button className="poll-opt">{currentStory.metadata.poll.option1}</button>
                                <button className="poll-opt">{currentStory.metadata.poll.option2}</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Interaction */}
                <div className="story-viewer-footer-v2">
                    <div className="story-reply-input glass-panel">
                        <input type="text" placeholder="Send a message..." />
                    </div>
                    <div className="story-quick-actions">
                        <button className="notif-action-btn"><Heart size={24} /></button>
                        <button className="notif-action-btn"><Send size={24} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoryViewer;
