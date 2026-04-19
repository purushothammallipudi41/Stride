const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String, required: true },
    content: { type: String, default: "" },
    caption: { type: String, default: "" },
    contentUrl: { type: String, default: "" },
    likes: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    commentCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    tags: [String],
    type: { type: String, enum: ['post', 'reel', 'image', 'video'], default: 'post' },
    isMemberOnly: { type: Boolean, default: false },
     isPremium: { type: Boolean, default: false }, // Tiered subscription gate
    music: { type: String, default: "" },
    isHD: { type: Boolean, default: false }, // 4K/HD quality flag
    filterApplied: { type: String, default: "normal" }, // Filter metadata
    uniqueViews: [{ type: String, default: [] }], // For Ad Rev-Share logic
}, { timestamps: true });

postSchema.index({ createdAt: -1 });
postSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
