const mongoose = require('mongoose');
require('dotenv').config();

// Models - Adjust paths if necessary
const Post = require('./models/Post');
const User = require('./models/User');

const PREMIUM_USER = {
    username: "aura_luxe",
    name: "Aura Luxe ✨",
    email: "luxury@stride.in",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    bio: "Living the curated life. 4K Reels & Aesthetic Vibes. 💎",
    stats: { posts: 4, followers: 45200, following: 120 },
    isVerified: true
};

const NEW_REELS = [
    {
        username: "aura_luxe",
        userAvatar: PREMIUM_USER.avatar,
        type: "reel",
        contentUrl: "https://videos.pexels.com/video-files/5828437/5828437-sd_360_640_24fps.mp4",
        caption: "Abstract textures for your soul. ✨ #Aesthetic #Vibe",
        likes: ["stride", "purushothammallipudi"],
        comments: []
    },
    {
        username: "aura_luxe",
        userAvatar: PREMIUM_USER.avatar,
        type: "reel",
        contentUrl: "https://videos.pexels.com/video-files/4536500/4536500-sd_360_640_30fps.mp4",
        caption: "Lost in the green. 🌿 #Nature #Serenity",
        likes: ["stride"],
        comments: []
    },
    {
        username: "aura_luxe",
        userAvatar: PREMIUM_USER.avatar,
        type: "reel",
        contentUrl: "https://videos.pexels.com/video-files/7277922/7277922-sd_360_640_25fps.mp4",
        caption: "City lights and late nights. 🌃 #Urban #Nightlife",
        likes: ["purushothammallipudi"],
        comments: []
    },
    {
        username: "aura_luxe",
        userAvatar: PREMIUM_USER.avatar,
        type: "reel",
        contentUrl: "https://videos.pexels.com/video-files/4998278/4998278-hd_1080_1920_30fps.mp4",
        caption: "Poolside paradise. ☀️ #Luxury #Resort #Travel",
        likes: ["stride", "purushothammallipudi"],
        comments: []
    },
    {
        username: "aura_luxe",
        userAvatar: PREMIUM_USER.avatar,
        type: "reel",
        contentUrl: "https://videos.pexels.com/video-files/5167964/5167964-hd_1080_1920_30fps.mp4",
        caption: "Beachfront vibes. 🌴 #Ocean #Vacation",
        likes: ["stride"],
        comments: []
    },
    {
        username: "aura_luxe",
        userAvatar: PREMIUM_USER.avatar,
        type: "reel",
        contentUrl: "https://videos.pexels.com/video-files/10211984/10211984-hd_1080_1920_30fps.mp4",
        caption: "Infinity views. 🌊 #InfinityPool #Goals",
        likes: ["purushothammallipudi"],
        comments: []
    },
    {
        username: "aura_luxe",
        userAvatar: PREMIUM_USER.avatar,
        type: "reel",
        contentUrl: "https://videos.pexels.com/video-files/5992311/5992311-hd_1080_1920_30fps.mp4",
        caption: "Balcony bliss. 🌅 #MorningView #Peace",
        likes: ["stride"],
        comments: []
    },
    {
        username: "aura_luxe",
        userAvatar: PREMIUM_USER.avatar,
        type: "reel",
        contentUrl: "https://cdn.pixabay.com/video/2016/07/07/3735-173719892_large.mp4",
        caption: "Elevated elegance. 🥂 #Luxury #Gold",
        likes: ["stride", "purushothammallipudi"],
        comments: []
    },
    {
        username: "aura_luxe",
        userAvatar: PREMIUM_USER.avatar,
        type: "reel",
        contentUrl: "https://cdn.pixabay.com/video/2024/03/24/205415-926967131_large.mp4",
        caption: "Ancient mysteries. 🏜️ #Travel #Giza",
        likes: ["stride"],
        comments: []
    }
];

async function seed() {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        // await mongoose.connect("mongodb+srv://purushothammallipudi41_db_user:Stride2026!Fixed@cluster0.edd4ioz.mongodb.net/stride?retryWrites=true&w=majority&appName=Cluster0");
        console.log('✅ Connected.');

        // 1. Ensure User exists
        let user = await User.findOne({ username: PREMIUM_USER.username });
        if (!user) {
            console.log(`👤 Creating user: ${PREMIUM_USER.username}`);
            user = await User.create(PREMIUM_USER);
        } else {
            console.log(`👤 User ${PREMIUM_USER.username} already exists.`);
            // Update stats if needed
            user.avatar = PREMIUM_USER.avatar;
            await user.save();
        }

        // 2. Clear old Mixkit reels AND existing aura_luxe reels to prevent duplicates
        console.log('🧹 Clearing old reels...');
        await Post.deleteMany({
            type: 'reel',
            contentUrl: { $regex: /mixkit/i }
        });

        // Remove previous reels from this user to re-seed cleanly
        const userReelsDeleted = await Post.deleteMany({
            username: PREMIUM_USER.username,
            type: 'reel'
        });
        console.log(`✅ Deleted ${userReelsDeleted.deletedCount} existing reels for ${PREMIUM_USER.username}.`);

        // 3. Seed new Reels
        console.log('🌱 Seeding new premium reels...');
        for (const reel of NEW_REELS) {
            await Post.create({
                ...reel,
                userId: user._id,
                userEmail: user.email,
                timestamp: new Date()
            });
            console.log(`➕ Added Reel: ${reel.caption.substring(0, 20)}...`);
        }

        console.log('✨ Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seed();
