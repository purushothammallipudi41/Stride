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
        username: String,
        userAvatar: String,
        timestamp: { type: Date, default: Date.now }
    }],
    timestamp: { type: Date, default: Date.now, index: true }
});

postSchema.index({ timestamp: -1 }); // Optimized for latest feed
postSchema.index({ username: 1, timestamp: -1 }); // Optimized for profile

module.exports = mongoose.model('Post', postSchema);
