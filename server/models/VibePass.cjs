const mongoose = require('mongoose');

const vibePassSchema = new mongoose.Schema({
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenId: { type: String, unique: true }, // For mock/real NFT mapping
    metadata: {
        rank: { type: String, default: 'Member' },
        mintDate: { type: Date, default: Date.now },
        image: String
    },
    transactionHash: String,
    status: { type: String, enum: ['minted', 'pending', 'burned'], default: 'minted' }
});

module.exports = mongoose.model('VibePass', vibePassSchema);
