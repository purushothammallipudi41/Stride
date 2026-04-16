const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    author: { type: String, required: true },
    avatar: { type: String },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 }
}, { timestamps: true });

const threadSchema = new mongoose.Schema({
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    author: { type: String, required: true },
    authorAvatar: { type: String },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }],
    replies: [replySchema],
    isPinned: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Thread', threadSchema);
