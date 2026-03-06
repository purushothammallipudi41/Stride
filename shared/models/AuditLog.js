const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    serverId: { type: String, required: true },
    targetUserId: { type: String },
    actorUserId: { type: String, required: true }, // Usually System or an Admin
    action: {
        type: String,
        required: true,
        enum: [
            'KEYWORD_BLOCKED', 'USER_WARNED', 'USER_MUTED', 'USER_KICKED',
            'MESSAGE_REPORTED', 'MEMBER_JOINED', 'MEMBER_LEFT',
            'SUBSCRIPTION_CREATED', 'TIP_SENT',
            'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE',
            'TWO_FA_ENABLED', 'TWO_FA_DISABLED', 'USER_REGISTERED',
            'SENSITIVE_DATA_ACCESS', 'RATE_LIMIT_EXCEEDED'
        ]
    },
    reason: { type: String },
    content: { type: String },
    metadata: { type: String }, // JSON stringified additional context
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
