import { useContext } from 'react';
import MusicContext from '../context/MusicContextObject';

export const useMusic = () => useContext(MusicContext);
