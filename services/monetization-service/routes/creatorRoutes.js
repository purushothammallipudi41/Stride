const express = require('express');
const router = express.Router();
const User = require('../../../shared/models/User');
const Post = require('../../../shared/models/Post');
const Transaction = require('../../../shared/models/Transaction');
const Subscription = require('../../../shared/models/Subscription');
const authenticate = require('../../../shared/middleware/auth');
const cache = require('../../../shared/redisClient');
const logger = require('../../../shared/logger');

// POST /tip
router.post('/tip', authenticate, async (req, res) => {
    try {
        const { recipientEmail, amount, message } = req.body;
        const senderEmail = req.user.userId;

        if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
        if (senderEmail === recipientEmail) return res.status(400).json({ error: 'Cannot tip yourself' });

        const sender = await User.findOne({ email: senderEmail });
        const recipient = await User.findOne({ email: recipientEmail });

        if (!sender || !recipient) return res.status(404).json({ error: 'User not found' });
        if (sender.vibeTokens < amount) return res.status(400).json({ error: 'Insufficient tokens' });

        // Transactional movement
        sender.vibeTokens -= amount;
        recipient.vibeTokens += amount;

        await sender.save();
        await recipient.save();

        await Transaction.create({
            fromEmail: senderEmail,
            toEmail: recipientEmail,
            amount: amount,
            type: 'tip',
            description: message || `Tip from ${sender.username}`
        });

        // Real-time updates via Redis
        await cache.publish('user_updates', {
            type: 'balance_update',
            email: senderEmail,
            newBalance: sender.vibeTokens
        });
        await cache.publish('user_updates', {
            type: 'balance_update',
            email: recipientEmail,
            newBalance: recipient.vibeTokens,
            notification: {
                type: 'tip_received',
                from: sender.username,
                amount
            }
        });

        res.json({ success: true, newBalance: sender.vibeTokens });
    } catch (err) {
        logger.error('Tip error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /gift
router.post('/gift', authenticate, async (req, res) => {
    try {
        const { recipientEmail, giftType, spaceId } = req.body;
        const senderEmail = req.user.userId;

        const GIFT_PRICES = {
            'heart': 10,
            'diamond': 100,
            'rocket': 500,
            'trophy': 1000
        };

        const amount = GIFT_PRICES[giftType] || 10;
        if (senderEmail === recipientEmail) return res.status(400).json({ error: 'Cannot gift yourself' });

        const sender = await User.findOne({ email: senderEmail });
        const recipient = await User.findOne({ email: recipientEmail });

        if (!sender || !recipient) return res.status(404).json({ error: 'User not found' });
        if (sender.vibeTokens < amount) return res.status(400).json({ error: 'Insufficient tokens' });

        sender.vibeTokens -= amount;
        recipient.vibeTokens += amount;

        await sender.save();
        await recipient.save();

        await Transaction.create({
            fromEmail: senderEmail,
            toEmail: recipientEmail,
            amount,
            type: 'gift',
            description: `Sent a ${giftType} gift!`
        });

        // Publish to user balance updates
        await cache.publish('user_updates', {
            type: 'balance_update',
            email: senderEmail,
            newBalance: sender.vibeTokens
        });

        // Publish gift event for the specific space/room
        await cache.publish('audio_space_events', JSON.stringify({
            event: 'gift_sent',
            data: {
                spaceId,
                giftType,
                sender: sender.username,
                recipient: recipient.username
            }
        }));

        res.json({ success: true, newBalance: sender.vibeTokens });
    } catch (err) {
        logger.error('Gift error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /unlock-post
router.post('/unlock-post', authenticate, async (req, res) => {
    try {
        const { postId } = req.body;
        const userEmail = req.user.userId;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (!post.isPaywalled) return res.status(400).json({ error: 'Post is not gated' });
        if (post.purchasedBy.includes(userEmail)) return res.json({ success: true, alreadyUnlocked: true });

        const buyer = await User.findOne({ email: userEmail });
        const creator = await User.findOne({ email: post.userEmail || post.userId }); // userId often used for email in this codebase

        if (!buyer) return res.status(404).json({ error: 'Buyer not found' });
        if (buyer.vibeTokens < post.unlockPrice) return res.status(400).json({ error: 'Insufficient tokens' });

        // Move tokens
        buyer.vibeTokens -= post.unlockPrice;
        if (creator) {
            creator.vibeTokens += post.unlockPrice;
            await creator.save();
        }
        await buyer.save();

        post.purchasedBy.push(userEmail);
        await post.save();

        await Transaction.create({
            fromEmail: userEmail,
            toEmail: post.userEmail || post.userId,
            amount: post.unlockPrice,
            type: 'content_unlock',
            referenceId: postId,
            description: `Unlocked post by ${post.username}`
        });

        res.json({ success: true, newBalance: buyer.vibeTokens });
    } catch (err) {
        logger.error('Unlock error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /earnings
router.get('/earnings', authenticate, async (req, res) => {
    try {
        const userEmail = req.user.userId;
        const transactions = await Transaction.find({ toEmail: userEmail }).sort({ timestamp: -1 }).limit(50);

        const totalEarnings = await Transaction.aggregate([
            { $match: { toEmail: userEmail, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            history: transactions,
            total: totalEarnings[0]?.total || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
