const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String }, // Optional for mock data hydration
    password: { type: String }, // Optional for mock data hydration
    name: { type: String, required: true },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "https://i.pravatar.cc/150" },
    avatarFrame: { type: String, default: "none" },
    accentColor: { type: String, default: "#8b5cf6" }, // Default to primary purple
    banner: { type: String, default: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070&auto=format&fit=crop" },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    topTracks: [{
        id: String,
        title: String,
        artist: String,
        artwork: String
    }],
    socialLinks: {
        instagram: String,
        twitter: String,
        website: String
    },
    posts: [{ type: mongoose.Schema.Types.Mixed }], // Mixed to handle both ObjectIds and legacy nested objects
    favorites: [{ type: String }], // Array of song IDs or similar
    isVerified: { type: Boolean, default: false },
    hasUnreadNotifications: { type: Boolean, default: false },
    hasUnreadMessages: { type: Boolean, default: false }
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);
