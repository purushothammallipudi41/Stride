const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: String, // 'like', 'follow', etc
    user: {
        name: String,
        avatar: String,
        email: String
    },
    targetUserEmail: { type: String, index: true }, // Who receives it
    content: String,
    read: { type: Boolean, default: false, index: true },
    timestamp: { type: Date, default: Date.now, index: true }
});

notificationSchema.index({ targetUserEmail: 1, timestamp: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
