const express = require('express');
const router = express.Router();
const AudioSpace = require('../../../shared/models/AudioSpace');
const User = require('../../../shared/models/User');
const authenticate = require('../../../shared/middleware/auth');
const cache = require('../../../shared/redisClient');

const EVENT_CHANNEL = 'audio_space_events';

// GET /api/spaces/active
router.get('/active', async (req, res) => {
    try {
        const spaces = await AudioSpace.find({ isLive: true, endedAt: null })
            .sort({ startedAt: -1 })
            .lean();
        res.json(spaces);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/spaces
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, serverId, isVideoEnabled } = req.body;
        const user = await User.findOne({ email: req.user.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const space = await AudioSpace.create({
            title,
            hostEmail: user.email,
            hostUsername: user.username,
            hostAvatar: user.avatar,
            serverId: serverId || null,
            isVideoEnabled: isVideoEnabled || false,
            speakers: [{
                email: user.email,
                username: user.username,
                avatar: user.avatar
            }]
        });

        await cache.publish(EVENT_CHANNEL, { event: 'space-created', data: space });

        res.status(201).json(space);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/spaces/:id/join
router.post('/:id/join', authenticate, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.userId });
        const space = await AudioSpace.findById(req.params.id);
        if (!space) return res.status(404).json({ error: 'Space not found' });

        // Don't add if already listener or speaker
        const isSpeaker = space.speakers.some(s => s.email === user.email);
        const isListener = space.listeners.some(l => l.email === user.email);

        if (!isSpeaker && !isListener) {
            space.listeners.push({
                email: user.email,
                username: user.username,
                avatar: user.avatar
            });
            await space.save();
            await cache.publish(EVENT_CHANNEL, { event: 'space-updated', data: space });
        }

        res.json(space);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/spaces/:id/leave
router.post('/:id/leave', authenticate, async (req, res) => {
    try {
        const space = await AudioSpace.findById(req.params.id);
        if (!space) return res.status(404).json({ error: 'Space not found' });

        space.listeners = space.listeners.filter(l => l.email !== req.user.userId);
        space.speakers = space.speakers.filter(s => s.email !== req.user.userId);
        space.handRaises = space.handRaises.filter(h => h.email !== req.user.userId);

        await space.save();
        await cache.publish(EVENT_CHANNEL, { event: 'space-updated', data: space });

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PATCH /api/spaces/:id/hand
router.patch('/:id/hand', authenticate, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.userId });
        const space = await AudioSpace.findById(req.params.id);
        if (!space) return res.status(404).json({ error: 'Space not found' });

        const isRaised = space.handRaises.some(h => h.email === user.email);
        if (isRaised) {
            space.handRaises = space.handRaises.filter(h => h.email !== user.email);
        } else {
            space.handRaises.push({
                email: user.email,
                username: user.username,
                avatar: user.avatar
            });
        }

        await space.save();
        await cache.publish(EVENT_CHANNEL, { event: 'space-updated', data: space });

        res.json({ raised: !isRaised });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PATCH /api/spaces/:id/approve
router.patch('/:id/approve', authenticate, async (req, res) => {
    try {
        const { speakerEmail } = req.body;
        const space = await AudioSpace.findById(req.params.id);
        if (!space) return res.status(404).json({ error: 'Space not found' });

        if (space.hostEmail !== req.user.userId) {
            return res.status(403).json({ error: 'Only host can approve speakers' });
        }

        const aspirant = space.handRaises.find(h => h.email === speakerEmail);
        if (aspirant) {
            space.speakers.push({
                email: aspirant.email,
                username: aspirant.username,
                avatar: aspirant.avatar
            });
            space.handRaises = space.handRaises.filter(h => h.email !== speakerEmail);
            space.listeners = space.listeners.filter(l => l.email !== speakerEmail);

            await space.save();
            await cache.publish(EVENT_CHANNEL, { event: 'space-updated', data: space });
        }

        res.json(space);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/spaces/:id
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const space = await AudioSpace.findById(req.params.id);
        if (!space) return res.status(404).json({ error: 'Space not found' });

        if (space.hostEmail !== req.user.userId) {
            return res.status(403).json({ error: 'Only host can end space' });
        }

        space.isLive = false;
        space.endedAt = new Date();
        await space.save();

        await cache.publish(EVENT_CHANNEL, { event: 'space-ended', data: { id: space._id } });

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
