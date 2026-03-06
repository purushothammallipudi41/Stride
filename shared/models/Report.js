const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporterId: {
        type: String,
        required: true,
        index: true
    },
    reporterEmail: String,
    targetType: {
        type: String,
        enum: ['post', 'comment', 'article', 'user', 'message', 'story'],
        required: true,
        index: true
    },
    targetId: {
        type: String,
        required: true,
        index: true
    },
    targetOwnerId: String, // ID of the user who owns the reported content
    reason: {
        type: String,
        required: true,
        enum: ['spam', 'harassment', 'hate_speech', 'nsfw', 'violence', 'scam', 'other']
    },
    description: String,
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
        default: 'pending',
        index: true
    },
    actionTaken: {
        type: String,
        enum: ['none', 'content_deleted', 'user_warned', 'user_muted', 'user_banned'],
        default: 'none'
    },
    moderatorId: String, // ID of the admin who reviewed it
    moderatorNotes: String,
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, { timestamps: true });

// Index for group lookups in moderation dashboard
reportSchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model('Report', reportSchema);
