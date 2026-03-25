import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Initialize Push Notifications and register listeners.
 */
export const initPushNotifications = async () => {
    try {
        // Request permission
        let permStatus = await PushNotifications.requestPermissions();

        if (permStatus.receive === 'granted') {
            // Register with FCM
            await PushNotifications.register();
        }

        // On success, we should send the token to our backend
        await PushNotifications.addListener('registration', (token) => {
            console.log('Push registration success, token: ' + token.value);
            // TODO: sendTokenToBackend(token.value);
        });

        // Some issue with our setup and push will not work
        await PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Show us the notification payload if the app is open on our device
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
        });

        // Method called when tapping on a notification
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
        });
        
    } catch {
        console.warn('Push Notifications not supported on this platform');
    }
};
