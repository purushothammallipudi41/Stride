const User = require('../models/User.cjs');
const Post = require('../models/Post.cjs');
const Transaction = require('../models/Transaction.cjs');

const PAYOUT_RATE = 0.1; // 0.1 VP per unique view (100 VP / 1k views)

const MonetizationService = {
    /**
     * Records a unique impression and awards revenue to the creator.
     * @param {string} postId - Target post
     * @param {string} viewerUsername - Current viewer
     */
    handleImpression: async (postId, viewerUsername) => {
        if (!viewerUsername || viewerUsername === 'guest') return;

        try {
            const post = await Post.findById(postId);
            if (!post || post.username === viewerUsername) return; // Don't pay for self-views

            // Check if already viewed
            if (post.uniqueViews.includes(viewerUsername)) return;

            // Record unique view
            post.uniqueViews.push(viewerUsername);
            post.viewCount = (post.viewCount || 0) + 1;
            await post.save();

            // Payout Logic: Award VP to the creator
            const creator = await User.findOne({ username: post.username });
            if (creator) {
                creator.balance += PAYOUT_RATE;
                await creator.save();

                // Create transaction for auditing
                await Transaction.create({
                    from: '000000000000000000000000', // System/Treasury
                    to: creator._id,
                    amount: PAYOUT_RATE,
                    type: 'ad_revenue',
                    trackId: postId,
                    status: 'completed'
                });

                return { success: true, newBalance: creator.balance };
            }
        } catch (err) {
            console.error('MonetizationService Error:', err);
        }
    },

    /**
     * Checks if a user has access to premium content.
     */
    checkAccess: async (targetUsername, viewerId) => {
        try {
            const creator = await User.findOne({ username: targetUsername });
            if (!creator) return false;
            
            // Check if viewer is a subscriber
            return creator.subscribers.includes(viewerId);
        } catch (err) {
            console.error('MonetizationService Access Check Error:', err);
            return false;
        }
    }
};

module.exports = MonetizationService;
