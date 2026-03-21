import { useState, useEffect } from 'react';


import socket from '../services/socket';

import { ServerContext } from './ServerContextObject';





export const ServerProvider = ({ children }) => {
    const [servers, setServers] = useState([]);
    const [realTimeActivity, setRealTimeActivity] = useState([]);

    useEffect(() => {
        // Fetch existing communities from backend
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/communities`)
            .then(res => res.json())
            .then(data => setServers(data))
            .catch(err => console.error("Failed to fetch communities:", err));


        socket.on('initial_activity', (activities) => {
            setRealTimeActivity(activities);
        });

        socket.on('activity_broadcast', (activity) => {
            setRealTimeActivity(prev => {
                const filtered = prev.filter(a => a.userId !== activity.userId);
                return [...filtered, activity];
            });
        });

        socket.on('user_disconnected', (userId) => {
            setRealTimeActivity(prev => prev.filter(a => a.userId !== userId));
        });

        socket.on('global_event', (event) => {
            if (event.type === 'COMMUNITY_CREATED') {
                setServers(prev => {
                    if (prev.find(s => s._id === event.data._id)) return prev;
                    return [...prev, event.data];
                });
            }
        });

        socket.on('jukebox_updated', ({ communityId, queue }) => {
            setServers(prev => prev.map(s => 
                s._id === communityId ? { ...s, jukeboxQueue: queue } : s
            ));
        });


        return () => {
            socket.off('initial_activity');
            socket.off('activity_broadcast');
            socket.off('user_disconnected');
            socket.off('global_event');
        };
    }, []);

    const addCommunity = async (communityData) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/communities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(communityData)
            });
            const newCommunity = await response.json();
            setServers(prev => [...prev, newCommunity]);
            return newCommunity;
        } catch (error) {
            console.error("Failed to create community:", error);
        }
    };

    const joinCommunity = async (communityId, userId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/communities/${communityId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const updated = await response.json();
            setServers(prev => prev.map(s => s._id === communityId ? updated : s));
            socket.emit('join_community', communityId);
            return updated;
        } catch (error) {
            console.error("Failed to join community:", error);
        }
    };


    const value = {
        servers,
        realTimeActivity,
        addCommunity,
        joinCommunity

    };

    return (
        <ServerContext.Provider value={value}>
            {children}
        </ServerContext.Provider>
    );
};
