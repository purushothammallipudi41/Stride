process.env.SERVICE_NAME = 'api-gateway';
require('../shared/instrumentation');
const logger = require('../shared/logger');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { Server } = require("socket.io");
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
const auditLogger = require('../shared/auditLogger');
const port = process.env.PORT || 3001;
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Paths for Microservices
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5002';
const MESSAGING_SERVICE_URL = process.env.MESSAGING_SERVICE_URL || 'http://localhost:5003';
const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://localhost:5004';
const MONETIZATION_SERVICE_URL = process.env.MONETIZATION_SERVICE_URL || 'http://localhost:5005';

// Mongoose & Database (Shared)
const connectDB = require('../shared/db');
const cache = require('../shared/redisClient');

// Models (Imported for seeding/global use from Shared)
const User = require('../shared/models/User');
const ServerModel = require('../shared/models/Server');

// Route Imports (Monolith Remaining)
// All routes extracted to microservices

// Utils (Shared)
const { sendVerificationEmail } = require('../shared/utils/email');

// Force IPv4 for DNS resolution to avoid ENETUNREACH on Render
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

// Connect to MongoDB
connectDB();

const app = express();

// --- Global Middleware ---
app.use(helmet()); // Secure HTTP headers
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));
app.use(morgan('dev'));

// --- Rate Limiting (Redis-backed with memory fallback) ---
const useRedis = process.env.ENABLE_REDIS === 'true' && cache.getClient();
const limiterStore = useRedis ? new RedisStore({
    // @ts-expect-error - ioredis type mismatch but it works
    sendCommand: (...args) => cache.getClient().call(...args),
}) : undefined; // undefined defaults to MemoryStore

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 20, // 20 attempts per window
    message: { error: 'Too many login attempts, please try again later.' },
    store: limiterStore,
    handler: (req, res, next, options) => {
        auditLogger.log({
            action: 'RATE_LIMIT_EXCEEDED',
            actorUserId: req.ip,
            reason: 'Brute force protection triggered on Login',
            metadata: { identifier: req.body.identifier }
        });
        res.status(options.statusCode).send(options.message);
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // 500 requests per 15 mins
    message: { error: 'Too many requests, slow down please.' },
    store: limiterStore,
    handler: (req, res, next, options) => {
        auditLogger.log({
            action: 'RATE_LIMIT_EXCEEDED',
            actorUserId: req.ip,
            reason: 'API quota exceeded',
            metadata: { url: req.originalUrl }
        });
        res.status(options.statusCode).send(options.message);
    }
});

app.use('/api/auth/login', authLimiter);
app.use('/api', apiLimiter);

// --- API Gateway Proxy Routes ---
// IMPORTANT: These must come BEFORE express.json() to avoid hanging on POST/PUT requests
app.use(createProxyMiddleware({
    pathFilter: '/api/auth',
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to AUTH_SERVICE`);
    },
    onError: (err, req, res) => {
        console.error(`[PROXY_ERROR] Auth Service unreachable: ${err.message}`);
        res.status(502).json({ error: 'Authentication service temporarily unavailable' });
    }
}));

app.use(createProxyMiddleware({
    pathFilter: '/api/users',
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/users': '' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to USER_SERVICE`);
    },
    onError: (err, req, res) => {
        console.error(`[PROXY_ERROR] User Service unreachable: ${err.message}`);
        res.status(502).json({ error: 'User service temporarily unavailable' });
    }
}));

app.use(createProxyMiddleware({
    pathFilter: '/api/moderation',
    target: USER_SERVICE_URL,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to USER_SERVICE`);
    }
}));

// Consolidated Messaging Service Proxy
app.use(createProxyMiddleware({
    target: MESSAGING_SERVICE_URL,
    changeOrigin: true,
    pathFilter: [
        '/api/messages',
        '/api/conversations',
        '/api/servers',
        '/api/server-threads',
        '/api/stickers',
        '/api/link-preview'
    ],
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to MESSAGING_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: MESSAGING_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/online-users',
    pathRewrite: { '^/api/online-users': '/online-users' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to MESSAGING_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: MESSAGING_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/active-vibe-sessions',
    pathRewrite: { '^/api/active-vibe-sessions': '/active-vibe-sessions' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to MESSAGING_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/posts',
    pathRewrite: { '^/api/posts': '/posts' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to CONTENT_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/feed/foryou',
    pathRewrite: { '^/api/feed/foryou': '/posts/foryou' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to CONTENT_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/analytics',
    pathRewrite: { '^/api/analytics': '/analytics' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to CONTENT_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/activity',
    pathRewrite: { '^/api/activity': '/analytics/activity' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to CONTENT_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/gamification',
    pathRewrite: { '^/api/gamification': '/api/gamification' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to USER_SERVICE (gamification)`);
    }
}));

