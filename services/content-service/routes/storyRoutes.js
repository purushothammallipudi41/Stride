const express = require('express');
const router = express.Router();
const Story = require('../../../shared/models/Story');
const authenticate = require('../../../shared/middleware/auth');
const { checkContentSafety, saveBase64Image } = require('../../../shared/utils/contentSafety');
const logger = require('../../../shared/logger');

// GET /api/stories
router.get('/', async (req, res) => {
    try {
        const stories = await Story.find({})
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();
        res.json(stories);
    } catch (e) {
        logger.error('[CONTENT-SERVICE] Fetch stories failed:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/stories
router.post('/', async (req, res) => {
    try {
        const storyData = req.body;

        // Content Safety
        if (storyData.caption && checkContentSafety(storyData.caption)) {
            return res.status(400).json({ error: 'Inappropriate content detected' });
        }

        // Image Optimization & Cloudinary Upload
        if (storyData.content && storyData.content.startsWith('data:')) {
            const cloudinaryUrl = await saveBase64Image(storyData.content);
            if (cloudinaryUrl) {
                storyData.content = cloudinaryUrl;
            }
        }

        const story = await Story.create({
            ...storyData,
            timestamp: new Date()
        });

        res.status(201).json(story);
    } catch (e) {
        logger.error('[CONTENT-SERVICE] Create story failed:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/stories/:storyId/like
router.post('/:storyId/like', async (req, res) => {
    try {
        const { userEmail } = req.body;
        const story = await Story.findById(req.params.storyId);
        if (!story) return res.status(404).json({ error: 'Story not found' });

        const index = story.likes.indexOf(userEmail);
        if (index === -1) {
            story.likes.push(userEmail);
        } else {
            story.likes.splice(index, 1);
        }

        await story.save();
        res.json({ likes: story.likes });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
