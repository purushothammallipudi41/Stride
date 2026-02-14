const mongoose = require('mongoose');

// Base pattern from .env
const user = 'purushothammallipudi41_db_user';
const cluster = 'cluster0.edd4ioz.mongodb.net/stride?retryWrites=true&w=majority&appName=Cluster0';

const passwords = [
    'Stride2026!Fixed',       // Original
    'Stride2026%21Fixed',     // URL Encoded !
    'Stride2026%21Fixed',     // Double check 
];

async function testConnection(password) {
    const uri = `mongodb+srv://${user}:${password}@${cluster}`;
    console.log(`Testing password: ${password}`);
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ SUCCESS!");
        return true;
    } catch (e) {
        console.log(`❌ Failed: ${e.message}`);
        return false;
    } finally {
        await mongoose.disconnect();
    }
}

async function run() {
    for (const p of passwords) {
        if (await testConnection(p)) break;
    }
    process.exit(0);
}

run();
