const mongoose = require('mongoose');

const PlaylistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    thumbnail: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isCollaborative: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
    tracks: [{
        id: String,
        title: String,
        artist: String,
        cover: String,
        duration: Number,
        addedAt: { type: Date, default: Date.now },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    tags: [String]
}, { timestamps: true });

module.exports = mongoose.model('Playlist', PlaylistSchema);
