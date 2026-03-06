const mongoose = require('mongoose');

const StickerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    format: {
        type: String,
        enum: ['lottie', 'gif', 'png'],
        default: 'lottie'
    },
    packName: { type: String, default: 'Default Pack' },
    serverId: { type: String, index: true, default: 'global' }, // 'global' or serverId
    createdBy: { type: String },
    usageCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sticker', StickerSchema);
