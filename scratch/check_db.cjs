const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = 'mongodb+srv://purshothammallipudi:purushotham8599@cluster0.pwyf9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkUser() {
    try {
        await mongoose.connect(MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({ username: String, name: String }));
        
        const usernameToCheck = 'purushotham_m';
        const user = await User.findOne({ username: usernameToCheck });
        
        if (user) {
            console.log(`FOUND User: ${JSON.stringify(user)}`);
        } else {
            console.log(`NOT FOUND: ${usernameToCheck}`);
            const allUsers = await User.find().limit(10);
            console.log(`Existing users Sample: ${JSON.stringify(allUsers.map(u => u.username))}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
