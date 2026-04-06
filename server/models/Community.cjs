const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    id: { type: String },
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
    accentColor: { type: String, default: '#d946ef' },
    isLive: { type: Boolean, default: false },
    voiceParticipants: [{ type: String }], // List of usernames in voice
    vibeScore: { type: Number, default: 0 },
    gatedChannels: [{ type: String }], // List of channel names that require Vibe Pass
    timestamp: { type: Date, default: Date.now }
});
CommunitySchema.index({ memberCount: -1 });
CommunitySchema.index({ vibeScore: -1 });

module.exports = mongoose.model('Community', CommunitySchema);
