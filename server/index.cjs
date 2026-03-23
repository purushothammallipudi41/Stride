require('dotenv').config();
require('../patch-bigint.cjs');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Models
const User = require('./models/User.cjs');
const Post = require('./models/Post.cjs');
const Community = require('./models/Community.cjs');
const Playlist = require('./models/Playlist.cjs');
const Analytics = require('./models/Analytics.cjs');
const Transaction = require('./models/Transaction.cjs');


const Message = require('./models/Message.cjs');
const Notification = require('./models/Notification.cjs');
const Comment = require('./models/Comment.cjs');


// Database Connection
const connectDB = async () => {
    try {
        let uri = process.env.MONGODB_URI;
        if (!uri) {
            console.log('INFO: No MONGODB_URI found. Starting MongoMemoryServer for local development...');
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
        }
        
        await mongoose.connect(uri);
        console.log('MongoDB Connected successfully.');
        
        // Hydrate from data.json if empty
        await hydrateFromJSON();
    } catch (err) {
        console.error('CRITICAL: MongoDB connection failed:', err.message);
    }
};

const hydrateFromJSON = async () => {
    try {
        console.log('INFO: Starting database hydration check...');
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));

        // 1. Communities / Servers
        if (data.servers) {
            for (const s of data.servers) {
                const communityData = {
                    name: s.name,
                    description: s.description || `The official ${s.name} community.`,
                    owner: data.users?.[0]?._id || new mongoose.Types.ObjectId(),
                    memberCount: typeof s.members === 'number' ? s.members : 0,
                    avatar: s.icon || '🎧'
                };
                
                await Community.findOneAndUpdate(
                    { name: s.name },
                    { 
                        $setOnInsert: { owner: communityData.owner, members: [] },
                        $set: { 
                            description: communityData.description,
                            memberCount: communityData.memberCount,
                            avatar: communityData.avatar
                        } 
                    },
                    { upsert: true, new: true }
                );
            }
        }

        // 2. Users (If empty)
        const userCount = await User.countDocuments();
        if (userCount === 0 && data.users) {
            console.log('INFO: Hydrating users...');
            for (const u of Object.values(data.users)) {
                const userData = { ...u, password: u.password || 'admin' };
                if (typeof u.followers === 'number') {
                    userData.followerCount = u.followers;
                    userData.followers = [];
                }
                if (typeof u.following === 'number') {
                    userData.followingCount = u.following;
                    userData.following = [];
                }
                await User.create(userData);
            }
        }

        // 3. Feed/Posts (If empty)
        const postCount = await Post.countDocuments();
        if (postCount === 0 && data.feed) {
            console.log('INFO: Hydrating feed...');
            for (const p of data.feed) {
                const userObj = await User.findOne({ username: p.username });
                const postData = { ...p, user: userObj ? userObj._id : null };
                if (typeof p.comments === 'number') {
                    postData.commentCount = p.comments;
                    postData.comments = [];
                }
                await Post.create(postData);
            }
        }

        console.log('INFO: Data hydration check complete.');
    } catch (err) {
        console.error('ERROR: Data hydration failed:', err.message);
    }
};

connectDB();

// Email Configuration
let transporter;
const createTransporter = async () => {
    // If we have real credentials, try them first
    if (process.env.EMAIL_PASS && process.env.EMAIL_USER) {
        const port = parseInt(process.env.EMAIL_PORT || "587"); // Prefer 587 for Render/Cloud
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST || "smtp.gmail.com",
            port,
            secure: port === 465, // Only true for 465
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 15000, // 15 seconds
            greetingTimeout: 15000,   // 15 seconds
            socketTimeout: 30000,     // 30 seconds
            pool: true                // Reuse connections
        });
    }
    
    // Otherwise, create a test account on the fly (Ethereal Email)
    console.log('INFO: No Gmail credentials or failing. Creating an automated Ethereal Test Account...');
    try {
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, 
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    } catch (err) {
        console.error('ERROR: Failed to create test account. Falling back to console-only logging.');
        return null;
    }
};

// Initialize transporter asynchronously
let transportReady = createTransporter();

