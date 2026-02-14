require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./models/User');
const ServerModel = require('./models/Server');

async function testStrideServer() {
    try {
        await connectDB();

        // Simulate server.js logic (which runs on startup)
        console.log("Checking Stride Official Server...");
        let strideOfficial = await ServerModel.findOne({ id: 0 });

        // Emulate the update logic from server.js
        if (!strideOfficial) {
            console.log("Creating Stride Official Server...");
            await ServerModel.create({
                id: 0,
                name: "Stride Official",
                icon: "/logo.png",
                channels: ["announcements", "updates", "general"],
                members: 1,
                ownerId: "stride",
                admins: ["stride", "purushotham_mallipudi"]
            });
        } else {
            if (strideOfficial.icon !== "/logo.png") {
                console.log("🔄 Updating Icon from", strideOfficial.icon, "to /logo.png");
                strideOfficial.icon = "/logo.png";
                await strideOfficial.save();
            }
        }

        strideOfficial = await ServerModel.findOne({ id: 0 });
        console.log("✅ Stride Server Icon:", strideOfficial.icon);

        if (strideOfficial.icon === "/logo.png") {
            console.log("✅ Verification Success: Icon is correct.");
        } else {
            console.log("❌ Verification Failed: Icon is", strideOfficial.icon);
        }

        process.exit(0);
    } catch (e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
}

testStrideServer();
