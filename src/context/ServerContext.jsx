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
            .then(data => {
                console.log("[ServerContext] Fetched servers:", data.length);
                setServers(data);
            })
            .catch(err => console.error("[ServerContext] Failed to fetch communities:", err));


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


        socket.on('community_updated', ({ communityId, community }) => {
            console.log("[ServerContext] Community updated:", communityId);
            setServers(prev => prev.map(s => s._id === communityId ? community : s));
        });

        return () => {
            socket.off('initial_activity');
            socket.off('activity_broadcast');
            socket.off('user_disconnected');
            socket.off('global_event');
            socket.off('jukebox_updated');
            socket.off('community_updated');
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


    const updateMemberRole = async (communityId, userId, role) => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/communities/${communityId}/members/${userId}/role`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': user._id
                },
                body: JSON.stringify({ role })
            });
            const updatedData = await response.json();
            if (updatedData.community) {
                setServers(prev => prev.map(s => s._id === communityId ? updatedData.community : s));
            }
            return updatedData;
        } catch (error) {
            console.error("Failed to update role:", error);
        }
    };

    const kickMember = async (communityId, userId) => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/communities/${communityId}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'x-user-id': user._id }
            });
            const updatedData = await response.json();
            if (updatedData.community) {
                setServers(prev => prev.map(s => s._id === communityId ? updatedData.community : s));
            }
            return updatedData;
        } catch (error) {
            console.error("Failed to kick member:", error);
        }
    };

    const value = {
        servers,
        realTimeActivity,
        addCommunity,
        joinCommunity,
        updateMemberRole,
        kickMember
    };

    return (
        <ServerContext.Provider value={value}>
            {children}
        </ServerContext.Provider>
    );
};
