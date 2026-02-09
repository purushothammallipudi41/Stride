const mongoose = require('mongoose');


const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI;

        if (!uri) {
            console.error('❌ MONGODB_URI environment variable is missing!');
            // Fallback for local development only if absolutely needed, but better to fail fast in prod
            uri = 'mongodb://127.0.0.1:27017/stride';
            console.log(`⚠️  Using local fallback: ${uri}`);
        }

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000, // Increased to 30s for Render/Atlas cold starts
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        console.log("Retrying connection in 5 seconds...");
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;
