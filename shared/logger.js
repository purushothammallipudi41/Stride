const fs = require('fs');
const path = require('path');

const logLevels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

const currentLogLevel = process.env.LOG_LEVEL || 'INFO';

const logger = {
    log(level, message, meta = {}) {
        if (logLevels[level] < logLevels[currentLogLevel]) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...meta,
            service: process.env.SERVICE_NAME || 'unknown-service'
        };

        const logString = JSON.stringify(logEntry);

        // In production, we'd send this to a centralized collector or a file
        // For now, we print to console where Docker/system monitors can capture it
        console.log(logString);

        // Also append to a shared file for easy manual inspection during dev
        try {
            const logDir = path.join(__dirname, '../logs');
            if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
            fs.appendFileSync(path.join(logDir, 'combined.log'), logString + '\n');
        } catch (e) {
            // Fail silently for file logging in dev
        }
    },

    debug(msg, meta) { this.log('DEBUG', msg, meta); },
    info(msg, meta) { this.log('INFO', msg, meta); },
    warn(msg, meta) { this.log('WARN', msg, meta); },
    error(msg, meta) { this.log('ERROR', msg, meta); }
};

module.exports = logger;
