const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: { type: String, required: true }, // Username
    type: { type: String, enum: ['topup', 'tip', 'subscription', 'withdrawal', 'reward', 'purchase'], required: true },
    amount: { type: Number, required: true },
    target: { type: String }, // Target username or post ID
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    description: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
