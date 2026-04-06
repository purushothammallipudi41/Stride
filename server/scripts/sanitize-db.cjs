const mongoose = require('mongoose');
const Post = require('../models/Post.cjs');
const User = require('../models/User.cjs');
require('dotenv').config();

const UNSPLASH_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
    "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    "https://images.unsplash.com/photo-1459749411177-042180ce673c?w=800&q=80",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80"
];

const getRandomPlaceholder = () => UNSPLASH_PLACEHOLDERS[Math.floor(Math.random() * UNSPLASH_PLACEHOLDERS.length)];

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
        
        const postsToSanitize = await Post.find({
            $or: [
                { contentUrl: localPathRegex },
                { imageUrl: localPathRegex }
            ]
        });

        console.log(`Found ${postsToSanitize.length} posts with local file paths.`);

        for (const post of postsToSanitize) {
            const oldValue = post.contentUrl || post.imageUrl;
            post.contentUrl = getRandomPlaceholder();
            // Also ensure imageUrl is updated if it exists
            if (post.imageUrl) post.imageUrl = post.contentUrl;
            await post.save();
            console.log(`Sanitized post ${post._id}: ${oldValue} -> ${post.contentUrl}`);
        }

        // 2. Sanitize User Avatars/Banners
        const usersToSanitize = await User.find({
            $or: [
                { avatar: localPathRegex },
                { banner: localPathRegex }
            ]
        });

        console.log(`Found ${usersToSanitize.length} users with local file paths.`);

        for (const user of usersToSanitize) {
            if (localPathRegex.test(user.avatar)) {
                user.avatar = `https://i.pravatar.cc/150?u=${user.username}`;
            }
            if (localPathRegex.test(user.banner)) {
                user.banner = getRandomPlaceholder();
            }
            await user.save();
            console.log(`Sanitized user ${user.username}: paths replaced with web URLs.`);
        }

        console.log("Sanitization complete.");
        process.exit(0);
    } catch (err) {
        console.error("Sanitization ERROR:", err);
        process.exit(1);
    }
}

sanitize();
