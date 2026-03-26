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
const helmet = require('helmet');
const { Resend } = require('resend');
const rateLimit = require('express-rate-limit');

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
const VibeAnalytics = require('./models/VibeAnalytics.cjs');


// Database Connection
const logVibeEvent = async (communityId, userId, eventType, metadata = {}) => {
    try {
        if (!communityId || !userId) return;
        
        // Ensure communityId is an ObjectId
        const cid = mongoose.isValidObjectId(communityId) ? communityId : null;
        const uid = mongoose.isValidObjectId(userId) ? userId : null;
        
        if (!cid || !uid) {
            // If they are IDs but not ObjectId type, we might need to find them or just skip
            // For now, let's assume valid IDs are passed or we skip
        }

        await VibeAnalytics.create({
            communityId,
            userId,
            eventType,
            metadata,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Analytics Logging Error:', err);
    }
};
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
                    avatar: s.icon || '🎧',
                    category: s.name.toLowerCase().includes('music') || s.name.toLowerCase().includes('lo-fi') || s.name.toLowerCase().includes('prod') ? 'Music' : 
                              s.name.toLowerCase().includes('game') || s.name.toLowerCase().includes('play') ? 'Gaming' : 'Social'
                };
                
                await Community.findOneAndUpdate(
                    { name: s.name },
                    { 
                        $setOnInsert: { owner: communityData.owner, members: [] },
                        $set: { 
                            description: communityData.description,
                            memberCount: communityData.memberCount,
                            avatar: communityData.avatar,
                            tags: s.tags || [],
                            category: communityData.category
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

        // 4. Reels
        if (data.reels) {
            console.log('INFO: Hydrating reels (Force Refresh Pixabay)...');
            await Post.deleteMany({ type: 'reel' });
            
            for (const r of data.reels) {
                const userObj = await User.findOne({ username: r.username });
                await Post.create({
                    username: r.username,
                    user: userObj ? userObj._id : null,
                    caption: r.description,
                    contentUrl: r.url,
                    likes: r.likes || 0,
                    music: r.music || "",
                    type: 'reel',
                    tags: r.tags || []
                });
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
let resend;

const createTransporter = async () => {
    // Priority 1: Resend SDK (Most reliable for Render/Production)
    if (process.env.RESEND_API_KEY) {
        console.log('INFO: Using Resend SDK for reliable HTTP-based email delivery.');
        resend = new Resend(process.env.RESEND_API_KEY);
        return null; // Don't need a transporter for Resend
    }

    // Priority 2: Generic SMTP/Gmail (Fallback)
    if (process.env.EMAIL_PASS && process.env.EMAIL_USER) {
        const port = parseInt(process.env.EMAIL_PORT || "587");
        console.log(`INFO: Using SMTP fallback on port ${port}.`);
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST || "smtp.gmail.com",
            port,
            secure: port === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 20000, 
            greetingTimeout: 20000,   
            socketTimeout: 30000,     
            pool: true                
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
    try {
        console.log(`Attempting to send email to ${to}...`);
        
        // Priority 1: Resend SDK (HTTP based, avoids SMTP port blocks on Render)
        if (resend) {
            console.log('Using Resend SDK Path (HTTP)...');
            const { data, error } = await resend.emails.send({
                from: 'Stride <onboarding@resend.dev>',
                to: [to],
                subject: subject,
                html: html,
            });
            if (error) {
                console.error('Resend SDK Error:', error.message);
                throw error;
            }
            console.log(`Resend Email sent successfully to ${to}: ${data.id}`);
            return true;
        }

        // Priority 2: Generic SMTP Path
        let readyTransporter = await transportReady;
        if (!readyTransporter) throw new Error('No email service configured');

        const info = await readyTransporter.sendMail({
            from: `"Stride App" <contact@thestrideapp.in>`,
            to,
            subject,
            html
        });
        
        console.log(`Email sent successfully to ${to}`);
        if (nodemailer.getTestMessageUrl(info)) {
            console.log(`PREVIEW URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
        return true;
    } catch (err) {
        console.error(`CRITICAL: Error sending email to ${to}:`, err.message);
        if (err.code) console.error(`ERROR CODE: ${err.code}, SYSCALL: ${err.syscall}, COMMAND: ${err.command}`);
        
        // Final fallback: try to create a test account if SMTP failed and resend is not active
        if (!resend && (err.code === 'ETIMEDOUT' || err.code === 'EAUTH')) {
            console.log('SMTP FAILURE: Attempting one-time fallback to test account...');
            try {
                const testAccount = await nodemailer.createTestAccount();
                const fallbackTransporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email", port: 587, secure: false,
                    auth: { user: testAccount.user, pass: testAccount.pass }
                });
                await fallbackTransporter.sendMail({
                    from: `"Stride App" <contact@thestrideapp.in>`,
                    to,
                    subject,
                    html
                });
                console.log('Successfully sent via Ethereal fallback.');
                return true;
            } catch (fallbackErr) {
                console.error('FALLBACK FAILURE:', fallbackErr.message);
            }
        }
        return false;
    }
};


const app = express();
app.set('trust proxy', 1); // Required for express-rate-limit on Render
app.use(helmet({
    contentSecurityPolicy: false,
}));
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);
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
        const newServer = await Community.create({
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

app.get('/api/analytics/community/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const requesterId = req.headers['x-user-id'];

        const community = await Community.findById(id);
        if (!community) return res.status(404).json({ error: 'Community not found' });

        // Authorization: Requester must be owner or mod
        const isOwner = community.owner.toString() === requesterId;
        const requesterRole = community.roles?.find(r => r.user === requesterId)?.role;
        const isMod = requesterRole === 'mod' || requesterRole === 'owner';

        if (!isOwner && !isMod) {
            return res.status(403).json({ error: 'Unauthorized: Only moderators or owners can view analytics.' });
        }

        const now = new Date();
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const stats = await VibeAnalytics.aggregate([
            { $match: { communityId: new mongoose.Types.ObjectId(id), timestamp: { $gte: past24h } } },
            { $group: {
                _id: "$eventType",
                count: { $sum: 1 }
            }}
        ]);

        const topTracks = await VibeAnalytics.aggregate([
            { $match: { communityId: new mongoose.Types.ObjectId(id), eventType: 'play' } },
            { $group: {
                _id: "$metadata.trackName",
                plays: { $sum: 1 },
                artist: { $first: "$metadata.artistName" }
            }},
            { $sort: { plays: -1 } },
            { $limit: 5 }
        ]);

        res.json({ stats, topTracks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RBAC: Update member role
app.put('/api/communities/:id/members/:userId/role', async (req, res) => {
    try {
        const { id, userId } = req.params;
        const { role } = req.body;
        const requesterId = req.headers['x-user-id'];

        const community = await Community.findById(id).populate('members');
        if (!community) return res.status(404).json({ error: 'Community not found' });

        if (community.owner.toString() !== requesterId) {
            return res.status(403).json({ error: 'Only the owner can change roles.' });
        }

        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) return res.status(404).json({ error: 'User not found' });

        // Update or add role
        let roleEntry = community.roles.find(r => r.user === userToUpdate.username);
        if (roleEntry) {
            roleEntry.role = role;
        } else {
            community.roles.push({ user: userToUpdate.username, role });
        }

        await community.save();
        res.json({ message: 'Role updated', community });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// RBAC: Kick member
app.delete('/api/communities/:id/members/:userId', async (req, res) => {
    try {
        const { id, userId } = req.params;
        const requesterId = req.headers['x-user-id'];

        const community = await Community.findById(id);
        if (!community) return res.status(404).json({ error: 'Community not found' });

        const requester = await User.findById(requesterId);
        const targetUser = await User.findById(userId);
        
        if (!requester || !targetUser) return res.status(404).json({ error: 'User not found' });

        // Authorization check
        const isOwner = community.owner.toString() === requesterId;
        const requesterRole = community.roles?.find(r => r.user === requester.username)?.role;
        const targetRole = community.roles?.find(r => r.user === targetUser.username)?.role;

        const canKick = isOwner || (requesterRole === 'mod' && targetRole !== 'mod' && targetUser._id.toString() !== community.owner.toString());

        if (!canKick) {
            return res.status(403).json({ error: 'Unauthorized to kick this member.' });
        }

        community.members = community.members.filter(m => m.toString() !== userId);
        community.roles = community.roles.filter(r => r.user !== targetUser.username);
        community.memberCount = community.members.length;

        await community.save();
        
        io.to(`community_${id}`).emit('member_kicked', { userId, communityId: id });
        
        res.json({ message: 'Member kicked', community });
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
        // Fetch Reels from MongoDB (instead of reading raw JSON)
        const reels = await Post.find({ type: 'reel' }).sort({ createdAt: -1 });
        
        // Enhance reels with user data (like avatarFrame and isVerified)
        const enhancedReels = await Promise.all(reels.map(async (reel) => {
            const user = await User.findOne({ username: reel.username });
            return {
                ...reel.toObject(),
                url: reel.contentUrl, // Compatibility with ReelItem prop naming
                description: reel.caption, // Compatibility with ReelItem prop naming
                avatar: user ? user.avatar : '🎧',
                avatarFrame: user ? user.avatarFrame : 'none',
                isVerified: user ? user.isVerified : (reel.isVerified || false)
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
        const communities = await Community.find()
            .populate('owner', 'username')
            .populate('members', 'username avatar avatarFrame');
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
        
        const populated = await Community.findById(req.params.id).populate('members', 'username avatar avatarFrame');
        res.json(populated);
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
        io.to(`community_${req.params.id}`).emit('jukebox_updated', { 
            communityId: req.params.id, 
            queue: community.jukeboxQueue 
        });
        
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

app.post('/api/verify-code', async (req, res) => {
    const { email, code } = req.body;
    const storedCode = verificationCodes.get(email);

    // Development bypass or correct code match
    if (code === '000000' || (storedCode && storedCode === code)) {
        verificationCodes.delete(email); // One-time use
        
        // Update user status in MongoDB
        await User.findOneAndUpdate({ email }, { isVerified: true });
        
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

const roomOccupancy = new Map(); // roomId -> Set(socket.id)
const socketToUser = new Map(); // socket.id -> { username, avatar, avatarFrame }

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
        console.log(`Socket ${socket.id} joined room ${roomId}`);
        
        // Log Analytics Join Event
        const userData = socketToUser.get(socket.id);
        if (userData && roomId.startsWith('community_')) {
            const communityId = roomId.replace('community_', '');
            logVibeEvent(communityId, userData._id, 'join');
        } else if (userData && mongoose.isValidObjectId(roomId)) {
            // Sometimes roomId is just the ID
            logVibeEvent(roomId, userData._id, 'join');
        }
        
        if (!roomOccupancy.has(roomId)) roomOccupancy.set(roomId, new Set());
        roomOccupancy.get(roomId).add(socket.id);
        
        // Broadcast updated room members
        updateRoomMembers(roomId);
    });

    const updateRoomMembers = (roomId) => {
        const socketIds = roomOccupancy.get(roomId);
        if (!socketIds) return;
        
        const members = Array.from(socketIds).map(id => socketToUser.get(id)).filter(Boolean);
        // Deduplicate by username for display
        const uniqueMembers = Array.from(new Map(members.map(m => [m.username, m])).values());
        
        io.to(roomId).emit('room_members_updated', { roomId, members: uniqueMembers });
    };

    socket.on('register_user', (userData) => {
        socketToUser.set(socket.id, userData);
    });

    socket.on('join_user_room', (username) => {
        socket.join(`user_${username}`);
        console.log(`User ${socket.id} (username: ${username}) joined their private notification room.`);
    });

    socket.on('private_message', async (payload) => {
        const { roomId, message } = payload;
        const recipient = roomId.replace('chat_', '');
        try {
            const fullMessage = await Message.create({
                sender: message.username,
                receiver: recipient,
                text: message.text,
                type: message.type || 'text',
                timestamp: Date.now()
            });

            // Log Analytics Message Event
            const senderUser = await User.findOne({ username: message.username });
            if (senderUser) {
                // Determine if this is a community chat or private
                if (roomId.startsWith('community_')) {
                    logVibeEvent(roomId.replace('community_', ''), senderUser._id, 'message');
                }
            }

            // Update recipient status
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

    socket.on('channel_message', async (payload) => {
        const { roomId, message } = payload;
        // roomId format: community_ID_channelName
        try {
            // In a real app, we'd persist this to a ChannelMessage model
            // For now, broadcast to the room
            io.to(roomId).emit('new_channel_message', {
                ...message,
                roomId,
                id: Date.now()
            });

            // Log activity for the community
            const communityId = roomId.split('_')[1];
            const senderUser = await User.findOne({ username: message.username });
            if (senderUser && communityId) {
                logVibeEvent(communityId, senderUser._id, 'message');
            }
        } catch (err) {
            console.error('Socket Channel Message Error:', err);
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

    // ── WebRTC Signaling for Audio/Video Calls ──
    socket.on('call-user', (data) => {
        const { userToCall, signalData, from, name } = data;
        io.to(`user_${userToCall}`).emit('incoming-call', {
            signal: signalData,
            from,
            name
        });
    });

    socket.on('answer-call', (data) => {
        const { to, signal } = data;
        io.to(`user_${to}`).emit('call-accepted', signal);
    });

    socket.on('ice-candidate', (data) => {
        const { to, candidate } = data;
        io.to(`user_${to}`).emit('ice-candidate', candidate);
    });

    socket.on('end-call', (data) => {
        const { to } = data;
        io.to(`user_${to}`).emit('call-ended');
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
        socket.to(roomId).emit('sync_requested', { requester, socketId: socket.id });
        console.log(`Sync requested by ${requester} in room ${roomId}`);
    });

    socket.on('playback_update', ({ username, track, isPlaying }) => {
        userActivity.set(socket.id, { username, track, isPlaying, lastUpdate: Date.now() });
        io.emit('user_activity_updated', { username, track, isPlaying });

        // Log Analytics Play Event if in a community
        const userData = socketToUser.get(socket.id);
        if (userData && track && isPlaying) {
            // Find which room the user is in to get communityId
            roomOccupancy.forEach((sockets, roomId) => {
                if (sockets.has(socket.id) && (roomId.startsWith('community_') || mongoose.isValidObjectId(roomId))) {
                    const communityId = roomId.replace('community_', '');
                    logVibeEvent(communityId, userData._id, 'play', {
                        trackId: track.id || track.trackId,
                        trackName: track.name,
                        artistName: track.artist
                    });
                }
            });
        }
    });

    socket.on('join_community', (communityId) => {
        socket.join(`community_${communityId}`);
        console.log(`User joined community room: community_${communityId}`);
    });

    socket.on('disconnect', () => {
        const userData = socketToUser.get(socket.id);
        if (userData) {
            console.log(`User disconnected: ${userData.username}`);
            io.emit('user_disconnected', userData.username);
        }
        
        // Remove from all rooms
        roomOccupancy.forEach((sockets, roomId) => {
            if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                updateRoomMembers(roomId);
            }
        });
        
        socketToUser.delete(socket.id);
        userActivity.delete(socket.id);
    });

    socket.on('vote_song', async ({ communityId, trackId, vote }) => {
        try {
            const community = await Community.findById(communityId);
            if (!community) return;
            
            const track = community.jukeboxQueue.find(t => t.trackId === trackId || t.id === trackId);
            if (track) {
                track.votes = (track.votes || 0) + vote;
                
                // Log Analytics Vibe Event
                const userData = socketToUser.get(socket.id);
                if (userData) {
                    logVibeEvent(communityId, userData._id, 'vibe', {
                        trackId: track.trackId,
                        trackName: track.name
                    });
                }
                
                // Award vibe points to the person who added it (if it's an upvote)
                if (vote > 0 && track.addedBy) {
                    let entry = community.vibeLeaderboard.find(e => e.user && e.user.toString() === track.addedBy.toString());
                    if (!entry) {
                        entry = { user: track.addedBy, username: track.addedByUsername || 'Anonymous', points: 0 };
                        community.vibeLeaderboard.push(entry);
                        entry = community.vibeLeaderboard[community.vibeLeaderboard.length - 1];
                    }
                    entry.points += 10; // 10 points per upvote
                    // Sort leaderboard
                    community.vibeLeaderboard.sort((a, b) => b.points - a.points);
                }

                // Sort by votes
                community.jukeboxQueue.sort((a, b) => (b.votes || 0) - (a.votes || 0));
                await community.save();
                
                io.to(`community_${communityId}`).emit('jukebox_updated', { 
                    communityId, 
                    queue: community.jukeboxQueue,
                    leaderboard: community.vibeLeaderboard
                });
            }
        } catch (err) {
            console.error("Vote failed:", err);
        }
    });

    socket.on('track_finished', async ({ communityId, track }) => {
        try {
            const community = await Community.findById(communityId);
            if (!community) return;

            // Add to pastQueue
            community.pastQueue.unshift({
                trackId: track.trackId || track.id,
                title: track.title,
                artist: track.artist,
                artwork: track.artwork || track.cover
            });
            
            // Keep only last 50
            if (community.pastQueue.length > 50) {
                community.pastQueue = community.pastQueue.slice(0, 50);
            }

            // Remove from current queue
            community.jukeboxQueue = community.jukeboxQueue.filter(t => (t.trackId || t.id) !== (track.trackId || track.id));
            
            await community.save();
            io.to(`community_${communityId}`).emit('jukebox_updated', { 
                communityId, 
                queue: community.jukeboxQueue,
                pastQueue: community.pastQueue
            });
        } catch (err) {
            console.error("Track finished processing failed:", err);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Stride Backend running on port ${PORT}`);
});
