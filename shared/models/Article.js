const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    authorEmail: { type: String, required: true },
    authorUsername: { type: String, required: true },
    authorAvatar: { type: String, default: null },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true }, // HTML content from rich editor
    coverImage: { type: String, default: null },
    serverId: { type: Number, default: null }, // null = public article
    isWiki: { type: Boolean, default: false }, // true = server wiki page
    tags: [{ type: String }],
    likes: [{ type: String }], // array of emails who liked
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    isPaywalled: { type: Boolean, default: false },
    requiredTier: { type: Number, default: 0 },
    unlockPrice: { type: Number, default: 0 },
    purchasedBy: [{ type: String }],
}, { timestamps: true });

articleSchema.index({ serverId: 1, isWiki: 1 });
articleSchema.index({ authorEmail: 1 });
articleSchema.index({ tags: 1 });

module.exports = mongoose.model('Article', articleSchema);
