const mongoose = require('mongoose');
require('../patch-bigint.cjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Models
const User = require('./models/User.cjs');
const Post = require('./models/Post.cjs');
const Server = require('./models/Server.cjs');
const Message = require('./models/Message.cjs');

const DATA_FILE = path.join(__dirname, 'data.json');

const migrate = async () => {
    try {
        console.log('--- STRIDE DATA MIGRATION STARTED ---');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stride');
        console.log('Connected to MongoDB.');

        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

        // 1. Migrate Servers
        if (data.servers) {
            console.log(`Migrating ${data.servers.length} servers...`);
            await Server.deleteMany({});
            await Server.insertMany(data.servers);
        }

        // 2. Migrate Users
        if (data.users) {
            const userArray = Object.values(data.users);
            console.log(`Migrating ${userArray.length} users...`);
            await User.deleteMany({});
            // Transform user objects (handled by Mongoose)
            for (const u of userArray) {
                await User.create(u);
            }
        }

        // 3. Migrate Feed (Posts)
        if (data.feed) {
            console.log(`Migrating ${data.feed.length} posts...`);
            await Post.deleteMany({});
            for (const p of data.feed) {
                const userObj = await User.findOne({ username: p.username });
                await Post.create({
                    ...p,
                    user: userObj ? userObj._id : null
                });
            }
        }

        // 4. Migrate Messages
        if (data.chat_threads) {
            console.log(`Migrating chat history...`);
            await Message.deleteMany({});
            for (const thread of data.chat_threads) {
                if (thread.messages) {
                    for (const m of thread.messages) {
                        await Message.create({
                            sender: m.username || thread.username,
                            receiver: m.isMe ? thread.username : 'admin',
                            text: m.text,
                            type: m.type || 'text',
                            timestamp: m.timestamp || Date.now(),
                            readStatus: m.readStatus || false
                        });
                    }
                }
            }
        }

        console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
