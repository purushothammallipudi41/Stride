const express = require('express');
const router = express.Router();
const Article = require('../../../shared/models/Article');
const authenticate = require('../../../shared/middleware/auth');

// POST /api/articles - Create article or wiki
router.post('/', authenticate, async (req, res) => {
    try {
        const { title, content, coverImage, serverId, isWiki, tags, isPaywalled, requiredTier, unlockPrice } = req.body;

        const article = new Article({
            authorEmail: req.user.userId,
            authorUsername: req.user.username || req.user.userId.split('@')[0],
            authorAvatar: req.user.avatar,
            title,
            content,
            coverImage,
            serverId,
            isWiki,
            tags,
            isPaywalled,
            requiredTier,
            unlockPrice
        });

        await article.save();
        res.status(201).json(article);
    } catch (e) {
        console.error('[ARTICLE CREATE] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/articles - List public articles
router.get('/', async (req, res) => {
    try {
        const { tag, limit = 20, skip = 0 } = req.query;
        const query = { isPublished: true, isWiki: false };
        if (tag) query.tags = tag;

        const articles = await Article.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        res.json(articles);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/articles/server/:serverId - List wiki pages for a server
router.get('/server/:serverId', async (req, res) => {
    try {
        const { serverId } = req.params;
        const articles = await Article.find({ serverId, isWiki: true, isPublished: true })
            .sort({ title: 1 });
        res.json(articles);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/articles/:id - Get single article
router.get('/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).json({ error: 'Article not found' });

        // Increment views
        article.views += 1;
        await article.save();

        res.json(article);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PATCH /api/articles/:id - Update article
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).json({ error: 'Article not found' });

        // Check ownership
        if (article.authorEmail !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized to edit this article' });
        }

        const updates = req.body;
        Object.keys(updates).forEach(key => {
            article[key] = updates[key];
        });

        await article.save();
        res.json(article);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/articles/:id - Delete article
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).json({ error: 'Article not found' });

        if (article.authorEmail !== req.user.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await article.deleteOne();
        res.json({ message: 'Article deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/articles/:id/like - Toggle like
router.post('/:id/like', authenticate, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) return res.status(404).json({ error: 'Article not found' });

        const email = req.user.userId;
        const index = article.likes.indexOf(email);

        if (index === -1) {
            article.likes.push(email);
        } else {
            article.likes.splice(index, 1);
        }

        await article.save();
        res.json({ likes: article.likes.length, isLiked: index === -1 });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
