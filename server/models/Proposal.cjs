const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['aesthetic', 'policy', 'feature', 'node'], 
        default: 'aesthetic' 
    },
    creator: { type: String, required: true }, // username
    communityId: { type: String, default: 'global' },
    status: { 
        type: String, 
        enum: ['active', 'passed', 'dismissed'], 
        default: 'active' 
    },
    options: [{
        label: { type: String, required: true },
        votes: { type: Number, default: 0 }
    }],
    voters: [{
        username: { type: String },
        weight: { type: Number },
        option: { type: String }
    }],
    totalWeight: { type: Number, default: 0 },
    quorum: { type: Number, default: 1000 }, // Total weight needed
    impactValue: { type: String }, // e.g. "hue-rotate(90deg)" for aesthetic shifts
    expiresAt: { type: Date, required: true },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Proposal', ProposalSchema);
