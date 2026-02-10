const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables if needed, assuming they're in local .env or provided by environment
// For this environment, we rely on the connection string we've seen in the logs or previous turns.
const MONGO_URI = "mongodb+srv://thestrideapp:purushotham@cluster0.p0v7w.mongodb.net/vibestream?retryWrites=true&w=majority";

const Post = require('./backend/models/Post');
const Notification = require('./backend/models/Notification');
const Story = require('./backend/models/Story');

async function cleanup() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB for cleanup');

        const deletedPosts = await Post.deleteMany({ username: { $in: ["stride", "alex_beats", "purushotham_mallipudi"] } });
        console.log(`Deleted ${deletedPosts.deletedCount} mock posts`);

        const deletedNotes = await Notification.deleteMany({});
        console.log(`Cleared ${deletedNotes.deletedCount} notifications`);

        const deletedStories = await Story.deleteMany({});
        console.log(`Cleared ${deletedStories.deletedCount} stories`);

        console.log('Cleanup complete');
        process.exit(0);
    } catch (e) {
        console.error('Cleanup failed:', e);
        process.exit(1);
    }
}

cleanup();
