const mongoose = require('mongoose');

const scheduledPostSchema = new mongoose.Schema({
    serverId: { type: Number, required: true },
    channelId: { type: String, required: true },
    authorEmail: { type: String, required: true },
    authorUsername: { type: String },
    authorAvatar: { type: String },
    text: { type: String, required: true },
    scheduledFor: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'published', 'cancelled'], default: 'pending' },
    publishedAt: { type: Date, default: null }
}, { timestamps: true });

scheduledPostSchema.index({ scheduledFor: 1, status: 1 });

module.exports = mongoose.model('ScheduledPost', scheduledPostSchema);
