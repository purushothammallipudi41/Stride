const mongoose = require('mongoose');


const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI;
        // let uri = "mongodb+srv://purushothammallipudi41_db_user:Stride2026!Fixed@cluster0.edd4ioz.mongodb.net/stride?retryWrites=true&w=majority&appName=Cluster0";

        if (!uri) {
            console.error('❌ MONGODB_URI environment variable is missing!');
            // Fallback for local development only if absolutely needed, but better to fail fast in prod
            uri = 'mongodb://127.0.0.1:27017/stride';
            console.log(`⚠️  Using local fallback: ${uri}`);
        }

        console.log(`[DEBUG] Connecting to: ${uri.replace(/:([^@]+)@/, ':****@')}`);

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        console.log("Retrying connection in 5 seconds...");
        setTimeout(connectDB, 5000);
    }
};

module.exports = connectDB;
