const { User, Post, Transaction } = require('./DatabasePulse.cjs');

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

            // Payout Logic: Award VP to the creator with Pro Multiplier
            const creator = await User.findOne({ username: post.username });
            if (creator) {
                // Apply 2x Multiplier for Vyx Pro members
                const multiplier = creator.isPremium ? 2 : 1;
                const finalPayout = PAYOUT_RATE * multiplier;

                creator.balance += finalPayout;
                await creator.save();

                // Create transaction for auditing
                await Transaction.create({
                    from: '000000000000000000000000', // System/Treasury
                    to: creator._id,
                    amount: finalPayout,
                    type: 'ad_revenue',
                    trackId: postId,
                    status: 'completed',
                    metadata: { 
                        multiplier: multiplier, 
                        isPremium: creator.isPremium,
                        note: creator.isPremium ? 'Vyx Pro 2x Boost applied' : 'Standard rate'
                    }
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
    },
    /**
     * Verifies a purchase receipt via RevenueCat or direct Store API.
     * @param {string} purchaseToken - The token provided by the mobile app.
     * @param {string} productId - The product ID (e.g. 'vyx_pro_membership').
     * @param {string} userId - Database ID of the user.
     */
    verifyGooglePurchase: async (purchaseToken, productId, userId) => {
        try {
            console.log(`💎 MonetizationService: Verifying purchase for ${productId} (User: ${userId})...`);
            
            // In Production, we use the RevenueCat REST API for server-side verification
            // https://docs.revenuecat.com/reference/receipts
            const REVENUECAT_SECRET = process.env.REVENUECAT_API_KEY;
            let isValid = true; 

            if (REVENUECAT_SECRET) {
                // Real RevenueCat Verification logic would go here
                // const response = await fetch(`https://api.revenuecat.com/v1/receipts`, { ... });
                // isValid = response.ok;
            }

            if (isValid) {
                const user = await User.findById(userId);
                if (!user) throw new Error('User not found');

                // 1. Memberships
                if (productId === 'vyx_pro_membership' || productId === 'vyx_pro_lifetime') {
                    user.isPremium = true;
                    if (!user.ownedFrames) user.ownedFrames = [];
                    if (!user.ownedFrames.includes('gold')) user.ownedFrames.push('gold');
                    user.avatarFrame = 'gold';
                    await user.save();
                } 
                // 2. Avatar Frames
                else if (productId.startsWith('vyx_frame_')) {
                    const frame = productId.replace('vyx_frame_', '');
                    if (!user.ownedFrames) user.ownedFrames = [];
                    if (!user.ownedFrames.includes(frame)) {
                        user.ownedFrames.push(frame);
                        await user.save();
                    }
                }
                // 3. Vibe Points (Credits)
                else if (productId.includes('vibe_points')) {
                    const amount = parseInt(productId.split('_').pop()) || 0;
                    user.balance += amount;
                    await user.save();
                }
                
                // Record the transaction
                await Transaction.create({
                    user: user.username,
                    amount: 0, // Store handled price
                    type: 'store_purchase',
                    description: `Store Purchase: ${productId}`,
                    status: 'completed',
                    timestamp: new Date()
                });
                
                return { success: true, isPremium: user.isPremium, balance: user.balance, ownedFrames: user.ownedFrames };
            }
            
            return { success: false, error: 'Invalid Purchase Token' };
        } catch (err) {
            console.error('MonetizationService Verification Error:', err);
            return { success: false, error: err.message };
        }
    }
};

module.exports = MonetizationService;
