const mongoose = require('mongoose');

// The string we constructed from the user's input/screenshot
const uri = "mongodb+srv://purushothammallipudi41_db_user:40f50ab4ebd1e3d303d35fb2e7@cluster0.edd4ioz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

console.log("Attempting to connect to:", uri.replace(/:([^@]+)@/, ':****@'));

mongoose.connect(uri)
    .then(() => {
        console.log("✅ SUCCESS! Connected to MongoDB.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ CONNECTION FAILED:", err.message);
        if (err.message.includes('bad auth')) {
            console.error("   -> PASSWORD INCORRECT");
        } else if (err.message.includes('endpoint')) {
            console.error("   -> IP WHITELIST ISSUE (or cluster is down)");
        }
        process.exit(1);
    });
