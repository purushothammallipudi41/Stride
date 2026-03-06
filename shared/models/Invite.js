const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    serverId: { type: Number, required: true }, // Using Numeric ID to match Server.js 'id' field
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, default: null }, // null means never expires
    maxUses: { type: Number, default: null }, // null means unlimited uses
    usedCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Index for TTL (Time To Live) but handle nulls manually in logic
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Invite', inviteSchema);
