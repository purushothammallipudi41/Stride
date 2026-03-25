import { createContext } from 'react';

const MusicContext = createContext({
    allSongs: [],
    currentTrack: null,
    isPlaying: false,
    playTrack: () => {},
    joinMusicRoom: () => {},
    leaveMusicRoom: () => {},
    playlists: [],
    createPlaylist: () => {},
    addToPlaylist: () => {},
});

export default MusicContext;
