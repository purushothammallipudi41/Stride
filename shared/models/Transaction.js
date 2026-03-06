const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    fromEmail: { type: String, required: true, index: true },
    toEmail: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    type: {
        type: String,
        enum: ['tip', 'subscription', 'content_unlock', 'sticker_purchase', 'ad_revenue'],
        required: true,
        index: true
    },
    referenceId: { type: String, index: true }, // PostId, PackId, etc.
    description: String,
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

// Index for ledger/dashboard lookups
transactionSchema.index({ fromEmail: 1, timestamp: -1 });
transactionSchema.index({ toEmail: 1, timestamp: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
