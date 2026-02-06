const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: String, // 'like', 'follow', etc
    user: {
        name: String,
        avatar: String,
        email: String
    },
    targetUserEmail: String, // Who receives it
    content: String,
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
