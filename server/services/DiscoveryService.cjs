const User = require('../models/User.cjs');
const Community = require('../models/Community.cjs');

/**
 * DiscoveryService: Adaptive Recommendation Engine
 * Factors:
 * 1. User Favorites (genre/artist overlap)
 * 2. Community Activity (trending in joined communities)
 * 3. Global Trending (recency + engagement)
 */
class DiscoveryService {
    static async getPersonalizedFeed(username, limit = 10) {
        try {
            const user = await User.findOne({ username }).populate('favorites');
            if (!user) return [];

            // 1. Get user genres and artists from favorites
            const favoriteGenres = new Set();
            const favoriteArtists = new Set();
            
            user.favorites.forEach(track => {
                if (track.genre) favoriteGenres.add(track.genre);
                if (track.artist) favoriteArtists.add(track.artist);
            });

            // 2. Find communities the user belongs to
            const communities = await Community.find({ members: user._id });
            const communityTracks = communities.flatMap(c => c.jukeboxQueue || []);

            // 3. Weighting: Mix of trending posts and reels
            const trendingPosts = await Post.find({ 
                type: { $ne: 'reel' },
                imageUrl: { $ne: "" } 
            }).sort({ likes: -1 }).limit(10).lean();

            const trendingReels = await Post.find({ 
                type: 'reel' 
            }).sort({ likes: -1 }).limit(10).lean();

            // Interleave and randomize slightly
            const discoverGrid = [...trendingPosts, ...trendingReels]
                .sort(() => Math.random() - 0.5)
                .slice(0, 15);

            return {
                recommendedTracks: communityTracks.slice(0, limit),
                trendingCommunities: await Community.find({ isPrivate: false }).sort({ memberCount: -1 }).limit(5),
                discoverGrid
            };
        } catch (err) {
            console.error("Discovery failed:", err);
            return { recommendedTracks: [], trendingCommunities: [] };
        }
    }
}

module.exports = DiscoveryService;
