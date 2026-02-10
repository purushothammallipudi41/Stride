const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    reporterId: { type: String, required: true }, // User ID or Email of reporter
    targetId: { type: String, required: true },   // ID of Post, Story, or User being reported
    targetType: { type: String, enum: ['post', 'story', 'user'], required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' }
});

module.exports = mongoose.model('Report', ReportSchema);
