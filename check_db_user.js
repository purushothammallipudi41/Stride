const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const User = mongoose.connection.collection('users');
        const user = await User.findOne({ email: 'purushothammallipudi41@gmail.com' });
        console.log('User Record:', JSON.stringify(user, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
