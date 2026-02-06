const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    username: String,
    userAvatar: String,
    userId: String,
    type: { type: String, default: 'image' },
    contentUrl: String,
    caption: String,
    musicTrack: String,
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
