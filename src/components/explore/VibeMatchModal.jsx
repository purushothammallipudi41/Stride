import React, { useState } from 'react';
import { X, Sparkles, Music, Play, Loader2 } from 'lucide-react';
import { audiusService } from '../../services/audiusService';
import { useMusic } from '../../context/MusicContext';
import './VibeMatchModal.css';

const VIBE_MAP = [
    { emoji: '🔥', label: 'Hype', query: 'energy trap electronic phonk' },
    { emoji: '🌊', label: 'Chill', query: 'lofi chill ambient wave' },
    { emoji: '❤️', label: 'Romantic', query: 'love romantic rnb soul' },
    { emoji: '🥳', label: 'Party', query: 'dance party pop house' },
    { emoji: '🧘', label: 'Zen', query: 'meditation calm yoga peace' },
    { emoji: '🎸', label: 'Rock', query: 'rock indie alternative' },
    { emoji: '🌃', label: 'Night', query: 'night synthwave retro' },
    { emoji: '🧸', label: 'Cozy', query: 'cozy acoustic folk soft' }
];

const VibeMatchModal = ({ isOpen, onClose }) => {
    const { playTrack, currentTrack, isPlaying } = useMusic();
    const [selectedVibe, setSelectedVibe] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleVibeClick = async (vibe) => {
        setSelectedVibe(vibe);
        setLoading(true);
        try {
            const tracks = await audiusService.search(vibe.query);
            setResults(tracks.slice(0, 10)); // Top 10 matches
        } catch (error) {
            console.error('Vibe match failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="vibe-modal-overlay" onClick={onClose}>
            <div className="vibe-modal-content glass-card" onClick={e => e.stopPropagation()}>
                <header className="vibe-modal-header">
                    <div className="header-title">
                        <Sparkles className="sparkle-icon" size={24} />
                        <h2>AI Vibe Match</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </header>

                <div className="vibe-modal-body">
                    <p className="vibe-prompt">How are you feeling right now?</p>

                    <div className="vibe-grid">
                        {VIBE_MAP.map((vibe) => (
                            <button
                                key={vibe.label}
                                className={`vibe-card ${selectedVibe?.label === vibe.label ? 'active' : ''}`}
                                onClick={() => handleVibeClick(vibe)}
                            >
                                <span className="vibe-emoji">{vibe.emoji}</span>
                                <span className="vibe-label">{vibe.label}</span>
                            </button>
                        ))}
                    </div>

                    {loading && (
                        <div className="vibe-loading">
                            <Loader2 className="animate-spin" size={32} />
                            <p>Scanning the vibes...</p>
                        </div>
                    )}

                    {!loading && results.length > 0 && (
                        <div className="vibe-results-section animate-in">
                            <h3>Matching your vibe...</h3>
                            <div className="vibe-results-list">
                                {results.map((track) => (
                                    <div
                                        key={track.id}
                                        className={`vibe-result-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                                        onClick={() => playTrack(track, results)}
                                    >
                                        <img src={track.cover} alt={track.title} />
                                        <div className="result-info">
                                            <h4>{track.title}</h4>
                                            <p>{track.artist}</p>
                                        </div>
                                        <div className="play-indicator">
                                            {(currentTrack?.id === track.id && isPlaying) ?
                                                <div className="playing-bars">
                                                    <span></span><span></span><span></span>
                                                </div> :
                                                <Play size={16} fill="currentColor" />
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VibeMatchModal;
