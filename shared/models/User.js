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
        serverId: { type: Number, index: true },
        nickname: String,
        avatar: String
    }],
    isOfficial: { type: Boolean, default: false }, // Blue Tick status
    verificationRequest: {
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: null },
        documentUrl: String,
        timestamp: { type: Date, index: true }
    },
    vibeTokens: { type: Number, default: 0 },
    lastVibeClaim: { type: Date, default: null },
    unlockedPerks: [{ type: String }],
    profileThemeUrl: { type: String, default: null },
    activeAvatarFrame: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    status: { type: String, default: '' },
    isAI: { type: Boolean, default: false },
    moderation: {
        warningCount: { type: Number, default: 0 },
        isMuted: { type: Boolean, default: false },
        muteExpires: { type: Date, default: null }
    },
    activeSubscriptions: [{
        serverId: Number,
        tierName: String,
        tierLevel: Number,
        expiresAt: Date
    }],
    twoFactorSecret: String,
    isTwoFactorEnabled: { type: Boolean, default: false },
    fcmTokens: [{ type: String }], // For push notifications (multi-device)
    referralCode: { type: String, default: null }, // Referral code used to join
    messagingPublicKey: { type: String, default: null }, // Base64 encoded public key for E2EE
    // Gamification — Phase 40
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null }, // YYYY-MM-DD
    achievements: [{ type: String }], // IDs of earned achievements
    weeklyXp: { type: Number, default: 0 }, // Resets weekly for leaderboard
    role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user', index: true }
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);
