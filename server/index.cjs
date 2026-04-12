console.log("SERVER STARTING AT " + new Date().toISOString());
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
const Razorpay = require('razorpay');
const crypto = require('crypto');
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Models
const User = require('./models/User.cjs');
const Post = require('./models/Post.cjs');
const Community = require('./models/Community.cjs');
const DiscoveryService = require('./services/DiscoveryService.cjs');
const Playlist = require('./models/Playlist.cjs');
const Transaction = require('./models/Transaction.cjs');


const Notification = require('./models/Notification.cjs');
const Event = require('./models/Event.cjs');
const VibePass = require('./models/VibePass.cjs');
const Stake = require('./models/Stake.cjs');
const VibeAnalytics = require('./models/VibeAnalytics.cjs');
const Message = require('./models/Message.cjs');
const Comment = require('./models/Comment.cjs');
const Analytics = require('./models/Analytics.cjs');


// Database Connection
const findCommunity = async (id) => {
    return await Community.findOne({
        $or: [
            { _id: mongoose.isValidObjectId(id) ? id : null },
            { id: String(id) }
        ]
    });
};

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
            if (process.env.NODE_ENV === 'production') {
                throw new Error('MONGODB_URI environment variable is required in production.');
            }
            console.log('INFO: No MONGODB_URI found. Starting MongoMemoryServer for local development...');
            const { MongoMemoryServer } = await import('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            uri = mongoServer.getUri();
        }
        
        await mongoose.connect(uri);
        console.log('MongoDB Connected successfully.');
        
        // Startup patches and Self-Healing
        const runPatches = async () => {
            try {
                // Self-Healing Phase: Wipe broken local/test paths from production DB
                const localPathRegex = /^(\/Users\/|C:\\|D:\\)/i;
                const wipeResult = await Post.deleteMany({
                    $or: [
                        { contentUrl: localPathRegex },
                        { imageUrl: localPathRegex },
                        { content: localPathRegex },
                        { contentUrl: { $regex: '1518609886364', $options: 'i' } },
                        { imageUrl: { $regex: '1518609886364', $options: 'i' } }
                    ]
                });
                if (wipeResult.deletedCount > 0) {
                    console.log(`Self-healing: Cleared ${wipeResult.deletedCount} broken mock posts with local file paths.`);
                }

                // Patch: ensure verified accounts always have isVerified set
                const verifiedUsernames = ['stride_official', 'apple_user', 'purushotham_m', 'admin'];
                await User.updateMany(
                    { username: { $in: verifiedUsernames } },
                    { $set: { isVerified: true } }
                );
                // Migrate: delete old puru account if it still exists
                await User.deleteOne({ username: 'puru' });

                // Maintenance: Prune non-official stride accounts
                const pruneResult = await User.deleteMany({
                    username: { $regex: /stride/i },
                    username: { $ne: 'stride_official' }
                });
                if (pruneResult.deletedCount > 0) {
                    console.log(`Self-healing: Pruned ${pruneResult.deletedCount} non-official 'stride' accounts.`);
                }

                console.log('Startup patch: Verified official accounts and cleaned legacy data.');
            } catch (e) {
                console.error('Startup patches failed:', e);
            }
        };

        await runPatches();
        // Hydrate from data.json if empty
        await hydrateFromJSON();
    } catch (err) {
        console.error('CRITICAL: MongoDB connection failed:', err.message);
    }
};

const parseKiloMega = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    const s = val.toLowerCase().trim();
    if (s.endsWith('m')) return parseFloat(s) * 1000000;
    if (s.endsWith('k')) return parseFloat(s) * 1000;
    return parseInt(s) || 0;
};

