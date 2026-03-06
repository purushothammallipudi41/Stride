const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
    from: String,
    to: String,
    text: String,
    sharedContent: Object,
    timestamp: { type: Date, default: Date.now },
    time: String, // Legacy formatted time string
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'DirectMessage' }
});

module.exports = mongoose.model('DirectMessage', directMessageSchema);
