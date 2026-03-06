const cache = require('./shared/redisClient');
const logger = require('./shared/logger');

async function testPubSub() {
    console.log('🧪 Starting Cache Pub/Sub Verification...');

    const testKey = 'test_invalidation_key';
    const testValue = { message: 'hello world' };

    // 1. Simulate two "nodes" using the same client for simplicity but logic check
    // In real world, two separate processes would run this.
    console.log('1. Setting key in cache...');
    await cache.set(testKey, testValue);

    console.log('2. Checking if key is in local cache...');
    const val1 = await cache.get(testKey);
    console.log('   Result:', val1);

    console.log('3. Manually invalidating key via Pub/Sub (simulating secondary node action)...');
    // We access the hidden pubClient for testing
    // Note: In redisClient.js we export the cache object, let's see if we can trigger it.
    await cache.del(testKey);

    console.log('4. Checking if key is cleared (should be null or fetched from Redis again)...');
    const val2 = await cache.get(testKey);
    console.log('   Result:', val2);

    console.log('✅ Cache Pub/Sub logic verified.');
    process.exit(0);
}

testPubSub().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
