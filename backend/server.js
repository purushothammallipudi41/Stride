const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();
const mongoose = require('mongoose');
// const nodemailer = require('nodemailer'); // Removed in favor of Resend

// Mongoose & Database
const connectDB = require('./db');
const User = require('./models/User');
const Story = require('./models/Story');
const Post = require('./models/Post');
const ServerModel = require('./models/Server'); // Renamed to avoid conflict with socket.io Server
const DirectMessage = require('./models/DirectMessage');
const ServerMessage = require('./models/ServerMessage');
const Notification = require('./models/Notification');
const Report = require('./models/Report');

// Connect to MongoDB
connectDB();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: [
        'http://localhost:5174',
        'http://localhost:3000',
        'https://stride-social.onrender.com',
        'capacitor://localhost',
        'http://localhost',
        'https://localhost'
    ],
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
const dns = require('dns');
// Force IPv4 for DNS resolution to avoid ENETUNREACH on Render
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

// Email Transporter
const { Resend } = require('resend');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, code) {
    if (!resend) {
        console.log(`[EMAIL MOCK] Verification code for ${email}: ${code}`);
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Stride <onboarding@resend.dev>',
            to: [email],
            subject: 'Verify your Stride Account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to Stride! 🎵</h2>
                    <p>Please use the following code to verify your account:</p>
                    <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                        ${code}
                    </div>
                    <p>This code will expire in 15 minutes.</p>
                </div>
            `
        });

        if (error) {
            console.error('[RESEND ERROR]', error);
            throw new Error(error.message);
        }

        console.log(`[EMAIL SENT] Verification code sent to ${email} (ID: ${data.id})`);
    } catch (e) {
        console.error('[EMAIL SEND FAILURE]', e);
        throw e;
    }
}

// Cloudinary Config
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'stride_uploads',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov'],
        resource_type: 'auto', // Auto-detect image or video
    },
});

const upload = multer({ storage: storage });

// --- Helper Functions ---
async function saveBase64Image(base64String) {
    // For base64, we need to upload directly via SDK
    if (!base64String.startsWith('data:')) return null;

    try {
        const result = await cloudinary.uploader.upload(base64String, {
            folder: 'stride_uploads',
            resource_type: 'auto'
        });
        console.log(`[CLOUDINARY] Upload success: ${result.secure_url}`);
        return result.secure_url;
    } catch (err) {
        console.error('[CLOUDINARY] Base64 upload failed:', err);
        return null;
    }
}

// Serve uploads (Legacy support for old files, though they disappear on Render)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// New Cloudinary Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: req.file.path }); // Cloudinary key is 'path' or 'secure_url'
});

// --- Seeding Logic ---
async function seedDatabase() {
    try {
        // Check for specific users needed for Auto-Follow
        const targetUsernames = ['stride', 'purushotham_mallipudi'];
        const existingTargets = await User.find({ username: { $in: targetUsernames } });
        const existingUsernames = existingTargets.map(u => u.username);

        const newUsers = [
            {
                username: "stride",
                name: "Stride Official",
                email: "thestrideapp@gmail.com",
                password: "password123", // Dummy pass
                avatar: "logo.png",
                bio: "The official beat of Stride. 🎵 #KeepStriding",
                stats: { posts: 999, followers: 12500, following: 0 },
                isVerified: true
            },
            {
                username: "purushotham_mallipudi",
                name: "Purushotham Mallipudi",
                email: "user@example.com",
                password: "password123",
                avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=purushotham",
                bio: "Building the future of social music. 🚀",
                stats: { posts: 12, followers: 12500, following: 450 },
                isVerified: true
            },
            {
                username: "alex_beats",
                name: "Alex Beats",
                email: "alex@beats.com",
                password: "password123",
                avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex",
                bio: "Music Producer 🎹 | LA-Based. Creating vibes daily.",
                stats: { posts: 42, followers: 8900, following: 120 },
                isVerified: true
            }
        ];

        const usersToCreate = newUsers.filter(u => !existingUsernames.includes(u.username));

        if (usersToCreate.length > 0) {
            await User.create(usersToCreate);
            console.log(`✅ Seeded ${usersToCreate.length} new users.`);
        } else {
            console.log('✅ Target users already exist.');
        }

        // --- Mutual Follow Logic for Stride & Developer ---
        const stride = await User.findOne({ username: 'stride' });
        const dev = await User.findOne({ username: 'purushotham' });

        if (stride && dev) {
            let changed = false;

            // Stride follows Dev
            if (!stride.following.includes(dev._id.toString())) {
                stride.following.push(dev._id.toString());
                stride.stats.following += 1;
                changed = true;
            }
            if (!dev.followers.includes(stride._id.toString())) {
                dev.followers.push(stride._id.toString());
                dev.stats.followers += 1;
                await dev.save();
            }

            // Dev follows Stride
            if (!dev.following.includes(stride._id.toString())) {
                dev.following.push(stride._id.toString());
                dev.stats.following += 1;
                await dev.save(); // Save dev again if changed
            }
            if (!stride.followers.includes(dev._id.toString())) {
                stride.followers.push(dev._id.toString());
                stride.stats.followers += 1;
                changed = true;
            }

            if (changed) await stride.save();
            console.log('✅ Mutual follow established between Stride and Developer.');
        }

        const serverCount = await ServerModel.countDocuments();
        if (serverCount === 0) {
            console.log('🌱 Seeding servers...');
            await ServerModel.create([
                {
                    id: 1, // Explicit ID for frontend compatibility
                    name: "Lo-Fi Lounge",
                    icon: "🎧",
                    channels: ["general", "music-sharing", "voice-chat"],
                    members: 120
                },
                {
                    id: 2,
                    name: "Producer's Hub",
                    icon: "🎹",
                    channels: ["general", "collabs", "feedback"],
                    members: 85
                }
            ]);
            console.log('✅ Servers seeded');
        }

        const postCount = await Post.countDocuments();
        if (postCount === 0) {
            console.log('🌱 Seeding posts...');
            // Need alex's ID for correct association? For now just direct create
            await Post.create({
                username: "alex_beats",
                userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
                type: "image",
                contentUrl: "https://images.unsplash.com/photo-1514525253361-b83a65c0d27c?w=800",
                caption: "New studio setup is finally ready! 🎹✨",
                likes: [],
                comments: []
            });
            console.log('✅ Posts seeded');
        }

    } catch (err) {
        console.error('Seeding error:', err);
    }
}
// Run seeding slightly after connection
// seedDatabase();
// setTimeout(seedDatabase, 2000); 



// --- Routes ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Posts
app.get('/api/posts', async (req, res) => {
    try {
        const { viewerId } = req.query;
        let filter = {};

        if (viewerId) {
            const viewer = await User.findById(viewerId);
            if (viewer && viewer.blockedUsers && viewer.blockedUsers.length > 0) {
                // Determine the valid user IDs (users not in the blocked list)
                // However, Post schema relies on `username` not `userId` in some legacy parts?
                // Checking Post.js schema... it stores `username` and `userAvatar`.
                // It does NOT strictly store `userId`. This is a tech debt.
                // We must filter by username if we don't have userId on posts.

                // Strategy: Get usernames of blocked users
                const blockedUsers = await User.find({ _id: { $in: viewer.blockedUsers } });
                const blockedUsernames = blockedUsers.map(u => u.username);

                filter = { username: { $nin: blockedUsernames } };
            }
        }

        const posts = await Post.find(filter).sort({ timestamp: -1 });
        res.json(posts);
    } catch (e) {
        console.error('API Error:', e);
        res.status(500).json({
            error: e.message,
            stack: process.env.NODE_ENV === 'production' ? null : e.stack,
            dbState: mongoose.connection.readyState
        });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const postData = req.body;

        // Offload media to Cloudinary if it's base64
        if (postData.contentUrl && postData.contentUrl.startsWith('data:')) {
            const cloudinaryUrl = await saveBase64Image(postData.contentUrl);
            if (cloudinaryUrl) {
                postData.contentUrl = cloudinaryUrl;
            }
        }

        const post = await Post.create(postData);
        res.status(201).json(post);
    } catch (e) {
        console.error('[API POST] Error creating post:', e);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body; // Requester's email

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Basic auth check: only owner can delete
        if (post.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized to delete this post' });
        }

        await Post.findByIdAndDelete(id);
        res.json({ success: true, message: 'Post deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/posts/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail } = req.body;

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const index = post.likes.indexOf(userEmail);
        if (index > -1) {
            post.likes.splice(index, 1);
        } else {
            post.likes.push(userEmail);
        }
        await post.save();
        res.json({ success: true, likes: post.likes });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/posts/:id/comment', async (req, res) => {
    // Note: Post Schema 'comments' is currently a Number in my definition for simplicity or Object?
    // In Post.js I defined comments: { type: Number, default: 0 }. 
    // BUT legacy code pushed objects array to comments.
    // FIX: I should probably update Post.js to have an array of comment objects if I want real comments.
    // For now, to match Schema, I'll just increment count, but the frontend might expect the comment back.
    // Let's assume for this transition we just increment the counter or if I really want comments I need to change schema.
    // I'll stick to incrementing count to match schema, but return the 'mock' comment to frontend for UI update.
    try {
        const { id } = req.params;
        const { comment } = req.body; // Expecting { text, username, userAvatar }
        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const newComment = {
            id: Date.now().toString(),
            ...comment,
            timestamp: new Date()
        };

        post.comments.push(newComment);
        await post.save();

        res.status(201).json(newComment);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Stories
app.get('/api/stories', async (req, res) => {
    try {
        const stories = await Story.find().sort({ timestamp: 1 });
        res.json(stories);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/stories', async (req, res) => {
    try {
        const storyData = req.body;

        // Offload media to Cloudinary if it's base64
        if (storyData.content && storyData.content.startsWith('data:')) {
            const cloudinaryUrl = await saveBase64Image(storyData.content);
            if (cloudinaryUrl) {
                storyData.content = cloudinaryUrl;
            }
        }

        const story = await Story.create(storyData);
        res.status(201).json(story);
    } catch (e) {
        console.error('[API STORY] Error creating story:', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/stories/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail } = req.body;
        const story = await Story.findById(id);
        if (!story) return res.status(404).json({ error: 'Story not found' });

        const index = story.likes.indexOf(userEmail);
        if (index === -1) story.likes.push(userEmail);
        else story.likes.splice(index, 1);

        await story.save();
        res.json({ success: true, likes: story.likes });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/stories/:id/view', async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail } = req.body;
        const story = await Story.findById(id);
        if (!story) return res.status(404).json({ error: 'Story not found' });

        if (!story.viewers.includes(userEmail)) {
            story.viewers.push(userEmail);
            await story.save();
        }
        res.json({ success: true, viewers: story.viewers });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/stories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail } = req.body;
        const story = await Story.findById(id);

        if (story && story.userId === userEmail) {
            await Story.findByIdAndDelete(id);
            res.status(200).json({ message: 'Story deleted' });
        } else {
            res.status(403).json({ message: 'Unauthorized' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, 'username name email avatar');
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/users/batch', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid IDs' });

        // Find users by ID (ObjectId) OR email OR username to be safe
        const users = await User.find({
            $or: [
                { _id: { $in: ids.filter(id => mongoose.Types.ObjectId.isValid(id)) } },
                { email: { $in: ids } },
                { username: { $in: ids } }
            ]
        }, 'username name email avatar');

        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/users/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;
        console.log(`[USER FETCH] Request for: ${identifier}`);

        // Search by ID (if valid ObjectId) OR username OR email
        const isObjectId = mongoose.Types.ObjectId.isValid(identifier);

        let query = { $or: [{ username: identifier }, { email: identifier }] };
        if (isObjectId) query.$or.push({ _id: identifier });

        let user = await User.findOne(query);
        console.log(`[USER FETCH] Found: ${user ? user.email : 'NULL'}`);

        // Auto-create mockup for email identifiers if missing (Legacy behavior)
        if (!user && identifier.includes('@')) {
            const username = identifier.split('@')[0];
            user = await User.create({
                username: username + Date.now(), // Ensure unique
                name: username,
                email: identifier,
                password: 'generated-user',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                bio: "New to Stride! 🎵"
            });
        }

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, name, email, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(409).json({ error: 'User already exists' });

        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Auto-Follow Logic
        const targetUsernames = ['stride', 'purushotham_mallipudi'];
        const targets = await User.find({ username: { $in: targetUsernames } });

        let initialFollowing = [];

        // Add targets to new user's following list (just IDs first)
        if (targets.length > 0) {
            initialFollowing = targets.map(t => t._id.toString());
        }

        const newUser = await User.create({
            username,
            name: name || username,
            email,
            password,
            avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`,
            bio: "New to Stride! 🎵",
            isVerified: false,
            verificationRequired: true, // Enforce verification for new users
            verificationCode,
            verificationCodeExpires,
            following: initialFollowing,
            stats: { posts: 0, followers: 0, following: initialFollowing.length }
        });

        // Update targets' followers list AFTER newUser is created
        if (targets.length > 0) {
            for (const target of targets) {
                target.followers.push(newUser._id);
                target.stats.followers += 1;
                await target.save();
            }
        }

        await sendVerificationEmail(email, verificationCode);
        console.log(`[REGISTER] New user: ${email}, Code: ${verificationCode}, Auto-Followed: ${targets.length}`);

        res.json({ success: true, email: newUser.email, message: 'Verification code sent' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/verify', async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isVerified) return res.json({ success: true, message: 'Already verified' });

        if (user.verificationCode !== code || user.verificationCodeExpires < Date.now()) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.json({ success: true, user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'Account already verified' });

        const verificationCode = generateVerificationCode();
        user.verificationCode = verificationCode;
        user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        await sendVerificationEmail(email, verificationCode);
        res.json({ success: true, message: 'Verification code resent' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (user && user.password === password) {
            // Only block if verification is explicitly required AND they are not verified
            if (user.verificationRequired && user.isVerified === false) {
                return res.status(403).json({ error: 'Email not verified', email: user.email });
            }
            console.log(`[LOGIN] User logged in: ${user.email}`);
            res.json({ success: true, user });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/users/:email/update', async (req, res) => {
    try {
        const { email } = req.params;
        const updates = req.body;

        if (updates.avatar && updates.avatar.startsWith('data:')) {
            const fileUrl = await saveBase64Image(updates.avatar);
            if (fileUrl) {
                // Save relative path so frontend can construct full URL dynamically
                updates.avatar = fileUrl;
            }
        }

        const user = await User.findOneAndUpdate({ email }, updates, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ success: true, user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/users/:id/follow', async (req, res) => {
    try {
        const { id } = req.params; // Target ID
        const { followerEmail } = req.body; // Me

        const currentUser = await User.findOne({ email: followerEmail });
        // Handling if id is ObjectId or legacy Int. 
        // User.findById might fail if id is not ObjectId.
        let targetUser = mongoose.Types.ObjectId.isValid(id) ? await User.findById(id) : null;
        if (!targetUser) {
            // Fallback find if seeded without specific objectId
            targetUser = await User.findOne({ _id: id }); // unlikely to match if not ObjectId, but maybe
        }

        if (currentUser && targetUser) {
            // Strings for comparison
            const targetId = targetUser._id.toString();
            const currentId = currentUser._id.toString();

            const fIdx = currentUser.following.indexOf(targetId);
            const tIdx = targetUser.followers.indexOf(currentId);

            if (fIdx === -1) {
                currentUser.following.push(targetId);
                if (tIdx === -1) targetUser.followers.push(currentId);
            } else {
                currentUser.following.splice(fIdx, 1);
                if (tIdx > -1) targetUser.followers.splice(tIdx, 1);
            }

            await currentUser.save();
            await targetUser.save();

            res.json({ success: true, following: currentUser.following, followersCount: targetUser.followers.length });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
    const notes = await Notification.find().sort({ timestamp: -1 });
    res.json(notes);
});

app.post('/api/notifications', async (req, res) => {
    try {
        const note = await Notification.create(req.body);
        res.status(201).json(note);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/notifications/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/notifications/clear', async (req, res) => {
    try {
        // Option 1: Delete all notifications (Hard reset)
        await Notification.deleteMany({});
        // Option 2: Delete only for a specific user (if we had userId context)
        // For now, global clear since we are in early stage
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Safety & Moderation ---

app.post('/api/users/:id/block', async (req, res) => {
    try {
        const { id } = req.params; // User to block
        const { currentUserId } = req.body; // Me

        const currentUser = await User.findById(currentUserId);
        const userToBlock = await User.findById(id);

        if (!currentUser || !userToBlock) return res.status(404).json({ error: 'User not found' });

        if (!currentUser.blockedUsers.includes(id)) {
            currentUser.blockedUsers.push(id);

            // Also Unfollow context
            const fIdx = currentUser.following.indexOf(id);
            if (fIdx > -1) {
                currentUser.following.splice(fIdx, 1);
                currentUser.stats.following = Math.max(0, currentUser.stats.following - 1);
            }

            // Remove them from my followers
            const tIdx = currentUser.followers.indexOf(id);
            if (tIdx > -1) {
                currentUser.followers.splice(tIdx, 1);
                currentUser.stats.followers = Math.max(0, currentUser.stats.followers - 1);
            }

            await currentUser.save();
        }

        res.json({ success: true, blockedUsers: currentUser.blockedUsers });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/users/:id/unblock', async (req, res) => {
    try {
        const { id } = req.params;
        const { currentUserId } = req.body;

        const currentUser = await User.findById(currentUserId);
        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        const index = currentUser.blockedUsers.indexOf(id);
        if (index > -1) {
            currentUser.blockedUsers.splice(index, 1);
            await currentUser.save();
        }

        res.json({ success: true, blockedUsers: currentUser.blockedUsers });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/report', async (req, res) => {
    try {
        const { reporterId, targetId, targetType, reason } = req.body;

        await Report.create({
            reporterId,
            targetId,
            targetType,
            reason
        });

        res.json({ success: true, message: 'Report submitted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Servers
app.get('/api/servers', async (req, res) => {
    const servers = await ServerModel.find().sort({ id: 1 });
    res.json(servers);
});

app.post('/api/servers', async (req, res) => {
    try {
        // Find max ID to increment (mocking auto-increment for Servers)
        const lastServer = await ServerModel.findOne().sort({ id: -1 });
        const newId = lastServer && lastServer.id ? lastServer.id + 1 : 1;

        const server = await ServerModel.create({
            id: newId,
            name: req.body.name,
            icon: req.body.icon || req.body.name.charAt(0).toUpperCase(),
            channels: ["general"],
            members: 1
        });
        res.status(201).json(server);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/servers/:serverId/channels', async (req, res) => {
    try {
        const { serverId } = req.params;
        const { name } = req.body;
        const server = await ServerModel.findOne({ id: parseInt(serverId) });
        if (server) {
            if (!server.channels.includes(name)) {
                server.channels.push(name);
                await server.save();
            }
            res.json(server);
        } else {
            res.status(404).json({ error: 'Server not found' });
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/servers/:serverId/leave', async (req, res) => {
    try {
        const { serverId } = req.params;
        const server = await ServerModel.findOne({ id: parseInt(serverId) });
        // Just logic stub
        if (server) res.json({ success: true });
        else res.status(404).json({ error: 'Server not found' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/servers/:serverId', async (req, res) => {
    try {
        const { serverId } = req.params;
        await ServerModel.findOneAndDelete({ id: parseInt(serverId) });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/servers/:serverId/messages/:channelId', async (req, res) => {
    const { serverId, channelId } = req.params;
    const messages = await ServerMessage.find({ serverId: parseInt(serverId), channelId }).sort({ timestamp: 1 });
    res.json(messages);
});

app.post('/api/servers/:serverId/messages/:channelId', async (req, res) => {
    try {
        const { serverId, channelId } = req.params;
        const message = await ServerMessage.create({
            serverId: parseInt(serverId),
            channelId,
            userEmail: req.body.userEmail,
            username: req.body.username,
            text: req.body.text,
            type: req.body.type || 'text',
            time: "Just now"
        });
        res.status(201).json(message);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/messages/:userEmail', async (req, res) => {
    const { userEmail } = req.params;
    // Find messages where I am sender or receiver
    const messages = await DirectMessage.find({
        $or: [{ from: userEmail }, { to: userEmail }]
    }).sort({ timestamp: 1 });
    res.json(messages);
});

app.post('/api/messages/send', async (req, res) => {
    try {
        const message = await DirectMessage.create({
            from: req.body.from,
            to: req.body.to,
            text: req.body.text,
            sharedContent: req.body.sharedContent,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        res.status(201).json(message);
    } catch (e) { res.status(500).json({ error: e.message }); }
});


// Audius (External Wrappers)
let audiusNode = 'https://api.audius.co';
// ... (Insert simple Audius fetch logic or minimal stub)
// To save space, using minimal wrapper for external APIs
app.get('/api/audius/search', async (req, res) => {
    try {
        const response = await fetch(`${audiusNode}/v1/tracks/search?query=${req.query.q}&app_name=STRIDE_SOCIAL`);
        res.json(await response.json());
    } catch (e) { res.status(503).json({ error: 'Audius API unavailable' }); }
});

app.get('/api/audius/trending', async (req, res) => {
    try {
        const response = await fetch(`${audiusNode}/v1/tracks/trending?app_name=STRIDE_SOCIAL`);
        res.json(await response.json());
    } catch (e) { res.status(503).json({ error: 'Audius API unavailable' }); }
});

const fetch = require('node-fetch');

app.get('/api/audius/stream/:id', async (req, res) => {
    try {
        const trackId = req.params.id;
        // Step 1: Get the stream URL which will redirect
        const initialUrl = `${audiusNode}/v1/tracks/${trackId}/stream?app_name=STRIDE_SOCIAL`;

        // Fetch with a standard User-Agent to avoid 403 blocks from specific nodes
        // Removed Referer as it might be triggering hotlink protection
        const response = await fetch(initialUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Range': 'bytes=0-'
            }
        });

        if (!response.ok) {
            console.error(`[AUDIUS STREAM] Failed to fetch stream: ${response.status} ${response.statusText}`);
            return res.status(response.status).send('Stream unavailable');
        }

        // Forward content headers
        res.set('Content-Type', response.headers.get('content-type'));
        res.set('Content-Length', response.headers.get('content-length'));
        res.set('Accept-Ranges', 'bytes');

        // Pipe the stream to the response
        response.body.pipe(res);

    } catch (e) {
        console.error('[AUDIUS STREAM] Error:', e);
        res.status(500).send("Stream error");
    }
});

// Start Server
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
    socket.on("join-room", (userId) => socket.join(userId));
    socket.on("call-user", ({ userToCall, signalData, from }) => {
        io.to(userToCall).emit("call-user", { signal: signalData, from });
    });
    socket.on("answer-call", (data) => io.to(data.to).emit("call-accepted", data.signal));
    socket.on("disconnect", () => socket.broadcast.emit("call-ended"));
});

httpServer.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
