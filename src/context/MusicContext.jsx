import { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../services/socket';
import { getTrendingTracks, getStreamUrl } from '../services/audiusService';
import MusicContext from './MusicContextObject';
import { hapticImpactLight, hapticImpactMedium } from '../services/haptics';

export const MusicProvider = ({ children }) => {
    const getLoggedUsername = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.username || 'guest';
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
    const [currentRoom, setCurrentRoom] = useState(null); // 'community_ID' or null
    const [roomListeners, setRoomListeners] = useState([]);


    
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


    // Listen for global and sync events
    useEffect(() => {
        socket.on('global_event', (event) => {
            console.log('Global Event received:', event);
        });

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.username) {
            socket.emit('register_user', {
                username: user.username,
                avatar: user.avatar,
                avatarFrame: user.avatarFrame
            });
        }

        socket.on('room_members_updated', ({ roomId, members }) => {
            if (roomId === currentRoom) {
               setRoomListeners(members);
            }
        });

        socket.on('sync_requested', (data) => {
            console.log('Sync requested by:', data.requester);
            if (isPlaying && currentTrack) {
                socket.emit('sync_playback', {
                    roomId: currentRoom || 'listening_party',
                    track: currentTrack,
                    progress: audioRef.current.currentTime,
                    isPlaying: true,
                    sender: socket.id // Identify as the responder
                });
            }
        });

        socket.on('playback_synced', (data) => {
            console.log('Playback Synced Event:', data);
            // Only auto-sync if we are in a room and not the sender
            if (data.sender !== socket.id) {
                // If it's a new track, load it.
                if (data.track && data.track.id !== currentTrack?.id) {
                    setCurrentTrack(data.track);
                    // If the room was already playing, we should probably start playing too
                    if (data.isPlaying && !isPlaying) {
                        setIsPlaying(true);
                    }
                }
                
                if (audioRef.current && data.progress !== undefined) {
                    const diff = Math.abs(audioRef.current.currentTime - data.progress);
                    if (diff > 3) { // 3 second threshold for auto-correction
                        audioRef.current.currentTime = data.progress;
                    }
                    if (data.isPlaying !== undefined && data.isPlaying !== isPlaying) {
                        setIsPlaying(data.isPlaying);
                    }
                }
            }
        });

        return () => {
            socket.off('global_event');
            socket.off('playback_synced');
            socket.off('sync_requested');
        };
    }, [currentTrack, isPlaying, currentRoom]);


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

    const togglePlay = useCallback(() => {
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        setIsPlaying(prev => {
            const newState = !prev;
            const roomId = currentRoom || 'listening_party';
            socket.emit('sync_playback', {
                roomId,
                track: currentTrack,
                progress: audioRef.current.currentTime,
                isPlaying: newState
            });
            socket.emit('playback_update', {
                username,
                track: currentTrack,
                isPlaying: newState
            });
            return newState;
        });
    }, [currentTrack, username, currentRoom]);



    const playTrack = useCallback(async (track) => {
        hapticImpactLight();
        // Init analyzer on first play if not already done
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
                
                const roomId = currentRoom || 'listening_party';
                socket.emit('sync_playback', {
                    roomId,
                    track: fallbackTrack,
                    progress: 0,
                    isPlaying: true
                });

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
    }, [currentTrack, togglePlay, username, isPublicSession, currentRoom]);


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
            const roomId = currentRoom || 'listening_party';
            socket.emit('sync_playback', {
                roomId,
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
        togglePublicSession: () => setIsPublicSession(prev => !prev),
        currentRoom,
        roomListeners,
        joinMusicRoom: (roomId) => {
            setCurrentRoom(roomId);
            socket.emit('join_room', roomId);
            socket.emit('request_sync', { roomId, requester: username });
        },
        leaveMusicRoom: () => {
            setCurrentRoom(null);
            setRoomListeners([]);
        },
        voteSong: (communityId, trackId, vote) => {
            hapticImpactMedium();
            socket.emit('vote_song', { communityId, trackId, vote });
        },
        sendBeat: async (targetUsername, track) => {
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
        }
    };


    return (
        <MusicContext.Provider value={value}>
            {children}
        </MusicContext.Provider>
    );
};

export default MusicProvider;



