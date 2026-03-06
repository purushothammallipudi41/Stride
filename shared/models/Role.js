const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    color: { type: String, default: '#99aab5' },
    permissions: {
        administrator: { type: Boolean, default: false },
        manageServer: { type: Boolean, default: false },
        manageChannels: { type: Boolean, default: false },
        manageMessages: { type: Boolean, default: false },
        manageMembers: { type: Boolean, default: false },
        createInvite: { type: Boolean, default: true },
        changeNickname: { type: Boolean, default: true },
        manageNicknames: { type: Boolean, default: false },
        sendMessages: { type: Boolean, default: true },
        readHistory: { type: Boolean, default: true }
    },
    serverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Server', required: true },
    position: { type: Number, default: 0 } // For role hierarchy
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
