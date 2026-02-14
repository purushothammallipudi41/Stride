const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('./models/Post');
const Story = require('./models/Story');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find stories with base64 content
        const base64Stories = await Story.find({ content: { $regex: /^data:/ } });
        console.log(`Found ${base64Stories.length} stories with base64 content.`);

        if (base64Stories.length > 0) {
            const result = await Story.deleteMany({ content: { $regex: /^data:/ } });
            console.log(`Deleted ${result.deletedCount} base64 stories.`);
        }

        // Also check posts (just in case they have base64 too)
        const base64Posts = await Post.find({ contentUrl: { $regex: /^data:/ } });
        console.log(`Found ${base64Posts.length} posts with base64 content.`);

        if (base64Posts.length > 0) {
            const result = await Post.deleteMany({ contentUrl: { $regex: /^data:/ } });
            console.log(`Deleted ${result.deletedCount} base64 posts.`);
        }

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanup();
