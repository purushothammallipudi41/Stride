import { useState, useEffect, createContext, useContext, useCallback, useRef, useMemo } from 'react';
import socket from '../services/socket';
import { getTrendingTracks, getStreamUrl } from '../services/audiusService';
import { getStoredUser } from '../utils/storage';
import { hapticImpactLight } from '../services/haptics';
import { BASE_URL } from '../utils/api';

import MusicContext from './MusicContextObject';

export const MusicProvider = ({ children }) => {
    const getLoggedUsername = () => {
        const user = getStoredUser();
        return user?.username || 'guest';
    };

    const USERNAME = getLoggedUsername();


    const FALLBACK_TRACKS = [
        { id: 'f1', title: "Midnight City", artist: "M83", duration: 243, cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=480&q=80" },
        { id: 'f2', title: "Blinding Lights", artist: "The Weeknd", duration: 200, cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=480&q=80" },
        { id: 'f3', title: "Lofi Study", artist: "Stride Beats", duration: 180, cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=480&q=80" }
    ];

    const [allSongs, setAllSongs] = useState(FALLBACK_TRACKS);
    const [genres, setGenres] = useState([]);
    const [artists, setArtists] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [languages, setLanguages] = useState([]);
    
    const [currentTrack, setCurrentTrack] = useState(FALLBACK_TRACKS[0]);

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
    
    const audioRef = useRef(null);
    if (typeof window !== 'undefined' && !audioRef.current) {
        audioRef.current = new Audio();
    }
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
        fetch(`${BASE_URL}/api/favorites/${username}`)
            .then(res => res.json())
            .then(data => setFavorites(data))
            .catch(err => console.error("Failed to fetch favorites:", err));

        // Fetch genres
        fetch(`${BASE_URL}/api/music/genres`)
            .then(res => res.json())
            .then(data => setGenres(data))
            .catch(err => console.error("Failed to fetch genres:", err));

        // Fetch artists
        fetch(`${BASE_URL}/api/music/artists`)
            .then(res => res.json())
            .then(data => setArtists(data))
            .catch(err => console.error("Failed to fetch artists:", err));

        // Fetch albums
        fetch(`${BASE_URL}/api/music/albums`)
            .then(res => res.json())
            .then(data => setAlbums(data))
            .catch(err => console.error("Failed to fetch albums:", err));

        // Fetch languages
        fetch(`${BASE_URL}/api/music/languages`)
            .then(res => res.json())
            .then(data => setLanguages(data))
            .catch(err => console.error("Failed to fetch languages:", err));

        // Fetch playlists
        fetch(`${BASE_URL}/api/playlists/${username}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPlaylists(data);
                } else {
                    console.warn("Playlists fetch returned non-array data:", data);
                    setPlaylists([]);
                }
            })
            .catch(err => {
                console.error("Failed to fetch playlists:", err);
                setPlaylists([]);
            });
    }, [username]);


    // Listen for global and sync events
    useEffect(() => {
        socket.on('global_event', (event) => {
            console.log('Global Event received:', event);
        });

        let user = {};
        try {
            user = JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            user = {};
        }
        if (user && user.username) {
            socket.emit('register_user', {
                username: user.username,
                avatar: user.avatar,
                avatarFrame: user.avatarFrame
            });
        }

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
            try {
                const tracks = await getTrendingTracks();
                if (tracks && tracks.length > 0) {
                    const formattedTracks = tracks.map(t => ({
                        id: t.id,
                        title: t.title,
                        artist: t.user?.name || "Unknown",
                        cover: t.artwork?.['480x480'] || t.artwork?.['150x150'] || null,
                        duration: t.duration
                    }));
                    setAllSongs(formattedTracks);
                    // Only update current track if none is playing or we were on fallback
                    if (currentTrack.id === 'f1') {
                        setCurrentTrack(formattedTracks[0]);
                    }
                }
            } catch (err) {
                console.error("Trending tracks error:", err);
                // Keep fallbacks
            }
        };
        fetchTracks();
    }, []);

    const togglePlay = useCallback(() => {
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        setIsPlaying(prev => {
            const newState = !prev;
            socket.emit('playback_update', {
                username,
                track: currentTrack,
                isPlaying: newState
            });
            return newState;
        });
    }, [currentTrack, username]);



    const playTrack = useCallback(async (track) => {
        hapticImpactLight();
        
        // Initialize Web Audio API for visualizers
        if (!audioContextRef.current) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContextRef.current = new AudioContext();
                analyzerRef.current = audioContextRef.current.createAnalyser();
                analyzerRef.current.fftSize = 256;
                const source = audioContextRef.current.createMediaElementSource(audioRef.current);
                source.connect(analyzerRef.current);
                analyzerRef.current.connect(audioContextRef.current.destination);
            } catch (err) {
                console.error("Web Audio API not supported or blocked:", err);
            }
        }

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
                
                socket.emit('playback_update', {
                    username,
                    track: fallbackTrack,
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
    }, [currentTrack, togglePlay, username, isPublicSession]);


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

    const toggleFavorite = useCallback(async (track) => {
        try {
            const response = await fetch(`${BASE_URL}/api/favorites/${username}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track })
            });
            const updatedFavorites = await response.json();
            setFavorites(updatedFavorites);
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
        }
    }, [username]);

    const setProgressHandler = useCallback((time) => {
        setProgress(time);
        audioRef.current.currentTime = time;
    }, []);

    const createPlaylist = useCallback(async (playlistData) => {
        try {
            let user = {};
            try {
                user = JSON.parse(localStorage.getItem('user') || '{}');
            } catch {
                user = {};
            }
            const res = await fetch(`${BASE_URL}/api/playlists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...playlistData, owner: user._id })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to create playlist');
            }
            const newPlaylist = await res.json();
            setPlaylists(prev => [...prev, newPlaylist]);
            return newPlaylist;
        } catch (err) {
            console.error("Create playlist failed:", err);
        }
    }, []);

    const addToPlaylist = useCallback(async (playlistId, track) => {
        let user = {};
        try {
            user = JSON.parse(localStorage.getItem('user') || '{}');
        } catch {
            user = {};
        }
        const userId = user._id;
        try {
            await fetch(`${BASE_URL}/api/playlists/${playlistId}/tracks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track, userId })
            });
        } catch (err) {
            console.error("Add to playlist failed:", err);
        }
    }, []);



    const sendBeat = useCallback(async (targetUsername, track) => {
        hapticImpactLight();
        // This is a stub for the Phase 7 direct sharing feature
        // In a real app, this would emit a socket event or call an API
        console.log(`Sending beat ${track.title} to ${targetUsername}`);
        socket.emit('send_message', {
            to: targetUsername,
            from: username,
            text: `🎵 Shared a beat: ${track.title} by ${track.artist}`,
            attachment: {
                type: 'track',
                trackId: track.id,
                title: track.title,
                artist: track.artist,
                cover: track.cover
            }
        });
        alert(`Beat shared with ${targetUsername}!`);
    }, [username]);

    const clearNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const togglePublicSession = useCallback(() => {
        setIsPublicSession(prev => !prev);
    }, []);







    const value = useMemo(() => ({
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
        clearNotification,
        setProgress: setProgressHandler,
        createPlaylist,
        addToPlaylist,
        isPublicSession,
        togglePublicSession,
        sendBeat
    }), [
        allSongs, currentTrack, isPlaying, progress, volume, favorites, 
        recentTracks, genres, artists, albums, languages, notifications, 
        playlists, togglePlay, nextTrack, prevTrack, playTrack, toggleFavorite, 
        setVolume, username, clearNotification, setProgressHandler, 
        createPlaylist, addToPlaylist, isPublicSession, togglePublicSession, 
        sendBeat
    ]);


    return (
        <MusicContext.Provider value={value}>
            {children}
        </MusicContext.Provider>
    );
};

export default MusicProvider;



