import { Play, Pause, SkipBack, SkipForward, Volume2, Heart } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import './BottomPlayer.css';

const BottomPlayer = () => {
    const { currentTrack, isPlaying, togglePlay, progress, nextTrack, prevTrack, volume, setVolume } = useMusic();

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const calculateProgress = () => {
        if (!currentTrack.duration) return 0;
        return (progress / currentTrack.duration) * 100;
    };

    return (
        <div className="bottom-player">
            <div className="player-track-info">
                <div className="track-art-placeholder" />
                <div className="track-details">
                    <span className="track-title">{currentTrack.title}</span>
                    <span className="track-artist">{currentTrack.artist}</span>
                </div>
                <button className="like-btn">
                    <Heart size={18} />
                </button>
            </div>

            <div className="player-controls-container">
                <div className="player-controls">
                    <button className="control-btn secondary" onClick={prevTrack}><SkipBack size={20} /></button>
                    <button className="control-btn primary play-pause" onClick={togglePlay}>
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                    </button>
                    <button className="control-btn secondary" onClick={nextTrack}><SkipForward size={20} /></button>
                </div>
                <div className="progress-bar-container">
                    <span className="time-current">{formatTime(progress)}</span>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${calculateProgress()}%` }}></div>
                    </div>
                    <span className="time-total">{formatTime(currentTrack.duration)}</span>
                </div>
            </div>

            <div className="player-volume">
                <Volume2 size={20} />
                <div className="volume-slider">
                    <div className="volume-fill" style={{ width: '70%' }}></div>
                </div>
            </div>
        </div>
    );
};

export default BottomPlayer;
