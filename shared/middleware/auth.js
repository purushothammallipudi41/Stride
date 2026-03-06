const mongoose = require('mongoose');
const cache = require('../redisClient');

const Session = require('../models/Session');

async function authenticate(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1] || req.headers['x-session-token'];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        // Check Redis Cache first
        const cachedSession = await cache.get(`session:${token}`);
        if (cachedSession) {
            req.user = cachedSession; // Contains userId and other session info
            return next();
        }

        // Fallback to MongoDB if not in cache (or if cache missed)
        const session = await Session.findOne({ token });
        if (!session) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        const User = require('../models/User');
        const query = { email: session.userId };
        if (mongoose.Types.ObjectId.isValid(session.userId)) {
            query._id = session.userId;
        }

        const user = await User.findOne({
            $or: [query]
        }).select('role username email');

        // Re-cache for future requests
        const sessionData = {
            userId: session.userId,
            role: user?.role || 'user',
            username: user?.username,
            email: user?.email,
            status: 'active'
        };
        await cache.set(`session:${token}`, sessionData, 3600); // 1 hour TTL

        req.user = sessionData;
        next();
    } catch (e) {
        console.error('[AUTH] Middleware error:', e.message);
        res.status(500).json({ error: 'Authentication service error' });
    }
}

module.exports = authenticate;
