import { useRef, useEffect, useState } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Maximize2, Minimize2, Share2, MoreHorizontal } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import './CanvasView.css';

const CanvasView = ({ isOpen, onClose }) => {
    const {
        currentTrack, isPlaying, togglePlay, progress,
        seek, playNext, playPrevious, analyser
    } = useMusic();

    const canvasRef = useRef(null);
    const requestRef = useRef();
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        if (!isOpen || !analyser || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const render = () => {
            analyser.getByteFrequencyData(dataArray);

            // Clear with slight trail effect
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height * 0.6;

                // Vibrant accent colors from the track (derived from standard vibe-accent variable if available)
                const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--vibe-accent').trim() || 'rgb(130, 87, 229)';
                ctx.fillStyle = accentColor.replace('rgb', 'rgba').replace(')', `, ${0.4 + (dataArray[i] / 255) * 0.6})`);

                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
            requestRef.current = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(requestRef.current);
    }, [isOpen, analyser]);

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen || !currentTrack) return null;

    const handleShare = () => {
        navigator.clipboard.writeText(`${window.location.origin}/track/${currentTrack.id}`);
        // Assume toast is available globally or just alert for now since I don't want to add another hook dependency yet
        alert('Link copied to clipboard!');
    };

    return (
        <div className={`canvas-view-overlay ${isOpen ? 'active' : ''}`}>
            <div className="canvas-background">
                <img
                    src={currentTrack.cover}
                    alt=""
                    className="canvas-bg-img"
                    crossOrigin="anonymous"
                />
                <div className="canvas-gradient-overlay"></div>
            </div>

            <header className="canvas-header">
                <button className="close-btn" onClick={onClose}>
                    <ChevronDown size={32} />
                </button>
                <div className="playing-from">
                    <span>PLAYING FROM EXPLORE</span>
                    <strong>Trending Tracks</strong>
                </div>
                <button className="more-btn" onClick={handleShare}>
                    <MoreHorizontal size={24} />
                </button>
            </header>

            <main className="canvas-main">
                <div className="canvas-content-grid">
                    <div className="canvas-art-container">
                        <img
                            src={currentTrack.cover}
                            alt={currentTrack.title}
                            className={`main-art ${isPlaying ? 'playing' : ''}`}
                            crossOrigin="anonymous"
                            onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80';
                            }}
                        />
                        <canvas ref={canvasRef} className="visualizer-canvas" width={400} height={150} />
                    </div>

                    <div className="canvas-track-info">
                        <div className="title-row">
                            <div className="track-meta">
                                <h1>{currentTrack.title}</h1>
                                <h2>{currentTrack.artist}</h2>
                            </div>
                            <button className="share-btn" onClick={handleShare}>
                                <Share2 size={24} />
                            </button>
                        </div>

                        <div className="canvas-controls-section">
                            <div className="canvas-progress-wrap" onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                seek((x / rect.width) * 100);
                            }}>
                                <div className="canvas-progress-bar">
                                    <div className="canvas-progress-fill" style={{ width: `${progress}%` }}></div>
                                    <div className="progress-handle" style={{ left: `${progress}%` }}></div>
                                </div>
                                <div className="time-row">
                                    <span>{formatTime((progress / 100) * (currentTrack.duration || 0))}</span>
                                    <span>{formatTime(currentTrack.duration || 0)}</span>
                                </div>
                            </div>

                            <div className="canvas-actions">
                                <button className="canvas-control-btn" onClick={playPrevious}>
                                    <SkipBack size={32} fill="white" />
                                </button>
                                <button className="canvas-play-btn" onClick={togglePlay}>
                                    {isPlaying ? <Pause size={48} fill="black" /> : <Play size={48} fill="black" />}
                                </button>
                                <button className="canvas-control-btn" onClick={playNext}>
                                    <SkipForward size={32} fill="white" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CanvasView;
