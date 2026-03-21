import { useCallback } from 'react';

export const useSound = () => {
    const playSound = useCallback((type) => {
        const sounds = {
            notify: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
            gift: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // shimmer/magic
            tip: 'https://assets.mixkit.co/active_storage/sfx/1070/1070-preview.mp3', // k-ching
            message: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'
        };

        const url = sounds[type];
        if (url) {
            const audio = new Audio(url);
            audio.volume = 0.4;
            audio.play().catch(err => console.log("Audio play blocked:", err));
        }
    }, []);

    return { playSound };
};
