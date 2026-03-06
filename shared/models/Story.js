const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Keeping as String (email) for now to match logic
    username: String,
    userAvatar: String,
    content: String,
    type: { type: String, default: 'image' },
    likes: [String],
    viewers: [String],
    isPaywalled: { type: Boolean, default: false },
    requiredTier: { type: Number, default: 0 },
    unlockPrice: { type: Number, default: 0 },
    purchasedBy: [{ type: String }],
    timestamp: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24h (86400s)
});

module.exports = mongoose.model('Story', storySchema);
