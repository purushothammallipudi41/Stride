const express = require('express');
const router = express.Router();
const Ad = require('../../../shared/models/Ad');
const authenticate = require('../../../shared/middleware/auth');
const { saveBase64Image } = require('../../../shared/utils/contentSafety');

// GET /api/ads -> aliased to active
router.get('/', async (req, res) => {
    try {
        const ads = await Ad.find({ status: 'active' }).sort({ createdAt: -1 }).limit(10).lean();
        res.json(ads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ads/active
router.get('/active', async (req, res) => {
    try {
        const ads = await Ad.find({ status: 'active' }).sort({ createdAt: -1 }).limit(10).lean();
        res.json(ads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/ads/user/:userId
router.get('/user/:userId', async (req, res) => {
    try {
        const ads = await Ad.find({ creator: req.params.userId }).sort({ createdAt: -1 }).lean();
        res.json(ads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ads
router.post('/', async (req, res) => {
    try {
        const adData = req.body;

        if (adData.image && adData.image.startsWith('data:')) {
            const cloudinaryUrl = await saveBase64Image(adData.image);
            if (cloudinaryUrl) {
                adData.image = cloudinaryUrl;
            }
        }

        const ad = await Ad.create({
            ...adData,
            createdAt: new Date()
        });

        res.status(201).json(ad);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/ads/:adId/click
router.post('/:adId/click', async (req, res) => {
    try {
        const ad = await Ad.findByIdAndUpdate(
            req.params.adId,
            { $inc: { 'stats.clicks': 1 } },
            { new: true }
        );
        if (!ad) return res.status(404).json({ error: 'Ad not found' });
        res.json(ad);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Track views
router.post('/:adId/view', async (req, res) => {
    try {
        await Ad.findByIdAndUpdate(req.params.adId, { $inc: { 'stats.views': 1 } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
