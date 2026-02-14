const mongoose = require('mongoose');
require('dotenv').config();

const Story = require('./models/Story');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete all stories EXCEPT for the primary test user
        const result = await Story.deleteMany({ userId: { $ne: 'user@example.com' } });
        console.log(`Deleted ${result.deletedCount} test stories.`);

        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanup();
