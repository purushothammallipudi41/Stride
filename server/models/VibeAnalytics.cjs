const mongoose = require('mongoose');

const vibeAnalyticsSchema = new mongoose.Schema({
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventType: {
        type: String,
        enum: ['join', 'leave', 'play', 'vibe', 'message', 'share'],
        required: true,
        index: true
    },
    metadata: {
        trackId: String,
        trackName: String,
        artistName: String,
        source: String, // e.g., 'direct', 'search'
        duration: Number
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound index for time-series queries
vibeAnalyticsSchema.index({ communityId: 1, timestamp: -1 });

module.exports = mongoose.model('VibeAnalytics', vibeAnalyticsSchema);
