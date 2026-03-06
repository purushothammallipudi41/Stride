import React, { createContext, useContext, useEffect, useState } from 'react';

const ShortcutContext = createContext();

export const useShortcuts = () => useContext(ShortcutContext);

export const ShortcutProvider = ({ children }) => {
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Cmd+K or Ctrl+K for Command Palette
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }

            // Esc to close
            if (e.key === 'Escape') {
                setIsCommandPaletteOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleCommandPalette = () => setIsCommandPaletteOpen(prev => !prev);

    const value = {
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        toggleCommandPalette
    };

    return (
        <ShortcutContext.Provider value={value}>
            {children}
        </ShortcutContext.Provider>
    );
};
