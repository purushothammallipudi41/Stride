import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const hapticImpact = async (style = ImpactStyle.Light) => {
    try {
        await Haptics.impact({ style });
    } catch (e) {
        // Fallback for web/dev
        console.debug('Haptics (Impact) triggered:', style);
    }
};

export const hapticNotification = async (type = NotificationType.Success) => {
    try {
        await Haptics.notification({ type });
    } catch (e) {
        // Fallback for web/dev
        console.debug('Haptics (Notification) triggered:', type);
    }
};

export const hapticVibrate = async () => {
    try {
        await Haptics.vibrate();
    } catch (e) {
        console.debug('Haptics (Vibrate) triggered');
    }
};

export const hapticSelection = async () => {
    try {
        await Haptics.selectionStart();
        setTimeout(() => Haptics.selectionEnd(), 100);
    } catch (e) {
        console.debug('Haptics (Selection) triggered');
    }
};
