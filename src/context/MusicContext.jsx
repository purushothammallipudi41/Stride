import { createContext, useContext, useState, useRef, useEffect } from 'react';

const MusicContext = createContext();

export const MusicProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [trackList, setTrackList] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.7);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

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
                // Don't auto-skip here to avoid infinite loops if the whole API is down
                setIsPlaying(false);
            });
        }
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

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => {
                console.error("Play toggle failed:", e);
                if (currentTrack) {
                    audioRef.current.src = currentTrack.streamUrl;
                    audioRef.current.load();
                    audioRef.current.play();
                }
            });
        }
        setIsPlaying(!isPlaying);
    };

    const seek = (percent) => {
        if (!audioRef.current || !audioRef.current.duration) return;
        const time = (percent / 100) * audioRef.current.duration;
        audioRef.current.currentTime = time;
        setProgress(percent);
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
    };

    return (
        <MusicContext.Provider value={{
            currentTrack,
            isPlaying,
            volume,
            progress,
            duration,
            playTrack,
            pauseTrack,
            playNext,
            playPrevious,
            togglePlay,
            setVolume,
            seek,
            closePlayer
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
