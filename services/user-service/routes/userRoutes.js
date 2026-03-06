const express = require('express');
const router = express.Router();
const User = require('../../../shared/models/User');
const Report = require('../../../shared/models/Report');
const authenticate = require('../../../shared/middleware/auth');
const auditLogger = require('../../../shared/auditLogger');

// GET /api/moderation/reports (CONSOLIDATED)
router.get('/api/moderation/reports', async (req, res) => {
    try {
        const reports = await Report.find({}).sort({ createdAt: -1 });
        res.json(reports);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/users/me/public-key
router.post('/me/public-key', authenticate, async (req, res) => {
    try {
        const { publicKey } = req.body;
        const user = await User.findOneAndUpdate(
            { email: req.user.userId },
            { $set: { messagingPublicKey: publicKey } },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });

        await auditLogger.log({
            action: auditLogger.Actions.SENSITIVE_DATA_ACCESS,
            actorUserId: user.email,
            reason: 'Encryption Public Key registered'
        });

        res.json({ success: true, publicKey: user.messagingPublicKey });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/users/:email/update
router.post('/:email/update', async (req, res) => {
    try {
        const { email } = req.params;
        const updates = req.body;
        const user = await User.findOneAndUpdate({ email }, { $set: updates }, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });

        await auditLogger.log({
            action: 'PROFILE_UPDATED',
            actorUserId: email,
            metadata: { fields: Object.keys(updates) }
        });

        res.json(user);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// GET /api/users/:email/public-key
router.get('/:email/public-key', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email }).select('messagingPublicKey');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ publicKey: user.messagingPublicKey });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/users/:id/follow
router.post('/:id/follow', async (req, res) => {
    console.log('[USER-ROUTE] Hit POST /:id/follow');
    try {
        const { id } = req.params;
        const { followerId } = req.body;

        const target = await User.findById(id);
        const follower = await User.findById(followerId);

        if (!target || !follower) return res.status(404).json({ error: 'User not found' });

        if (!target.followers.includes(followerId)) {
            target.followers.push(followerId);
            target.stats.followers = target.followers.length;
            await target.save();

            follower.following.push(id);
            follower.stats.following = follower.following.length;
            await follower.save();
        }

        res.json({ success: true, target, follower });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/users/:id/block
router.post('/:id/block', authenticate, async (req, res) => {
    try {
        const { id } = req.params; // Target to block
        const requesterId = req.user.userId;

        const requester = await User.findOne({ email: requesterId });
        const target = await User.findById(id);

        if (!requester || !target) return res.status(404).json({ error: 'User not found' });

        // Add to blockedUsers list
        if (!requester.blockedUsers.includes(target.email)) {
            requester.blockedUsers.push(target.email);
            // Also unfollow automatically
            requester.following = requester.following.filter(f => f !== String(target._id));
            target.followers = target.followers.filter(f => f !== String(requester._id));

            await requester.save();
            await target.save();

            await auditLogger.log({
                action: 'USER_BLOCKED',
                actorUserId: requesterId,
                targetUserId: target.email
            });
        }

        res.json({ success: true, blockedUsers: requester.blockedUsers });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/users/:id/unblock
router.post('/:id/unblock', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.user.userId;

        const requester = await User.findOne({ email: requesterId });
        const target = await User.findById(id);

        if (!requester || !target) return res.status(404).json({ error: 'User not found' });

        requester.blockedUsers = requester.blockedUsers.filter(u => u !== target.email && u !== target.username && u !== String(target._id));
        await requester.save();

        res.json({ success: true, blockedUsers: requester.blockedUsers });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/users/:identifier (MOVED TO BOTTOM)
router.get('/:identifier', async (req, res) => {
    console.log('[USER-ROUTE] Hit /:identifier with:', req.params.identifier);
    try {
        const { identifier } = req.params;
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }, { id: identifier }]
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