app.use(createProxyMiddleware({
    target: CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/ai',
    pathRewrite: { '^/api/ai': '/ai' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to CONTENT_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/audius',
    pathRewrite: { '^/api/audius': '/audius' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to CONTENT_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/spaces',
    pathRewrite: { '^/api/spaces': '/spaces' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to CONTENT_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/articles',
    pathRewrite: { '^/api/articles': '/articles' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to CONTENT_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: CONTENT_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/stories',
    pathRewrite: { '^/api/stories': '/stories' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to CONTENT_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: MONETIZATION_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/ads',
    pathRewrite: { '^/api/ads': '/ads' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to MONETIZATION_SERVICE`);
    }
}));

app.use(createProxyMiddleware({
    target: MONETIZATION_SERVICE_URL,
    changeOrigin: true,
    pathFilter: '/api/marketplace',
    pathRewrite: { '^/api/marketplace': '/marketplace' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[PROXY] Routing ${req.method} ${req.url} to MONETIZATION_SERVICE`);
    }
}));

// --- Body Parsing (Only for monolith routes) ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Request Logging Middleware ---
app.use((req, res, next) => {
    // Only log body for non-proxied routes (if body parser was used)
    const displayBody = req.body ? JSON.stringify(req.body) : '[OMITTED_OR_PROXIED]';
    const log = `[${new Date().toISOString()}] ${req.method} ${req.url} - Body: ${displayBody}\n`;

    try {
        const logPath = path.join(__dirname, 'api_requests.log');
        if (fs.existsSync(logPath) && fs.statSync(logPath).size > 5 * 1024 * 1024) {
            fs.writeFileSync(logPath, '[LOG_ROTATED]\n');
        }
        fs.appendFileSync(logPath, log);
    } catch (e) { }
    next();
});

// --- Socket.IO Proxying ---
const httpServer = http.createServer(app);

// Use http-proxy-middleware to handle Socket.IO upgrades
app.use(createProxyMiddleware({
    target: MESSAGING_SERVICE_URL,
    changeOrigin: true,
    ws: true, // Enable WebSocket proxying
    logLevel: 'debug',
    pathFilter: '/socket.io'
}));

// --- Monolith Remaining Routes ---
// All functional routes extracted to microservices

// Health Check
app.get('/api/health', (req, res) => {
    const isConnected = mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2;
    res.json({ status: 'ok', database: isConnected ? 'connected' : 'disconnected' });
});

// Static Assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Note: Re-implementing simplified seeding here to maintain startup behavior
setTimeout(() => {
    seedDatabase().catch(err => logger.error('[INIT] seedDatabase failed:', { error: err.message }));
}, 2000);

async function seedDatabase() {
    try {
        const targetUsernames = ['stride', 'purushotham_mallipudi'];
        const existingTargets = await User.find({ username: { $in: targetUsernames } });
        const existingUsernames = existingTargets.map(u => u.username);

        const newUsers = [
            {
                username: "stride",
                name: "Stride Official",
                email: "thestrideapp@gmail.com",
                password: "password123",
                avatar: "logo.png",
                bio: "The official beat of Stride. 🎵 #KeepStriding",
                stats: { posts: 999, followers: 12500, following: 0 },
                isVerified: true,
                isAI: true,
                serverProfiles: [{ serverId: 0, nickname: "Stride AI", avatar: "logo.png" }],
                members: [{ userId: "thestrideapp@gmail.com" }, { userId: "purushothammallipudi41@gmail.com" }]
            },
            {
                username: "purushotham_mallipudi",
                name: "Purushotham Mallipudi",
                email: "purushothammallipudi41@gmail.com",
                password: "password123",
                avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=purushotham",
                bio: "Building the future of social music. 🚀",
                stats: { posts: 12, followers: 12500, following: 450 },
                isVerified: true,
                serverProfiles: [{ serverId: 0, nickname: "purushotham_mallipudi", avatar: "" }]
            }
        ];

        for (const u of newUsers) {
            if (!existingUsernames.includes(u.username)) {
                await User.create(u);
                logger.info(`✅ Seeded user: ${u.username}`);
            }
        }

        // Stride Official Server
        let strideOfficial = await ServerModel.findOne({ id: 0 });
        if (!strideOfficial) {
            await ServerModel.create({
                id: 0,
                name: "Stride Official",
                icon: "/logo.png",
                channels: [{ name: "general", type: "text" }],
                ownerId: "stride",
                admins: ["thestrideapp@gmail.com", "purushothammallipudi41@gmail.com"],
                members: [{ userId: "thestrideapp@gmail.com" }, { userId: "purushothammallipudi41@gmail.com" }],
                isPublic: true,
                category: "Social",
                description: "The beat of Stride."
            });
            logger.info('✅ Stride Official Server created');
        } else if (strideOfficial && (!strideOfficial.members || strideOfficial.members.length === 0)) {
            strideOfficial.members = [{ userId: "thestrideapp@gmail.com" }, { userId: "purushothammallipudi41@gmail.com" }];
            await strideOfficial.save();
            logger.info('✅ Stride Official Server members updated');
        }

    } catch (err) {
        logger.error('Seeding error:', { error: err.message });
    }
}

// Socket IO logic moved to messaging-service

httpServer.listen(port, () => {
    logger.info(`🚀 API Gateway running on port ${port}`);
});
