import { Play, Pause, Music, Heart, Share2, Plus } from 'lucide-react';
import { useMusic } from '../../hooks/useMusic';
import './TrackCard.css';

const TrackCard = ({ track, isMe, onAdd, isTrending }) => {
    const { currentTrack, isPlaying, playTrack, togglePlay } = useMusic();
    const isActive = currentTrack?.id === track?.id;

    const handlePlay = (e) => {
        e.stopPropagation();
        if (isActive) {
            togglePlay();
        } else {
            playTrack(track);
        }
    };

    return (
        <div className={`track-card glass-panel ${isActive ? 'active' : ''} ${isMe ? 'is-me' : ''}`}>
            <div className="track-card-main">
                <div className="track-card-artwork" onClick={handlePlay}>
                    <img src={track?.artwork} alt="" />
                    <div className="artwork-overlay">
                        {isActive && isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
                    </div>
                </div>
                
                <div className="track-card-info">
                    <div className="track-type-badge">
                        <Music size={12} />
                        <span>Shared Track</span>
                    </div>
                    <h4 className="track-title">{track?.title || 'Unknown Track'}</h4>
                    <p className="track-artist">{track?.artist || 'Unknown Artist'}</p>
                    
                    {isActive && isPlaying && (
                        <div className="waveform-animation">
                            <span className="bar" />
                            <span className="bar" />
                            <span className="bar" />
                            <span className="bar" />
                        </div>
                    )}
                </div>
            </div>

            <div className="track-card-actions">
                {isTrending && (
                    <button 
                        className="action-btn add-to-queue-btn" 
                        data-testid="add-to-queue-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd && onAdd();
                        }}
                        title="Add to Jukebox Queue"
                    >
                        <Plus size={16} />
                    </button>
                )}
                <button className="action-btn"><Heart size={16} /></button>
                <button className="action-btn"><Share2 size={16} /></button>
                <div className="track-duration">{track?.duration ? Math.floor(track.duration / 60) + ':' + (track.duration % 60).toString().padStart(2, '0') : '3:45'}</div>
            </div>
        </div>
    );
};

export default TrackCard;
