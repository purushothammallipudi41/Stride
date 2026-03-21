const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['tip', 'subscription'], default: 'tip' },
    timestamp: { type: Date, default: Date.now },
    trackId: { type: String } // Optional track reference for tips
});

module.exports = mongoose.model('Transaction', transactionSchema);
