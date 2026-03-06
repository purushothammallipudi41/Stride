import React, { createContext, useContext, useCallback } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const HapticContext = createContext();

export const useHaptics = () => {
    const context = useContext(HapticContext);
    if (!context) {
        throw new Error('useHaptics must be used within a HapticProvider');
    }
    return context;
};

export const HapticProvider = ({ children }) => {
    const impactLight = useCallback(async () => {
        try {
            if (window.Capacitor && window.Capacitor.isPluginAvailable('Haptics')) {
                await Haptics.impact({ style: ImpactStyle.Light });
            }
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    }, []);

    const impactMedium = useCallback(async () => {
        try {
            if (window.Capacitor && window.Capacitor.isPluginAvailable('Haptics')) {
                await Haptics.impact({ style: ImpactStyle.Medium });
            }
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    }, []);

    const impactHeavy = useCallback(async () => {
        try {
            if (window.Capacitor && window.Capacitor.isPluginAvailable('Haptics')) {
                await Haptics.impact({ style: ImpactStyle.Heavy });
            }
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    }, []);

    const vibrate = useCallback(async () => {
        try {
            if (window.Capacitor && window.Capacitor.isPluginAvailable('Haptics')) {
                await Haptics.vibrate();
            }
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    }, []);

    const vibrateSuccess = useCallback(async () => {
        try {
            if (window.Capacitor && window.Capacitor.isPluginAvailable('Haptics')) {
                await Haptics.notification({ type: 'SUCCESS' });
            }
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    }, []);

    const vibrateError = useCallback(async () => {
        try {
            if (window.Capacitor && window.Capacitor.isPluginAvailable('Haptics')) {
                await Haptics.notification({ type: 'ERROR' });
            }
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    }, []);

    const value = {
        impactLight,
        impactMedium,
        impactHeavy,
        vibrate,
        vibrateSuccess,
        vibrateError
    };

    return (
        <HapticContext.Provider value={value}>
            {children}
        </HapticContext.Provider>
    );
};
