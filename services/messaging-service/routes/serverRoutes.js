const express = require('express');
const router = express.Router();
const ServerModel = require('../../../shared/models/Server');
const ServerMessage = require('../../../shared/models/ServerMessage');
const AuditLog = require('../../../shared/models/AuditLog');
const Emoji = require('../../../shared/models/Emoji');
const Role = require('../../../shared/models/Role');
const authenticate = require('../../../shared/middleware/auth');
const strideAIEngine = require('../../../shared/utils/StrideAIEngine');
const crypto = require('crypto');



// GET / - Get all servers
router.get('/', async (req, res) => {
    try {
        const servers = await ServerModel.find({}).sort({ createdAt: -1 });
        res.json(servers);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /explore - Get public servers
router.get('/explore', async (req, res) => {
    try {
        const { q, category } = req.query;
        const query = { isPublic: { $ne: false } };

        if (q) query.name = { $regex: q, $options: 'i' };
        if (category && category !== 'All') query.category = category;

        const servers = await ServerModel.find(query).sort({ memberCount: -1 });
        res.json(servers);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /joined - Get servers the user is a member of
router.get('/joined', authenticate, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.email;
        const servers = await ServerModel.find({
            'members.userId': userId
        });
        res.json(servers);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /:serverId
router.get('/:serverId', async (req, res) => {
    try {
        // Ensure serverId is numeric if possible, or handle string IDs
        const query = isNaN(req.params.serverId)
            ? { _id: req.params.serverId }
            : { id: parseInt(req.params.serverId) };

        const server = await ServerModel.findOne(query);
        if (!server) return res.status(404).json({ error: 'Server not found' });
        res.json(server);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PATCH /:serverId
router.patch('/:serverId', async (req, res) => {
    try {
        const server = await ServerModel.findOneAndUpdate(
            { id: req.params.serverId },
            { $set: req.body },
            { new: true }
        );
        if (!server) return res.status(404).json({ error: 'Server not found' });
        res.json(server);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// DELETE /:serverId
router.delete('/:serverId', async (req, res) => {
    try {
        const result = await ServerModel.findOneAndDelete({ id: req.params.serverId });
        if (!result) return res.status(404).json({ error: 'Server not found' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// GET /:serverId/members
router.get('/:serverId/members', async (req, res) => {
    try {
        const query = isNaN(req.params.serverId)
            ? { _id: req.params.serverId }
            : { id: parseInt(req.params.serverId) };
        const server = await ServerModel.findOne(query);
        if (!server) return res.status(404).json({ error: 'Server not found' });
        res.json(server.members || []);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /:serverId/roles
router.get('/:serverId/roles', async (req, res) => {
    try {
        const query = isNaN(req.params.serverId)
            ? { _id: req.params.serverId }
            : { id: parseInt(req.params.serverId) };
        const server = await ServerModel.findOne(query).populate('roles');
        if (!server) return res.status(404).json({ error: 'Server not found' });
        res.json(server.roles || []);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /:serverId/group-key
router.get('/:serverId/group-key', authenticate, async (req, res) => {
    try {
        const server = await ServerModel.findOne({ id: req.params.serverId });
        if (!server) return res.status(404).json({ error: 'Server not found' });

        // Check if user is a member
        const isMember = server.members.some(m => m.userId === req.user.userId || m.email === req.user.email);
        if (!isMember) return res.status(403).json({ error: 'Access denied. Must be a member.' });

        // If not encrypted, return null
        if (!server.isEncrypted) {
            return res.json({ groupKey: null, isEncrypted: false });
        }

        res.json({
            groupKey: server.groupKey,
            isEncrypted: true,
            serverId: server.id
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /:serverId/enable-encryption
router.post('/:serverId/enable-encryption', authenticate, async (req, res) => {
    try {
        const server = await ServerModel.findOne({ id: req.params.serverId });
        if (!server) return res.status(404).json({ error: 'Server not found' });

        // Only owner can enable encryption
        if (server.ownerId !== req.user.userId && server.ownerEmail !== req.user.email) {
            return res.status(403).json({ error: 'Only server owner can enable encryption' });
        }

        server.isEncrypted = true;
        server.groupKey = crypto.randomBytes(32).toString('base64');
        await server.save();

        res.json({ success: true, isEncrypted: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});



// GET /:serverId/messages/:channelId
router.get('/:serverId/messages/:channelId', async (req, res) => {
    try {
        const messages = await ServerMessage.find({
            serverId: req.params.serverId,
            channelId: req.params.channelId
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (e) {

        res.status(500).json({ error: e.message });
    }
});

// POST /api/servers/:serverId/messages/:channelId
router.post('/:serverId/messages/:channelId', async (req, res) => {
    try {
        const { serverId, channelId } = req.params;
        const { text } = req.body;

        // --- Stride Native Moderation ---
        const safety = strideAIEngine.getSafetyScore(text);
        if (!safety.isSafe) {
            return res.status(400).json({
                error: 'Message rejected',
                reason: safety.reason,
                isModerated: true
            });
        }

        // --- AI Sentiment Integration ---
        let sentiment = null;
        if (text && text.trim().length > 0) {
            try {
                // Use native engine
                sentiment = strideAIEngine.analyze(text);
            } catch (aiErr) {
                console.error('[MESSAGING-AI] Sentiment analysis failed:', aiErr.message);
            }
        }


        const msgData = {
            ...req.body,
            serverId: parseInt(serverId),
            channelId,
            sentiment, // Add sentiment to server message
            timestamp: new Date()
        };
        const message = await ServerMessage.create(msgData);

        if (req.io) {
            req.io.to(`server_${serverId}_${channelId}`).emit('new-server-message', message);
        }

        res.json(message);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/server-threads/:serverId/:threadId
router.get('/server-threads/:serverId/:threadId', async (req, res) => {
    try {
        const parent = await ServerMessage.findById(req.params.threadId);
        const replies = await ServerMessage.find({ threadParentId: req.params.threadId }).sort({ timestamp: 1 });
        res.json({ parent, replies });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /:serverId/channels
router.post('/:serverId/channels', async (req, res) => {
    try {
        const { name, type } = req.body;
        const server = await ServerModel.findOne({ id: req.params.serverId });
        if (!server) return res.status(404).json({ error: 'Server not found' });

        server.channels.push({ name, type: type || 'text' });
        await server.save();
        res.json(server);
    } catch (e) {

        res.status(500).json({ error: e.message });
    }
});

// DELETE /:serverId/channels/:channelId
router.delete('/:serverId/channels/:channelId', async (req, res) => {
    try {
        const server = await ServerModel.findOne({ id: req.params.serverId });
        if (!server) return res.status(404).json({ error: 'Server not found' });

        server.channels = server.channels.filter(c => c.name !== req.params.channelId);
        await server.save();
        res.json(server);
    } catch (e) {

        res.status(500).json({ error: e.message });
    }
});

// GET /api/servers/:serverId/emojis
router.get('/:serverId/emojis', async (req, res) => {
    try {
        const emojis = await Emoji.find({ serverId: req.params.serverId });
        res.json(emojis);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
