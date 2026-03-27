const mongoose = require('mongoose');

const stakeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trackId: { type: String, required: true },
    amount: { type: Number, required: true }, // VP amount staked
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
    boostMultiplier: { type: Number, default: 1.0 },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stake', stakeSchema);
