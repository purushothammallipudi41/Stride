import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import config from '../config';

const GamificationContext = createContext(null);

export const useGamification = () => {
    const ctx = useContext(GamificationContext);
    if (!ctx) return { xp: 0, level: 1, streak: 0, weeklyXp: 0, rank: null, achievements: [], loading: true };
    return ctx;
};

export const GamificationProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [gamification, setGamification] = useState({
        xp: 0, level: 1, streak: 0, weeklyXp: 0, rank: null,
        achievements: [], xpInCurrentLevel: 0, xpForNextLevel: 500, loading: true
    });
    const [newlyUnlocked, setNewlyUnlocked] = useState([]); // freshly earned achievements

    const fetchProfile = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${config.API_URL}/api/gamification/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGamification(prev => ({ ...prev, ...data, loading: false }));
            }
        } catch (e) {
            console.error('[GAMI] profile fetch failed', e);
            setGamification(prev => ({ ...prev, loading: false }));
        }
    }, [token]);

    const doCheckin = useCallback(async () => {
        if (!token) return;
        const lastCheckin = localStorage.getItem('gami_checkin_date');
        const today = new Date().toISOString().split('T')[0];
        if (lastCheckin === today) return; // Already checked in today

        try {
            const res = await fetch(`${config.API_URL}/api/gamification/checkin`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('gami_checkin_date', today);
                if (data.newAchievements?.length > 0) {
                    setNewlyUnlocked(data.newAchievements);
                    setTimeout(() => setNewlyUnlocked([]), 5000);
                }
                await fetchProfile(); // Refresh profile with updated XP
            }
        } catch (e) {
            console.error('[GAMI] checkin failed', e);
        }
    }, [token, fetchProfile]);

    useEffect(() => {
        if (user && token) {
            fetchProfile();
            doCheckin();
        }
    }, [user, token, fetchProfile, doCheckin]);

    return (
        <GamificationContext.Provider value={{ ...gamification, newlyUnlocked, refresh: fetchProfile }}>
            {children}
        </GamificationContext.Provider>
    );
};

export default GamificationContext;
