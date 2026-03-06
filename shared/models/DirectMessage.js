const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
    from: String,
    to: String,
    text: String,
    mediaUrl: String,
    mediaType: String,
    gif: String,
    sharedContent: Object,
    encryptedMedia: Object,
    isAI: { type: Boolean, default: false },

    timestamp: { type: Date, default: Date.now },
    time: String, // Legacy formatted time string
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'DirectMessage' },
    reactions: [{
        emoji: String,
        count: { type: Number, default: 0 },
        users: [String] // Array of user emails or IDs who reacted
    }],
    poll: {
        question: String,
        options: [{
            text: String,
            voters: [String]
        }],
        isMultipleChoice: { type: Boolean, default: false }
    },
    sentiment: {
        score: Number,
        label: String,
        vibeColor: String
    },
    isE2EE: { type: Boolean, default: false }
});


module.exports = mongoose.model('DirectMessage', directMessageSchema);
