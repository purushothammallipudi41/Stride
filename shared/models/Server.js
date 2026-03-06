const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    id: { type: Number, unique: true }, // Keeping custom ID for now to avoid breaking frontend that expects ints
    name: String,
    icon: String,
    channels: [{
        name: String,
        type: { type: String, enum: ['text', 'voice', 'stage'], default: 'text' }
    }],
    categories: [{
        name: String,
        channels: [{
            name: String,
            type: { type: String, enum: ['text', 'voice', 'stage'], default: 'text' }
        }]
    }],
    members: [{
        userId: String, // email or username
        roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
    }],
    ownerId: String,
    admins: [{ type: String }], // Array of user IDs or emails (legacy)
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    verificationLevel: { type: String, default: 'None' },
    explicitContentFilter: { type: String, default: 'Scan members' },
    readOnlyChannels: [{ type: String }],
    isPublic: { type: Boolean, default: false },
    description: { type: String, default: '' },
    category: { type: String, enum: ['Gaming', 'Music', 'Tech', 'Entertainment', 'Social', 'Other'], default: 'Social' },
    tags: [{ type: String }],
    blacklistedKeywords: [{ type: String }],
    subscriptionTiers: [{
        level: { type: Number, default: 1 }, // e.g. 1=Supporter, 2=VIP, 3=Elite
        name: String,
        cost: Number,
        perks: [String],
        badgeColor: { type: String, default: '#3b82f6' }
    }],
    isEncrypted: { type: Boolean, default: false },
    groupKey: { type: String } // Encrypted group key or identifier
}, { timestamps: true });


module.exports = mongoose.model('Server', serverSchema);
