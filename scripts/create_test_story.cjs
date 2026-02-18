const API_URL = 'http://localhost:3001/api';

async function createTestStory() {
    try {
        // 1. Register/Login 'techno' user
        const userData = {
            email: 'techno@vibestream.com',
            password: 'password123',
            name: 'Techno Viking',
            username: 'techno'
        };

        console.log('Logging in/Registering test user...');
        let user;

        // Try Login
        try {
            const loginRes = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: userData.email, password: userData.password })
            }); // Note: login uses 'identifier' not 'email' in server.js

            if (loginRes.ok) {
                user = await loginRes.json();
            } else {
                // If 404/401, proceed to register
                const txt = await loginRes.text();
                // console.log("Login fail reason:", txt); 
                throw new Error('Login failed');
            }
        } catch (e) {
            console.log('Login failed, trying register...');
            const regRes = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (regRes.ok) {
                user = await regRes.json();
            } else {
                const errText = await regRes.text();
                throw new Error(`Register failed: ${errText}`);
            }
        }

        console.log(`User ${user.username} authenticated.`);

        // 2. Create a Story
        console.log('Posting story...');
        const storyData = {
            userId: user.email, // server.js expects 'userId' (which is often email in legacy code) or '_id' depending on schema. 
            // In server.js `app.post('/api/stories')`, it uses `req.body`.
            // Let's check Schema or usage. One place says `story.userId`.
            // The creation logic in server.js: `const story = await Story.create(storyData);`
            // Story schema likely has `userId`, `username`, `userAvatar`.
            username: user.username,
            userAvatar: user.avatar,
            type: 'image',
            content: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
            caption: 'Real-time vibes only ⚡️'
        };

        const storyRes = await fetch(`${API_URL}/stories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(storyData)
        });

        if (storyRes.ok) {
            console.log('Story posted successfully!');
        } else {
            console.error('Failed to post story:', await storyRes.text());
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

createTestStory();
