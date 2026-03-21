import { createContext } from 'react';

const MusicContext = createContext({
    playlists: [],
    createPlaylist: () => {},
    addToPlaylist: () => {},
});

export default MusicContext;
