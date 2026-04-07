require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post.cjs');
const User = require('../models/User.cjs');

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("ERROR: MONGODB_URI not found. Please prefix the command with MONGODB_URI='your-uri'");
        process.exit(1);
    }
    
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(uri);
        console.log("Connected.");

        const localPathRegex = /^(\/Users\/|C:\\|D:\\)/i;

        const result = await Post.deleteMany({
            $or: [
                { contentUrl: localPathRegex },
                { imageUrl: localPathRegex }
            ]
        });

        console.log(`Successfully deleted ${result.deletedCount} broken posts!`);
        
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
