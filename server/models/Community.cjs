const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    memberCount: { type: Number, default: 0 },
    roles: [{
        user: { type: String, required: true }, // username
        role: { type: String, enum: ['owner', 'mod', 'member'], default: 'member' }
    }],
    avatar: { type: String },
    banner: { type: String },
    isPrivate: { type: Boolean, default: false },
    jukeboxQueue: [{
        trackId: String,
        title: String,
        artist: String,
        artwork: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedByUsername: String,
        votes: { type: Number, default: 0 }
    }],
    pastQueue: [{
        trackId: String,
        title: String,
        artist: String,
        artwork: String,
        playedAt: { type: Date, default: Date.now }
    }],
    vibeLeaderboard: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        points: { type: Number, default: 0 }
    }],
    tags: [String],
    primaryColor: { type: String, default: '#8b5cf6' },
    accentColor: { type: String, default: '#d946ef' },
    timestamp: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Community', CommunitySchema);
