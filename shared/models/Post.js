const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    username: { type: String, index: true },
    userAvatar: String,
    userId: { type: String, index: true },
    type: { type: String, default: 'image', index: true },
    contentUrl: String,
    caption: String,
    posterUrl: String,
    musicTrack: String,
    isSensitive: { type: Boolean, default: false },
    moderationStatus: { type: String, enum: ['none', 'flagged', 'reviewed'], default: 'none' },
    likes: [String],
    views: { type: Number, default: 0 },
    isRemix: { type: Boolean, default: false },
    parentPostId: { type: String, index: true },
    comments: [{
        id: String,
        text: String,
        gif: String,
        username: String,
        userId: String,
        userAvatar: String,
        userActiveAvatarFrame: String,
        likes: [String],
        timestamp: { type: Date, default: Date.now }
    }],
    isPaywalled: { type: Boolean, default: false },
    requiredTier: { type: Number, default: 0 }, // 0 = no tier required, >0 = tier level required
    unlockPrice: { type: Number, default: 0 }, // Token cost to unlock a la carte
    purchasedBy: [{ type: String }], // Array of user emails/IDs who bought it
    hashtags: [{ type: String }], // Auto-extracted from caption
    impressionCount: { type: Number, default: 0 }, // Tracks how many times post was viewed
    moderationScore: { type: Number, default: 0 }, // AI safety score
    reportCount: { type: Number, default: 0 }, // Total reports received
    status: { type: String, enum: ['published', 'scheduled', 'draft'], default: 'published', index: true },
    scheduledFor: { type: Date, index: true },
    timestamp: { type: Date, default: Date.now, index: true }
});

postSchema.index({ timestamp: -1 }); // Optimized for latest feed
postSchema.index({ username: 1, timestamp: -1 }); // Optimized for profile
postSchema.index({ hashtags: 1 }); // Optimized for hashtag lookup

// Auto-extract hashtags from caption before saving
postSchema.pre('save', function (next) {
    if (this.caption) {
        const tags = this.caption.match(/#([\w]+)/g);
        if (tags) {
            this.hashtags = [...new Set(tags.map(t => t.slice(1).toLowerCase()))];
        }
    }
    next();
});

module.exports = mongoose.model('Post', postSchema);
