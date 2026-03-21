const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Number, default: () => Date.now() },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
