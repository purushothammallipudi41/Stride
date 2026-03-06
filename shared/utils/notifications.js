const Notification = require('../models/Notification');
const cache = require('../redisClient');

/**
 * Send a notification to a user
 * @param {Object} data { type, recipientEmail, actorEmail, actorName, actorAvatar, content, targetId }
 */
async function sendNotification(data) {
    try {
        const { type, recipientEmail, actorEmail, actorName, actorAvatar, content, targetId } = data;

        // 1. Save to Database
        const notification = await Notification.create({
            type,
            targetUserEmail: recipientEmail,
            user: {
                email: actorEmail,
                name: actorName,
                avatar: actorAvatar
            },
            content,
            targetId,
            timestamp: new Date(),
            read: false
        });

        // 2. Publish to Redis for real-time delivery via Messaging Service
        await cache.publish('notification_events', {
            event: 'new-notification',
            data: notification
        });

        return notification;
    } catch (err) {
        console.error('[NOTIFICATIONS] Error sending notification:', err.message);
        return null;
    }
}

/**
 * Handle mentions in text
 * @param {string} text 
 * @param {Object} actor { email, username, name, avatar }
 * @param {string} targetId 
 * @param {string} type 'post' | 'comment'
 */
async function handleMentions(text, actor, targetId, type = 'post') {
    if (!text) return;

    const mentionRegex = /@(\w+)/g;
    const mentions = [...new Set(text.match(mentionRegex) || [])];

    if (mentions.length === 0) return;

    const User = require('../models/User');
    const usernames = mentions.map(m => m.substring(1));

    const recipients = await User.find({ username: { $in: usernames } }, 'email username').lean();

    for (const recipient of recipients) {
        if (recipient.email === actor.email) continue; // Don't notify self

        await sendNotification({
            type: 'mention',
            recipientEmail: recipient.email,
            actorEmail: actor.email,
            actorName: actor.name || actor.username,
            actorAvatar: actor.avatar,
            content: `mentioned you in a ${type}`,
            targetId
        });
    }
}

module.exports = {
    sendNotification,
    handleMentions
};
