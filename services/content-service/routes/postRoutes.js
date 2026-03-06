const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../../../shared/models/Post');
const User = require('../../../shared/models/User');
const cache = require('../../../shared/redisClient');
const authenticate = require('../../../shared/middleware/auth');
const {
    checkContentSafety,
    saveBase64Image,
    checkPaywallAccess
} = require('../../../shared/utils/contentSafety');
const { handleMentions } = require('../../../shared/utils/notifications');
const Report = require('../../../shared/models/Report');

// GET /api/posts
router.get('/', async (req, res) => {
    try {
        const { viewerId, type, username, limit = 20, skip = 0 } = req.query;

        const isPublicFeed = !viewerId;
        const cacheKey = `posts:feed:${type || 'all'}:${username || 'all'}:${limit}:${skip}`;

        if (isPublicFeed) {
            const cachedPosts = await cache.get(cacheKey);
            if (cachedPosts) return res.json(cachedPosts);
        }

        let filter = { status: 'published' };
        if (type) filter.type = type;
        if (username) filter.username = username;

        if (viewerId && viewerId !== 'undefined') {
            const query = { $or: [{ email: viewerId }, { username: viewerId }] };
            if (mongoose.isValidObjectId(viewerId)) query.$or.push({ _id: viewerId });
            const viewer = await User.findOne(query);
            if (viewer && viewer.blockedUsers && viewer.blockedUsers.length > 0) {
                const blockedIds = viewer.blockedUsers.filter(id => mongoose.isValidObjectId(id));
                const blockedEmails = viewer.blockedUsers;

                const blockedUsers = await User.find({
                    $or: [
                        { _id: { $in: blockedIds } },
                        { email: { $in: blockedEmails } },
                        { username: { $in: viewer.blockedUsers } }
                    ]
                });

                const blockedUsernames = blockedUsers.map(u => u.username);
                filter.username = { ...filter.username, $nin: blockedUsernames };
            }
        }

        const posts = await Post.find(filter)
            .sort({ timestamp: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .lean();

        const usernames = [...new Set(posts.map(p => p.username))];
        const users = await User.find({ username: { $in: usernames } }, 'username avatar activeAvatarFrame unlockedPerks isOfficial').lean();
        const userMap = users.reduce((acc, u) => {
            const isSpecial = u.username === 'stride' || u.username === 'purushotham_mallipudi';
            const perks = u.unlockedPerks || [];
            if (isSpecial && !perks.includes('gold_name')) perks.push('gold_name');
            if (isSpecial && !perks.includes('gold_frame')) perks.push('gold_frame');
            if (isSpecial && !perks.includes('gold_bubble')) perks.push('gold_bubble');

            return {
                ...acc,
                [u.username]: {
                    avatar: u.avatar,
                    activeAvatarFrame: isSpecial ? 'gold_frame' : u.activeAvatarFrame,
                    unlockedPerks: perks,
                    isOfficial: u.isOfficial
                }
            };
        }, {});

        const enrichedPosts = await Promise.all(posts.map(async (post) => {
            let hasAccess = !post.isPaywalled;
            if (post.isPaywalled && viewerId && viewerId !== 'undefined') {
                const query = { $or: [{ email: viewerId }, { username: viewerId }] };
                if (mongoose.isValidObjectId(viewerId)) query.$or.push({ _id: viewerId });
                const viewerObj = await User.findOne(query);
                if (viewerObj) {
                    hasAccess = await checkPaywallAccess(viewerObj, post, post.serverId);
                }
            }

            const sanitizedPost = {
                ...post,
                userAvatar: userMap[post.username]?.avatar || post.userAvatar,
                userActiveAvatarFrame: userMap[post.username]?.activeAvatarFrame || null,
                userUnlockedPerks: userMap[post.username]?.unlockedPerks || [],
                isOfficial: userMap[post.username]?.isOfficial || false
            };

            if (!hasAccess) {
                sanitizedPost.caption = (sanitizedPost.caption || '').substring(0, 50) + '... [Unlock to view]';
                sanitizedPost.contentUrl = null;
                sanitizedPost.isLocked = true;
            }

            return sanitizedPost;
        }));

        if (isPublicFeed) {
            await cache.set(cacheKey, enrichedPosts, 300);
        }

        res.json(enrichedPosts);
    } catch (e) {
        console.error('API Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/posts
router.post('/', async (req, res) => {
    try {
        const postData = req.body;

        if (postData.caption && checkContentSafety(postData.caption)) {
            postData.isSensitive = true;
            postData.moderationStatus = 'flagged';
        }

        if (postData.contentUrl && postData.contentUrl.startsWith('data:')) {
            const cloudinaryUrl = await saveBase64Image(postData.contentUrl);
            if (cloudinaryUrl) {
                postData.contentUrl = cloudinaryUrl;
            }
        }

        const post = await Post.create({
            ...postData,
            status: postData.status || 'published',
            scheduledFor: postData.scheduledFor ? new Date(postData.scheduledFor) : null,
            timestamp: postData.status === 'scheduled' ? new Date(postData.scheduledFor) : new Date()
        });

        // 1. Handle Mentions
        const actor = await User.findOne({ email: post.userId || post.userEmail });
        if (actor) {
            await handleMentions(post.caption, actor, post._id, 'post');
        }

        // 2. Invalidate primary feed caches
        await cache.del('posts:feed:all:all:20:0');
        if (postData.type) {
            await cache.del(`posts:feed:${postData.type}:all:20:0`);
        }

        res.status(201).json(post);
    } catch (e) {
        console.error('[POST_CREATE] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/feed/foryou
router.get('/foryou', authenticate, async (req, res) => {
    try {
        const userObj = await User.findOne({ email: req.user.userId });
        if (!userObj) return res.status(404).json({ error: 'User not found' });

        const { skip = 0, limit = 20 } = req.query;
        const cacheKey = `feed:foryou:${userObj.email}:${skip}:${limit}`;

        const cachedFeed = await cache.get(cacheKey);
        if (cachedFeed) return res.json(cachedFeed);

        // Advanced Logic: Followers + Trending + Interest Match
        // 1. Get posts from followed users
        const following = userObj.following || [];

        // 2. Mix with high engagement posts (trending)
        const posts = await Post.find({
            status: 'published',
            $or: [
                { userId: { $in: following } },
                { likesCount: { $gt: 5 } },
                { isOfficial: true }
            ]
        })
            .sort({ timestamp: -1, likesCount: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .lean();

        // 3. Simple scoring for "relevance"
        const scoredPosts = posts.map(post => {
            let score = 0;
            if (following.includes(post.userId)) score += 50;
            if (post.isOfficial) score += 30;
            score += (post.likesCount || 0) * 2;
            score += (post.commentsCount || 0) * 5;
            return { ...post, relevanceScore: score };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);

        await cache.set(cacheKey, scoredPosts, 600); // Cache for 10 mins
        res.json(scoredPosts);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/posts/:postId
router.get('/:postId', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId).lean();
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/posts/:postId
router.put('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { caption, requesterId } = req.body;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Basic authorization check
        if (post.userId !== requesterId && post.userEmail !== requesterId && requesterId !== 'stride') {
            return res.status(403).json({ error: 'Unauthorized to edit this post' });
        }

        post.caption = caption;
        if (caption && checkContentSafety(caption)) {
            post.isSensitive = true;
            post.moderationStatus = 'flagged';
        }

        await post.save();
        await cache.del('posts:feed:all:all:20:0'); // Invalidate main feed cache
        res.json(post);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/posts/:postId
router.delete('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.body;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Authorization: owner or admin
        if (post.userId !== userId && post.userEmail !== userId && userId !== 'stride' && userId !== 'purushothammallipudi41@gmail.com') {
            return res.status(403).json({ error: 'Unauthorized to delete this post' });
        }

        await Post.findByIdAndDelete(postId);
        await cache.del('posts:feed:all:all:20:0'); // Invalidate feed cache
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/posts/:postId/like
router.post('/:postId/like', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userEmail } = req.body;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const likeIndex = post.likes.indexOf(userEmail);
        if (likeIndex > -1) {
            post.likes.splice(likeIndex, 1);
        } else {
            post.likes.push(userEmail);
        }

        await post.save();
        res.json({ likes: post.likes });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/posts/:postId/comment
router.post('/:postId/comment', async (req, res) => {
    try {
        const { postId } = req.params;
        const { comment } = req.body;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const newComment = {
            ...comment,
            id: mongoose.Types.ObjectId().toString(),
            timestamp: new Date(),
            likes: []
        };

        post.comments.push(newComment);
        await post.save();
        res.json(newComment);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/posts/:postId/comment/:commentId/like
router.post('/:postId/comment/:commentId/like', async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { userEmail } = req.body;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const comment = post.comments.find(c => c.id === commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const likeIndex = (comment.likes || []).indexOf(userEmail);
        if (likeIndex > -1) {
            comment.likes.splice(likeIndex, 1);
        } else {
            comment.likes = comment.likes || [];
            comment.likes.push(userEmail);
        }

        await post.save();
        res.json({ likes: comment.likes });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/posts/:postId/comment/:commentId
router.delete('/:postId/comment/:commentId', async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        post.comments = post.comments.filter(c => c.id !== commentId);
        await post.save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/posts/:postId/comment/:commentId
router.put('/:postId/comment/:commentId', async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { text } = req.body;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const comment = post.comments.find(c => c.id === commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        comment.text = text;
        await post.save();
        res.json({ comment });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ─── Reporting & Moderation ────────────────────────────────────────

// POST /api/reports
router.post('/reports', authenticate, async (req, res) => {
    try {
        const { targetType, targetId, reason, description, targetOwnerId } = req.body;

        const report = await Report.create({
            reporterId: req.user.userId,
            reporterEmail: req.user.email,
            targetType,
            targetId,
            targetOwnerId,
            reason,
            description,
            timestamp: new Date()
        });

        // Increment report count on the target if it's a post
        if (targetType === 'post') {
            await Post.findByIdAndUpdate(targetId, { $inc: { reportCount: 1 } });
        }

        res.status(201).json(report);
    } catch (e) {
        console.error('[REPORT_CREATE] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// GET /api/moderation/reports (Admin only)
router.get('/moderation/reports', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const { status = 'pending', limit = 50, skip = 0 } = req.query;
        const reports = await Report.find({ status })
            .sort({ timestamp: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .lean();

        res.json(reports);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PATCH /api/moderation/reports/:id (Admin only)
router.patch('/moderation/reports/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const { id } = req.params;
        const { status, actionTaken, moderatorNotes } = req.body;

        const report = await Report.findById(id);
        if (!report) return res.status(404).json({ error: 'Report not found' });

        report.status = status || report.status;
        report.actionTaken = actionTaken || report.actionTaken;
        report.moderatorNotes = moderatorNotes || report.moderatorNotes;
        report.moderatorId = req.user.userId;

        await report.save();

        // Perform action if needed
        if (actionTaken === 'content_deleted') {
            if (report.targetType === 'post') {
                await Post.findByIdAndDelete(report.targetId);
                await cache.del('posts:feed:all:all:20:0');
            }
        } else if (actionTaken === 'user_warned') {
            // Logic to warn user could be added here (e.g., sending a notification or email)
            const targetUser = await User.findOne({
                $or: [{ email: report.targetOwnerId }, { username: report.targetOwnerId }]
            });
            if (targetUser) {
                targetUser.moderation = targetUser.moderation || {};
                targetUser.moderation.warningCount = (targetUser.moderation.warningCount || 0) + 1;
                await targetUser.save();
            }
        }

        res.json(report);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/posts/me/scheduled
router.get('/me/scheduled', authenticate, async (req, res) => {
    try {
        const posts = await Post.find({
            $or: [{ userId: req.user.userId }, { userEmail: req.user.userId }],
            status: 'scheduled'
        }).sort({ scheduledFor: 1 });
        res.json(posts);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
