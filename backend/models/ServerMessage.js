const mongoose = require('mongoose');

const serverMessageSchema = new mongoose.Schema({
    serverId: Number,
    channelId: String,
    userEmail: String,
    username: String,
    userAvatar: String,
    text: String,
    type: { type: String, default: 'text' },
    timestamp: { type: Date, default: Date.now },
    time: String,
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'ServerMessage' }
});

module.exports = mongoose.model('ServerMessage', serverMessageSchema);
