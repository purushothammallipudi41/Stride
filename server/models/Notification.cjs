const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: String, required: true }, // target username
    type: { type: String, enum: ['like', 'follow', 'message', 'mention', 'system'], required: true },
    from: { type: String, required: true }, // username of the person who triggered it
    content: { type: String, required: true },
    time: { type: String, default: "Just now" },
    readStatus: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