const sendEmail = async (to, subject, html) => {
    const attemptSend = async (currentTransporter) => {
        if (!currentTransporter) return { success: false, logOnly: true };
        try {
            console.log(`Attempting to send email to ${to}...`);
            const info = await currentTransporter.sendMail({
                from: `"Stride App" <contact@thestrideapp.in>`,
                to,
                subject,
                html
            });
            console.log(`Email sent successfully to ${to}`);
            if (nodemailer.getTestMessageUrl(info)) {
                console.log(`PREVIEW URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: err };
        }
    };

    let readyTransporter = await transportReady;
    let result = await attemptSend(readyTransporter);

    if (!result.success && !result.logOnly) {
        const err = result.error;
        console.error(`CRITICAL: Error sending email to ${to}:`, err.message);
        console.error(`ERROR CODE: ${err.code}, SYSCALL: ${err.syscall}, COMMAND: ${err.command}`);
        
        if (err.code === 'EAUTH' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
            console.error('SMTP FAILURE: Retrying with fallback test account...');
            try {
                const testAccount = await nodemailer.createTestAccount();
                const fallbackTransporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email", port: 587, secure: false,
                    auth: { user: testAccount.user, pass: testAccount.pass }
                });
                transportReady = Promise.resolve(fallbackTransporter); // Update global for future calls
                result = await attemptSend(fallbackTransporter);
            } catch (fallbackErr) {
                console.error('FALLBACK FAILURE: Failed to create test account:', fallbackErr.message);
            }
        }
    }

    if (result.logOnly) {
        console.log(`[DEV-MOCK] Email to ${to} would have been sent with content logged above.`);
        return true;
    }

    return result.success;
};


const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const DATA_FILE = path.join(__dirname, 'data.json');
let stories = []; // In-memory stories store for simplified dev

// Helper to read data
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading data file:", err);
        return {};
    }
};

// REST API Endpoints
app.get('/api/servers', async (req, res) => {
    try {
        const servers = await ServerModel.find();
        res.json(servers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/servers', async (req, res) => {
    try {
        const newServer = await ServerModel.create({
            ...req.body,
            channels: ["general"],
            members: 1
        });
        
        io.emit('global_event', {
            type: 'SERVER_CREATED',
            data: newServer,
            timestamp: Date.now()
        });
        
        res.json(newServer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/music/genres', async (req, res) => {
    const genres = [
        { id: "g1", name: "Pop", color: "#ec4899" },
        { id: "g2", name: "Hip-Hop", color: "#f59e0b" },
        { id: "g3", name: "Rock", color: "#ef4444" },
        { id: "g4", name: "Electronic", color: "#8b5cf6" },
        { id: "g5", name: "R&B", color: "#3b82f6" },
        { id: "g6", name: "Jazz", color: "#10b981" },
        { id: "g7", name: "Indie", color: "#6366f1" },
        { id: "g8", name: "Classical", color: "#8b5cf6" }
    ];
    res.json(genres);
});

app.get('/api/music/artists', async (req, res) => {
    // Mock artists based on trending data or static list
    const artists = [
        { id: "a1", name: "Stride Official", avatar: "https://ui-avatars.com/api/?name=Stride+Official&background=random" },
        { id: "a2", name: "Melody Maker", avatar: "https://ui-avatars.com/api/?name=Melody+Maker&background=random" },
        { id: "a3", name: "Vibe Master", avatar: "https://ui-avatars.com/api/?name=Vibe+Master&background=random" }
    ];
    res.json(artists);
});

app.get('/api/music/albums', async (req, res) => {
    const albums = [
        { id: "ab1", title: "Midnight Echoes", artist: "Stride Official", cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80" },
        { id: "ab2", title: "Neon Dreams", artist: "Melody Maker", cover: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&q=80" }
    ];
    res.json(albums);
});

app.get('/api/music/languages', async (req, res) => {
    const languages = [
        { id: "l1", name: "English" },
        { id: "l2", name: "Hindi" },
        { id: "l3", name: "Spanish" },
        { id: "l4", name: "Japanese" }
    ];
    res.json(languages);
});


app.get('/api/profile/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username }).populate('posts');
        if (user) {
            res.json(user);
        } else {
            // Default mock for missing users during dev
            res.json({
                username,
                name: "Stride User",
                bio: "Just a music lover on Stride 🎵",
                followers: 0,
                following: 0,
                isVerified: true,
                avatar: `https://i.pravatar.cc/150?u=${username}`,
                favorites: []
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/feed', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        
        // Enhance posts with user data (like avatarFrame)
        const enhancedPosts = await Promise.all(posts.map(async (post) => {
            // Find user by username (stored in post.username)
            const user = await User.findOne({ username: post.username });
            return {
                ...post.toObject(),
                avatarFrame: user ? user.avatarFrame : 'none',
                isVerified: user ? user.isVerified : false
            };
        }));
        
        res.json(enhancedPosts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/stories', async (req, res) => {
    try {
        // Return existing stories
        res.json(stories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/stories', async (req, res) => {
    try {
        const { username, contentUrl, musicTrack } = req.body;
        const user = await User.findOne({ username });
        
        const newStory = {
            id: Date.now().toString(),
            username,
            avatar: user ? user.avatar : `https://i.pravatar.cc/150?u=${username}`,
            contentUrl: contentUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80",
            musicTrack: musicTrack || null,
            createdAt: new Date()
        };
        
        stories.unshift(newStory);
        // Keep stories fresh (e.g., last 24h)
        if (stories.length > 20) stories.pop();

        io.emit('content_updated', { type: 'story', data: newStory });
        res.json(newStory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/reels', async (req, res) => {
    try {
        const data = readData();
        const reels = data.reels || [];
        
        // Enhance reels with user data (like avatarFrame)
        const enhancedReels = await Promise.all(reels.map(async (reel) => {
            const user = await User.findOne({ username: reel.username });
            return {
                ...reel,
                avatarFrame: user ? user.avatarFrame : 'none',
                isVerified: user ? user.isVerified : false
            };
        }));
        
        res.json(enhancedReels);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/feed', async (req, res) => {
    try {
        const userObj = await User.findOne({ username: req.body.username });
        const newPost = await Post.create({
            ...req.body,
            user: userObj ? userObj._id : null
        });
        
        if (userObj) {
            userObj.posts.push(newPost._id);
            await userObj.save();
        }

        io.emit('content_updated', { type: 'post', data: newPost });
        res.json(newPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/feed/:id/like', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post) {
            post.likes += 1;
            await post.save();
            
            // Notification for post owner
            const liker = await User.findOne({ username: 'Stridy' }); // Placeholder for authenticated user
            await Notification.create({
                user: post.username,
                type: 'like',
                from: liker ? liker.username : 'someone',
                senderFrame: liker ? liker.avatarFrame : 'none',
                content: 'liked your post',
                time: 'Just now'
            });
            await User.findOneAndUpdate({ username: post.username }, { hasUnreadNotifications: true });

            // Targeted notification for post author
            const author = post.username; 
            if (author) {
                io.to(`user_${author}`).emit('new_notification', {
                    type: 'like',
                    from: 'someone', // In a real app, get from req.user
                    content: 'liked your post',
                    postId: post._id
                });
            }

            io.emit('content_updated', { type: 'like', postId: post._id, likes: post.likes });
            res.json({ success: true, likes: post.likes });
        } else {
            res.status(404).json({ success: false, message: 'Post not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/profile/:username/follow', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOneAndUpdate({ username }, { $inc: { followers: 1 }, hasUnreadNotifications: true }, { new: true });
        
        if (user) {
            const follower = await User.findOne({ username: 'Stridy' }); // Placeholder
            await Notification.create({
                user: username,
                type: 'follow',
                from: follower ? follower.username : 'someone',
                senderFrame: follower ? follower.avatarFrame : 'none',
                content: 'started following you',
                time: 'Just now'
            });

            // Targeted notification for followed user
            io.to(`user_${username}`).emit('new_notification', {
                type: 'follow',
                from: 'someone',
                content: 'started following you'
            });

            io.emit('content_updated', { type: 'follow', username, followers: user.followers });
            res.json({ success: true, followers: user.followers });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PLAYLISTS & COLLABORATION ---
app.post('/api/playlists', async (req, res) => {
    try {
        const playlist = new Playlist(req.body);
        await playlist.save();
        res.status(201).json(playlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/playlists/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ error: "User not found" });

        const playlists = await Playlist.find({
            $or: [
                { owner: user._id },
                { collaborators: user._id }
            ]
        }).populate('owner collaborators', 'username avatar');
        
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/playlists/:id/tracks', async (req, res) => {
    try {
        const { track, userId } = req.body;
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) return res.status(404).json({ error: "Playlist not found" });

        playlist.tracks.push({ ...track, addedBy: userId });
        await playlist.save();

        // Real-time update
        io.to(`playlist_${req.params.id}`).emit('playlist_updated', {
            type: 'track_added',
            track,
            playlistId: req.params.id
        });

        res.json(playlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/playlists/:id/collaborate', async (req, res) => {
    try {
        const { username } = req.body;
        const userToInvite = await User.findOne({ username });
        if (!userToInvite) return res.status(404).json({ error: "User not found" });

        const playlist = await Playlist.findById(req.params.id);
        if (playlist && !playlist.collaborators.includes(userToInvite._id)) {
            playlist.collaborators.push(userToInvite._id);
            playlist.isCollaborative = true;
            await playlist.save();
        }

        res.json(playlist);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- TAG DISCOVERY ---
app.get('/api/search/trending', async (req, res) => {
    try {
        // Collect all tags from various sources
        const postTags = await Post.aggregate([
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } }
        ]);
        const playlistTags = await Playlist.aggregate([
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } }
        ]);
        const communityTags = await Community.aggregate([
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } }
        ]);

        // Merge and sort
        const allTags = {};
        [...postTags, ...playlistTags, ...communityTags].forEach(tag => {
            allTags[tag._id] = (allTags[tag._id] || 0) + tag.count;
        });

        const sortedTags = Object.entries(allTags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));

        res.json({ trendingTags: sortedTags });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/search/tag/:tag', async (req, res) => {
    try {
        const tag = req.params.tag;
        const posts = await Post.find({ tags: tag }).limit(10);
        const playlists = await Playlist.find({ tags: tag }).populate('owner', 'username');
        const communities = await Community.find({ tags: tag });

        res.json({ posts, playlists, communities });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SOCIAL FEED & ACTIVITY ---


app.get('/api/communities', async (req, res) => {
    try {
        const communities = await Community.find().populate('owner', 'username');
        res.json(communities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/communities', async (req, res) => {
    try {
        const { name, description, ownerId, avatar } = req.body;
        const community = new Community({ name, description, owner: ownerId, avatar, members: [ownerId] });
        await community.save();
        res.status(201).json(community);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/communities/:id/join', async (req, res) => {
    try {
        const { userId } = req.body;
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ error: "Community not found" });
        
        if (!community.members.includes(userId)) {
            community.members.push(userId);
            await community.save();
        }
        res.json(community);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/communities/:id/jukebox', async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        res.json(community.jukeboxQueue || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/communities/:id/jukebox', async (req, res) => {
    try {
        const { track, userId } = req.body;
        const community = await Community.findById(req.params.id);
        community.jukeboxQueue.push({ ...track, addedBy: userId });
        await community.save();
        
        // Notify members via socket
        io.to(`community_${req.params.id}`).emit('jukebox_updated', community.jukeboxQueue);
        
        res.json(community.jukeboxQueue);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Notifications
app.get('/api/notifications/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const notifications = await Notification.find({ user: username }).sort({ createdAt: -1 });
        const user = await User.findOne({ username });
        res.json({
            notifications,
            hasUnread: user ? user.hasUnreadNotifications : false
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/notifications/unread-count/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const count = await Notification.countDocuments({ user: username, readStatus: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/messages/unread-count/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const count = await Message.countDocuments({ receiver: username, readStatus: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/notifications/mark-read/:username', async (req, res) => {
    const { username } = req.params;
    try {
        await User.findOneAndUpdate({ username }, { hasUnreadNotifications: false });
        await Notification.updateMany({ user: username }, { readStatus: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/notifications/mark-all-read/:username', async (req, res) => {
    const { username } = req.params;
    try {
        await User.findOneAndUpdate({ username }, { hasUnreadNotifications: false });
        await Notification.updateMany({ user: username }, { readStatus: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/users/search', async (req, res) => {

    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } }
            ]
        }).limit(10);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/posts/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.id }).sort({ createdAt: 1 });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/posts/:id/comments', async (req, res) => {
    const { username, content } = req.body;
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const comment = await Comment.create({
            post: post._id,
            username,
            content
        });

        post.comments.push(comment._id);
        post.commentCount = (post.commentCount || 0) + 1;
        await post.save();

        // Notify post owner
        if (post.username !== username) {
            io.to(`user_${post.username}`).emit('new_notification', {
                type: 'comment',
                from: username,
                content: 'commented on your post',
                postId: post._id
            });
        }

        io.emit('content_updated', { type: 'comment', postId: post._id, commentCount: post.commentCount });
        res.json(comment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/explore', async (req, res) => {

    try {
        const posts = await Post.find().limit(10);
        const exploreItems = posts.map((p, i) => ({
            id: `f-${p._id}`,
            type: i % 3 === 0 ? 'reel' : 'image',
            size: i % 4 === 0 ? 'large' : (i % 5 === 0 ? 'tall' : 'normal'),
            url: p.contentUrl || `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80`
        }));
        res.json(exploreItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: 1 });
        
        // Group messages by (sender, receiver) pair to create "chats"
        const chatsMap = new Map();
        
        for (const msg of messages) {
            const participants = [msg.sender, msg.receiver].sort();
            const chatId = participants.join('-');
            
            if (!chatsMap.has(chatId)) {
                // In a real app, 'otherUser' is the participant who isn't 'me'
                // For this demo, we'll just use the receiver if it's not the first participant
                const otherUserUsername = msg.receiver; 
                
                chatsMap.set(chatId, {
                    id: chatId,
                    username: otherUserUsername,
                    messages: [],
                    lastMessage: '',
                    time: '',
                    avatar: null,
                    isVerified: false
                });
            }
            
            const chat = chatsMap.get(chatId);
            chat.messages.push(msg);
            chat.lastMessage = msg.text || 'Attachment';
            chat.time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Enhance with user details
        const enrichedChats = await Promise.all(Array.from(chatsMap.values()).map(async (chat) => {
            const user = await User.findOne({ username: chat.username });
            return {
                ...chat,
                avatar: user ? user.avatar : `https://i.pravatar.cc/150?u=${chat.username}`,
                isVerified: user ? user.isVerified : false,
                avatarFrame: user ? user.avatarFrame : 'none'
            };
        }));
        
        res.json(enrichedChats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Mock Authentication Endpoint
// In-memory store for verification codes
const verificationCodes = new Map();

app.post('/api/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email, code);
    
    console.log('\n----------------------------------------');
    console.log(`[VERIFICATION] Code for ${email}: ${code}`);
    console.log('----------------------------------------\n');
    
    // Real-time email
    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a; background: #f9f9f9;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #8b5cf6; margin-bottom: 20px;">Verify Your Identity</h2>
                <p>Hello,</p>
                <p>Use the code below to complete your verification on <strong>Stride</strong>. This code will expire in 10 minutes.</p>
                <div style="font-size: 32px; font-weight: bold; color: #8b5cf6; text-align: center; margin: 30px 0; letter-spacing: 5px;">
                    ${code}
                </div>
                <p style="font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">Stride Music Platform © 2024</p>
            </div>
        </div>
    `;
    
    const emailSent = await sendEmail(email, 'Your Stride Verification Code', html);
    if (!emailSent) {
        return res.status(500).json({ success: false, message: 'Failed to send verification email. Please check server logs.' });
    }
    res.json({ success: true, message: 'Verification code sent!' });
});

app.post('/api/signup', async (req, res) => {
    const { email, username, password } = req.body;
    try {
        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Username or Email already exists' });
        }

        const newUser = await User.create({
            username,
            email,
            password, 
            name: username, // default name
            avatar: `https://i.pravatar.cc/150?u=${username}`,
            favorites: []
        });

        // Send Welcome Email (async, don't block response)
        const welcomeHtml = `
            <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a; background: #f4f4f4;">
                <div style="max-width: 550px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; border-top: 5px solid #8b5cf6;">
                    <h1 style="color: #111; margin-bottom: 20px;">Welcome to Stride, ${username}! 🚀</h1>
                    <p style="font-size: 16px; line-height: 1.6;">We're thrilled to have you join our community.</p>
                </div>
            </div>
        `;
        sendEmail(email, 'Welcome to Stride!', welcomeHtml);

        res.json({ success: true, message: 'Account created successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
});

app.post('/api/verify-code', (req, res) => {
    const { email, code } = req.body;
    const storedCode = verificationCodes.get(email);

    // Development bypass or correct code match
    if (code === '000000' || (storedCode && storedCode === code)) {
        verificationCodes.delete(email); // One-time use
        res.json({ success: true, message: 'Email verified successfully!' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const foundUser = await User.findOne({ 
            $or: [{ email: email }, { username: email }], 
            password: password 
        });

        if (foundUser) {
            res.json({
                success: true,
                user: {
                    username: foundUser.username,
                    email: foundUser.email,
                    avatar: foundUser.avatar
                },
                token: 'mock-jwt-token-stride-' + Date.now()
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/profile/update', async (req, res) => {
    const { username, name, bio, avatar, avatarFrame, banner } = req.body;
    try {
        const updatedUser = await User.findOneAndUpdate(
            { username },
            { name, bio, avatar, avatarFrame, banner },
            { new: true }
        );
        if (updatedUser) {
            res.json({ success: true, user: updatedUser });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/favorites/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        res.json(user ? user.favorites : []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/favorites/:username', (req, res) => {
    const { username } = req.params;
    const { track } = req.body;
    const data = readData();
    
    if (!data.users[username]) {
        data.users[username] = { ...data.users['default_user'], favorites: [] };
    }
    
    const favorites = data.users[username].favorites;
    const index = favorites.findIndex(f => f.id === track.id);
    
    if (index === -1) {
        favorites.push(track);
        // Broadcast real-time event
        io.emit('global_event', {
            type: 'TRACK_FAVORITED',
            data: { track, username },
            timestamp: Date.now()
        });
    } else {
        favorites.splice(index, 1);
    }
    
    writeData(data);
    res.json(favorites);
});

// ── Monetization & Analytics ──

app.post('/api/monetization/tip', async (req, res) => {
    const { fromId, toId, amount, trackId } = req.body;
    try {
        const tx = new Transaction({ from: fromId, to: toId, amount, trackId, type: 'tip' });
        await tx.save();

        // Update Analytics
        if (trackId) {
            await Analytics.findOneAndUpdate(
                { trackId },
                { $inc: { tips: amount } },
                { upsert: true }
            );
        }

        res.json({ success: true, transaction: tx });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/monetization/gift-frame', async (req, res) => {
    const { fromId, toId, frameType, amount } = req.body;
    try {
        const tx = new Transaction({ from: fromId, to: toId, amount, type: 'gift' });
        await tx.save();

        // Update recipient's avatar frame
        const updatedUser = await User.findByIdAndUpdate(toId, { avatarFrame: frameType }, { new: true });

        // Broadcast the gift and create notification
        const sender = await User.findById(fromId);
        const recipient = await User.findById(toId);
        
        if (recipient && sender) {
            await Notification.create({
                user: recipient.username,
                type: 'gift',
                from: sender.username,
                senderFrame: sender.avatarFrame || 'none',
                content: `gifted you a ${frameType} avatar frame!`,
                time: 'Just now'
            });
            await User.findOneAndUpdate({ username: recipient.username }, { hasUnreadNotifications: true });
        }

        io.emit('global_event', {
            type: 'FRAME_GIFTED',
            data: { from: sender?.username || fromId, to: recipient?.username || toId, frameType },
            timestamp: Date.now()
        });

        res.json({ success: true, user: updatedUser, transaction: tx });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/artist/stats/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ error: "Artist not found" });

        const stats = await Analytics.find({ artistId: user._id });
        const recentTxs = await Transaction.find({ to: user._id }).sort({ timestamp: -1 }).limit(10).populate('from', 'username name');
        
        res.json({ stats, recentTransactions: recentTxs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/analytics/listen', async (req, res) => {
    const { trackId, artistId } = req.body;
    try {
        await Analytics.findOneAndUpdate(
            { trackId },
            { $inc: { listens: 1 }, $set: { artistId } },
            { upsert: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Socket.io Logic
const userActivity = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.emit('initial_activity', Array.from(userActivity.values()));

    socket.on('update_activity', (data) => {
        const activity = {
            userId: socket.id,
            ...data,
            timestamp: Date.now()
        };
        userActivity.set(socket.id, activity);
        socket.broadcast.emit('activity_broadcast', activity);
    });

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('join_user_room', (username) => {
        socket.join(`user_${username}`);
        console.log(`User ${socket.id} (username: ${username}) joined their private notification room.`);
    });

    socket.on('private_message', async (payload) => {
        const { roomId, message } = payload;
        try {
            const fullMessage = await Message.create({
                sender: message.username,
                receiver: roomId.replace('chat_', ''),
                text: message.text,
                type: message.type || 'text',
                timestamp: Date.now()
            });

            // Update recipient status
            const recipient = roomId.replace('chat_', '');
            await User.findOneAndUpdate({ username: recipient }, { hasUnreadMessages: true });
            
            const sender = await User.findOne({ username: message.username });
            await Notification.create({
                user: recipient,
                type: 'message',
                from: message.username,
                senderFrame: sender ? sender.avatarFrame : 'none',
                content: `sent you a message: "${(message.text || 'attachment').substring(0, 20)}..."`,
                time: 'Just now'
            });

            // Broadcast to room
            io.to(roomId).emit('new_private_message', {
                ...fullMessage.toObject(),
                isMe: false // recipient side
            });

            // Global notification
            socket.broadcast.emit('global_event', {
                type: 'NEW_MESSAGE',
                data: { from: message.username, text: message.text, roomId },
                timestamp: Date.now()
            });
        } catch (err) {
            console.error('Socket Message Error:', err);
        }
    });

    socket.on('mark_messages_read', async ({ username }) => {
        try {
            await User.findOneAndUpdate({ username }, { hasUnreadMessages: false });
            io.emit('user_status_updated', { username, hasUnreadMessages: false });
        } catch (err) {
            console.error('Socket Mark Read Error:', err);
        }
    });

    socket.on('typing_start', ({ roomId, username }) => {
        socket.to(roomId).emit('user_typing_start', { username });
    });

    socket.on('typing_stop', ({ roomId, username }) => {
        socket.to(roomId).emit('user_typing_stop', { username });
    });

    socket.on('message_seen', async ({ roomId, messageId, username }) => {
        try {
            await Message.findByIdAndUpdate(messageId, { readStatus: true });
            socket.to(roomId).emit('user_message_seen', { messageId, username });
        } catch (err) {
            console.error('Socket Message Seen Error:', err);
        }
    });

    // Sync-Play Handlers
    socket.on('sync_playback', ({ roomId, track, progress, isPlaying }) => {
        socket.to(roomId).emit('playback_synced', { track, progress, isPlaying, sender: socket.id });
    });

    socket.on('request_sync', ({ roomId, requester }) => {
        socket.to(roomId).emit('sync_requested', { requester });
    });

    socket.on('playback_update', ({ username, track, isPlaying }) => {
        userActivity.set(socket.id, { username, track, isPlaying, lastUpdate: Date.now() });
        io.emit('user_activity_updated', { username, track, isPlaying });
    });

    socket.on('join_community', (communityId) => {
        socket.join(`community_${communityId}`);
        console.log(`User joined community room: community_${communityId}`);
    });

    socket.on('disconnect', () => {

        userActivity.delete(socket.id);
        io.emit('user_disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Stride Backend running on port ${PORT}`);
});
