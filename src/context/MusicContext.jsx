import { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../services/socket';
import { getTrendingTracks, getStreamUrl } from '../services/audiusService';
import MusicContext from './MusicContextObject';

export const MusicProvider = ({ children }) => {
    const getLoggedUsername = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.username || 'guest';
    };

    const USERNAME = getLoggedUsername();


    const [allSongs, setAllSongs] = useState([]);
    const [genres, setGenres] = useState([]);
    const [artists, setArtists] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [languages, setLanguages] = useState([]);
    
    const [currentTrack, setCurrentTrack] = useState({
        title: "Loading...",
        artist: "Audius",
        cover: null,
        duration: 0,
        url: null
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [favorites, setFavorites] = useState([]);




    const [playlists, setPlaylists] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isPublicSession, setIsPublicSession] = useState(false);


    
    const [recentTracks, setRecentTracks] = useState(() => {
        const saved = localStorage.getItem('stride_recent');
        return saved ? JSON.parse(saved) : [];
    });
    
    const audioRef = useRef(new Audio());
    const analyzerRef = useRef(null);
    const audioContextRef = useRef(null);

    const [username, setUsername] = useState(getLoggedUsername());

    
    // Update username when localStorage changes (simple sync)
    useEffect(() => {
        const handleStorage = () => setUsername(getLoggedUsername());
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Fetch metadata and favorites from backend on mount/login
    useEffect(() => {
        if (username === 'guest') return;

        // Fetch favorites
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/favorites/${username}`)
            .then(res => res.json())
            .then(data => setFavorites(data))
            .catch(err => console.error("Failed to fetch favorites:", err));

        // Fetch genres
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/music/genres`)
            .then(res => res.json())
            .then(data => setGenres(data))
            .catch(err => console.error("Failed to fetch genres:", err));

        // Fetch artists
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/music/artists`)
            .then(res => res.json())
            .then(data => setArtists(data))
            .catch(err => console.error("Failed to fetch artists:", err));

        // Fetch albums
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/music/albums`)
            .then(res => res.json())
            .then(data => setAlbums(data))
            .catch(err => console.error("Failed to fetch albums:", err));

        // Fetch languages
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/music/languages`)
            .then(res => res.json())
            .then(data => setLanguages(data))
            .catch(err => console.error("Failed to fetch languages:", err));

        // Fetch playlists
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/playlists/${username}`)
            .then(res => res.json())
            .then(data => setPlaylists(data))
            .catch(err => console.error("Failed to fetch playlists:", err));
    }, [username]);


    // Listen for global real-time events
    useEffect(() => {
        socket.on('global_event', (event) => {
            console.log('Global Event received:', event);
            // We now handle most social notifications in App.jsx / UIContext
        });

        return () => {
            socket.off('global_event');
        };
    }, []);


    // Sync recent to localStorage (keeping local for now as per plan focus on favorites/servers)
    useEffect(() => {
        localStorage.setItem('stride_recent', JSON.stringify(recentTracks));
    }, [recentTracks]);

    // Fetch trending tracks on mount
    useEffect(() => {
        const fetchTracks = async () => {
            const tracks = await getTrendingTracks();
            if (tracks.length > 0) {
                const formattedTracks = tracks.map(t => ({
                    id: t.id,
                    title: t.title,
                    artist: t.user?.name || "Unknown",
                    cover: t.artwork?.['480x480'] || t.artwork?.['150x150'] || null,
                    duration: t.duration
                }));
                setAllSongs(formattedTracks);
                setCurrentTrack(formattedTracks[0]);
            }
        };
        fetchTracks();
    }, []);

    const initAnalyzer = useCallback(() => {
        if (analyzerRef.current) return analyzerRef.current;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            const analyzer = ctx.createAnalyser();
            const source = ctx.createMediaElementSource(audioRef.current);
            
            source.connect(analyzer);
            analyzer.connect(ctx.destination);
            
            analyzer.fftSize = 256;
            
            audioContextRef.current = ctx;
            analyzerRef.current = analyzer;
            return analyzer;
        } catch (e) {
            console.error("Failed to init analyzer", e);
            return null;
        }
    }, []);

    const togglePlay = useCallback(() => {
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        setIsPlaying(prev => {
            const newState = !prev;
            socket.emit('sync_playback', {
                roomId: 'listening_party',
                track: currentTrack,
                progress: audioRef.current.currentTime,
                isPlaying: newState
            });
            return newState;
        });
    }, [currentTrack]);



    const playTrack = useCallback(async (track) => {
        // Init analyzer on first play if not already done
        initAnalyzer();
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

        // If same track, toggle play
        if (currentTrack?.id === track.id) {
            togglePlay();
            return;
        }

        const fallbackTrack = {
            ...track,
            cover: track.cover || null
        };

        setCurrentTrack(fallbackTrack);
        setIsPlaying(true);
        setProgress(0);

        // Update recent tracks
        setRecentTracks(prev => {
            const filtered = prev.filter(t => t.id !== track.id);
            return [fallbackTrack, ...filtered].slice(0, 10);
        });

        // Emit activity to real-time backend
        console.log(`Emitting activity: ${fallbackTrack.title}`);
        socket.emit('update_activity', {
            username: username,
            track: {
                title: fallbackTrack.title,
                artist: fallbackTrack.artist,
                id: fallbackTrack.id
            }
        });
        
        try {
            // Add timeout for host discovery/streaming
            const streamUrl = await Promise.race([
                getStreamUrl(track.id),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Audius Timeout')), 5000))
            ]);

            if (streamUrl) {
                audioRef.current.src = streamUrl;
                audioRef.current.play().catch(e => console.error("Play failed", e));
                
                socket.emit('sync_playback', {
                    roomId: 'listening_party',
                    track: fallbackTrack,
                    progress: 0,
                    isPlaying: true
                });

                if (isPublicSession) {
                    socket.emit('broadcast_session', {
                        username,
                        track: fallbackTrack,
                        isPublic: true
                    });
                }

            } else {
                throw new Error("No stream URL");
            }

        } catch (e) {
            console.error("Audius Playback Error:", e.message);
            setIsPlaying(false);
            // Optionally try another node here in a real app
        }
    }, [currentTrack, initAnalyzer, togglePlay, username, isPublicSession]);


    const nextTrack = useCallback(() => {
        if (allSongs.length === 0) return;
        const currentIndex = allSongs.findIndex(s => s.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % allSongs.length;
        playTrack(allSongs[nextIndex]);
    }, [allSongs, currentTrack, playTrack]);

    const prevTrack = useCallback(() => {
        if (allSongs.length === 0) return;
        const currentIndex = allSongs.findIndex(s => s.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + allSongs.length) % allSongs.length;
        playTrack(allSongs[prevIndex]);
    }, [allSongs, currentTrack, playTrack]);

    useEffect(() => {
        if ('mediaSession' in navigator && currentTrack) {
            navigator.mediaSession.metadata = new window.MediaMetadata({
                title: currentTrack.title,
                artist: currentTrack.artist,
                album: 'Stride Music',
                artwork: [
                    { src: currentTrack.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=512&q=80', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => togglePlay());
            navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
            navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
        }
    }, [currentTrack, togglePlay, prevTrack, nextTrack]);



    // Audio Event Listeners
    useEffect(() => {
        const audio = audioRef.current;

        const updateProgress = () => setProgress(Math.floor(audio.currentTime));
        const handleEnded = () => nextTrack();

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [allSongs, currentTrack, nextTrack]); // Re-attach if songs or handlers change



    useEffect(() => {
        const audio = audioRef.current;
        if (isPlaying && audio.src) {

            audio.play().catch(e => {
                console.error("Playback failed", e);
                setIsPlaying(false);
            });
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    const toggleFavorite = async (track) => {

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/favorites/${username}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track })
            });
            const updatedFavorites = await response.json();
            setFavorites(updatedFavorites);
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
        }
    };







    const value = {
        allSongs,
        currentTrack,
        isPlaying,
        progress,
        volume,
        favorites,
        recentTracks,
        genres,
        artists,
        albums,
        languages,
        notifications,
        playlists,

        togglePlay,
        nextTrack,
        prevTrack,
        playTrack,
        toggleFavorite,
        setVolume,
        analyzer: analyzerRef.current,
        username,
        clearNotification: (id) => setNotifications(prev => prev.filter(n => n.id !== id)),
        setProgress: (time) => {
            setProgress(time);
            audioRef.current.currentTime = time;
            socket.emit('sync_playback', {
                roomId: 'listening_party',
                track: currentTrack,
                progress: time,
                isPlaying
            });
        },
        createPlaylist: async (playlistData) => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/playlists`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...playlistData, owner: JSON.parse(localStorage.getItem('user'))._id })
                });
                const newPlaylist = await res.json();
                setPlaylists(prev => [...prev, newPlaylist]);
                return newPlaylist;
            } catch (err) {
                console.error("Create playlist failed:", err);
            }
        },
        addToPlaylist: async (playlistId, track) => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user._id;
            try {
                await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/playlists/${playlistId}/tracks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ track, userId })
                });
            } catch (err) {
                console.error("Add to playlist failed:", err);
            }
        },
        isPublicSession,
        togglePublicSession: () => setIsPublicSession(prev => !prev)
    };


    return (
        <MusicContext.Provider value={value}>
            {children}
        </MusicContext.Provider>
    );
};

export default MusicProvider;



