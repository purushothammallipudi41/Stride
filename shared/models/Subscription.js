const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    subscriberEmail: { type: String, required: true, index: true },
    creatorEmail: { type: String, required: true, index: true },
    tierName: { type: String, default: 'Silver' },
    tierLevel: { type: Number, default: 1 },
    serverId: { type: Number, index: true }, // If linked to a specific server
    price: { type: Number, required: true },
    currency: { type: String, default: 'Vibe Tokens' },
    status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    autoRenew: { type: Boolean, default: true }
}, { timestamps: true });

subscriptionSchema.index({ subscriberEmail: 1, creatorEmail: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
