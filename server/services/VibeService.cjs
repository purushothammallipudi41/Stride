const User = require('../models/User.cjs');

const VibeService = {
    /**
     * Updates a user's vibeScores based on the tags of a post they interacted with.
     * @param {string} username - Target user
     * @param {string[]} tags - Tags to increment (e.g., ['#lofi', '#abstract'])
     * @param {number} increment - How much to add (default 1)
     */
    updateVibeScore: async (username, tags, increment = 1) => {
        if (!tags || tags.length === 0) return;
        
        try {
            const user = await User.findOne({ username });
            if (!user) return;

            if (!user.vibeScores) user.vibeScores = new Map();

            tags.forEach(tag => {
                const cleanTag = tag.toLowerCase().replace('#', '');
                const currentScore = user.vibeScores.get(cleanTag) || 0;
                user.vibeScores.set(cleanTag, currentScore + increment);
            });

            await user.save();
        } catch (err) {
            console.error('VibeService Error updating scores:', err);
        }
    },

    /**
     * Finds users with similar top vibe profiles.
     * @param {string} username - The user to match for
     * @returns {Promise<User[]>} - List of potential rhythmic matches
     */
    getRhythmicMatches: async (username) => {
        try {
            const currentUser = await User.findOne({ username });
            if (!currentUser || !currentUser.vibeScores || currentUser.vibeScores.size === 0) return [];

            // Get top 3 vibes for current user
            const myVibes = Array.from(currentUser.vibeScores.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(v => v[0]);

            // Find users who have at least one of these in their top vibes
            // Note: In a large DB, this would use a more complex aggregation.
            const potentialMatches = await User.find({ 
                username: { $ne: username },
                vibeScores: { $exists: true }
            }).limit(20);

            const scoredMatches = potentialMatches.map(u => {
                const userVibes = Array.from(u.vibeScores.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5) // Look at top 5 for overlap
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
            console.error('VibeService Error getting matches:', err);
            return [];
        }
    }
};

module.exports = VibeService;
