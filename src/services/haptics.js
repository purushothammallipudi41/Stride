import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Trigger a light tactile feedback for general UI interactions.
 */
export const hapticImpactLight = async () => {
    try {
        await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
        // Falls back silently on unsupported platforms (browsers)
    }
};

/**
 * Trigger a medium tactile feedback for more significant actions (e.g. upvotes).
 */
export const hapticImpactMedium = async () => {
    try {
        await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
        // Falls back silently
    }
};

/**
 * Trigger a success feedback sequence (e.g. joining a room).
 */
export const hapticNotificationSuccess = async () => {
    try {
        await Haptics.notification({ type: 'SUCCESS' });
    } catch {
        // Falls back silently
    }
};

/**
 * Trigger a vibration feedback.
 */
export const hapticVibrate = async () => {
    try {
        await Haptics.vibrate();
    } catch {
        // Falls back silently
    }
};
