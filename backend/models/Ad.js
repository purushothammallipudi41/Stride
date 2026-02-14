const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    link: { type: String, required: true }, // Destination URL
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['active', 'paused', 'pending'],
        default: 'active'
    },
    stats: {
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ad', adSchema);
