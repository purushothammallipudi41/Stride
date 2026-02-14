import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

const NativePermissions = () => {
    useEffect(() => {
        // Only run on native platforms
        if (!Capacitor.isNativePlatform()) return;

        const requestPermissions = async () => {
            try {
                // 1. Local Notifications (Safe, doesn't require Firebase)
                const localPerms = await LocalNotifications.checkPermissions();
                if (localPerms.display === 'prompt') {
                    await LocalNotifications.requestPermissions();
                    console.log('[NativePermissions] Local notifications requested');
                }

                // 2. Camera & Photos (Used for posts/stories)
                const cameraPerms = await Camera.checkPermissions();
                if (cameraPerms.camera === 'prompt' || cameraPerms.photos === 'prompt') {
                    await Camera.requestPermissions();
                    console.log('[NativePermissions] Camera/Photos requested');
                }

                // 3. Microphone (Used for calls/videos)
                try {
                    // This will trigger the native prompt if not already granted
                    await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop()));
                    console.log('[NativePermissions] Microphone requested');
                } catch (micErr) {
                    console.warn('[NativePermissions] Microphone permission error:', micErr);
                }

                // 4. Push Notifications (Experimental - avoiding register() to prevent crash without Firebase)
                try {
                    const pushPerms = await PushNotifications.checkPermissions();
                    if (pushPerms.receive === 'prompt') {
                        await PushNotifications.requestPermissions();
                        console.log('[NativePermissions] Push notification perms requested');
                    }
                } catch (pushErr) {
                    console.warn('[NativePermissions] Push plugin error (expected if Firebase missing):', pushErr);
                }

            } catch (error) {
                console.error('[NativePermissions] Critical error in permission logic:', error);
            }
        };

        // Delay slightly to ensure bridge is fully ready
        setTimeout(requestPermissions, 1000);
    }, []);

    return null;
};

export default NativePermissions;
