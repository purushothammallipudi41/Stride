require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./models/User');
const ServerModel = require('./models/Server');
const ServerMessage = require('./models/ServerMessage');

async function testWelcomeFlow() {
    try {
        await connectDB();

        // 1. Ensure Server 0 has 'welcome' channel (Simulate startup)
        let strideOfficial = await ServerModel.findOne({ id: 0 });
        if (strideOfficial && !strideOfficial.channels.includes('welcome')) {
            console.log("Adding welcome channel...");
            strideOfficial.channels.push('welcome');
            await strideOfficial.save();
        }

        // 2. Simulate Registration
        const testUserEmail = `test_welcome_${Date.now()}@example.com`;
        const testUsername = `welcome_user_${Date.now()}`;

        console.log(`Simulating registration for ${testUserEmail}...`);

        // We can't easily call the API function directly without mocking req/res, 
        // but we can replicate the logic to verify the models work as expected.
        // OR we can use 'fetch' to hit the running server if it's running.
        // Assuming server is running at localhost:5000 (default)

        // Let's try hitting the actual API
        // NOTE: Port 5000 is often taken by AirPlay on Mac. 
        // We should check what port the server is actually running on.
        // Assuming 5001 based on common alternatives or just try 5000.
        // If 5000 is AirPlay, the server likely failed to start or picked another port if configured.
        // BUT, for this test script, I will assume I can just use the DB logic directly if API fails.
        // However, the Welcome Message creation happens INSIDE the API route.
        // So I MUST hit the API.

        const PORT = process.env.PORT || 3001;

        // Try hitting the API at the configured port (3001 default)

        let apiRes;
        try {
            console.log(`Attempting to hit API at http://localhost:${PORT}/api/register`);
            apiRes = await fetch(`http://localhost:${PORT}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: testUsername,
                    email: testUserEmail,
                    password: 'password123',
                    name: 'Test Welcome'
                })
            });
        } catch (e) {
            console.error(`Failed to reach API at ${PORT}`, e);
            process.exit(1);
        }

        const apiData = await apiRes.json();
        console.log("Registration API Response:", apiData);

        if (!apiData.success) {
            console.error("❌ Registration failed:", apiData.error);
            process.exit(1);
        }

        // 3. Verify Welcome Message
        // Allow some time for async socket/db operations
        await new Promise(r => setTimeout(r, 2000));

        const messages = await ServerMessage.find({
            serverId: 0,
            channelId: 'welcome'
        }).sort({ timestamp: -1 }).limit(1);

        if (messages.length > 0) {
            const latestMsg = messages[0];
            console.log("✅ Latest Welcome Message:", latestMsg.text);
            if (latestMsg.text && latestMsg.text.includes(testUsername)) {
                console.log("✅ SUCCESS: Welcome message contains username.");
            } else {
                console.log("❌ FAILURE: Welcome message does not contain username or is empty.");
            }
        } else {
            console.log("❌ FAILURE: No messages found in welcome channel.");
        }

        process.exit(0);
    } catch (e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
}

testWelcomeFlow();
