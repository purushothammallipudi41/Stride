const Post = require('../../../shared/models/Post');
const logger = require('../../../shared/logger');
const cache = require('../../../shared/redisClient');

/**
 * Periodically checks for scheduled posts that need to be published.
 */
async function processScheduledPosts() {
    try {
        const now = new Date();
        // Find posts with status 'scheduled' and scheduledFor <= now
        const pendingPosts = await Post.find({
            status: 'scheduled',
            scheduledFor: { $lte: now }
        });

        if (pendingPosts.length === 0) return;

        logger.info(`[SCHEDULER] Found ${pendingPosts.length} posts to publish.`);

        for (const post of pendingPosts) {
            post.status = 'published';
            post.timestamp = now; // Update timestamp to now so it appears at top of feed
            await post.save();

            // Clear cache for following feeds of the creator
            const cachePattern = `feed:foryou:*`;
            // In a real system, we might be more surgical, but for now we let it expire or clear relevant ones.
            logger.info(`[SCHEDULER] Published post ${post._id} by ${post.userId}`);
        }

    } catch (err) {
        logger.error('[SCHEDULER] Error processing scheduled posts:', err.message);
    }
}

module.exports = {
    processScheduledPosts
};
