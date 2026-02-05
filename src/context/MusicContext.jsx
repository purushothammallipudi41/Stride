import { createContext, useState, useContext, useRef, useEffect } from 'react';

const MusicContext = createContext();

export const useMusic = () => useContext(MusicContext);

export const MusicProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState({
        title: "Midnight City",
        artist: "M83",
        cover: null, // Placeholder
        duration: 243, // seconds
        url: null // Placeholder for real audio
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(0.7);

    // Simulation of audio progress for now
    useEffect(() => {
        let interval;
        if (isPlaying) {
            interval = setInterval(() => {
                setProgress((prev) => (prev >= currentTrack.duration ? 0 : prev + 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentTrack]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const nextTrack = () => {
        console.log("Next track");
        // Logic to fetch next track
        setProgress(0);
    };

    const prevTrack = () => {
        console.log("Prev track");
        // Logic to fetch prev track
        setProgress(0);
    };

    const playTrack = (track) => {
        setCurrentTrack({
            ...track,
            url: null // In a real app, this would be the audio source
        });
        setIsPlaying(true);
        setProgress(0);
    };

    const value = {
        currentTrack,
        isPlaying,
        progress,
        volume,
        togglePlay,
        nextTrack,
        prevTrack,
        playTrack,
        setVolume
    };

    return (
        <MusicContext.Provider value={value}>
            {children}
        </MusicContext.Provider>
    );
};
