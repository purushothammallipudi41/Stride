import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, Minimize2, ChevronDown, X } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import './BottomPlayer.css';

const BottomPlayer = () => {
    const { currentTrack, isPlaying, togglePlay, progress, volume, setVolume, seek, playNext, playPrevious, closePlayer } = useMusic();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!currentTrack || !currentTrack.streamUrl) return null;

    const handleExpandToggle = (e) => {
        // Prevent expansion when clicking controls
        if (e.target.closest('.player-controls') || e.target.closest('.volume-slider') || e.target.closest('.progress-container')) {
            return;
        }
        setIsExpanded(!isExpanded);
    };

    const formatTime = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className={`bottom-player ${isExpanded ? 'expanded' : ''}`}
            onClick={handleExpandToggle}
        >
            <div className="player-content">
                {isExpanded && (
                    <>
                        <div
                            className="expanded-bg"
                            style={{ backgroundImage: `url(${currentTrack.cover})` }}
                        />
                        <button className="collapse-btn" onClick={() => setIsExpanded(false)}>
                            <ChevronDown size={32} />
                        </button>
                    </>
                )}

                <div className="track-info">
                    <img src={currentTrack.cover} alt={currentTrack.title} className="track-art" />
                    <div className="track-details">
                        <h4 className="track-title">{currentTrack.title}</h4>
                        <p className="track-artist">{currentTrack.artist}</p>
                    </div>
                </div>

                <div className="player-main">
                    <div className="player-controls">
                        <button className="control-btn" onClick={(e) => { e.stopPropagation(); playPrevious(); }}>
                            <SkipBack size={20} />
                        </button>
                        <button className="play-btn" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>
                        <button className="control-btn" onClick={(e) => { e.stopPropagation(); playNext(); }}>
                            <SkipForward size={20} />
                        </button>
                    </div>

                    <div className="progress-container" onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        seek((x / rect.width) * 100);
                    }}>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="player-actions">
                    <div className="volume-control">
                        <Volume2 size={20} />
                        <div className="volume-slider" onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            setVolume(Math.max(0, Math.min(1, x / rect.width)));
                        }}>
                            <div className="volume-fill" style={{ width: `${volume * 100}%` }}></div>
                        </div>
                    </div>
                    {/* Mobile Close Button (Visible mainly on mobile or small screens if needed, but we put it here) */}
                    <button className="expand-btn" onClick={(e) => { e.stopPropagation(); closePlayer(); }}>
                        <X size={20} />
                    </button>
                    {!isExpanded ? (
                        <button className="expand-btn mobile-hide" onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}>
                            <Maximize2 size={20} />
                        </button>
                    ) : (
                        <button className="expand-btn mobile-hide" onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>
                            <Minimize2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="expanded-bg" style={{ backgroundImage: `url(${currentTrack.cover})` }}></div>
            )}
        </div>
    );
};

export default BottomPlayer;
