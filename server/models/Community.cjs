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
        votes: { type: Number, default: 0 }
    }],
    tags: [String],
    timestamp: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Community', CommunitySchema);
