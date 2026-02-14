import { createContext, useState, useContext, useEffect } from 'react';
import config from '../config';

const ServerContext = createContext();

export const useServer = () => useContext(ServerContext);

export const ServerProvider = ({ children }) => {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${config.API_URL}/api/servers`)
            .then(res => res.json())
            .then(data => {
                setServers(data);
                setLoading(false);
            })
            .catch(err => console.error("Failed to fetch servers:", err));
    }, []);

    const addServer = async (name) => {
        try {
            const res = await fetch(`${config.API_URL}/api/servers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const newServer = await res.json();
            setServers([...servers, newServer]);
            return newServer;
        } catch (err) {
            console.error("Failed to add server:", err);
        }
    };

    const fetchMessages = async (serverId, channelId) => {
        try {
            const res = await fetch(`${config.API_URL}/api/servers/${serverId}/messages/${channelId}`);
            return await res.json();
        } catch (err) {
            console.error("Failed to fetch messages:", err);
            return [];
        }
    };

    const sendServerMessage = async (serverId, channelId, messageData) => {
        try {
            const res = await fetch(`${config.API_URL}/api/servers/${serverId}/messages/${channelId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });
            return await res.json();
        } catch (err) {
            console.error("Failed to send server message:", err);
        }
    };


    const createChannel = async (serverId, channelName, type = 'text') => {
        try {
            const res = await fetch(`${config.API_URL}/api/servers/${serverId}/channels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: channelName, type })
            });

            if (res.ok) {
                const updatedServer = await res.json();
                setServers(prev => prev.map(s => s.id === parseInt(serverId) ? updatedServer : s));
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to create channel:", err);
            return false;
        }
    };

    const leaveServer = async (serverId, userEmail) => {
        try {
            const res = await fetch(`${config.API_URL}/api/servers/${serverId}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail })
            });
            if (res.ok) {
                // Remove server from local state immediately
                setServers(prev => prev.filter(s => s.id !== parseInt(serverId)));
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to leave server:", err);
            return false;
        }
    };

    const deleteServer = async (serverId, userEmail) => {
        try {
            const res = await fetch(`${config.API_URL}/api/servers/${serverId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail })
            });
            if (res.ok) {
                setServers(prev => prev.filter(s => s.id !== parseInt(serverId)));
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to delete server:", err);
            return false;
        }
    };

    const updateServer = async (serverId, updates) => {
        try {
            const res = await fetch(`${config.API_URL}/api/servers/${serverId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) {
                const updatedServer = await res.json();
                setServers(prev => prev.map(s => s.id === parseInt(serverId) ? updatedServer : s));
                return true;
            }
            return false;
        } catch (err) {
            console.error("Failed to update server:", err);
            return false;
        }
    };

    const updateServerProfile = async (serverId, userId, profileData) => {
        try {
            const res = await fetch(`${config.API_URL}/api/users/${userId}/server-profile/${serverId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });
            if (res.ok) {
                return await res.json();
            }
            return false;
        } catch (err) {
            console.error("Failed to update server profile:", err);
            return false;
        }
    };

    const value = {
        servers,
        addServer,
        fetchMessages,
        sendServerMessage,
        createChannel,
        leaveServer,
        deleteServer,
        updateServer,
        updateServerProfile,
        loading
    };

    return (
        <ServerContext.Provider value={value}>
            {children}
        </ServerContext.Provider>
    );
};
