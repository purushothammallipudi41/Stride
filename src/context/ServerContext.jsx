import { useState, useEffect } from 'react';


import socket from '../services/socket';

import { ServerContext } from './ServerContextObject';





export const ServerProvider = ({ children }) => {
    const [servers, setServers] = useState([]);
    const [realTimeActivity, setRealTimeActivity] = useState([]);

    const matchCommunityId = (server, idOrName) => {
        if (!server || !idOrName) return false;
        const target = String(idOrName);
        return String(server._id) === target || 
               (server.id && String(server.id) === target) || 
               (server.name && server.name === idOrName);
    };

    useEffect(() => {
        // Fetch existing communities from backend
        fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'}/api/communities`)
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
                    if (prev.find(s => matchCommunityId(s, event.data._id))) return prev;
                    return [...prev, event.data];
                });
            }
        });

        socket.on('jukebox_updated', ({ communityId, queue }) => {
            console.log("[ServerContext] Jukebox updated (Socket):", communityId, "Queue size:", queue?.length);
            setServers(prev => prev.map(s => 
                matchCommunityId(s, communityId) ? { ...s, jukeboxQueue: queue } : s
            ));
        });


        socket.on('community_updated', ({ communityId, community }) => {
            if (community && (community._id || community.id)) {
                setServers(prev => prev.map(s => matchCommunityId(s, communityId) ? community : s));
            }
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
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'}/api/communities`, {
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
            console.log("[ServerContext] Joining community (API Request):", communityId, "for user:", userId);
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'}/api/communities/${communityId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error("[ServerContext] Join API Error:", errorData);
                return errorData;
            }

            const updated = await response.json();
            
            if (updated && (updated._id || updated.id)) {
                setServers(prev => prev.map(s => matchCommunityId(s, communityId) ? updated : s));
            }
            
            socket.emit('join_community', communityId);
            return updated;
        } catch (error) {
            console.error("Failed to join community:", error);
        }
    };


    const updateMemberRole = async (communityId, userId, role) => {
        try {
            let user = {};
            try {
                user = JSON.parse(localStorage.getItem('user') || '{}');
            } catch {
                user = {};
            }
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'}/api/communities/${communityId}/members/${userId}/role`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': user._id
                },
                body: JSON.stringify({ role })
            });
            const updatedData = await response.json();
            if (updatedData.community) {
                setServers(prev => prev.map(s => matchCommunityId(s, communityId) ? updatedData.community : s));
            }
            return updatedData;
        } catch (error) {
            console.error("Failed to update role:", error);
        }
    };

    const kickMember = async (communityId, userId) => {
        try {
            let user = {};
            try {
                user = JSON.parse(localStorage.getItem('user') || '{}');
            } catch {
                user = {};
            }
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'}/api/communities/${communityId}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'x-user-id': user._id }
            });
            const updatedData = await response.json();
            if (updatedData.community) {
                setServers(prev => prev.map(s => matchCommunityId(s, communityId) ? updatedData.community : s));
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
