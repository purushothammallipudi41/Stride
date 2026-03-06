const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    token: { type: String, required: true },
    device: { type: String },
    ip: { type: String },
    lastActive: { type: Date, default: Date.now },
    userAgent: { type: String }
});

module.exports = mongoose.model('Session', SessionSchema);
