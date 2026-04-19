const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true }, // Using username for simplicity or ObjectId
    receiver: { type: String, required: true },
    text: { type: String },
    type: { type: String, enum: ['text', 'image', 'music', 'gif'], default: 'text' },
    track: { type: Object }, // For shared music metadata
    reactions: [{
        username: String,
        emoji: String,
        timestamp: { type: Number, default: Date.now }
    }],
    metadata: {
        type: { type: String }, // 'tip', 'sticker', 'collab_wave', etc.
        value: mongoose.Schema.Types.Mixed,
        displayMeta: mongoose.Schema.Types.Mixed
    },
    isMe: { type: Boolean },
    timestamp: { type: Number, default: () => Date.now() },
    readStatus: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
