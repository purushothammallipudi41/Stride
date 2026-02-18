const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    id: { type: Number, unique: true }, // Keeping custom ID for now to avoid breaking frontend that expects ints
    name: String,
    icon: String,
    channels: [String],
    categories: [{
        name: String,
        channels: [String]
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
    readOnlyChannels: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Server', serverSchema);
