const AuditLog = require('./models/AuditLog');
const logger = require('./logger');

/**
 * Enterprise Audit Logger
 * Standardizes security and moderation event tracking across microservices.
 */
const auditLogger = {
    /**
     * Log a security or moderation event
     * @param {Object} params
     * @param {string} params.action - e.g., 'LOGIN_SUCCESS', 'PASSWORD_CHANGED', 'USER_KICKED'
     * @param {string} params.actorUserId - The user performing the action
     * @param {string} [params.targetUserId] - The user affected by the action
     * @param {string} [params.serverId] - ID of the server if applicable
     * @param {string} [params.reason] - Justification for the action
     * @param {string} [params.content] - Relevant data (e.g., blocked keyword)
     * @param {Object} [params.metadata] - Additional context
     */
    log: async ({ action, actorUserId, targetUserId, serverId, reason, content, metadata }) => {
        try {
            const logEntry = new AuditLog({
                action,
                actorUserId,
                targetUserId,
                serverId: serverId || 'SYSTEM',
                reason,
                content,
                metadata: metadata ? JSON.stringify(metadata) : undefined
            });

            await logEntry.save();

            // Also log to our structured JSON logs for real-time monitoring
            logger.info(`[AUDIT] ${action}`, {
                actor: actorUserId,
                target: targetUserId,
                server: serverId,
                reason
            });

            return logEntry;
        } catch (err) {
            logger.error('Audit Logging Failed:', {
                error: err.message,
                action,
                actorUserId
            });
        }
    },

    // Pre-defined Actions for consistency
    Actions: {
        LOGIN_SUCCESS: 'LOGIN_SUCCESS',
        LOGIN_FAILED: 'LOGIN_FAILED',
        LOGOUT: 'LOGOUT',
        PASSWORD_CHANGE: 'PASSWORD_CHANGE',
        TWO_FA_ENABLED: 'TWO_FA_ENABLED',
        TWO_FA_DISABLED: 'TWO_FA_DISABLED',
        USER_REGISTERED: 'USER_REGISTERED',
        USER_WARNED: 'USER_WARNED',
        USER_MUTED: 'USER_MUTED',
        USER_KICKED: 'USER_KICKED',
        KEYWORD_BLOCKED: 'KEYWORD_BLOCKED',
        SENSITIVE_DATA_ACCESS: 'SENSITIVE_DATA_ACCESS'
    }
};

module.exports = auditLogger;
