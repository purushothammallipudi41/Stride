const mongoose = require('mongoose');

const giftTransactionSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    spaceId: { type: String, required: true },
    giftName: { type: String, required: true },
    vibeAmount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GiftTransaction', giftTransactionSchema);
