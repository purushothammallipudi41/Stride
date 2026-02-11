const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    username: String,
    userAvatar: String,
    userId: String,
    type: { type: String, default: 'image' },
    contentUrl: String,
    caption: String,
    musicTrack: String,
    isSensitive: { type: Boolean, default: false },
    moderationStatus: { type: String, enum: ['none', 'flagged', 'reviewed'], default: 'none' },
    likes: [String],
    comments: [{
        id: String,
        text: String,
        username: String,
        userAvatar: String,
        timestamp: { type: Date, default: Date.now }
    }],
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
