const webpush = require('web-push');
const { User } = require('./DatabasePulse.cjs');

const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BLYw4hzos3fJvyOZR33U_zu7rMf6QCxvdlgvwgRAnLWfKx8UP1W3UeM0Yeh4TFxT5-4nSUHza25tHhE5cviByvI',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'IiXMKNrJ3xdzI-20nTMHD5M2tEs7QmNJJ6SYJeu1Mos'
};

try {
    if (vapidKeys.publicKey && vapidKeys.publicKey !== 'placeholder' && !vapidKeys.publicKey.startsWith('BF_')) {
        webpush.setVapidDetails(
            'mailto:support@vyxapp.in',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
        console.log('[PushService] VAPID intelligence initialized successfully.');
    } else {
        console.warn('[PushService] Warning: VAPID keys not configured. Push notifications will be inactive.');
    }
} catch (err) {
    console.error('[PushService] Critical Error: VAPID initialization failed. Push notifications disabled.', err.message);
}

class PushService {
    static async sendNotification(userId, payload) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
                return;
            }

            const pushPayload = JSON.stringify({
                title: payload.title || 'Vyx Alert',
                body: payload.body || 'New frequency detected.',
                icon: payload.icon || '/vyx-logo.png',
                data: payload.data || {}
            });

            // Send to all registered devices for this user
            const notifications = user.pushSubscriptions.map(subscription => 
                webpush.sendNotification(subscription, pushPayload)
                    .catch(async (err) => {
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            // Subscription expired or removed
                            user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== subscription.endpoint);
                            await user.save();
                        }
                        console.error('Push notification failed for subscription:', err);
                    })
            );

            await Promise.all(notifications);
        } catch (err) {
            console.error('PushService Error:', err);
        }
    }

    static async sendToUserByName(username, payload) {
        try {
            const user = await User.findOne({ username });
            if (user) {
                return this.sendNotification(user.id || user._id, payload);
            }
        } catch (err) {
            console.error('PushService sendToUserByName Error:', err);
        }
    }
}

module.exports = PushService;
