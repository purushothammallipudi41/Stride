const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String, default: "🎧" },
    channels: [{ type: String }],
    members: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Server', serverSchema);
