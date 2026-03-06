import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import config from '../config';

const NativePermissions = () => {
    useEffect(() => {
        // Only run on native platforms
        if (!Capacitor.isNativePlatform()) return;

        const authToken = localStorage.getItem('token') || sessionStorage.getItem('token');

        const setupPushNotifications = async () => {
            try {
                // 1. Request permission
                const pushPerms = await PushNotifications.checkPermissions();
                let finalState = pushPerms.receive;

                if (pushPerms.receive === 'prompt' || pushPerms.receive === 'prompt-with-rationale') {
                    const result = await PushNotifications.requestPermissions();
                    finalState = result.receive;
                }

                if (finalState !== 'granted') {
                    console.warn('[Push] Permission not granted:', finalState);
                    return;
                }

                // 2. Register device with APNS/FCM
                /* 
                try {
                    await PushNotifications.register();
                    console.log('[Push] Registered successfully');
                } catch (regError) {
                    console.warn('[Push] Registration failed (likely missing config):', regError);
                }
                */
                console.warn('[Push] Skipping registration - Firebase configuration (google-services.json) is missing.');

                // 3. Capture FCM/APNS token and send to backend
                PushNotifications.addListener('registration', async (fcmToken) => {
                    console.log('[Push] FCM Token:', fcmToken.value);
                    if (authToken && fcmToken.value) {
                        try {
                            await fetch(`${config.API_URL}/api/users/push-token`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${authToken}`
                                },
                                body: JSON.stringify({ token: fcmToken.value })
                            });
                            console.log('[Push] Token stored on backend');
                        } catch (err) {
                            console.warn('[Push] Failed to store token:', err);
                        }
                    }
                });

                // 4. Handle push notification received while app is in foreground
                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('[Push] Foreground notification:', notification);
                    // Schedule a local notification to show it visually
                    LocalNotifications.schedule({
                        notifications: [{
                            id: Date.now(),
                            title: notification.title || 'Stride',
                            body: notification.body || '',
                            extra: notification.data || {},
                            smallIcon: 'ic_launcher_round',
                        }]
                    }).catch(err => console.warn('[Push] Local notify failed:', err));
                });

                // 5. Handle push notification tap (background/killed)
                PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                    const data = action.notification.data;
                    console.log('[Push] Tap action data:', data);

                    // Deep-link handling: route to the right server/channel or DM
                    if (data?.serverId && data?.channelId) {
                        window.location.href = `/servers/${data.serverId}`;
                    } else if (data?.dmEmail) {
                        window.location.href = `/messages`;
                    }
                });

                PushNotifications.addListener('registrationError', (err) => {
                    console.error('[Push] Registration error:', err.error);
                });

            } catch (pushErr) {
                console.warn('[Push] Setup error (expected without Firebase config):', pushErr.message);
            }
        };

        const requestPermissions = async () => {
            console.log('[Native] Starting primary permission sequence...');
            try {
                // Local Notifications
                console.log('[Native] Checking LocalNotifications...');
                if (Capacitor.isPluginAvailable('LocalNotifications')) {
                    const localPerms = await LocalNotifications.checkPermissions();
                    if (localPerms.display === 'prompt') {
                        await LocalNotifications.requestPermissions();
                    }
                    console.log('[Native] LocalNotifications ready');
                }

                // Camera & Photos
                console.log('[Native] Checking Camera...');
                if (Capacitor.isPluginAvailable('Camera')) {
                    const cameraPerms = await Camera.checkPermissions();
                    if (cameraPerms.camera === 'prompt' || cameraPerms.photos === 'prompt') {
                        await Camera.requestPermissions();
                    }
                    console.log('[Native] Camera ready');
                }

                // Microphone
                console.log('[Native] Checking Microphone...');
                try {
                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        await navigator.mediaDevices.getUserMedia({ audio: true })
                            .then(s => s.getTracks().forEach(t => t.stop()));
                        console.log('[Native] Microphone ready');
                    }
                } catch (micErr) {
                    console.warn('[Native] Microphone permission error:', micErr);
                }

                // Push Notifications (Full implementation)
                console.log('[Native] Starting Push setup...');
                await setupPushNotifications();
                console.log('[Native] Permission sequence finished');

            } catch (error) {
                console.error('[Native] CRITICAL PERMISSION ERROR:', error);
                const logs = JSON.parse(localStorage.getItem('stride_native_logs') || '[]');
                logs.push({ timestamp: new Date().toISOString(), error: error.toString() });
                localStorage.setItem('stride_native_logs', JSON.stringify(logs.slice(-5)));
            }
        };

        // Delay slightly to ensure Capacitor bridge is fully ready
        console.log('[Native] Platform:', Capacitor.getPlatform(), 'Scheduling permissions in 2s');
        const timer = setTimeout(requestPermissions, 2000);
        return () => clearTimeout(timer);
    }, []);

    return null;
};

export default NativePermissions;
