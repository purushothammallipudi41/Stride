const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema({
    from: String,
    to: String,
    text: String,
    sharedContent: Object,
    timestamp: { type: Date, default: Date.now },
    time: String // Legacy formatted time string
});

module.exports = mongoose.model('DirectMessage', directMessageSchema);
