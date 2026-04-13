const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stride';

async function runMigration() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false }));

        console.log('Searching for legacy messages with hyphenated IDs (e.g. msg-*)...');
        
        // Find documents where _id is a string and contains '-' OR matches 'msg-' pattern
        // Note: MongoDB allows _id to be a string.
        const result = await Message.deleteMany({
            $or: [
                { _id: { $type: 'string', $regex: '-' } },
                { id: { $exists: true, $regex: '-' } }
            ]
        });

        console.log(`Migration Complete: Purged ${result.deletedCount} legacy records.`);
        
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
