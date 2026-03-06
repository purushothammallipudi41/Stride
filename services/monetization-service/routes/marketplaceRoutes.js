const express = require('express');
const router = express.Router();
const StickerPack = require('../../../shared/models/StickerPack');
const User = require('../../../shared/models/User');
const authenticate = require('../../../shared/middleware/auth');
const mongoose = require('mongoose');
const cache = require('../../../shared/redisClient');

// GET /api/marketplace/packs
router.get('/packs', async (req, res) => {
    try {
        const packs = await StickerPack.find({}).sort({ isOfficial: -1, createdAt: -1 }).lean();
        res.json(packs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/marketplace/library?email=...
router.get('/library', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const ownedPacks = await StickerPack.find({ purchases: email }).lean();
        res.json(ownedPacks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/marketplace/packs/:packId/buy
router.post('/packs/:packId/buy', authenticate, async (req, res) => {
    try {
        const { packId } = req.params;
        const userEmail = req.user.userId;

        const pack = await StickerPack.findById(packId);
        if (!pack) return res.status(404).json({ error: 'Pack not found' });

        if (pack.purchases.includes(userEmail)) {
            return res.status(400).json({ error: 'Already owned' });
        }

        const userObj = await User.findOne({ email: userEmail });
        if (!userObj) return res.status(404).json({ error: 'User not found' });

        if (pack.price > 0 && userObj.vibeTokens < pack.price) {
            return res.status(400).json({ error: 'Insufficient Vibe Tokens' });
        }

        // Transaction
        if (pack.price > 0) {
            userObj.vibeTokens -= pack.price;
            await userObj.save();
        }

        pack.purchases.push(userEmail);
        await pack.save();

        // Notify via Redis for real-time socket update
        await cache.publish('user_updates', {
            type: 'balance_update',
            email: userEmail,
            newBalance: userObj.vibeTokens,
            reason: `Purchase: ${pack.name}`
        });

        res.json({ success: true, newBalance: userObj.vibeTokens });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
