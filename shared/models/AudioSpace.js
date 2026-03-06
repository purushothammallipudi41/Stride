const mongoose = require('mongoose');

const audioSpaceSchema = new mongoose.Schema({
    hostEmail: { type: String, required: true },
    hostUsername: { type: String, required: true },
    hostAvatar: { type: String, default: null },
    title: { type: String, required: true, maxlength: 120 },
    serverId: { type: Number, default: null }, // optional - link to a server
    isLive: { type: Boolean, default: true },
    speakers: [{
        email: String,
        username: String,
        avatar: String,
        isMuted: { type: Boolean, default: false },
        joinedAt: { type: Date, default: Date.now }
    }],
    listeners: [{
        email: String,
        username: String,
        avatar: String,
        joinedAt: { type: Date, default: Date.now }
    }],
    handRaises: [{
        email: String,
        username: String,
        avatar: String,
        raisedAt: { type: Date, default: Date.now }
    }],
    tags: [{ type: String }],
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    giftTotal: { type: Number, default: 0 },
    isVideoEnabled: { type: Boolean, default: false },
    hostPeerId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('AudioSpace', audioSpaceSchema);
