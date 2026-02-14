const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./models/Post');
const Story = require('./models/Story');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const deletedPosts = await Post.deleteMany({});
        console.log(`Deleted ${deletedPosts.deletedCount} posts`);

        const deletedStories = await Story.deleteMany({});
        console.log(`Deleted ${deletedStories.deletedCount} stories`);

        const Server = require('./models/Server');
        const deletedServers = await Server.deleteMany({});
        console.log(`Deleted ${deletedServers.deletedCount} servers`);

        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanup();
