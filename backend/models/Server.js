const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    id: { type: Number, unique: true }, // Keeping custom ID for now to avoid breaking frontend that expects ints
    name: String,
    icon: String,
    channels: [String],
    members: { type: Number, default: 1 },
    ownerId: String,
    admins: [{ type: String }] // Array of user IDs or emails
});

module.exports = mongoose.model('Server', serverSchema);
