const mongoose = require('mongoose');
const Post = require('../models/Post.cjs');
const User = require('../models/User.cjs');
require('dotenv').config();

const UNSPLASH_PLACEHOLDERS = [];

const getRandomPlaceholder = () => "";

async function sanitize() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("ERROR: MONGODB_URI not found in environment.");
        process.exit(1);
    }

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(uri);
        console.log("Connected successfully.");

        // 1. Sanitize Posts
        const localPathRegex = /^(\/Users\/|C:\\|D:\\)/i;
        const mockRegex = /(pravatar|unsplash|placeholder|i\.pravatar\.cc)/i;
        
        const postsToSanitize = await Post.find({
            $or: [
                { contentUrl: localPathRegex },
                { imageUrl: localPathRegex },
                { contentUrl: mockRegex },
                { imageUrl: mockRegex }
            ]
        });

        console.log(`Found ${postsToSanitize.length} posts with local paths or mock URLs.`);

        for (const post of postsToSanitize) {
            const oldValue = post.contentUrl || post.imageUrl;
            post.contentUrl = "";
            if (post.imageUrl) post.imageUrl = "";
            await post.save();
            console.log(`Sanitized post ${post._id}: ${oldValue} erased.`);
        }

        // 2. Sanitize User Avatars/Banners
        const usersToSanitize = await User.find({
            $or: [
                { avatar: localPathRegex },
                { banner: localPathRegex },
                { avatar: mockRegex },
                { banner: mockRegex }
            ]
        });

        console.log(`Found ${usersToSanitize.length} users with local paths or mock URLs.`);

        for (const user of usersToSanitize) {
            let sanitized = false;
            if (localPathRegex.test(user.avatar) || mockRegex.test(user.avatar)) {
                user.avatar = "";
                sanitized = true;
            }
            if (localPathRegex.test(user.banner) || mockRegex.test(user.banner)) {
                user.banner = "";
                sanitized = true;
            }
            if (sanitized) {
                await user.save();
                console.log(`Sanitized user ${user.username}: mock paths/URLs erased.`);
            }
        }

        console.log("Sanitization complete.");
        process.exit(0);
    } catch (err) {
        console.error("Sanitization ERROR:", err);
        process.exit(1);
    }
}

sanitize();
