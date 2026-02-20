import { useState, useEffect } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Radio, Sparkles, Play, Pause, SkipForward, Activity } from 'lucide-react';
import './SmartDJ.css';

// Mock AI curated tracks
const AI_PLAYLIST = [
    { title: 'Neon Nights', artist: 'Synthwave Kid', audioUrl: '/audio/neon.mp3', cover: '/img/covers/neon.jpg', duration: '3:45' },
    { title: 'Cyber City', artist: 'Future Grid', audioUrl: '/audio/cyber.mp3', cover: '/img/covers/cyber.jpg', duration: '4:12' },
    { title: 'Midnight Drive', artist: 'Lofi Maker', audioUrl: '/audio/midnight.mp3', cover: '/img/covers/midnight.jpg', duration: '2:50' },
];

const SmartDJ = () => {
    const { currentTrack, isPlaying, playTrack, togglePlay, playNext } = useMusic();
    const [isDJActive, setIsDJActive] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const isDJPlaying = currentTrack && AI_PLAYLIST.some(t => t.title === currentTrack.title);

    const handleToggleDJ = () => {
        if (!isDJActive && !isDJPlaying) {
            setAnalyzing(true);
            // Simulate AI analysis delay
            setTimeout(() => {
                setAnalyzing(false);
                setIsDJActive(true);
                playTrack(AI_PLAYLIST[0], AI_PLAYLIST);
            }, 1500);
        } else if (isDJPlaying) {
            togglePlay();
        } else {
            // DJ was active but user played something else, resume DJ
            setIsDJActive(true);
            playTrack(AI_PLAYLIST[0], AI_PLAYLIST);
        }
    };

    return (
        <div className={`smart-dj-container glass-card ${isDJActive || analyzing ? 'active' : ''}`}>
            <div className="dj-header">
                <div className="dj-title">
                    <div className={`dj-icon-wrapper ${isDJPlaying && isPlaying ? 'pulse-glow' : ''}`}>
                        <Radio size={24} className="dj-icon" />
                    </div>
                    <div>
                        <h3>Smart DJ</h3>
                        <p>Curated vibes based on your history</p>
                    </div>
                </div>

                <button
                    className={`dj-power-btn ${isDJPlaying && isPlaying ? 'playing' : ''}`}
                    onClick={handleToggleDJ}
                    disabled={analyzing}
                >
                    {analyzing ? (
                        <Activity className="spin" size={20} />
                    ) : isDJPlaying && isPlaying ? (
                        <Pause size={20} />
                    ) : (
                        <Play size={20} />
                    )}
                </button>
            </div>

            {(isDJActive || analyzing) && (
                <div className="dj-visualizer animate-fade-in">
                    {analyzing ? (
                        <div className="analyzing-state">
                            <Sparkles className="float" />
                            <span>Analyzing your vibe...</span>
                        </div>
                    ) : (
                        <div className="dj-now-playing">
                            <img src={currentTrack?.cover} alt={currentTrack?.title} className="dj-mini-cover" />
                            <div className="dj-track-info">
                                <span className="dj-now-label">UP NEXT</span>
                                <h4>{currentTrack?.title || 'Loading...'}</h4>
                            </div>
                            <button className="icon-btn" onClick={playNext} disabled={!isDJPlaying}>
                                <SkipForward size={20} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SmartDJ;
