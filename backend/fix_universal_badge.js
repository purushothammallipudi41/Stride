const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function fixUniversalBadge() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database.');

        // Perks to remove from regular users
        const perksToRemove = ['custom_status', 'neon_frame', 'gold_name'];

        // We will preserve these perks for the official project accounts
        const preservedUsernames = ['stride', 'purushotham_mallipudi'];

        console.log(`Removing ${perksToRemove.join(', ')} from all users except: ${preservedUsernames.join(', ')}`);

        const result = await User.updateMany(
            { username: { $nin: preservedUsernames } },
            { $pullAll: { unlockedPerks: perksToRemove } }
        );

        console.log(`Successfully updated ${result.modifiedCount} users.`);

    } catch (error) {
        console.error('Error during database cleanup:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

fixUniversalBadge();
