import { Play, Pause, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import './BottomPlayer.css';

const BottomPlayer = () => {
    const { currentTrack, isPlaying, togglePlay, progress, volume, setVolume, seek, playNext, playPrevious, closePlayer } = useMusic();

    if (!currentTrack || !currentTrack.streamUrl) return null;

    return (
        <div className="bottom-player">
            <div className="player-content">
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
                    {/* PC Volume Control */}
                    <div className="volume-control mobile-hide">
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

                    {/* Mobile Play Button (Visible only on mobile mini-player via CSS) */}
                    <button className="play-btn mobile-only-play" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    </button>

                    {/* Mobile Close Button */}
                    <button className="expand-btn" onClick={(e) => { e.stopPropagation(); closePlayer(); }}>
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BottomPlayer;
