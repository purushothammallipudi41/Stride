const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function getCode() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ username: 'testuser_redirect' });
        if (user) {
            console.log(`Code: ${user.verificationCode}`);
        } else {
            console.log('User not found');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getCode();
