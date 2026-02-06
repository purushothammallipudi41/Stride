const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI;

        if (!uri || uri.includes('127.0.0.1')) {
            console.log('⚠️  No Cloud MongoDB URI found (or using default localhost). attempting to start in-memory fallback...');
            try {
                const mongod = await MongoMemoryServer.create();
                uri = mongod.getUri();
                console.log(`✅ Started local in-memory MongoDB at: ${uri}`);
            } catch (memErr) {
                console.warn('❌ Failed to start in-memory Mongo, trying default connection anyway:', memErr.message);
                uri = uri || 'mongodb://127.0.0.1:27017/stride';
            }
        }

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        // Do not exit, keep trying or let the app run without DB (though APIs will fail)
    }
};

module.exports = connectDB;
