const mongoose = require('mongoose');

const BotSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    ownerEmail: { type: String, required: true },
    token: { type: String, required: true, unique: true }, // API Key for bot
    avatar: { type: String, default: '/logo.png' },
    description: { type: String },
    permissions: [String], // e.g., 'send_messages', 'manage_members'
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bot', BotSchema);
