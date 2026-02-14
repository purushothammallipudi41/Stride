const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: { type: [String], index: true }, // Emails
    settings: [{
        email: { type: String, required: true },
        isMuted: { type: Boolean, default: false },
        isHidden: { type: Boolean, default: false },
        lastClearedAt: { type: Date, default: null }
    }],
    lastMessage: {
        sender: String,
        text: String,
        timestamp: { type: Date, default: Date.now }
    }
}, { timestamps: true });

// Ensure participants is unique for the combination
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
