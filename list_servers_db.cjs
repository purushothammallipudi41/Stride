const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const Server = require('./backend/models/Server');

async function listServers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const servers = await Server.find({});
        console.log('Total Servers:', servers.length);
        servers.forEach(s => {
            console.log(`ID: ${s.id}, Name: ${s.name}, Channels Count: ${s.channels?.length}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

listServers();
