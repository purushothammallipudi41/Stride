const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    trackId: { type: String, required: true },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listens: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    tips: { type: Number, default: 0 },
    isCollectible: { type: Boolean, default: false },
    totalCollected: { type: Number, default: 0 },
    dailyStats: [{

        date: { type: String }, // YYYY-MM-DD
        listens: { type: Number, default: 0 }
    }]
});

module.exports = mongoose.model('Analytics', analyticsSchema);
