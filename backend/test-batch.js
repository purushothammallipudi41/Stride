const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("Starting DB cleanup for dangling references...");
        const allUsers = await User.find({}, '_id email username following followers');
        const validIds = new Set(allUsers.map(u => u._id.toString()));
        const validEmails = new Set(allUsers.map(u => u.email));
        const validUsernames = new Set(allUsers.map(u => u.username));

        const isValidUser = (val) => validIds.has(val) || validEmails.has(val) || validUsernames.has(val);

        let updatedCount = 0;

        for (const user of allUsers) {
            let changed = false;

            const originalFollowing = user.following || [];
            const validFollowing = originalFollowing.filter(isValidUser);
            if (originalFollowing.length !== validFollowing.length) {
                user.following = validFollowing;
                changed = true;
                console.log(`Cleaned following for ${user.username}`);
            }

            const originalFollowers = user.followers || [];
            const validFollowers = originalFollowers.filter(isValidUser);
            if (originalFollowers.length !== validFollowers.length) {
                user.followers = validFollowers;
                changed = true;
                console.log(`Cleaned followers for ${user.username}`);
            }

            if (changed) {
                await user.save();
                updatedCount++;
            }
        }

        console.log(`Cleanup complete. Updated ${updatedCount} users.`);
        mongoose.connection.close();
    });
