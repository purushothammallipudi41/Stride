import { useState, useEffect } from 'react';
import socket from '../services/socket';
import ActivityContext from './ActivityContextObject';
import { useSound } from '../hooks/useSound';

export const ActivityProvider = ({ children }) => {
    const [userActivities, setUserActivities] = useState({});
    const { playSound } = useSound();

    useEffect(() => {
        const handleActivityUpdate = ({ username, track, isPlaying }) => {
            setUserActivities(prev => ({
                ...prev,
                [username]: { track, isPlaying, lastUpdate: Date.now() }
            }));
        };

        socket.on('user_activity_updated', handleActivityUpdate);
        
        socket.on('global_event', (event) => {
            if (event.type === 'FRAME_GIFTED') {
                playSound('gift');
            }
            if (event.type === 'NEW_MESSAGE') {
                playSound('message');
            }
        });

        // Cleanup old activity (offline users)
        const interval = setInterval(() => {
            const now = Date.now();
            setUserActivities(prev => {
                const next = { ...prev };
                let changed = false;
                for (const user in next) {
                    if (now - next[user].lastUpdate > 30000) { // 30s timeout
                        delete next[user];
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }, 10000);

        return () => {
            socket.off('user_activity_updated', handleActivityUpdate);
            clearInterval(interval);
        };
    }, [playSound]);

    const isUserListening = (username) => {
        return userActivities[username]?.isPlaying || false;
    };

    const getUserTrack = (username) => {
        return userActivities[username]?.track || null;
    };

    return (
        <ActivityContext.Provider value={{ userActivities, isUserListening, getUserTrack }}>
            {children}
        </ActivityContext.Provider>
    );
};

export default ActivityProvider;
