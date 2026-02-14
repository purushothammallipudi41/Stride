const mongoose = require('mongoose');
const User = require('./models/User');
const Server = require('./models/Server');
require('dotenv').config();

async function debug() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://purushothammallipudi41:8885145741pP@cluster0.edd4ioz.mongodb.net/stride?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected');

    const servers = await Server.find().sort({ id: 1 }).lean();
    for (const server of servers) {
        const count = await User.countDocuments({ "serverProfiles.serverId": server.id });
        console.log(`Server: ${server.name} (ID: ${server.id}), Dynamic Count: ${count}, Static Field: ${server.members}`);

        // Let's also check one user to see their profiles
        const oneMember = await User.findOne({ "serverProfiles.serverId": server.id });
        if (oneMember) {
            console.log(`Sample Member: ${oneMember.username}, Profiles: ${JSON.stringify(oneMember.serverProfiles)}`);
        }
    }
    process.exit(0);
}

debug();
