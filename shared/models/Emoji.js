const mongoose = require('mongoose');

const EmojiSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        match: /^[a-zA-Z0-9_]{2,32}$/
    },
    url: { type: String, required: true },
    serverId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true }, // email
    type: {
        type: String,
        enum: ['static', 'animated'],
        default: 'static'
    },
    usageCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Compound index for fast lookup by name within a server
EmojiSchema.index({ serverId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Emoji', EmojiSchema);
