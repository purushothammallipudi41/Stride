const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional for hydration
    username: { type: String, required: true }, // Denormalized for fast feed access
    content: { type: String, default: "" },
    caption: { type: String, default: "" },
    contentUrl: { type: String, required: true },
    likes: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    commentCount: { type: Number, default: 0 },
    tags: [String]
}, { timestamps: true });



module.exports = mongoose.model('Post', postSchema);