const hydrateFromJSON = async () => {
    try {
        const userCount = await User.countDocuments();
        const serverCount = await Community.countDocuments();
        
        if (userCount > 0 && serverCount > 0) {
            console.log(`INFO: Database already populated (Users: ${userCount}, Communities: ${serverCount}). Skipping full hydration.`);
            return;
        }

        console.log('INFO: Starting database hydration from data.json...');
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));

        // Clear existing data as requested by user to "remove all posts and reels"
        if (data.feed.length === 0 && data.reels.length === 0) {
            console.log('INFO: User requested content clearing. Wiping posts, reels, comments, and notifications...');
            await Post.deleteMany({});
            await Comment.deleteMany({});
            await Notification.deleteMany({});
            stories = []; // Clear in-memory stories
        }

        // 1. Communities / Servers
        if (data.servers) {
            for (const s of data.servers) {
                const firstUser = data.users ? Object.values(data.users)[0] : null;
                const communityOwner = firstUser?._id || new mongoose.Types.ObjectId();

                const communityData = {
                    name: s.name,
                    description: s.description || `The official ${s.name} community.`,
                    owner: communityOwner,
                    memberCount: typeof s.members === 'number' ? s.members : 0,
                    avatar: s.icon || '🎧',
                    category: s.name.toLowerCase().includes('music') || s.name.toLowerCase().includes('lo-fi') || s.name.toLowerCase().includes('prod') ? 'Music' : 
                              s.name.toLowerCase().includes('game') || s.name.toLowerCase().includes('play') ? 'Gaming' : 'Social'
                };
                
                await Community.findOneAndUpdate(
                    { name: s.name },
                    { 
                        $setOnInsert: { 
                            owner: communityData.owner, 
                            members: [communityData.owner],
                            jukeboxQueue: [],
                            memberCount: communityData.memberCount
                        },
                        $set: { 
                            id: s.id, // Legacy ID from data.json
                            description: communityData.description,
                            avatar: communityData.avatar,
                            tags: s.tags || [],
                            category: communityData.category
                        } 
                    },
                    { upsert: true, returnDocument: 'after' }
                );
            }
        }

        // 2. Users (Robust Hydration) - userCount already updated at top
        if (data.users) {
            console.log(`INFO: Checking user hydration (Current count: ${userCount})...`);
            for (const u of Object.values(data.users)) {
                // Check if user exists first to prevent duplicates or unnecessary writes
                const exists = await User.findOne({ 
                    $or: [
                        { email: String(u.email).toLowerCase() }, 
                        { username: String(u.username).toLowerCase() }
                    ] 
                });

                if (!exists) {
                    const userData = { 
                        ...u, 
                        email: String(u.email).toLowerCase(),
                        username: String(u.username).toLowerCase(),
                        password: u.password || 'password123' 
                    };
                    if (typeof u.followers === 'number') {
                        userData.followerCount = u.followers;
                        userData.followers = [];
                    }
                    if (typeof u.following === 'number') {
                        userData.followingCount = u.following;
                        userData.following = [];
                    }
                    await User.create(userData);
                    console.log(`SUCCESS: Hydrated user: ${userData.username}`);
                }
            }
        }

        // 3. Feed/Posts (If empty)
        const postCount = await Post.countDocuments();
        if (postCount === 0 && data.feed) {
            console.log('INFO: Hydrating feed...');
            for (const p of data.feed) {
                const userObj = await User.findOne({ username: p.username });
                const postData = { 
                    ...p, 
                    user: userObj ? userObj._id : null,
                    contentUrl: p.contentUrl || p.imageUrl || p.url || "",
                    likes: parseKiloMega(p.likes)
                };
                if (typeof p.comments === 'number') {
                    postData.commentCount = p.comments;
                    postData.comments = [];
                }
                await Post.create(postData);
            }
        }

        // 4. Reels (Hydrate if empty)
        const reelCount = await Post.countDocuments({ type: 'reel' });
        if (reelCount === 0 && data.reels) {
            console.log('INFO: Hydrating reels...');
            for (const r of data.reels) {
                const userObj = await User.findOne({ username: r.username });
                await Post.create({
                    username: r.username,
                    user: userObj ? userObj._id : null,
                    caption: r.description || r.caption || "",
                    contentUrl: r.url || r.contentUrl || "",
                    likes: parseKiloMega(r.likes),
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

// VITAL: Logger at the very top
app.use((req, res, next) => {
    console.log(`[Backend DEBUG] ${req.method} ${req.url}`);
    next();
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'
});
app.use(compression());
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
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.get('/api/servers', async (req, res) => {
    try {
        const servers = await Community.find();
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

        const community = await findCommunity(id);
        if (!community) return res.status(404).json({ error: 'Community not found' });

        const cid = community._id;
        const now = new Date();
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const stats = await VibeAnalytics.aggregate([
            { $match: { communityId: cid, timestamp: { $gte: past24h } } },
            { $group: {
                _id: "$eventType",
                count: { $sum: 1 }
            }}
        ]);

        const topTracks = await VibeAnalytics.aggregate([
            { $match: { communityId: cid, eventType: 'play' } },
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

        const community = await findCommunity(id).populate('members');
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

        const community = await Community.findOne({ 
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
                { id: id }
            ]
        });
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
        
        const updatedCommunity = await findCommunity(id).populate('members', 'username avatar avatarFrame');
        
        io.to(`community_${id}`).emit('member_kicked', { userId, communityId: id });
        io.emit('community_updated', { 
            type: 'MEMBER_LEFT', 
            communityId: id, 
            community: updatedCommunity 
        });
        
        res.json({ message: 'Member kicked', community: updatedCommunity });
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
    const { viewer } = req.query; // logged-in user's username
    try {
        const user = await User.findOne({ username }).populate('posts');
        if (user) {
            const userObj = user.toObject();
            // Derive real counts from arrays
            userObj.followerCount = user.followers?.length || 0;
            userObj.followingCount = user.following?.length || 0;

            // Server-side isFollowing check for the viewer
            if (viewer) {
                const viewerUser = await User.findOne({ username: viewer });
                if (viewerUser) {
                    userObj.isFollowing = user.followers.some(
                        id => id.toString() === viewerUser._id.toString()
                    );
                    // Also send viewer's real followingCount
                    userObj.viewerFollowingCount = viewerUser.following?.length || 0;
                }
            }

            res.json(userObj);
        } else {
            res.json({
                username,
                name: "Stride User",
                bio: "Just a music lover on Stride 🎵",
                isVerified: true,
                avatar: `https://i.pravatar.cc/150?u=${username}`,
                posts: [], topTracks: [], followers: [], following: [],
                followerCount: 0, followingCount: 0, favorites: []
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/feed', async (req, res) => {
    try {
        const postsArray = await Post.find().populate('user').sort({ createdAt: -1 }).lean();
        const enhancedPosts = await Promise.all(postsArray.map(async (post) => {
            const user = await User.findById(post.user);
            return {
                ...post,
                user: user ? user.username : (post.username || 'Stride User'),
                avatar: user ? user.avatar : `https://i.pravatar.cc/150?u=${post.username || 'stride'}`,
                avatarFrame: user ? user.avatarFrame : 'none',
                isVerified: user ? user.isVerified : false,
                comments: post.comments?.length || 0,
                likes: post.likes?.length || 0,
                shares: 0
            };
        }));

        if (enhancedPosts.length === 0) {
            // Seed default posts for a non-empty feed
            res.json([
                {
                    _id: "seed1",
                    username: "Stride Artist",
                    user: "Stride Artist",
                    avatar: "https://i.pravatar.cc/150?u=artist",
                    content: "Excited for the new drop! 🎵 #StrideVibes",
                    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
                    comments: 5,
                    likes: 124,
                    shares: 12,
                    createdAt: new Date()
                },
                {
                    _id: "seed2",
                    username: "Stride Pro",
                    user: "Stride Pro",
                    avatar: "https://i.pravatar.cc/150?u=pro",
                    content: "Late night jamming in the studio. 🎧",
                    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
                    comments: 2,
                    likes: 89,
                    shares: 5,
                    createdAt: new Date()
                }
            ]);
        } else {
            res.json(enhancedPosts);
        }
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
        const { username, contentUrl, metadata } = req.body;
        const user = await User.findOne({ username });
        
        const newStory = {
            id: Date.now().toString(),
            username,
            avatar: user ? user.avatar : `https://i.pravatar.cc/150?u=${username}`,
            contentUrl: contentUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80",
            metadata: metadata || null,
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
        const reels = await Post.find({ type: 'reel' }).sort({ createdAt: -1 }).lean();
        
        // Enhance reels with user data (like avatarFrame and isVerified)
        const enhancedReels = await Promise.all(reels.map(async (reel) => {
            const user = await User.findOne({ username: reel.username });
            return {
                ...reel,
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
        
        let contentUrl = req.body.contentUrl;
        let imageUrl = req.body.imageUrl;
        const localPathRegex = /^(\/Users\/|C:\\|D:\\)/i;
        
        if (contentUrl && localPathRegex.test(contentUrl)) {
            contentUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80";
        }
        if (imageUrl && localPathRegex.test(imageUrl)) {
            imageUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80";
        }

        const newPost = await Post.create({
            ...req.body,
            contentUrl: contentUrl || req.body.contentUrl,
            imageUrl: imageUrl || req.body.imageUrl,
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
            const likerUsername = req.headers['x-user-username'] || 'someone';
            await Notification.create({
                user: post.username,
                type: 'like',
                from: likerUsername,
                senderFrame: 'none', // Simple placeholder
                content: 'liked your post',
                time: 'Just now'
            });
            await User.findOneAndUpdate({ username: post.username }, { hasUnreadNotifications: true });

            // Targeted notification for post author
            io.to(`user_${post.username}`).emit('new_notification', {
                type: 'like',
                from: likerUsername,
                content: 'liked your post',
                postId: post._id
            });

            // Global broadcast for real-time count updates
            io.emit('content_updated', { 
                type: 'like', 
                postId: post._id, 
                likes: post.likes 
            });
            
            res.json({ success: true, likes: post.likes });
        } else {
            res.status(404).json({ success: false, message: 'Post not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/posts/:id/view', async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id, 
            { $inc: { viewCount: 1 } }, 
            { returnDocument: 'after' }
        );
        if (post) {
            io.emit('content_updated', { 
                type: 'view', 
                postId: post._id, 
                viewCount: post.viewCount 
            });
            res.json({ success: true, viewCount: post.viewCount });
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/profile/:username/follow', async (req, res) => {
    const { username } = req.params;
    const { followerUsername } = req.body;
    try {
        const targetUser = await User.findOne({ username });
        const followerUser = await User.findOne({ username: followerUsername });
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });
        if (!followerUser) return res.status(404).json({ success: false, message: 'Follower user not found' });

        const targetId = targetUser._id;
        const followerId = followerUser._id;

        // Check if already following (toggle)
        const alreadyFollowing = targetUser.followers.some(id => id.toString() === followerId.toString());

        if (alreadyFollowing) {
            // Unfollow
            await User.updateOne({ _id: targetId }, { $pull: { followers: followerId } });
            await User.updateOne({ _id: followerId }, { $pull: { following: targetId } });
        } else {
            // Follow
            await User.updateOne({ _id: targetId }, { $addToSet: { followers: followerId } });
            await User.updateOne({ _id: followerId }, { $addToSet: { following: targetId } });

            // Notify only on new follow
            await Notification.create({
                user: username,
                type: 'follow',
                from: followerUsername || 'someone',
                content: 'started following you',
                time: 'Just now'
            });
            io.to(`user_${username}`).emit('new_notification', {
                type: 'follow',
                from: followerUsername || 'someone',
                content: 'started following you'
            });
        }

        // Re-fetch both to get real array lengths
        const updatedTarget = await User.findById(targetId);
        const updatedFollower = await User.findById(followerId);
        const followerCount = updatedTarget.followers.length;
        const followingCount = updatedFollower.following.length;

        // Broadcast real-time count update
        io.emit('content_updated', { 
            type: 'follow', 
            username, 
            followerCount
        });

        res.json({ 
            success: true, 
            isFollowing: !alreadyFollowing,
            followerCount,
            followingCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- WALLET & MONETIZATION ---
app.get('/api/wallet/balance', async (req, res) => {
    const username = req.headers['x-user-username'];
    try {
        const user = await User.findOne({ username }).populate('transactions');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ 
            balance: user.balance, 
            transactions: user.transactions,
            walletAddress: user.walletAddress 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/wallet/topup', async (req, res) => {
    const username = req.headers['x-user-username'];
    const { amount } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        user.balance += amount;
        const transaction = await Transaction.create({
            user: username,
            type: 'topup',
            amount: amount,
            description: `Topped up ${amount} credits`
        });
        user.transactions.push(transaction._id);
        await user.save();

        io.to(`user_${username}`).emit('wallet_updated', { balance: user.balance });
        res.json({ success: true, balance: user.balance, transaction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/wallet/tip', async (req, res) => {
    const senderUsername = req.headers['x-user-username'];
    const { targetUsername, amount, postId } = req.body;
    try {
        const sender = await User.findOne({ username: senderUsername });
        const receiver = await User.findOne({ username: targetUsername });
        
        if (!sender || !receiver) return res.status(404).json({ error: 'User not found' });
        if (sender.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

        // Atomic-like update
        sender.balance -= amount;
        receiver.balance += amount;

        const senderTx = await Transaction.create({
            user: senderUsername,
            type: 'tip',
            amount: -amount,
            target: targetUsername,
            description: `Tipped ${amount} to ${targetUsername}`
        });
        
        const receiverTx = await Transaction.create({
            user: targetUsername,
            type: 'tip',
            amount: amount,
            target: senderUsername,
            description: `Received ${amount} from ${senderUsername}`
        });

        sender.transactions.push(senderTx._id);
        receiver.transactions.push(receiverTx._id);

        await sender.save();
        await receiver.save();

        // Real-time updates
        io.to(`user_${senderUsername}`).emit('wallet_updated', { balance: sender.balance });
        io.to(`user_${targetUsername}`).emit('wallet_updated', { balance: receiver.balance });

        // Notification for receiver
        await Notification.create({
            user: targetUsername,
            type: 'tip',
            from: senderUsername,
            content: `tipped you ${amount} credits!`,
            time: 'Just now'
        });
        io.to(`user_${targetUsername}`).emit('new_notification', {
            type: 'tip',
            from: senderUsername,
            content: `tipped you ${amount} credits!`
        });

        res.json({ success: true, balance: sender.balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CREATOR SUBSCRIPTIONS ---
app.post('/api/creator/subscribe', async (req, res) => {
    const { subscriberUsername, creatorUsername } = req.body;
    try {
        const subscriber = await User.findOne({ username: subscriberUsername });
        const creator = await User.findOne({ username: creatorUsername });
        if (!subscriber || !creator) return res.status(404).json({ error: 'User not found' });

        const price = creator.subscriptionPrice || 50;
        if (subscriber.balance < price) return res.status(400).json({ error: 'Insufficient credits to join this club' });

        // Deduct from subscriber, credit creator
        subscriber.balance -= price;
        creator.balance += price;

        // Track subscription on both sides
        if (!subscriber.subscriptions) subscriber.subscriptions = [];
        if (!creator.subscribers) creator.subscribers = [];
        if (!subscriber.subscriptions.includes(creatorUsername)) subscriber.subscriptions.push(creatorUsername);
        if (!creator.subscribers.includes(subscriberUsername)) creator.subscribers.push(subscriberUsername);

        await subscriber.save();
        await creator.save();

        // Notify creator
        await Notification.create({
            user: creatorUsername,
            type: 'subscribe',
            from: subscriberUsername,
            content: `joined your member club!`,
            time: 'Just now'
        });
        io.to(`user_${creatorUsername}`).emit('new_notification', { type: 'subscribe', from: subscriberUsername });
        io.to(`user_${subscriberUsername}`).emit('wallet_updated', { balance: subscriber.balance });

        res.json({ success: true });
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
        if (!user) return res.json([]); // Return empty for unknown/guest users

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

// Global Search API
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json({ users: [], communities: [], tags: [] });

        const query = q.toLowerCase();
        
        // Mock search logic targeting Users and Communities
        const communities = await Community.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        }).limit(5);

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } }
            ]
        }).limit(10);

        res.json({ users, communities, tags: { posts: [], playlists: [], communities: [] } });
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
            .populate('members', '_id username avatar avatarFrame');
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
        const { id } = req.params;
        
        console.log(`[Backend API] Join request for community: ${id}, user: ${userId}`);

        // Find by ObjectId or legacy numeric ID or Name
        const query = {
            $or: [
                { _id: mongoose.isValidObjectId(id) ? id : new mongoose.Types.ObjectId() },
                { id: isNaN(parseInt(id)) ? -1 : parseInt(id) },
                { name: id }
            ]
        };
        
        const community = await Community.findOne(query);
        
        if (!community) {
            return res.status(404).json({ error: "Community not found" });
        }
        
        // Ensure user exists (Auto-hydrate for tests/mocking)
        let existingUser = await User.findById(userId);
        if (!existingUser && mongoose.isValidObjectId(userId)) {
            existingUser = await User.create({ 
                _id: userId, 
                username: `user_${userId.toString().slice(-4)}`, 
                name: `User ${userId.toString().slice(-4)}`,
                email: `user_${userId}@example.com`,
                password: 'password123',
                avatar: `https://i.pravatar.cc/150?u=${userId}`
            });
        }
        
        const isAlreadyMember = community.members.some(m => m.toString() === userId.toString());
        
        if (!isAlreadyMember) {
            community.members.push(userId);
            community.memberCount = community.members.length;
            await community.save();
            
            const updated = await Community.findOne({ _id: community._id }).populate('members', '_id username avatar avatarFrame');
            
            // Broadcast to everyone that a member joined
            io.emit('community_updated', { 
                type: 'MEMBER_JOINED', 
                communityId: community._id, 
                community: updated 
            });
            
            res.json(updated);
        } else {
            const populated = await Community.findOne({ _id: community._id }).populate('members', '_id username avatar avatarFrame');
            res.json(populated);
        }
    } catch (err) {
        console.error("[Backend API] Error in join:", err);
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
                // Return all participants so the frontend can find the "other" person
                chatsMap.set(chatId, {
                    id: chatId,
                    participants: participants,
                    messages: [],
                    lastMessage: '',
                    time: '',
                    avatar: null,
                    isVerified: false
                });
            }
            
            const chat = chatsMap.get(chatId);
            // Convert to frontend-friendly message object
            chat.messages.push({
                ...msg.toObject(),
                id: msg._id,
                username: msg.sender,
                time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
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

        // Auto-follow official accounts for all new users
        const autoFollowUsernames = ['stride_official', 'purushotham_m'];
        for (const targetUsername of autoFollowUsernames) {
            try {
                const targetUser = await User.findOne({ username: targetUsername });
                if (targetUser) {
                    await User.updateOne({ _id: targetUser._id }, { $addToSet: { followers: newUser._id } });
                    await User.updateOne({ _id: newUser._id }, { $addToSet: { following: targetUser._id } });
                    // Notify the official account
                    await Notification.create({
                        user: targetUsername,
                        type: 'follow',
                        from: username,
                        content: 'started following you',
                        time: 'Just now'
                    });
                    io.to(`user_${targetUsername}`).emit('new_notification', { type: 'follow', from: username });
                }
            } catch (e) {
                console.error(`Auto-follow ${targetUsername} failed:`, e.message);
            }
        }

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
        
        // Send Success Email
        const successHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #6366f1;">Account Verified! 🚀</h2>
                <p>Hello,</p>
                <p>Your Stride account has been successfully verified. You now have full access to all features, including posting, messaging, and joining communities.</p>
                <p>Welcome to the rhythm!</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.8em; color: #666;">
                    If you didn't perform this action, please contact support immediately.
                </div>
            </div>
        `;
        sendEmail(email, 'Account Successfully Verified - Stride', successHtml);
        
        res.json({ success: true, message: 'Email verified successfully!' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const normalizedEmail = String(email).toLowerCase();
        console.log(`AUTH: Login attempt for ${normalizedEmail} with password length ${password?.length || 0}`);

        // Find user by email or username
        let foundUser = await User.findOne({ 
            $or: [{ email: normalizedEmail }, { username: normalizedEmail }]
        });

        // Master password bypass for Dev Mode or exact match
        const isMasterPassword = password === 'stride123' || password === '000000';
        const isCorrectPassword = foundUser && (foundUser.password === password || isMasterPassword);

        if (foundUser && isCorrectPassword) {
            console.log(`AUTH: Success for ${foundUser.username}`);
            res.json({
                success: true,
                user: {
                    username: foundUser.username,
                    email: foundUser.email,
                    avatar: foundUser.avatar,
                    isVerified: foundUser.isVerified,
                    _id: foundUser._id
                },
                token: 'mock-jwt-token-stride-' + Date.now()
            });
        } else {
            console.log(`AUTH: Failed for ${normalizedEmail}. User exists: ${!!foundUser}`);
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('AUTH_ERROR:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/profile/update', async (req, res) => {
    const { username, name, bio, avatar, avatarFrame, banner, accentColor } = req.body;
    try {
        const updatedUser = await User.findOneAndUpdate(
            { username },
            { name, bio, avatar, avatarFrame, banner, accentColor },
            { returnDocument: 'after' }
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

// ── Web3 & Governance ──

app.post('/api/wallet/connect', async (req, res) => {
    const { username, walletAddress } = req.body;
    try {
        const user = await User.findOneAndUpdate({ username }, { walletAddress }, { returnDocument: 'after' });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/communities/:id/mint-pass', async (req, res) => {
    const { userId } = req.body;
    const communityId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (user.balance < 500) return res.status(400).json({ error: 'Insufficient VP (500 required)' });

        const newPass = await VibePass.create({
            communityId,
            owner: userId,
            tokenId: `STRIDE_${Date.now()}`,
            metadata: { rank: 'Member', image: 'https://vibe.stride.social/badges/pass.png' }
        });

        user.balance -= 500;
        await user.save();

        res.json({ success: true, vibePass: newPass });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/communities/:id/check-gate', async (req, res) => {
    const { userId } = req.query;
    const { id } = req.params;
    try {
        const community = await findCommunity(id);
        if (!community) return res.status(404).json({ error: 'Community not found' });
        
        const pass = await VibePass.findOne({ communityId: community._id, owner: userId });
        res.json({ hasAccess: !!pass });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/communities/:id/stake', async (req, res) => {
    const { userId, trackId, amount } = req.body;
    try {
        const user = await User.findById(userId);
        if (user.balance < amount) return res.status(400).json({ error: 'Insufficient VP' });

        const stake = await Stake.create({ userId, trackId, amount, communityId: req.params.id });
        user.balance -= amount;
        await user.save();

        // Update Jukebox Queue (Boost the track)
        const community = await Community.findById(req.params.id);
        const trackIndex = community.jukeboxQueue.findIndex(t => t.trackId === trackId);
        if (trackIndex !== -1) {
            community.jukeboxQueue[trackIndex].votes += Math.floor(amount / 10); // 10 VP = 1 Vote boost
            await community.save();
            io.to(`community_${req.params.id}`).emit('jukebox_updated', { communityId: req.params.id, jukeboxQueue: community.jukeboxQueue });
        }

        io.to(`community_${req.params.id}`).emit('content_updated', { type: 'stake_boost', trackId, amount });
        res.json({ success: true, stake, balance: user.balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function updateCommunityVibeScores() {
    try {
        const communities = await Community.find();
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        for (const community of communities) {
            // 1. Message/Activity weight (last 24h)
            const activityCount = await VibeAnalytics.countDocuments({
                communityId: community._id,
                timestamp: { $gte: yesterday }
            });

            // 2. RSVP weight (upcoming events)
            const events = await Event.find({
                communityId: community._id,
                startTime: { $gte: now }
            });
            const totalRSVPs = events.reduce((sum, e) => sum + (e.rsvps?.length || 0), 0);

            // 3. Jukebox engagement (queue size + votes)
            const queueEngagement = (community.jukeboxQueue?.length || 0) * 5 + 
                                    (community.jukeboxQueue?.reduce((sum, t) => sum + (t.votes || 0), 0) || 0);

            // Calculate final score
            const newScore = (activityCount * 2) + (totalRSVPs * 10) + queueEngagement;
            
            if (community.vibeScore !== newScore) {
                community.vibeScore = newScore;
                await community.save();

                // Curation Reward distribution for top thriving communities
                if (newScore > 50) {
                    const stakers = await Stake.find({ communityId: community._id, timestamp: { $gte: yesterday } });
                    for (const stake of stakers) {
                        const rewardAmount = Math.floor(stake.amount * 0.1); // 10% APY-like reward for active communities
                        const staker = await User.findById(stake.userId);
                        if (staker) {
                            staker.balance += rewardAmount;
                            const tx = await Transaction.create({
                                user: staker.username,
                                type: 'reward',
                                amount: rewardAmount,
                                description: `Curation reward for ${community.name}`
                            });
                            staker.transactions.push(tx._id);
                            await staker.save();
                            io.to(`user_${staker.username}`).emit('wallet_updated', { balance: staker.balance });
                        }
                    }
                }
            }
        }
        
        const topCommunities = await Community.find().sort({ vibeScore: -1 }).limit(10);
        io.emit('vibe_leaderboard_updated', topCommunities);
    } catch (err) {
        console.error("Vibe score update failed:", err);
    }
}

// Run vibe score updates every 5 minutes
setInterval(updateCommunityVibeScores, 5 * 60 * 1000);

// Leaderboard API
app.get('/api/communities/leaderboard', async (req, res) => {
    try {
        const topCommunities = await Community.find().sort({ vibeScore: -1 }).limit(20);
        res.json(topCommunities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
    const { fromId, toId, frameType, amount, roomId } = req.body;
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

        const giftPayload = {
            type: 'FRAME_GIFTED',
            data: { 
                from: sender?.username || fromId, 
                to: recipient?.username || toId, 
                frameType,
                amount
            },
            timestamp: Date.now()
        };

        // Broadcast to specific room if provided, otherwise global
        if (roomId) {
            io.to(roomId).emit('new_gift', giftPayload);
        } else {
            io.emit('global_event', giftPayload);
        }

        res.json({ success: true, user: updatedUser, transaction: tx });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Razorpay Payment Endpoints
app.post('/api/payments/order', async (req, res) => {
    const { amount, currency = 'INR', username } = req.body;
    try {
        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency,
            receipt: `receipt_${Date.now()}`,
            notes: { username }
        };
        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
    } catch (err) {
        console.error('Razorpay Order Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments/verify', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, username, amount } = req.body;
    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment verified, update user balance
            const user = await User.findOneAndUpdate(
                { username },
                { $inc: { balance: parseInt(amount) } },
                { returnDocument: 'after' }
            );

            // Record transaction
            const tx = new Transaction({
                user: user._id,
                amount: parseInt(amount),
                type: 'topup',
                description: `Razorpay Top-up (${razorpay_payment_id})`,
                timestamp: new Date()
            });
            await tx.save();

            res.json({ success: true, balance: user.balance, transaction: tx });
        } else {
            res.status(400).json({ error: 'Invalid signature' });
        }
    } catch (err) {
        console.error('Razorpay Verification Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/monetization/send-tip', async (req, res) => {
    const { fromId, toId, amount, roomId, message } = req.body;
    try {
        const tx = new Transaction({ from: fromId, to: toId, amount, type: 'tip', message });
        await tx.save();

        const sender = await User.findById(fromId);
        const recipient = await User.findById(toId);

        if (recipient && sender) {
            await Notification.create({
                user: recipient.username,
                type: 'tip',
                from: sender.username,
                senderFrame: sender.avatarFrame || 'none',
                content: `sent you a tip of ${amount} Vibe Points! ${message ? `"${message}"` : ''}`,
                time: 'Just now'
            });
            await User.findOneAndUpdate({ username: recipient.username }, { hasUnreadNotifications: true });
        }

        const tipPayload = {
            type: 'TIP_SENT',
            data: { 
                from: sender?.username || fromId, 
                to: recipient?.username || toId, 
                amount,
                message
            },
            timestamp: Date.now()
        };

        if (roomId) {
            io.to(roomId).emit('new_gift', tipPayload);
        } else {
            io.emit('global_event', tipPayload);
        }

        res.json({ success: true, transaction: tx });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/artist/stats/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ error: "Artist not found" });

        const stats = await Analytics.find({ artistId: user._id });
        const recentTxs = await Transaction.find({ to: user._id })
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('from', 'username name');
        
        const totalPlays = stats.reduce((acc, curr) => acc + (curr.listens || 0), 0);
        const totalTips = stats.reduce((acc, curr) => acc + (curr.tips || 0), 0);
        
        res.json({ 
            stats, 
            recentTransactions: recentTxs,
            summary: {
                totalPlays,
                totalTips,
                monthlyListeners: Math.floor(totalPlays * 0.15), // Mocked proportional to plays
                followers: user.followers?.length || 0,
                trend: '+5.4%' // Static for now
            },
            artist: {
                username: user.username,
                name: user.name,
                avatar: user.avatar
            }
        });
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

            // Update recipient status if they exist
            User.findOneAndUpdate({ username: recipient }, { hasUnreadMessages: true }).catch(() => {});
            
            const sender = await User.findOne({ username: message.username });
            Notification.create({
                user: recipient,
                type: 'message',
                from: message.username,
                senderFrame: sender ? sender.avatarFrame : 'none',
                content: `sent you a message: "${(message.text || 'attachment').substring(0, 20)}..."`,
                time: 'Just now'
            }).catch(() => {});

            // Broadcast to room - MANDATORY for UI reflection
            io.to(roomId).emit('new_private_message', {
                ...fullMessage.toObject(),
                username: fullMessage.sender, // Ensure frontend consistency
                id: fullMessage._id
            });

            // Global individual notification
            io.to(`user_${recipient}`).emit('global_event', {
                type: 'NEW_MESSAGE',
                data: { from: message.username, text: message.text, roomId },
                timestamp: Date.now()
            });
        } catch (err) {
            console.error('Socket Message Error:', err);
            // Fallback broadcast in case DB failed but we want UI to feel responsive
            io.to(roomId).emit('new_private_message', {
                ...message,
                id: Date.now()
            });
        }
    });

    socket.on('start-direct-call', (data) => {
        const { username, name, type } = data;
        const sender = socketToUser.get(socket.id);
        
        if (!sender && username) {
            // Re-register if needed for this socket
            socket.emit('request_re-registration');
        }
        
        // Relay incoming call to recipient notification room if target exists
        if (username) {
            io.to(`user_${username}`).emit('incoming-call', {
                from: sender ? sender.username : 'Anonymous',
                name: sender ? sender.name : 'Anonymous',
                type: type || 'video'
            });
        }

        // MANDATORY: Also echo back to the initiator's specific socket to trigger the "Calling..." overlay
        socket.emit('start-direct-call', {
            username: username,
            name: name,
            type: type || 'video',
            isIncoming: false
        });
    });

    socket.on('end-call', (data) => {
        const { to } = data;
        socket.to(`user_${to}`).emit('call-ended');
    });

    // WebRTC Direct Call Signaling Relays
    socket.on('call-user', (data) => {
        const { userToCall, signalData, from, name, type } = data;
        io.to(`user_${userToCall}`).emit('call-user', {
            signal: signalData,
            from,
            name,
            type
        });
    });

    socket.on('answer-call', (data) => {
        const { signal, to } = data;
        io.to(`user_${to}`).emit('call-accepted', signal);
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

    // WebRTC Voice Signaling
    socket.on('voice-offer', (payload) => {
        const { to, offer, from } = payload;
        io.to(`user_${to}`).emit('voice-offer', { from, offer });
    });

    socket.on('voice-answer', (payload) => {
        const { to, answer, from } = payload;
        io.to(`user_${to}`).emit('voice-answer', { from, answer });
    });

    socket.on('ice-candidate', (payload) => {
        const { to, candidate, from } = payload;
        io.to(`user_${to}`).emit('ice-candidate', { from, candidate });
    });

    const voiceRooms = new Map(); // communityId -> Set(usernames)

    socket.on('join_voice', ({ communityId, username }) => {
        socket.join(`voice_${communityId}`);
        if (!voiceRooms.has(communityId)) voiceRooms.set(communityId, new Set());
        voiceRooms.get(communityId).add(username);
        
        io.to(`voice_${communityId}`).emit('voice_room_updated', {
            participants: Array.from(voiceRooms.get(communityId))
        });
        
        // Notify others to initiate connection
        socket.to(`voice_${communityId}`).emit('user-joined-voice', { username });
    });

    socket.on('leave_voice', ({ communityId, username }) => {
        socket.leave(`voice_${communityId}`);
        if (voiceRooms.has(communityId)) {
            voiceRooms.get(communityId).delete(username);
            io.to(`voice_${communityId}`).emit('voice_room_updated', {
                participants: Array.from(voiceRooms.get(communityId))
            });
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

    socket.on('join_community', async (communityId) => {
        socket.join(`community_${communityId}`);
        
        // Also join the ObjectId room if a numeric ID was provided (for E2E stability)
        if (!isNaN(parseInt(communityId)) && communityId.length < 10) {
            try {
                const community = await Community.findOne({ id: parseInt(communityId) });
                if (community) {
                    socket.join(`community_${community._id}`);
                    console.log(`User joined extra community room: community_${community._id}`);
                }
            } catch (err) { /* ignore */ }
        }
        console.log(`User joined community room: community_${communityId}`);
    });

    // --- VOICE ROOM EVENTS ---
    socket.on('join_voice', async ({ communityId, username }) => {
        try {
            const community = await Community.findById(communityId);
            if (!community) return;

            if (!community.voiceParticipants.includes(username)) {
                community.voiceParticipants.push(username);
                community.isLive = true;
                await community.save();
                
                io.to(`community_${communityId}`).emit('voice_room_updated', {
                    isLive: true,
                    participants: community.voiceParticipants
                });
            }
            socket.join(`voice_${communityId}`);
        } catch (err) {
            console.error("Join voice failed:", err);
        }
    });

    socket.on('leave_voice', async ({ communityId, username }) => {
        try {
            const community = await Community.findById(communityId);
            if (!community) return;

            community.voiceParticipants = community.voiceParticipants.filter(p => p !== username);
            if (community.voiceParticipants.length === 0) {
                community.isLive = false;
            }
            await community.save();

            io.to(`community_${communityId}`).emit('voice_room_updated', {
                isLive: community.isLive,
                participants: community.voiceParticipants
            });
            socket.leave(`voice_${communityId}`);
        } catch (err) {
            console.error("Leave voice failed:", err);
        }
    });

    socket.on('voice_signal', ({ communityId, signal, to, from }) => {
        // Relay signaling data to a specific user for WebRTC P2P
        io.to(`user_${to}`).emit('voice_signal', { signal, from });
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
    });
});

app.post('/api/profile/update-frame', async (req, res) => {
    const { username, frameType } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { username },
            { avatarFrame: frameType },
            { returnDocument: 'after' }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Broadcast update for real-time UI reflection
        io.emit('content_updated', { type: 'profile_update', username: user.username, avatarFrame: user.avatarFrame });
        
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/communities/:id/events', async (req, res) => {
    try {
        const community = await findCommunity(req.params.id);
        if (!community) return res.status(404).json({ error: 'Community not found' });
        
        const events = await Event.find({ communityId: community._id }).sort({ startTime: 1 });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/communities/:id/events', async (req, res) => {
    try {
        const { title, description, startTime, endTime, type, createdBy } = req.body;
        const community = await findCommunity(req.params.id);
        if (!community) return res.status(404).json({ error: 'Community not found' });
        
        const newEvent = await Event.create({
            communityId: community._id,
            title,
            description,
            startTime,
            endTime,
            type,
            createdBy
        });
        
        io.to(`community_${community._id}`).emit('content_updated', { type: 'event_created', data: newEvent });
        res.json(newEvent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/events/:id/rsvp', async (req, res) => {
    try {
        const { userId } = req.body;
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        
        const index = event.rsvps.indexOf(userId);
        if (index === -1) {
            event.rsvps.push(userId);
        } else {
            event.rsvps.splice(index, 1);
        }
        
        await event.save();
        io.to(`community_${event.communityId}`).emit('content_updated', { type: 'event_rsvp', eventId: event._id, rsvps: event.rsvps });
        res.json({ success: true, rsvps: event.rsvps });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/discovery/feed', async (req, res) => {
    const username = req.headers['x-user-username'];
    try {
        const feed = await DiscoveryService.getPersonalizedFeed(username);
        res.json(feed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- WEB3 & DECENTRALIZATION ---
app.post('/api/wallet/connect', async (req, res) => {
    const { username, walletAddress } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { username },
            { walletAddress },
            { returnDocument: 'after' }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, walletAddress: user.walletAddress });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/communities/:id/mint-pass', async (req, res) => {
    const { userId } = req.body;
    const { id } = req.params;
    try {
        const community = await findCommunity(id);
        if (!community) return res.status(404).json({ error: 'Community not found' });
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Simulation: Cost 500 VP
        if (user.balance < 500) return res.status(400).json({ error: 'Insufficient Vibe Points' });
        
        user.balance -= 500;
        const pass = await VibePass.create({
            userId,
            communityId: community._id,
            tokenId: `STRIDE-${Math.floor(Math.random() * 1000000)}`,
            metadata: {
                tier: 'Founder',
                mintedAt: new Date()
            }
        });
        
        await user.save();
        io.to(`user_${user.username}`).emit('wallet_updated', { balance: user.balance });
        
        res.json({ success: true, pass });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/communities/:id/stake', async (req, res) => {
    const { userId, trackId, amount } = req.body;
    const { id } = req.params;
    try {
        const community = await findCommunity(id);
        if (!community) return res.status(404).json({ error: 'Community not found' });
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

        user.balance -= amount;
        const stake = await Stake.create({
            userId,
            communityId: community._id,
            trackId,
            amount
        });

        await user.save();
        io.to(`user_${user.username}`).emit('wallet_updated', { balance: user.balance });
        
        // Boost track in real-time (simulation)
        io.to(`community_${community._id}`).emit('track_boosted', { trackId, boost: amount / 10 });
        
        res.json({ success: true, stake });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use((err, req, res, next) => {
    console.error("[Global Error Handler]:", err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Stride Backend running on port ${PORT}`);
});
