import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [currentTrack, setCurrentTrack] = useState(null);
    const [trackList, setTrackList] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.7);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [sessionHost, setSessionHost] = useState(null); // Following this user
    const [isHosting, setIsHosting] = useState(false);
    const audioRef = useRef(null);

    // Mood-Synced UI: Update theme colors based on current track
    useEffect(() => {
        if (!currentTrack) {
            // Reset to default Stride purple
            document.documentElement.style.setProperty('--vibe-accent', '#8257e5');
            document.documentElement.style.setProperty('--vibe-glow', 'rgba(130, 87, 229, 0.3)');
            document.documentElement.style.setProperty('--vibe-bg', '#030303');
            return;
        }

        const extractColors = async () => {
            try {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = currentTrack.cover;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 1;
                    canvas.height = 1;

                    ctx.drawImage(img, 0, 0, 1, 1);
                    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;

                    // Boost saturation/brightness for accent color
                    const accent = `rgb(${r}, ${g}, ${b})`;
                    const glow = `rgba(${r}, ${g}, ${b}, 0.3)`;
                    const darkBg = `rgba(${Math.max(0, r - 150)}, ${Math.max(0, g - 150)}, ${Math.max(0, b - 150)}, 1)`;

                    document.documentElement.style.setProperty('--vibe-accent', accent);
                    document.documentElement.style.setProperty('--vibe-glow', glow);
                    document.documentElement.style.setProperty('--vibe-bg', darkBg);
                };
            } catch (e) {
                console.warn("Color extraction failed:", e);
            }
        };

        extractColors();
    }, [currentTrack]);

    // Sync handle: emit state if hosting
    useEffect(() => {
        if (isHosting && socket && user) {
            const syncInterval = setInterval(() => {
                if (audioRef.current && currentTrack) {
                    socket.emit('vibe-playback-sync', {
                        hostEmail: user.email,
                        track: currentTrack,
                        isPlaying,
                        progress: (audioRef.current.currentTime / audioRef.current.duration) * 100,
                        timestamp: Date.now()
                    });
                }
            }, 5000); // Periodic sync every 5s
            return () => clearInterval(syncInterval);
        }
    }, [isHosting, socket, user, isPlaying, currentTrack]);

    // Handle incoming sync if following a host
    useEffect(() => {
        if (socket && sessionHost && !isHosting) {
            const handleSync = (data) => {
                if (data.hostEmail === sessionHost) {
                    // Update track if different
                    if (currentTrack?.id !== data.track.id) {
                        setCurrentTrack(data.track);
                        if (audioRef.current) {
                            audioRef.current.src = data.track.streamUrl;
                            audioRef.current.load();
                        }
                    }

                    // Sync playback state
                    if (audioRef.current) {
                        if (data.isPlaying && audioRef.current.paused) {
                            audioRef.current.play().catch(() => { });
                        } else if (!data.isPlaying && !audioRef.current.paused) {
                            audioRef.current.pause();
                        }

                        // Sync seek position if drift > 3 seconds
                        const remoteTime = (data.progress / 100) * audioRef.current.duration;
                        if (Math.abs(audioRef.current.currentTime - remoteTime) > 3) {
                            audioRef.current.currentTime = remoteTime;
                        }
                    }
                    setIsPlaying(data.isPlaying);
                }
            };

            socket.on('vibe-playback-update', handleSync);
            return () => socket.off('vibe-playback-update', handleSync);
        }
    }, [socket, sessionHost, isHosting, currentTrack]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const playTrack = (track, list = []) => {
        if (list.length > 0) setTrackList(list);

        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        setCurrentTrack(track);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = track.streamUrl;
            audioRef.current.load();
            audioRef.current.play().catch(e => {
                console.error("Playback failed (Track ID:", track.id, "):", e);
                setIsPlaying(false);
            });
        }

        // If hosting, broadcast change immediately
        if (isHosting && socket && user) {
            socket.emit('vibe-playback-sync', {
                hostEmail: user.email,
                track,
                isPlaying: true,
                progress: 0,
                timestamp: Date.now()
            });
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        const newState = !isPlaying;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => { });
        }
        setIsPlaying(newState);

        if (isHosting && socket && user) {
            socket.emit('vibe-playback-sync', {
                hostEmail: user.email,
                track: currentTrack,
                isPlaying: newState,
                progress: (audioRef.current.currentTime / audioRef.current.duration) * 100,
                timestamp: Date.now()
            });
        }
    };

    const startVibeSession = () => {
        setIsHosting(true);
        setSessionHost(null);
    };

    const joinVibeSession = (hostEmail) => {
        if (socket) {
            socket.emit('join-vibe-session', { hostEmail });
            setSessionHost(hostEmail);
            setIsHosting(false);
        }
    };

    const leaveVibeSession = () => {
        if (socket) {
            if (isHosting && user) {
                socket.emit('stop-vibe-session', { hostEmail: user.email });
            } else if (sessionHost) {
                socket.emit('leave-vibe-session', { hostEmail: sessionHost });
            }
        }
        setSessionHost(null);
        setIsHosting(false);
    };

    const playNext = () => {
        if (!trackList.length || !currentTrack) return;
        const currentIndex = trackList.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % trackList.length;
        playTrack(trackList[nextIndex]);
    };

    const playPrevious = () => {
        if (!trackList.length || !currentTrack) return;
        const currentIndex = trackList.findIndex(t => t.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + trackList.length) % trackList.length;
        playTrack(trackList[prevIndex]);
    };

    const seek = (percent) => {
        if (!audioRef.current || !audioRef.current.duration) return;
        const time = (percent / 100) * audioRef.current.duration;
        audioRef.current.currentTime = time;
        setProgress(percent);

        if (isHosting && socket && user) {
            socket.emit('vibe-playback-sync', {
                hostEmail: user.email,
                track: currentTrack,
                isPlaying,
                progress: percent,
                timestamp: Date.now()
            });
        }
    };

    const pauseTrack = () => {
        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const closePlayer = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentTrack(null);
        if (isHosting) leaveVibeSession();
    };

    return (
        <MusicContext.Provider value={{
            currentTrack,
            isPlaying,
            volume,
            progress,
            duration,
            sessionHost,
            isHosting,
            playTrack,
            pauseTrack,
            playNext,
            playPrevious,
            togglePlay,
            setVolume,
            seek,
            closePlayer,
            startVibeSession,
            joinVibeSession,
            leaveVibeSession
        }}>
            {children}
            <audio
                ref={audioRef}
                onTimeUpdate={(e) => {
                    const audio = e.target;
                    if (audio.duration) {
                        setProgress((audio.currentTime / audio.duration) * 100);
                        setDuration(audio.duration);
                    }
                }}
                onEnded={playNext}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => {
                    const error = e.target.error;
                    console.error("Audio Engine Error Details:", {
                        code: error?.code,
                        message: error?.message,
                        src: e.target.src
                    });
                }}
            />
        </MusicContext.Provider>
    );
};

export const useMusic = () => useContext(MusicContext);
