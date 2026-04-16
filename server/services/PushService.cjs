const webpush = require('web-push');
const User = require('../models/User.cjs');

// VAPID keys should be generated once and stored in .env
// For this environment, I'll generate them or use these placeholders
// Generate: webpush.generateVAPIDKeys()
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BF_296-sQ_Y827Z-qF68-rFm9-e_6-f5_v2-f9_v2-f9_v2-f9_v2-f9_v2-f9_v2-f9_v2-f9_v2', // Placeholder
    privateKey: process.env.VAPID_PRIVATE_KEY || 'placeholder_private_key'
};

webpush.setVapidDetails(
    'mailto:support@stride.social',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

class PushService {
    static async sendNotification(userId, payload) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
                return;
            }

            const pushPayload = JSON.stringify({
                title: payload.title || 'Stride Alert',
                body: payload.body || 'New rhythm detected.',
                icon: payload.icon || '/stride-logo.png',
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
}

module.exports = PushService;
