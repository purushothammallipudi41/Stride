const Post = require('../../../shared/models/Post');
const User = require('../../../shared/models/User');
const cache = require('../../../shared/redisClient');
const logger = require('../../../shared/logger');

/**
 * Pre-computes the For You feed for a list of active users
 */
async function precomputeForYouFeeds() {
    try {
        logger.info('[FEED-TASK] Starting For You feed pre-computation...');

        // Find users active in the last 24 hours (simplified: just find 20 users for now)
        const activeUsers = await User.find().limit(20).lean();

        for (const user of activeUsers) {
            await precomputeUserFeed(user);
        }

        logger.info(`[FEED-TASK] Pre-computed feeds for ${activeUsers.length} users.`);
    } catch (err) {
        logger.error('[FEED-TASK] Error in pre-computation:', err.message);
    }
}

async function precomputeUserFeed(userObj) {
    const skip = 0;
    const limit = 20;
    const cacheKey = `feed:foryou:${userObj.email}:${skip}:${limit}`;

    try {
        const following = userObj.following || [];

        const posts = await Post.find({
            $or: [
                { userId: { $in: following } },
                { likesCount: { $gt: 5 } },
                { isOfficial: true }
            ]
        })
            .sort({ timestamp: -1, likesCount: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const scoredPosts = posts.map(post => {
            let score = 0;
            if (following.includes(post.userId)) score += 50;
            if (post.isOfficial) score += 30;
            score += (post.likesCount || 0) * 2;
            score += (post.commentsCount || 0) * 5;
            return { ...post, relevanceScore: score };
        }).sort((a, b) => b.relevanceScore - a.relevanceScore);

        await cache.set(cacheKey, scoredPosts, 3600); // 1 hour TTL for pre-computed
    } catch (e) {
        logger.error(`[FEED-TASK] Failed for ${userObj.email}:`, e.message);
    }
}

// Export for manual or scheduled run
module.exports = {
    precomputeForYouFeeds,
    precomputeUserFeed
};
