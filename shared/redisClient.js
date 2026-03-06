const Redis = require('ioredis');
const NodeCache = require('node-cache');

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const USE_REDIS = process.env.ENABLE_REDIS === 'true';

let redisClient = null;
let pubClient = null;
let subClient = null;
const localCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

const INVALIDATION_CHANNEL = 'cache_invalidation';

if (USE_REDIS) {
    try {
        const redisOptions = {
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                if (times > 3) return null;
                return Math.min(times * 50, 2000);
            }
        };

        redisClient = new Redis(REDIS_URL, redisOptions);
        pubClient = new Redis(REDIS_URL, redisOptions);
        subClient = new Redis(REDIS_URL, redisOptions);

        const setupSub = async () => {
            try {
                await subClient.subscribe(INVALIDATION_CHANNEL);
                subClient.on('message', (channel, key) => {
                    if (channel === INVALIDATION_CHANNEL) {
                        localCache.del(key);
                        // console.log(`[CACHE] Local cache invalidated for key: ${key}`);
                    }
                });
            } catch (err) {
                console.error('Redis Subscribe Error:', err.message);
            }
        };
        setupSub();

        redisClient.on('error', (err) => console.error('Redis Connection Error:', err.message));
        redisClient.on('connect', () => console.log('✅ Connected to Redis at', REDIS_URL));
    } catch (e) {
        console.error('Failed to initialize Redis client:', e.message);
    }
} else {
    console.log('ℹ️ Redis is disabled. Using in-memory fallback (node-cache).');
}

/**
 * Hybrid Caching Utility
 */
const cache = {
    set: async (key, value, ttl = 3600) => {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;

        if (redisClient && redisClient.status === 'ready') {
            try {
                await redisClient.set(key, stringValue, 'EX', ttl);
                // Also invalidate other nodes if we are updating a key
                if (pubClient && pubClient.status === 'ready') {
                    await pubClient.publish(INVALIDATION_CHANNEL, key);
                }
                return true;
            } catch (e) {
                console.error('Redis Set Error:', e.message);
            }
        }

        return localCache.set(key, value, ttl);
    },

    get: async (key) => {
        if (redisClient && redisClient.status === 'ready') {
            try {
                const val = await redisClient.get(key);
                if (val) {
                    try {
                        const parsed = JSON.parse(val);
                        // Update local cache for faster subsequent reads
                        localCache.set(key, parsed, 300); // Small TTL for local mirror
                        return parsed;
                    } catch (e) {
                        localCache.set(key, val, 300);
                        return val;
                    }
                }
            } catch (e) {
                console.error('Redis Get Error:', e.message);
            }
        }

        return localCache.get(key);
    },

    del: async (key) => {
        if (redisClient && redisClient.status === 'ready') {
            try {
                await redisClient.del(key);
                // Broadcast invalidation
                if (pubClient && pubClient.status === 'ready') {
                    await pubClient.publish(INVALIDATION_CHANNEL, key);
                }
                return true;
            } catch (e) {
                console.error('Redis Del Error:', e.message);
            }
        }

        return localCache.del(key);
    },

    flush: async () => {
        if (redisClient && redisClient.status === 'ready') {
            try {
                await redisClient.flushall();
                if (pubClient && pubClient.status === 'ready') {
                    await pubClient.publish(INVALIDATION_CHANNEL, '__FLUSH_ALL__');
                }
            } catch (e) {
                console.error('Redis Flush Error:', e.message);
            }
        }
        localCache.flushAll();
    },

    /**
     * Publish a message to a Redis channel
     */
    publish: async (channel, message) => {
        if (pubClient && pubClient.status === 'ready') {
            try {
                const payload = typeof message === 'object' ? JSON.stringify(message) : message;
                return await pubClient.publish(channel, payload);
            } catch (e) {
                console.error('Redis Publish Error:', e.message);
            }
        }
        return false;
    },

    /**
     * Get the raw Redis client (use with caution)
     */
    getClient: () => redisClient,

    /**
     * Get the subscriber client (use with caution)
     */
    getSubClient: () => subClient
};

module.exports = cache;
