const mongoose = require('mongoose');

const stickerPackSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    previewUrl: { type: String }, // Main preview image for the pack
    stickers: [{
        name: String,
        url: String,
        format: { type: String, enum: ['png', 'gif', 'lottie'], default: 'png' }
    }],
    price: { type: Number, required: true, min: 0 }, // In Vibe Tokens; 0 = free
    creatorEmail: { type: String, required: true },
    creatorUsername: { type: String },
    purchases: [{ type: String }], // Array of buyer emails
    isOfficial: { type: Boolean, default: false }, // Stride-curated packs
    tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('StickerPack', stickerPackSchema);
