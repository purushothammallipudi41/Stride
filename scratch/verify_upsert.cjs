const axios = require('axios');

async function testUpsert() {
    const BASE_URL = 'http://localhost:5005';
    const testUser = {
        username: 'transient_tester_' + Date.now(),
        name: 'Transient Tester',
        bio: 'I only exist because of upserts',
        avatar: 'https://i.pravatar.cc/150?u=transient'
    };

    try {
        console.log(`Testing upsert for ${testUser.username}...`);
        
        // 1. Try to fetch - should return fallback "mock" user
        const fetchRes = await axios.get(`${BASE_URL}/api/profile/${testUser.username}`);
        console.log(`Initial Fetch (should be fallback): ${fetchRes.data.name === testUser.username ? 'SUCCESS' : 'FAIL (got ' + fetchRes.data.name + ')'}`);

        // 2. Perform Update (Upsert)
        const updateRes = await axios.post(`${BASE_URL}/api/profile/update`, testUser);
        console.log(`Update Response: ${updateRes.data.success ? 'SUCCESS' : 'FAIL'}`);

        // 3. Verify record creation in DB
        const verifyRes = await axios.get(`${BASE_URL}/api/profile/${testUser.username}`);
        console.log(`Verify Fetch (should be real): ${verifyRes.data.name === testUser.name ? 'SUCCESS' : 'FAIL (got ' + verifyRes.data.name + ')'}`);

        if (verifyRes.data.name === testUser.name) {
            console.log("TEST PASSED: User record was created via upsert.");
        } else {
            console.log("TEST FAILED: User record mismatch.");
        }

    } catch (err) {
        console.error("Test failed with error:", err.message);
        if (err.message.includes('ECONNREFUSED')) {
            console.log("SKIP: Server not running on localhost:5005");
        }
    }
}

testUpsert();
