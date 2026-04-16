const User = require('../models/User.cjs');
const Post = require('../models/Post.cjs');

// Weighted signals for high-fidelity discovery
const SIGNAL_WEIGHTS = {
    'view': 1,
    'like': 5,
    'share': 8,
    'comment': 12,
    'monetized_view': 3
};

const VibeService = {
    /**
     * Updates vibeScores with weighted interaction signaling.
     */
    updateVibeScore: async (username, tags, signalType = 'view') => {
        if (!tags || tags.length === 0) return;
        
        try {
            const user = await User.findOne({ username });
            if (!user) return;

            if (!user.vibeScores) user.vibeScores = new Map();
            const weight = SIGNAL_WEIGHTS[signalType] || 1;

            tags.forEach(tag => {
                const cleanTag = tag.toLowerCase().replace('#', '');
                const currentScore = user.vibeScores.get(cleanTag) || 0;
                user.vibeScores.set(cleanTag, currentScore + weight);
            });

            await user.save();
        } catch (err) {
            console.error('VibeService Error updating scores:', err);
        }
    },

    /**
     * Personalized Feed Ranking Algorithm
     * ((TagAffinity * 0.7) + (SocialProximity * 0.3)) + DiscoveryJitter
     */
    getPersonalizedFeed: async (username, limit = 50) => {
        try {
            const currentUser = await User.findOne({ username });
            const allPosts = await Post.find({}).sort({ createdAt: -1 }).limit(100);
            
            if (!currentUser || !currentUser.vibeScores || currentUser.vibeScores.size === 0) {
                return allPosts.slice(0, limit);
            }

            const scoredPosts = allPosts.map(post => {
                let score = 0;
                
                // 1. Tag Affinity (70% weight)
                if (post.tags && post.tags.length > 0) {
                    post.tags.forEach(tag => {
                        const cleanTag = tag.toLowerCase().replace('#', '');
                        score += (currentUser.vibeScores.get(cleanTag) || 0) * 0.7;
                    });
                }

                // 2. Social Proximity (30% weight - boost if followed)
                const isFollowed = currentUser.following.some(id => id.toString() === post.authorId?.toString());
                if (isFollowed) score += 50 * 0.3;

                // 3. Discovery Jitter (Prevents echo chambers)
                const jitter = Math.random() * 10;
                
                return { post, finalScore: score + jitter };
            });

            return scoredPosts
                .sort((a, b) => b.finalScore - a.finalScore)
                .slice(0, limit)
                .map(item => item.post);
        } catch (err) {
            console.error('VibeService Ranking Error:', err);
            return [];
        }
    },

    getRhythmicMatches: async (username) => {
        try {
            const currentUser = await User.findOne({ username });
            if (!currentUser || !currentUser.vibeScores || currentUser.vibeScores.size === 0) return [];

            // Get top 3 vibes for current user
            const myVibes = Array.from(currentUser.vibeScores.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(v => v[0]);

            const potentialMatches = await User.find({ 
                username: { $ne: username },
                vibeScores: { $exists: true }
            }).limit(20);

            const scoredMatches = potentialMatches.map(u => {
                const userVibes = Array.from(u.vibeScores.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5) 
                    .map(v => v[0]);

                const overlap = myVibes.filter(v => userVibes.includes(v)).length;
                return { user: u, score: overlap };
            });

            return scoredMatches
                .filter(m => m.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map(m => m.user);
        } catch (err) {
            return [];
        }
    }
};

module.exports = VibeService;
