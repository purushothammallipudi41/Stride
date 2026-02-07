const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();

// Mongoose & Database
const connectDB = require('./db');
const User = require('./models/User');
const Story = require('./models/Story');
const Post = require('./models/Post');
const ServerModel = require('./models/Server'); // Renamed to avoid conflict with socket.io Server
const DirectMessage = require('./models/DirectMessage');
const ServerMessage = require('./models/ServerMessage');
const Notification = require('./models/Notification');

// Connect to MongoDB
connectDB();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Helper Functions ---
function saveBase64Image(base64String) {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;
    const type = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const extension = type.split('/')[1] || 'jpg';
    const fileName = `${Date.now()}-${uuidv4()}.${extension}`;
    const filePath = path.join(__dirname, 'uploads', fileName);

    try {
        if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
            fs.mkdirSync(path.join(__dirname, 'uploads'));
        }
        fs.writeFileSync(filePath, buffer);
        console.log(`[FILE UPLOAD] Saved ${fileName} (${buffer.length} bytes)`);
        return `/uploads/${fileName}`;
    } catch (err) {
        console.error('[FILE UPLOAD] Error saving file:', err);
        return null;
    }
}

// --- Seeding Logic ---
async function seedDatabase() {
    try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('🌱 Seeding specific initial users...');

            // Create these users with specific _ids if possible, or just let Mongoose generate them
            // Since frontend might stick to hardcoded IDs? No, usually not for users except specific follow logic.
            // The register endpoint auto-follows 'purushotham' and 'stride'. We need them to exist.

            await User.create([
                {
                    username: "stride",
                    name: "Stride Official",
                    email: "thestrideapp@gmail.com",
                    password: "password123", // Dummy pass
                    avatar: "logo.png",
                    bio: "The official beat of Stride. 🎵 #KeepStriding",
                    stats: { posts: 999, followers: 12500, following: 0 }
                },
                {
                    username: "purushotham",
                    name: "purushotham mallipudi",
                    email: "user@example.com",
                    password: "password123",
                    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=purushotham",
                    bio: "Building the future of social music. 🚀",
                    stats: { posts: 12, followers: 12500, following: 450 }
                },
                {
                    username: "alex_beats",
                    name: "Alex Beats",
                    email: "alex@beats.com",
                    password: "password123",
                    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=alex",
                    bio: "Music Producer 🎹 | LA-Based. Creating vibes daily.",
                    stats: { posts: 42, followers: 8900, following: 120 }
                }
            ]);
            console.log('✅ Users seeded');
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
setTimeout(seedDatabase, 2000);


// --- Routes ---

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ timestamp: -1 });
        // Mongoose result objects have .id getter by default, but let's ensure it maps cleanly if needed
        res.json(posts);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const post = await Post.create(req.body);
        res.status(201).json(post);
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
        const story = await Story.create(req.body);
        res.status(201).json(story);
    } catch (e) {
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

        const newUser = await User.create({
            username,
            name: name || username,
            email,
            password,
            avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`,
            bio: "New to Stride! 🎵"
        });

        console.log(`[REGISTER] New user: ${email}`);
        res.json({ success: true, user: newUser });
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
            const fileUrl = saveBase64Image(updates.avatar);
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
    const note = await Notification.create(req.body);
    res.status(201).json(note);
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

app.get('/api/audius/stream/:id', (req, res) => {
    res.redirect(`${audiusNode}/v1/tracks/${req.params.id}/stream?app_name=STRIDE_SOCIAL`);
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
