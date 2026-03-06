const mongoose = require('mongoose');

const serverMessageSchema = new mongoose.Schema({
    serverId: Number,
    channelId: String,
    userEmail: String,
    from: String,
    to: String,
    username: String,
    userAvatar: String,
    text: String,
    mediaUrl: String,
    mediaType: String,
    gif: String,
    sharedContent: Object,
    encryptedMedia: Object,
    type: { type: String, default: 'text' },

    isAI: { type: Boolean, default: false },
    userTier: String,
    timestamp: { type: Date, default: Date.now },
    time: String,
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ServerMessage' },
    reactions: [{
        emoji: String,
        count: { type: Number, default: 0 },
        users: [String]
    }],
    poll: {
        question: String,
        options: [{
            text: String,
            voters: [String]
        }],
        isMultipleChoice: { type: Boolean, default: false }
    },
    threadParentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServerMessage' },
    replyCount: { type: Number, default: 0 },
    customEmojis: [{
        name: String,
        url: String
    }],
    sentiment: {
        score: Number,
        label: String,
        vibeColor: String
    },
    isE2EE: { type: Boolean, default: false }
});


module.exports = mongoose.model('ServerMessage', serverMessageSchema);
