const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String, required: true },
    content: { type: String, default: "" },
    caption: { type: String, default: "" },
    contentUrl: { type: String, required: true },
    likes: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    commentCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    tags: [String],
    type: { type: String, enum: ['post', 'reel', 'image', 'video'], default: 'post' },
    isMemberOnly: { type: Boolean, default: false },
    music: { type: String, default: "" }
}, { timestamps: true });



module.exports = mongoose.model('Post', postSchema);
