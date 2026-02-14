const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    avatar: String,
    bio: String,
    stats: {
        posts: { type: Number, default: 0 },
        followers: { type: Number, default: 0 },
        following: { type: Number, default: 0 }
    },
    followers: [String], // Array of emails or IDs
    following: [String],
    isPrivate: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationRequired: { type: Boolean, default: false }, // For legacy/optional support
    verificationCode: String,
    verificationCodeExpires: Date,
    blockedUsers: [{ type: String }], // Array of user IDs or emails blocked by this user
    serverProfiles: [{
        serverId: Number,
        nickname: String,
        avatar: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
