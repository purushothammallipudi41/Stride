/**
 * privacy.js
 * 
 * Middleware to protect user PII in logs and debugging.
 */

const redactPII = (obj) => {
    const sensitiveKeys = ['email', 'password', 'token', 'userEmail', 'twoFactorSecret', 'phone'];
    const newObj = { ...obj };

    for (const key in newObj) {
        if (sensitiveKeys.includes(key)) {
            if (typeof newObj[key] === 'string' && newObj[key].length > 4) {
                // Redact email or sensitive strings: u***@domain.com or t***en
                const val = newObj[key];
                if (val.includes('@')) {
                    const [user, domain] = val.split('@');
                    newObj[key] = `${user[0]}***@${domain}`;
                } else {
                    newObj[key] = `${val.substring(0, 2)}***${val.substring(val.length - 2)}`;
                }
            } else {
                newObj[key] = '***';
            }
        } else if (typeof newObj[key] === 'object' && newObj[key] !== null) {
            newObj[key] = redactPII(newObj[key]);
        }
    }
    return newObj;
};

const privacyMiddleware = (req, res, next) => {
    // Log redacted body for debugging without exposing PII
    if (req.body && Object.keys(req.body).length > 0) {
        const redacted = redactPII(req.body);
        console.log(`[PRIVACY] Request to ${req.path} with body:`, JSON.stringify(redacted));
    }
    next();
};

module.exports = { privacyMiddleware, redactPII };
