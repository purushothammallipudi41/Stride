import { createContext, useState, useContext, useEffect } from 'react';

const ServerContext = createContext();

export const useServer = () => useContext(ServerContext);

export const ServerProvider = ({ children }) => {
    // Initial mock data
    const [servers, setServers] = useState([
        {
            id: 1,
            name: "Lo-Fi Lounge",
            icon: "🎧",
            channels: ["general", "music-sharing", "voice-chat"],
            members: 120
        },
        {
            id: 2,
            name: "Producer's Hub",
            icon: "🎹",
            channels: ["general", "collabs", "feedback"],
            members: 85
        }
    ]);

    const addServer = (name) => {
        const newServer = {
            id: Date.now(),
            name,
            icon: name.charAt(0).toUpperCase(),
            channels: ["general"],
            members: 1
        };
        setServers([...servers, newServer]);
    };

    const value = {
        servers,
        addServer
    };

    return (
        <ServerContext.Provider value={value}>
            {children}
        </ServerContext.Provider>
    );
};
