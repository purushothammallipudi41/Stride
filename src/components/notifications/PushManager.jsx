import { useEffect } from 'react';
import { getStoredUser } from '../../utils/storage';
import { BASE_URL } from '../../utils/api';

const VAPID_PUBLIC_KEY = 'BF_296-sQ_Y827Z-qF68-rFm9-e_6-f5_v2-f9_v2-f9_v2-f9_v2-f9_v2-f9_v2-f9_v2-f9_v2'; // Must match backend

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

const PushManager = () => {
    const user = getStoredUser();

    useEffect(() => {
        if (!user?._id || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }

        const subscribeUser = async () => {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                // Check for existing subscription
                let subscription = await registration.pushManager.getSubscription();
                
                if (!subscription && Notification.permission === 'granted') {
                    // Try to re-subscribe if permission exists but subscription is lost
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });
                }

                if (subscription) {
                    // Sync with backend
                    await fetch(`${BASE_URL}/api/notifications/subscribe`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: user._id,
                            subscription
                        })
                    });
                    console.log('[Push] Subscription synced with rhythm backend.');
                }
            } catch (err) {
                console.error('[Push] Management error:', err);
            }
        };

        subscribeUser();
    }, [user?._id]);

    return null; // Logic-only component
};

export default PushManager;

export const requestPushPermission = async (userId) => {
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && ('serviceWorker' in navigator)) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            await fetch(`${BASE_URL}/api/notifications/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, subscription })
            });
            return true;
        } catch (err) {
            console.error('[Push] Permission subscription failed:', err);
            return false;
        }
    }
    return false;
};
