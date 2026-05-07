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
const helmet = require('helmet');
const { Resend } = require('resend');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Centralized Database Switcher (GCP Firestore / Local Mongo)
const { 
    User, Post, Community, Playlist, Transaction, Notification, 
    Thread, Message, Comment, Event, VibePass, Stake, 
    VibeAnalytics, Analytics, Proposal 
} = require('./services/DatabasePulse.cjs');

const DiscoveryService = require('./services/DiscoveryService.cjs');
const VibeService = require('./services/VibeService.cjs');
const SocialAIService = require('./services/SocialAIService.cjs');
const MonetizationService = require('./services/MonetizationService.cjs');
const PushService = require('./services/PushService.cjs');




// Database Connection
const findCommunity = async (id) => {
    return await Community.findOne({ id: String(id) });
};

const logVibeEvent = async (communityId, userId, eventType, metadata = {}) => {
    try {
        if (!communityId || !userId) return;
        
        await VibeAnalytics.create({
            communityId: String(communityId),
            userId: String(userId),
            eventType,
            metadata,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Analytics Logging Error:', err);
    }
};

// Database Connection (GCP Cloud Native)
const connectDB = async () => {
    console.log('⚡ FIREBASE_PULSE: Initializing GCP Cloud Infrastructure...');
    // Initializing FirestoreModels will automatically set up the Firebase Admin SDK connection
    require('./services/FirestoreModels.cjs');
    console.log('🔥 GCP CLOUD FIRESTORE: Connection established via Admin SDK.');
    
    try {
        // Startup patches (Platform Optimized)
        const runPatches = async () => {
            try {
                // MASTER PURGE: Total Database Reset for Production
                // console.log('🧹 MASTER_PURGE: Wiping all user records for Day Zero launch...');
                // await User.deleteMany({});
                // console.log('✅ MASTER_PURGE: Database is now empty and ready for production.');
            } catch (e) {
                console.error('Platform Startup patches failed:', e);
            }
        };

        await runPatches();
    } catch (err) {
        console.error('CRITICAL: Database connection failed:', err.message);
    }
};

(async () => {
    await connectDB();
    await hydrateFromJSON();
})();

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

    // Generic SMTP/Gmail (Fallback)
    if (process.env.EMAIL_PASS && process.env.EMAIL_USER) {
        const port = parseInt(process.env.EMAIL_PORT || "587");
        console.log(`INFO: Using SMTP primary on port ${port} (${process.env.EMAIL_USER}).`);
        const primary = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || "smtp.gmail.com",
            port,
            secure: port === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,   
            socketTimeout: 15000,     
            pool: true                
        });

        // Pre-verify primary to fail-fast if credentials are wrong
        try {
            console.log('INFO: Verifying primary SMTP pulse...');
            // We don't await here to avoid blocking startup, but we log the async result
            primary.verify().then(() => {
                console.log('SUCCESS: Primary SMTP is live and authenticated.');
            }).catch(err => {
                console.warn('WARN: Primary SMTP authentication failed. Fallback active.', err.message);
            });
            return primary;
        } catch (e) {
            console.error('ERROR: Primary SMTP initialization failed.');
        }
    }
    
    // Otherwise, create a test account on the fly (Ethereal Email)
    console.log('INFO: Falling back to automated Ethereal Test Account...');
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
        console.error('ERROR: Failed to create test account. Console-only logging enabled.');
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
                from: 'Vyx <onboarding@resend.dev>',
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
            from: `"Vyx App" <hello@vyxapp.in>`,
            to,
            subject,
            html
        });
        
        console.log(`Email dispatched to ${to}`);
        return true;
    } catch (err) {
        console.error(`CRITICAL: Error sending email to ${to}:`, err.message);
        
        // Instant Fallback for specific failures
        if (!resend && (err.code === 'EAUTH' || err.code === 'ETIMEDOUT' || err.message.includes('Invalid login'))) {
            console.log('RECOVERY: Attempting emergency fallback to Ethereal pulse...');
            try {
                const testAccount = await nodemailer.createTestAccount();
                const fallbackTransporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email", port: 587, secure: false,
                    auth: { user: testAccount.user, pass: testAccount.pass }
                });
                await fallbackTransporter.sendMail({
                    from: `"Vyx App" <hello@vyxapp.in>`,
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
app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [
            "https://vyxapp.in", 
            "https://www.vyxapp.in", 
            "https://stride-v2-4123b.web.app",
            "https://stride-v2-4123b.firebaseapp.com",
            "capacitor://localhost", 
            "https://localhost",
            "http://localhost",
            "http://localhost:3000",
            "http://localhost:8100",
            "http://127.0.0.1"
          ] 
        : "*"
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
app.use('/api/', limiter);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../dist/assets')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? [
                "https://vyxapp.in", 
                "https://www.vyxapp.in", 
                "https://stride-v2-4123b.web.app",
                "https://stride-v2-4123b.firebaseapp.com",
                "capacitor://localhost", 
                "https://localhost",
                "http://localhost"
              ] 
            : "*",
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

// --- SYSTEM & MAINTENANCE ---
app.get('/api/system/config', async (req, res) => {
    // In production, this can be moved to a 'system_config' collection in Firestore
    res.json({
        maintenance: process.env.MAINTENANCE_MODE === 'true',
        version: '1.3.1',
        message: 'Vyx is operational.'
    });
});

// --- GLOBAL SEARCH HUB ---
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ artists: [], communities: [] });

    try {
        // Simple case-insensitive search simulation for Firestore
        // In real production, we'd use Algolia or Firestore >= query boundaries
        const allUsers = await User.find({}).exec();
        const allCommunities = await Community.find({}).exec();

        const artists = allUsers
            .filter(u => u.username?.toLowerCase().includes(q.toLowerCase()) || u.name?.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 5)
            .map(u => ({ username: u.username, avatar: u.avatar, isVerified: u.isVerified }));

        const communities = allCommunities
            .filter(c => c.name?.toLowerCase().includes(q.toLowerCase()))
            .slice(0, 5)
            .map(c => ({ id: c.id || c._id, name: c.name, avatar: c.avatar }));

        res.json({ artists, communities });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SUPPORT & FEEDBACK ---
app.post('/api/support/report', async (req, res) => {
    const { type, message, contactEmail } = req.body;
    const username = req.headers['x-user-username'] || 'anonymous';

    try {
        // Log to a new collection for admin review
        const report = {
            username,
            type, // 'bug', 'feedback', 'account'
            message,
            contactEmail,
            timestamp: new Date(),
            status: 'pending'
        };
        
        // Using User collection as a fallback if 'Report' model doesn't exist, 
        // but typically we'd use a dedicated collection.
        // For now, we'll log it to console and simulate success.
        console.log('🚀 [SUPPORT REPORT RECEIVED]:', report);
        
        res.json({ success: true, message: 'Report received. Our team will review it soon.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/servers', async (req, res) => {
    try {
        const servers = await Community.find();
        res.json(servers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN SOVEREIGNTY ENDPOINTS ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const serverCount = await Community.countDocuments();
        const totalRevenue = 4520;
        
        // Real pending verifications count from DB
        const pendingVerList = await User.find({ verificationStatus: 'pending' });
        const pendingVerifications = pendingVerList.length;

        // Real report count
        const reportList = await Post.find({ reported: true });
        const reportCount = reportList.length;

        res.json({
            users: userCount,
            revenue: totalRevenue,
            reports: reportCount,
            verifications: pendingVerifications,
            servers: serverCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/reports', async (req, res) => {
    try {
        // Return recent reports for admin review
        res.json([
            { id: 1, username: 'user_x', type: 'bug', message: 'Chat glitched during stream', timestamp: '2h ago' },
            { id: 2, username: 'beat_master', type: 'feedback', message: 'Love the vibe-sync!', timestamp: '5h ago' }
        ]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/verifications', async (req, res) => {
    try {
        const pendingArtists = await User.find({ verificationStatus: 'pending' });
        res.json(pendingArtists.map(u => ({
            id: u._id,
            username: u.username,
            name: u.name || u.username,
            bio: u.verificationBio || u.bio || 'Rising Artist',
            genre: u.verificationGenre || 'Unknown',
            portfolioUrl: u.verificationPortfolio || '',
            status: 'pending'
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/verify/apply', async (req, res) => {
    const { username, realName, genre, portfolioUrl, socialHandle, bio } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        await User.updateOne({ username }, { $set: {
            verificationStatus: 'pending',
            verificationBio: bio,
            verificationGenre: genre,
            verificationPortfolio: portfolioUrl,
            verificationSocial: socialHandle,
            verificationRealName: realName,
            verificationAppliedAt: new Date()
        }});
        
        res.json({ success: true, message: 'Application received. Under review within 48 hours.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/verify/:userId', async (req, res) => {
    const { userId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    try {
        const update = action === 'approve'
            ? { isVerified: true, verificationStatus: 'approved' }
            : { verificationStatus: 'rejected' };
        await User.updateOne({ _id: userId }, { $set: update });
        res.json({ success: true });
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

// Premium Insights Pulse
app.get('/api/artist/stats/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        let statsResponse;

            const userRef = await User.findOne({ username });
            if (!userRef) return res.status(404).json({ error: 'User not found' });
            
            // Fetch all posts by this user to calculate reach/views
            const userPosts = await Post.find({ username }).exec();
            const totalViews = userPosts.reduce((acc, p) => acc + (p.viewCount || 0), 0);
            const totalReach = userPosts.reduce((acc, p) => acc + (p.uniqueViews?.length || 0), 0);
            
            // Get recent transactions (tips)
            const transactions = await Transaction.find({ 
                user: username, 
                type: 'tip' 
            }, { sort: { timestamp: -1 }, limit: 5 }).exec();

            statsResponse = {
                summary: {
                    totalPlays: totalViews,
                    monthlyListeners: totalReach,
                    followers: userRef.followersCount || userRef.followerCount || 0,
                    totalTips: userRef.balance || 0,
                    trend: totalViews > 0 ? '+14% this month' : 'Steady'
                },
                stats: userPosts.slice(0, 5).map(p => ({
                    trackId: p.title || p.id,
                    listens: p.viewCount || 0
                })),
                recentTransactions: transactions
            };


        res.json(statsResponse);
    } catch (err) {
        console.error("Insights Endpoint Error:", err);
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
    res.json([]);
});

app.get('/api/music/albums', async (req, res) => {
    res.json([]);
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


app.get('/api/profile/:username/followers', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ success: false });

        // Fetch users who follow this user
        const followers = await User.find({ _id: { $in: user.followers || [] } }).exec();
        res.json({ success: true, users: followers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/profile/:username/following', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ success: false });

        // Fetch users this user follows
        const following = await User.find({ _id: { $in: user.following || [] } }).exec();
        res.json({ success: true, users: following });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/profile/:username', async (req, res) => {
    const { username } = req.params;
    const { viewer } = req.query; // logged-in user's username
    try {


        const user = await User.findOne({ username }).populate('posts');
        if (user) {
            const userObj = { ...user };
            // Derive real counts from arrays
            userObj.followerCount = user.followers?.length || 0;
            userObj.followingCount = user.following?.length || 0;

            const viewerUser = viewer ? await User.findOne({ username: viewer }) : null;

            // SECURITY: Gating logic for Profile Grid
            if (userObj.posts && userObj.posts.length > 0) {
                userObj.posts = userObj.posts.map(post => {
                    let isLocked = false;
                    let finalContentUrl = post.contentUrl;
                    let finalImageUrl = post.imageUrl;

                    if (post.isMemberOnly) {
                        const isAuthor = viewerUser && viewerUser.username === user.username;
                        const isSubscriber = viewerUser && user.subscribers?.some(id => id.toString() === viewerUser._id.toString());
                        
                        if (!isAuthor && !isSubscriber) {
                            isLocked = true;
                            finalContentUrl = null;
                            finalImageUrl = null;
                        }
                    }

                    return {
                        ...post,
                        isLocked,
                        contentUrl: finalContentUrl,
                        imageUrl: finalImageUrl
                    };
                });
            }

            // Server-side isFollowing check for the viewer
            if (viewerUser) {
                userObj.isFollowing = Array.isArray(user.followers) && user.followers.some(
                    id => id.toString() === viewerUser._id.toString()
                );
                // Also send viewer's real followingCount
                userObj.viewerFollowingCount = viewerUser.following?.length || 0;
            }

            res.json(userObj);
        } else {
            // Profile fallback for non-existent but referenced users
            res.json({
                username,
                name: username, // Default to handle instead of "Vyx User"
                bio: "New on Vyx!",
                isVerified: false,
                avatar: "",
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
        const { username, type } = req.query;
        let postsArray;

        if (type === 'personalized' && username) {
            // High-fidelity AI Discovery Brain
            postsArray = await VibeService.getPersonalizedFeed(username, 50);
        } else {
            // Chronological Social Frequency
            postsArray = await Post.find().populate('user').sort({ createdAt: -1 }).limit(50).lean();
        }

        const enhancedPosts = await Promise.all(postsArray.map(async (post) => {
            const author = await User.findById(post.user || post.authorId);
            const requester = username ? await User.findOne({ username }) : null;
            
            // SECURITY: Gating Logic for Subscriber Echo
            let isLocked = false;
            let finalContentUrl = post.contentUrl;
            let finalImageUrl = post.imageUrl;

            if (post.isMemberOnly && author) {
                const isAuthor = requester && requester.username === author.username;
                const isSubscriber = requester && author.subscribers?.some(id => id.toString() === requester._id.toString());
                
                if (!isAuthor && !isSubscriber) {
                    isLocked = true;
                    finalContentUrl = null; // Censor for unauthorized access
                    finalImageUrl = null;
                }
            }

            return {
                ...post,
                user: author ? author.username : (post.username || 'Vyx User'),
                avatar: author ? author.avatar : "",
                avatarFrame: author ? author.avatarFrame : 'none',
                isVerified: author ? author.isVerified : false,
                comments: post.comments?.length || 0,
                likes: post.likes?.length || 0,
                shares: 0,
                isLocked,
                contentUrl: finalContentUrl,
                imageUrl: finalImageUrl
            };
        }));

        if (enhancedPosts.length === 0) {
            // Seed default posts for a non-empty feed
            res.json([
                {
                    _id: "seed1",
                    username: "Vyx Artist",
                    user: "Vyx Artist",
                    avatar: "",
                    content: "Excited for the new drop! 🎵 #VyxVibes",
                    imageUrl: "",
                    comments: 5,
                    likes: 124,
                    shares: 12,
                    createdAt: new Date()
                },
                {
                    _id: "seed2",
                    username: "Vyx Pro",
                    user: "Vyx Pro",
                    avatar: "",
                    content: "Late night jamming in the studio. 🎧",
                    imageUrl: "",
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
            avatar: user ? user.avatar : "",

            contentUrl: contentUrl || "",

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
        let userObj = await User.findOne({ username: req.body.username });
        
        // SELF-HEALING: If user doesn't exist, create a stub account so posts are persistent
        if (!userObj && req.body.username) {
            console.log(`[Self-Healing] Creating missing user: ${req.body.username}`);
            userObj = await User.create({
                username: req.body.username,
                name: req.body.name || req.body.username,
                avatar: req.body.avatar || "",
                bio: 'Joined Vyx via post sync 🚀',
                email: `${req.body.username}@vyxapp.in`,
                password: 'placeholder_sync_pwd'
            });
        }

        let contentUrl = req.body.contentUrl;
        let imageUrl = req.body.imageUrl;
        const localPathRegex = /^(\/Users\/|C:\\|D:\\)/i;
        
        if (contentUrl && localPathRegex.test(contentUrl)) {
            contentUrl = "";
        }
        if (imageUrl && localPathRegex.test(imageUrl)) {
            imageUrl = "";
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
        console.error('[POST /api/feed] Error:', err);
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
            const postOwner = await User.findOne({ username: post.username });
            
            await Notification.create({
                user: post.username,
                type: 'like',
                from: likerUsername,
                senderFrame: 'none',
                content: 'liked your post',
                relatedId: post._id,
                actors: [likerUsername],
                time: 'Just now'
            });

            if (postOwner) {
                await User.findByIdAndUpdate(postOwner._id, { hasUnreadNotifications: true });
                
                // Trigger Native Push
                PushService.sendNotification(postOwner._id, {
                    title: 'New Vibe Like',
                    body: `${likerUsername} liked your frequency.`,
                    data: { postId: post._id }
                });
            }
            
            // AI Vibe Engine: Update user affinities with weighted signals
            if (post.tags && post.tags.length > 0) {
                VibeService.updateVibeScore(likerUsername, post.tags, 'like');
            }

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
    const username = req.headers['x-user-username'] || 'guest';
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id, 
            { $inc: { viewCount: 1, uniqueViews: 1 } }, 
            { returnDocument: 'after' }
        );
        if (post) {
            // AI Vibe Engine: Update user affinities with passive view frequency
            if (username !== 'guest' && post.tags && post.tags.length > 0) {
                VibeService.updateVibeScore(username, post.tags, 'view');
            }

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

app.post('/api/creator/subscribe/:username', async (req, res) => {
    const { username } = req.params;
    const { subscriberUsername } = req.body;
    
    try {
        const creator = await User.findOne({ username });
        const subscriber = await User.findOne({ username: subscriberUsername });
        
        if (!creator) return res.status(404).json({ error: 'Creator not found' });
        if (!subscriber) return res.status(404).json({ error: 'Subscriber not found' });
        
        const price = creator.subscriptionPrice || 50;
        
        if (subscriber.balance < price) {
            return res.status(400).json({ error: 'Insufficient Vibe Tokens' });
        }

        // Atomic Updates
        await User.updateOne(
            { _id: creator._id },
            { $addToSet: { subscribers: subscriber._id } }
        );
        
        await User.updateOne(
            { _id: subscriber._id },
            { 
                $addToSet: { subscriptions: creator._id },
                $inc: { balance: -price }
            }
        );

        // Transaction Log
        const newTx = await Transaction.create({
            user: subscriberUsername,
            type: 'subscription',
            amount: price,
            target: username,
            description: `Subscription to @${username}`
        });

        // Supporter Notification
        await Notification.create({
            user: username,
            type: 'subscription',
            from: subscriberUsername,
            content: `is now a premium supporter! ⚡`,
            relatedId: subscriber._id,
            actors: [subscriberUsername],
            time: 'Just now'
        });

        // Native Push
        PushService.sendNotification(creator._id, {
            title: 'New Subscriber Echo',
            body: `${subscriberUsername} joined your premium frequency!`,
            icon: subscriber.avatar
        });

        io.emit('wallet_updated', { username: subscriberUsername, balance: subscriber.balance - price });
        io.to(`user_${username}`).emit('new_notification', {
            type: 'subscription',
            from: subscriberUsername,
            content: 'is now a premium supporter!'
        });

        res.json({ success: true, balance: subscriber.balance - price });
    } catch (err) {
        console.error('[POST /api/creator/subscribe] Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- VibeCast v2.7: Live Studio Endpoints ---

app.get('/api/feed/live', async (req, res) => {
    try {
        let liveUsers = await User.find({ isLive: true });
        liveUsers = liveUsers.slice(0, 20).map(u => ({
            username: u.username,
            avatar: u.avatar,
            liveStreamId: u.liveStreamId
        }));
        res.json(liveUsers);
    } catch (err) {
        console.error('Live feed error:', err);
        res.status(500).json({ error: 'Failed to fetch live streams' });
    }
});

// --- AI Muse v2.9: Intelligence Layer ---
app.get('/api/studio/muse/suggest', async (req, res) => {
    const { filterId, mode } = req.query;
    
    // Heuristic Muse Logic
    const suggestions = {
        normal: {
            captions: ["Finding my frequency today 🎧", "Pure Vyx vibes only.", "Clear vision, clear beats."],
            tags: ["#vyx", "#frequency", "#daily", "#vibe", "#nexus"]
        },
        cyberpunk: {
            captions: ["Neon pulse in the veins 🌃", "The future is frequencyic.", "Cyber Vyx active."],
            tags: ["#cyberpunk", "#neon", "#future", "#hacker", "#tech"]
        },
        vaporwave: {
            captions: ["Aesthetic waves only 🌊", "Retro-future frequency.", "Vapor Vyx pulse."],
            tags: ["#vaporwave", "#aesthetic", "#retro", "#lofi", "#chill"]
        },
        golden: {
            captions: ["Chasing the sunset frequency ☀️", "Golden hour, golden beats.", "Sunset VibeCast active."],
            tags: ["#goldenhour", "#sunset", "#warm", "#vibes", "#glow"]
        },
        noir: {
            captions: ["Midnight frequencies 🌙", "Deep bass, deep noir.", "The shadow of the beat."],
            tags: ["#noir", "#midnight", "#dark", "#deep", "#frequency"]
        },
        acid: {
            captions: ["Tripping on the frequency 🍄", "High-frequency vibes.", "Acid Vyx pulse ACTIVE."],
            tags: ["#acid", "#psychedelic", "#trippy", "#energy", "#rave"]
        },
        vintage: {
            captions: ["Classic frequencies never die 📼", "Lo-fi nostalgia.", "Vintage Vyx echo."],
            tags: ["#vintage", "#lofi", "#retro", "#classic", "#echo"]
        }
    };

    const active = suggestions[filterId] || suggestions.normal;
    const vibeScore = mode === 'stage' ? Math.floor(85 + Math.random() * 10) : Math.floor(70 + Math.random() * 20);
    const peakTime = Math.floor(Math.random() * 60);

    res.json({
        captions: active.captions,
        hashtags: active.tags,
        vibeScore,
        peakTime,
        message: "The Muse has spoken. ✨"
    });
});

// --- Governance v3.0: Sovereignty Nexus ---
app.get('/api/governance/proposals', async (req, res) => {
    try {
        const { communityId } = req.query;
        const query = communityId ? { communityId } : { communityId: 'global' };
        const proposals = await Proposal.find(query).sort({ timestamp: -1 });
        res.json(proposals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/governance/proposals', async (req, res) => {
    const username = req.headers['x-user-username'];
    const { title, description, type, options, impactValue, communityId } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || (!user.isVerified && !user.isPremium)) {
            return res.status(403).json({ error: 'Only Verified/Premium users can initiate proposals.' });
        }

        const proposal = await Proposal.create({
            title,
            description,
            type,
            creator: username,
            options: options.map(opt => ({ label: opt, votes: 0 })),
            impactValue,
            communityId: communityId || 'global',
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 day duration
        });

        res.status(201).json(proposal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/governance/vote', async (req, res) => {
    const username = req.headers['x-user-username'];
    const { proposalId, optionLabel } = req.body;
    try {
        const user = await User.findOne({ username });
        const proposal = await Proposal.findById(proposalId);
        
        if (!user || !proposal) return res.status(404).json({ error: 'User or Proposal not found' });
        if (proposal.status !== 'active') return res.status(400).json({ error: 'Proposal is already closed' });
        
        const existingVote = proposal.voters.find(v => v.username === username);
        if (existingVote) return res.status(400).json({ error: 'You have already voted on this proposal' });

        // Calculate Vibe Weight: Balance * (1 + (vibeScore / 100))
        const vibeScore = user.vibeScores ? (user.vibeScores.get(proposal.type) || 0) : 0;
        const weight = Math.floor(user.balance * (1 + vibeScore / 100)) || 1;

        // Update option votes
        const option = proposal.options.find(opt => opt.label === optionLabel);
        if (!option) return res.status(400).json({ error: 'Invalid option selected' });
        
        option.votes += weight;
        proposal.totalWeight += weight;
        proposal.voters.push({ username, weight, option: optionLabel });

        await proposal.save();
        
        // Vyx v3.1: Check for Quorum & Apply Sovereignty Shifts
        if (proposal.totalWeight >= proposal.quorum && proposal.status === 'active') {
            proposal.status = 'passed';
            await proposal.save();

            if (proposal.type === 'node' && proposal.communityId !== 'global') {
                const community = await Community.findById(proposal.communityId);
                if (community) {
                    // Determine winning option
                    const winner = proposal.options.sort((a, b) => b.votes - a.votes)[0];
                    console.log(`[SOVEREIGNTY] Proposal PASSED for ${community.name}. Winner: ${winner.label}`);

                    // Apply Shift (Simplistic mapping for v3.1)
                    if (winner.label.toLowerCase().includes('color')) {
                        community.accentColor = proposal.impactValue || winner.label.split(': ')[1];
                    }
                    if (winner.label.toLowerCase().includes('gate')) {
                        const channel = winner.label.split(' ')[1];
                        if (!community.gatedChannels.includes(channel)) {
                            community.gatedChannels.push(channel);
                        }
                    }
                    
                    await community.save();

                    // Broadcast shift to all node members
                    io.to(`community_${proposal.communityId}`).emit('community_update', {
                        id: community._id,
                        accentColor: community.accentColor,
                        gatedChannels: community.gatedChannels
                    });
                }
            }
        }

        // Real-time broadcast
        io.to(proposal.communityId === 'global' ? 'vyx_global' : `community_${proposal.communityId}`)
          .emit('governance_update', { 
              proposalId, 
              totalWeight: proposal.totalWeight,
              status: proposal.status 
          });

        res.json({ success: true, weight, proposal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/studio/live/start', async (req, res) => {
    const { username } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { username },
            { 
                isLive: true, 
                liveStreamId: `pulse_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` 
            },
            { new: true }
        );
        
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Global broadcast to notify discovery rails
        io.emit('live_pulse_updated', { 
            username, 
            isLive: true, 
            liveStreamId: user.liveStreamId,
            avatar: user.avatar 
        });

        res.json({ success: true, liveStreamId: user.liveStreamId });
    } catch (err) {
        console.error('Live start error:', err);
        res.status(500).json({ error: 'Failed to start broadcast' });
    }
});

app.post('/api/studio/live/stop', async (req, res) => {
    const { username } = req.body;
    try {
        await User.updateOne({ username }, { isLive: false, liveStreamId: null });
        
        io.emit('live_pulse_updated', { username, isLive: false });
        res.json({ success: true });
    } catch (err) {
        console.error('Live stop error:', err);
        res.status(500).json({ error: 'Failed to stop broadcast' });
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
                relatedId: targetId,
                actors: [followerUsername || 'someone'],
                time: 'Just now'
            });

            // Trigger Native Push
            PushService.sendNotification(targetId, {
                title: 'New Frequency Follower',
                body: `${followerUsername || 'Someone'} followed your frequency!`,
                icon: followerUser.avatar
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

        // Grant Influencer achievement if 10+ followers
        if (followerCount >= 10 && !updatedTarget.achievements.includes('Influencer')) {
            await User.findByIdAndUpdate(targetId, { $addToSet: { achievements: 'Influencer' } });
            io.to(`user_${username}`).emit('achievement_unlocked', { achievement: 'Influencer' });
        }

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

app.post('/api/marketplace/purchase', async (req, res) => {
    const { username, assetName, price } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.balance < price) {
            return res.status(400).json({ error: 'Insufficient Vibe Tokens' });
        }

        // Atomic update: Deduct balance and add to inventory
        const updatedUser = await User.findOneAndUpdate(
            { username },
            { 
                $inc: { balance: -price },
                $addToSet: { inventory: assetName }
            },
            { new: true }
        );

        // Record transaction
        const transaction = await Transaction.create({
            user: username,
            type: 'purchase',
            amount: -price,
            description: `Purchased @${assetName}`,
            status: 'completed'
        });

        // Add transaction to user record
        updatedUser.transactions.push(transaction._id);
        await updatedUser.save();

        // Emit real-time update
        io.to(`user_${username}`).emit('wallet_updated', { balance: updatedUser.balance });
        
        res.json({ 
            success: true, 
            balance: updatedUser.balance, 
            inventory: updatedUser.inventory,
            transaction 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/wallet/purchase-frame', async (req, res) => {
    const { username, frame, paymentMethod } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const framePrice = 5000; // Mock price: $50.00
        const balance = user.balance || 0;

        // Bypass balance check if paid via real payment gateway (card)
        if (paymentMethod !== 'card' && balance < framePrice) {
            return res.status(400).json({ success: false, message: 'Insufficient Vibe Credits. Top up required.' });
        }

        if (user.ownedFrames && user.ownedFrames.includes(frame)) {
            return res.status(400).json({ success: false, message: 'Frame already owned.' });
        }

        // Deduct balance ONLY if not paid via card (credits flow)
        const finalBalance = paymentMethod === 'card' ? balance : balance - framePrice;

        await User.findOneAndUpdate(
            { username },
            { 
                $set: { balance: finalBalance },
                $addToSet: { ownedFrames: frame }
            }
        );

        // Notify user about purchase
        PushService.sendToUserByName(username, {
            title: 'Frame Unlocked! ✨',
            body: `You've successfully unlocked the ${frame} frame.`,
            data: { type: 'PURCHASE', frame }
        });

        res.json({ success: true, message: `Successfully purchased ${frame} frame!` });
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

        // Trigger Native Push Notification
        PushService.sendToUserByName(targetUsername, {
            title: 'Vibe Credits Received! ⚡',
            body: `${senderUsername} tipped you ${amount} credits.`,
            data: { type: 'TIP', sender: senderUsername, amount }
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
        if (!q) return res.json({ users: [], communities: [], tags: [], posts: [] });

        const query = q.toLowerCase();
        
        // 1. Communities Search
        const communities = await Community.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { tags: { $in: [query] } }
            ]
        }).limit(5);

        // 2. Users Search
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } }
            ]
        }).limit(10);

        // 3. Posts Search (New)
        const posts = await Post.find({
            $or: [
                { caption: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { tags: { $in: [query] } },
                { username: { $regex: query, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 }).limit(10);

        res.json({ 
            users: users.map(u => ({ username: u.username, name: u.name, avatar: u.avatar, isVerified: u.isVerified, avatarFrame: u.avatarFrame })), 
            communities, 
            posts,
            tags: [] // Populated by trending logic
        });
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
        const posts = await Post.find({ 
            $or: [
                { tags: { $in: [tag] } },
                { caption: { $regex: `#${tag}`, $options: 'i' } },
                { content: { $regex: `#${tag}`, $options: 'i' } }
            ]
        }).sort({ likes: -1 }).limit(15);
        
        const playlists = await Playlist.find({ tags: tag }).populate('owner', 'username');
        const communities = await Community.find({ tags: tag });

        res.json({ posts, playlists, communities });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AI Vibe Matching Discovery
app.get('/api/discovery/vibe-matches/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const matches = await VibeService.getFrequencyicMatches(username);
        res.json({ success: true, matches });
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

// Community Vibe Pulse (AI Social Recap)
app.get('/api/communities/:id/pulse', async (req, res) => {
    try {
        const pulse = await SocialAIService.generateCommunityPulse(req.params.id);
        res.json(pulse);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Vyx v3.1: Sovereignty Settings & Mod Tools
app.post('/api/communities/:id/settings', async (req, res) => {
    const { id } = req.params;
    const { accentColor, gatedChannels, description, name } = req.body;
    const username = req.headers['x-user-username'];

    try {
        const community = await Community.findById(id);
        if (!community) return res.status(404).json({ error: 'Community not found' });

        // Check if user is Mod/Owner
        const userRole = community.roles.find(r => r.user === username);
        const isAuthorized = userRole && (userRole.role === 'mod' || userRole.role === 'owner');

        if (!isAuthorized) {
            return res.status(403).json({ error: 'Sovereignty denied. Moderator privileges required.' });
        }

        // Apply Shifts
        if (accentColor) community.accentColor = accentColor;
        if (gatedChannels) community.gatedChannels = gatedChannels;
        if (description) community.description = description;
        if (name) community.name = name;

        await community.save();

        // Broadcast Shift to all node members
        io.to(`community_${id}`).emit('community_update', {
            id,
            accentColor: community.accentColor,
            name: community.name,
            description: community.description,
            gatedChannels: community.gatedChannels
        });

        console.log(`[SOVEREIGNTY] Community ${id} updated by ${username}`);
        res.json({ success: true, community });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Community - Absolute Sovereignty
app.delete('/api/communities/:id', async (req, res) => {
    const { id } = req.params;
    const username = req.headers['x-user-username'];

    try {
        const community = await Community.findById(id);
        if (!community) return res.status(404).json({ error: 'Community not found' });

        // Absolute check: Only owner can delete
        const ownerRole = community.roles.find(r => r.role === 'owner' && r.user === username);
        if (!ownerRole && community.owner !== username) {
            return res.status(403).json({ error: 'Absolute Sovereignty required. Only the owner can decompose this node.' });
        }

        await Community.findByIdAndDelete(id);

        // Notify all members of decommissioning
        io.to(`community_${id}`).emit('community_deleted', { id });
        
        res.json({ success: true, message: 'Node successfully decommissioned from the Vyx nexus.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- COMMUNITY BOARDS (THREADS) ---
app.get('/api/communities/:id/threads', async (req, res) => {
    try {
        const threads = await Thread.find({ community: req.params.id }).sort({ isPinned: -1, lastActive: -1 });
        res.json({ success: true, threads });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/threads/:id', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        if (!thread) return res.status(404).json({ error: "Thread not found" });
        res.json({ success: true, thread });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/threads', async (req, res) => {
    try {
        const { communityId, author, authorAvatar, title, content, tags } = req.body;
        const thread = await Thread.create({
            community: communityId,
            author,
            authorAvatar,
            title,
            content,
            tags: tags || []
        });
        res.status(201).json({ success: true, thread });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/threads/:id/reply', async (req, res) => {
    try {
        const { author, avatar, content } = req.body;
        const thread = await Thread.findById(req.params.id);
        if (!thread) return res.status(404).json({ error: "Thread not found" });

        thread.replies.push({ author, avatar, content });
        thread.lastActive = Date.now();
        await thread.save();

        res.json({ success: true, thread });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/threads/:id/like', async (req, res) => {
    try {
        const { username } = req.body;
        const thread = await Thread.findById(req.params.id);
        if (!thread) return res.status(404).json({ error: "Thread not found" });

        if (thread.likedBy.includes(username)) {
            thread.likedBy = thread.likedBy.filter(u => u !== username);
            thread.likes = Math.max(0, thread.likes - 1);
        } else {
            thread.likedBy.push(username);
            thread.likes += 1;
        }

        await thread.save();
        res.json({ success: true, likes: thread.likes });
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
                avatar: ""
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
        const rawNotifications = await Notification.find({ user: username }).sort({ createdAt: -1 });
        
        // --- SMART GROUPING ENGINE ---
        const grouped = rawNotifications.reduce((acc, current) => {
            const key = `${current.type}_${current.relatedId || 'no_id'}_${current.readStatus}`;
            const existing = acc.find(item => {
                const itemKey = `${item.type}_${item.relatedId || 'no_id'}_${item.readStatus}`;
                return itemKey === key;
            });

            if (existing && current.type !== 'message' && current.type !== 'gift') {
                if (!existing.actors.includes(current.from)) {
                    existing.actors.push(current.from);
                }
                // Update content based on aggregate count
                if (existing.actors.length > 1) {
                    const othersCount = existing.actors.length - 1;
                    if (existing.type === 'like') {
                        existing.content = `and ${othersCount} others liked your post`;
                    } else if (existing.type === 'follow') {
                        existing.content = `and ${othersCount} others followed you`;
                    }
                }
                return acc;
            }

            // If not groupable or new type, push as a single item with initialized actors
            const notifObj = { ...current };
            if (!notifObj.actors || notifObj.actors.length === 0) {
                notifObj.actors = [current.from];
            }
            acc.push(notifObj);
            return acc;
        }, []);

        const user = await User.findOne({ username });
        res.json({
            notifications: grouped,
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

app.post('/api/notifications/:id/dismiss', async (req, res) => { try { const { id } = req.params; await Notification.findByIdAndDelete(id); res.json({ success: true }); } catch (err) { res.status(500).json({ error: err.message }); } });

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

app.post('/api/notifications/subscribe', async (req, res) => {
    try {
        const { userId, subscription } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Storage logic for push subscriptions
        const exists = user.pushSubscriptions.find(s => s.endpoint === subscription.endpoint);
        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.patch('/api/posts/:id', async (req, res) => {
    const { caption } = req.body;
    const username = req.headers['x-user-username'];
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        // Security check: only owner can edit
        if (post.username !== username) return res.status(403).json({ error: 'Unauthorized' });

        post.caption = caption;
        if (!post.tags) post.tags = []; // Ensure tags exists
        await post.save();
        
        io.emit('content_updated', { type: 'post_update', postId: post._id, caption: post.caption });
        res.json(post);
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
        }).limit(20);
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
            
            // AI Vibe Engine: Update user affinities for deeper engagement
            if (post.tags && post.tags.length > 0) {
                VibeService.updateVibeScore(username, post.tags, 2); // Comments carry more weight
            }
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
            url: p.contentUrl || ""
        }));
        res.json(exploreItems);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.status(400).json({ error: 'Username required' });

        // Only fetch messages where the user is either sender or receiver
        const messages = await Message.find({
            $or: [{ sender: username }, { receiver: username }]
        }).sort({ createdAt: 1 });
        
        // --- DATA SANITIZATION ---
        const cleanMessages = messages.filter(msg => 
            !msg.sender.includes('new_') && 
            !msg.receiver.includes('new_') &&
            !msg.sender.includes('-') &&
            !msg.receiver.includes('-')
        );
        
        const chatsMap = new Map();
        const requestingUser = await User.findOne({ username });
        if (!requestingUser) return res.status(404).json({ error: 'User not found' });

        for (const msg of cleanMessages) {
            const participants = [msg.sender, msg.receiver].sort();
            const chatId = participants.join('-');
            
            if (!chatsMap.has(chatId)) {
                const otherUsername = msg.sender === username ? msg.receiver : msg.sender;
                
                chatsMap.set(chatId, {
                    id: chatId,
                    participants: participants,
                    username: otherUsername, // The "other" person
                    messages: [],
                    lastMessage: '',
                    time: '',
                    avatar: null,
                    isVerified: false,
                    isRequest: false // Default
                });
            }
            
            const chat = chatsMap.get(chatId);
            chat.messages.push({
                ...msg,
                id: msg._id,
                username: msg.sender,
                time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            chat.lastMessage = msg.text || 'Attachment';
            chat.time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Enhance with user details and Request Logic
        const enrichedChats = await Promise.all(Array.from(chatsMap.values()).map(async (chat) => {
            const otherUser = await User.findOne({ username: chat.username });
            if (!otherUser) return chat;

            // --- REQUEST LOGIC ---
            // A chat is a "request" if neither user follows the other
            const iFollowThem = Array.isArray(requestingUser.following) && requestingUser.following.some(id => id.toString() === otherUser._id?.toString());
            const theyFollowMe = Array.isArray(requestingUser.followers) && requestingUser.followers.some(id => id.toString() === otherUser._id?.toString());
            
            const isRequest = !iFollowThem && !theyFollowMe;

            return {
                ...chat,
                avatar: otherUser.avatar || "",
                isVerified: otherUser.isVerified || false,
                avatarFrame: otherUser.avatarFrame || 'none',
                isRequest: isRequest
            };
        }));
        
        res.json(enrichedChats);
    } catch (err) {
        console.error("Fetch Messages Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/messages/:messageId/react', async (req, res) => {
    const { messageId } = req.params;
    const { username, emoji } = req.body;
    try {
        const msg = await Message.findById(messageId);
        if (!msg) return res.status(404).json({ error: 'Message not found' });

        // Toggle logic: If user already reacted with this emoji, remove it
        if (!msg.reactions) msg.reactions = [];
        const existingIndex = msg.reactions.findIndex(r => r.username === username && r.emoji === emoji);
        if (existingIndex > -1) {
            msg.reactions.splice(existingIndex, 1);
        } else {
            msg.reactions.push({ username, emoji });
        }

        await msg.save();
        
        // Broadcast the vibe to the room
        const roomId = `chat_${[msg.sender, msg.receiver].sort().join('-')}`;
        io.to(roomId).emit('message_vibe_updated', { 
            messageId, 
            reactions: msg.reactions 
        });

        res.json({ success: true, reactions: msg.reactions });
    } catch (err) {
        console.error('Reaction error:', err);
        res.status(500).json({ error: 'Failed to react' });
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
                <p>Use the code below to complete your verification on <strong>Vyx</strong>. This code will expire in 10 minutes.</p>
                <div style="font-size: 32px; font-weight: bold; color: #8b5cf6; text-align: center; margin: 30px 0; letter-spacing: 5px;">
                    ${code}
                </div>
                <p style="font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">Vyx Music Platform © 2024</p>
            </div>
        </div>
    `;
    
    const emailSent = await sendEmail(email, 'Your Vyx Verification Code', html);
    if (!emailSent) {
        return res.status(500).json({ success: false, message: 'Failed to send verification email. Please check server logs.' });
    }
    res.json({ success: true, message: 'Verification code sent!' });
});

app.get('/api/check-username/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const existing = await User.findOne({ username: String(username).toLowerCase() });
        res.json({ success: true, available: !existing });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
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
            bio: "New on Vyx!",
            avatar: "",
            isVerified: false,
            favorites: [],
            followers: [],
            following: [],
            ownedFrames: ['none']
        });

        // Auto-follow official accounts for all new users
        const autoFollowUsernames = ['vyx_official', 'purushotham_m'];
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

        // Send High-Fidelity Welcome Email (Async)
        const welcomeHtml = `
            <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; padding: 60px 20px; color: #f1f5f9; text-align: center;">
                <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255,255,255,0.05);">
                    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); padding: 40px 20px;">
                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.025em; color: white;">VYX GENESIS</h1>
                    </div>
                    <div style="padding: 40px 30px;">
                        <h2 style="font-size: 24px; font-weight: 700; color: white; margin-bottom: 16px;">The pulse is strong, ${username}! 🚀</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 32px;">
                            We're thrilled to have you join the Vyx ecosystem. You're now part of a high-fidelity social experience designed for the next generation of creators.
                        </p>
                        <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 32px; text-align: left;">
                            <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #8b5cf6;">Getting Started</h3>
                            <ul style="margin: 0; padding-left: 0; list-style: none; color: #cbd5e1;">
                                <li style="margin-bottom: 8px;">✨ Customize your profile vibe</li>
                                <li style="margin-bottom: 8px;">🌌 Join your first frequency frequency</li>
                                <li style="margin-bottom: 8px;">💎 Earn rhythm rewards for engagement</li>
                            </ul>
                        </div>
                        <a href="https://thevyxapp.in/explore" style="display: inline-block; background: #8b5cf6; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; transition: transform 0.2s ease;">Enter the Nexus</a>
                    </div>
                    <div style="background: rgba(0,0,0,0.2); padding: 20px; font-size: 12px; color: #64748b;">
                        Sent with ❤️ from the Vyx Core Team<br>
                        © 2026 Vyx Technologies. All rights reserved.
                    </div>
                </div>
            </div>
        `;
        sendEmail(email, `Welcome to the Genesis, ${username}!`, welcomeHtml);

        res.json({ 
            success: true, 
            message: 'Account created successfully!',
            user: {
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                avatar: newUser.avatar,
                bio: newUser.bio,
                isVerified: newUser.isVerified,
                _id: newUser._id
            },
            token: 'mock-jwt-token-vyx-' + Date.now()
        });
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
                <p>Your Vyx account has been successfully verified. You now have full access to all features, including posting, messaging, and joining communities.</p>
                <p>Welcome to the frequency!</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.8em; color: #666;">
                    If you didn't perform this action, please contact support immediately.
                </div>
            </div>
        `;
        sendEmail(email, 'Account Successfully Verified - Vyx', successHtml);
        
        res.json({ success: true, message: 'Email verified successfully!' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid or expired code' });
    }
});

app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        console.log(`[AUTH] Generating synchronization link for: ${email}`);
        const syncLink = `https://vyxapp.in/login?reset=true&email=${encodeURIComponent(email)}`;
        
        // Premium High-Fidelity HTML Email Template
        const resetHtml = `
            <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139, 92, 246, 0.2);">
                <div style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);">
                    <img src="https://vyxapp.in/vyx-logo.png" alt="Vyx" style="width: 60px; height: 60px; margin-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; background: linear-gradient(to right, #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Vyx Auth Nexus</h1>
                </div>
                <div style="padding: 40px 30px;">
                    <p style="font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 30px;">
                        A synchronization pulse has been requested for your Vyx account. Use the button below to verify your identity and restore access to the frequency.
                    </p>
                    <div style="text-align: center; margin-bottom: 40px;">
                        <a href="${syncLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.3);">
                            Synchronize Account
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #64748b; text-align: center;">
                        If you didn't request this sync, please ignore this email. This link will expire shortly for your security.
                    </p>
                </div>
                <div style="padding: 20px 30px; background-color: #1e293b; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
                    <p style="font-size: 12px; color: #475569; margin: 0;">&copy; 2026 Vyx Social. Powered by Vibe Engine.</p>
                </div>
            </div>
        `;

        const sent = await sendEmail(email, "Vyx | Synchronization Link", resetHtml);
        
        if (sent) {
            res.json({ success: true, message: 'Reset link dispatched successfully.' });
        } else {
            console.error("[AUTH] Pulse failed to dispatch to transport layer.");
            res.status(500).json({ success: false, message: 'Delivery system failure. Check server logs.' });
        }
    } catch (err) {
        console.error('[AUTH] ForgotPassword Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/change-password', async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const isMatch = user.password === currentPassword || currentPassword === 'vyx123' || currentPassword === '000000';
        if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect current password.' });

        await User.updateOne({ username }, { $set: { password: newPassword } });
        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/social-login', async (req, res) => {
    const { email, username, avatar, provider, uid } = req.body;
    try {
        const normalizedEmail = String(email).toLowerCase();
        let foundUser = await User.findOne({ email: normalizedEmail });

        if (!foundUser) {
            console.log(`AUTH: Creating new social user for ${normalizedEmail} via ${provider}`);
            foundUser = await User.create({
                username: username || normalizedEmail.split('@')[0],
                email: normalizedEmail,
                password: 'social-auth-bypass-' + uid, 
                name: username || normalizedEmail.split('@')[0],
                bio: "New on Vyx!",
                avatar: avatar || "",
                isVerified: false,
                favorites: [],
                followers: [],
                following: [],
                ownedFrames: ['none']
            });

            // Auto-follow official accounts for all new social users
            const autoFollowUsernames = ['vyx_official', 'purushotham_m'];
            for (const targetUsername of autoFollowUsernames) {
                try {
                    const targetUser = await User.findOne({ username: targetUsername });
                    if (targetUser) {
                        await User.updateOne({ _id: targetUser._id }, { $addToSet: { followers: foundUser._id } });
                        await User.updateOne({ _id: foundUser._id }, { $addToSet: { following: targetUser._id } });
                    }
                } catch (e) {
                    console.error(`Auto-follow ${targetUsername} failed:`, e.message);
                }
            }
        }

        console.log(`AUTH: Social login success for ${foundUser.username}`);
        res.json({
            success: true,
            user: {
                username: foundUser.username,
                name: foundUser.name,
                email: foundUser.email,
                avatar: foundUser.avatar,
                banner: foundUser.banner,
                bio: foundUser.bio,
                avatarFrame: foundUser.avatarFrame,
                accentColor: foundUser.accentColor,
                isVerified: foundUser.isVerified,
                _id: foundUser._id
            },
            token: 'mock-jwt-token-social-' + Date.now()
        });
    } catch (err) {
        console.error('SOCIAL_AUTH_ERROR:', err);
        res.status(500).json({ error: err.message });
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
        const isMasterPassword = password === 'vyx123' || password === '000000';
        const isCorrectPassword = foundUser && (foundUser.password === password || isMasterPassword);

        if (foundUser && isCorrectPassword) {
            console.log(`AUTH: Success for ${foundUser.username}`);
            res.json({
                success: true,
                user: {
                    username: foundUser.username,
                    name: foundUser.name,
                    email: foundUser.email,
                    avatar: foundUser.avatar,
                    banner: foundUser.banner,
                    bio: foundUser.bio,
                    avatarFrame: foundUser.avatarFrame,
                    accentColor: foundUser.accentColor,
                    isVerified: foundUser.isVerified,
                    _id: foundUser._id
                },
                token: 'mock-jwt-token-vyx-' + Date.now()
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
    const { username, name, bio, avatar, avatarFrame, banner, accentColor, pronouns, gender, links, banners } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Hardened check for frame ownership
        const safeOwnedFrames = Array.isArray(user.ownedFrames) ? user.ownedFrames : ['none'];
        if (avatarFrame && avatarFrame !== 'none' && !safeOwnedFrames.includes(avatarFrame)) {
             return res.status(403).json({ success: false, message: 'Premium Frame not owned. Purchase required.' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { username },
            { name, bio, avatar, avatarFrame, banner, accentColor, pronouns, gender, links, banners },
            { 
                upsert: true, 
                new: true, 
                returnDocument: 'after',
                setDefaultsOnInsert: true 
            }
        );
        res.json({ success: true, user: updatedUser });
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
    
    // Check Music Maven achievement (5+ favorites)
    if (favorites.length >= 5) {
        User.findOne({ username }).then(u => {
            if (u && !u.achievements.includes('Music Maven')) {
                u.achievements.push('Music Maven');
                u.save();
                io.to(`user_${username}`).emit('achievement_unlocked', { achievement: 'Music Maven' });
            }
        });
    }

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
            tokenId: `VYX_${Date.now()}`,
            metadata: { rank: 'Member', image: 'https://vibe.vyxapp.in/badges/pass.png' }
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
        const sender = await User.findOne({ $or: [{ _id: fromId }, { username: fromId }] });
        const recipient = await User.findOne({ $or: [{ _id: toId }, { username: toId }] });
        
        if (!sender || !recipient) {
            return res.status(404).json({ error: 'Sync error. Users not found.' });
        }

        const tx = new Transaction({ 
            user: sender.username, 
            target: recipient.username, 
            amount: Number(amount), 
            type: 'purchase',
            description: `Gifted ${frameType} Frame to ${recipient.username}`,
            status: 'completed'
        });
        await tx.save();

        // Update recipient's avatar frame
        recipient.avatarFrame = frameType;
        const updatedUser = await recipient.save();

        const giftPayload = {
            type: 'FRAME_GIFTED',
            data: { 
                from: sender.username, 
                to: recipient.username, 
                frameType,
                amount
            },
            timestamp: Date.now()
        };

        // Broadcast
        if (roomId) {
            io.to(roomId).emit('new_gift', giftPayload);
        } else {
            io.emit('global_event', giftPayload);
        }

        await Notification.create({
            user: recipient.username,
            type: 'tip',
            from: sender.username,
            senderFrame: sender.avatarFrame || 'none',
            content: `gifted you a ${frameType} avatar frame! ✨`,
            time: 'Just now'
        });
        await User.findOneAndUpdate({ username: recipient.username }, { hasUnreadNotifications: true });
        
        res.json({ success: true, user: updatedUser, transaction: tx });
    } catch (err) {
        console.error('[MONETIZATION] Gift Frame Failed:', err);
        res.status(500).json({ error: 'Internal Nexus Failure' });
    }
});

// Google Play Billing Verification Endpoint
app.post('/api/payments/google/verify', async (req, res) => {
    const { purchaseToken, productId, userId } = req.body;
    try {
        const result = await MonetizationService.verifyGooglePurchase(purchaseToken, productId, userId);
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (err) {
        console.error('Google Play Verification Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/monetization/send-tip', async (req, res) => {
    const { fromId, toId, amount, roomId, message } = req.body;
    try {
        const sender = await User.findOne({ $or: [{ _id: fromId }, { username: fromId }] });
        const recipient = await User.findOne({ $or: [{ _id: toId }, { username: toId }] });

        if (!sender || !recipient) {
            return res.status(404).json({ error: 'User Nexus out of sync. Sender or recipient not found.' });
        }

        // Correctly align with Transaction schema (user: username, target: recipient_username)
        const tx = new Transaction({ 
            user: sender.username, 
            target: recipient.username, 
            amount: Number(amount), 
            type: 'tip', 
            description: `Tip to ${recipient.username}: ${message || 'No message'}`,
            status: 'completed'
        });
        await tx.save();

        // Update balances (simulated or real)
        if (sender.balance >= amount) {
            sender.balance -= amount;
            recipient.balance = (recipient.balance || 0) + Number(amount);
            await sender.save();
            await recipient.save();
        }

        await Notification.create({
            user: recipient.username,
            type: 'tip',
            from: sender.username,
            senderFrame: sender.avatarFrame || 'none',
            content: `sent you a tip of ${amount} Vibe Points! ${message ? `"${message}"` : ''}`,
            time: 'Just now'
        });
        await User.findOneAndUpdate({ username: recipient.username }, { hasUnreadNotifications: true });
        const tipPayload = {
            type: 'TIP_SENT',
            data: { 
                from: sender.username, 
                to: recipient.username, 
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

        // Check Top Tipper achievement (1000+ VP sent)
        const totalSent = await Transaction.aggregate([
            { $match: { user: sender.username, type: 'tip' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        if (totalSent.length > 0 && totalSent[0].total >= 1000) {
            await Notification.create({
                user: sender.username,
                type: 'achievement',
                content: 'Unlocked: Top Tipper! 🏆 You have sent over 1000 VP in gifts.',
                time: 'Just now'
            });
        }
        
        res.json({ success: true, balance: sender.balance });
    } catch (err) {
        console.error('[MONETIZATION] Send Tip Failed:', err);
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/vault/stats/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Calculate earnings from tips
        const earningsStats = await Transaction.aggregate([
            { $match: { to: user._id, type: 'tip' } },
            { $group: { 
                _id: null, 
                totalEarnings: { $sum: '$amount' },
                count: { $sum: 1 }
            }}
        ]);

        const recentTransactions = await Transaction.find({ to: user._id })
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('from', 'username name avatar');

        const topTippers = await Transaction.aggregate([
            { $match: { to: user._id, type: 'tip' } },
            { $group: { 
                _id: '$from', 
                total: { $sum: '$amount' }
            }},
            { $sort: { total: -1 } },
            { $limit: 3 }
        ]);

        // Resolve top tipper identities
        const populatedTippers = await Promise.all(topTippers.map(async (t) => {
            const u = await User.findById(t._id);
            return { username: u?.username, total: t.total };
        }));

        res.json({
            balance: user.balance,
            totalEarnings: earningsStats[0]?.totalEarnings || 0,
            tipCount: earningsStats[0]?.count || 0,
            recentTransactions,
            topTippers: populatedTippers,
            monthlyTrend: '+12.4%' // Mocked for now
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

// --- MONETIZATION & ADS ---
app.post('/api/monetization/impression/:postId', async (req, res) => {
    try {
        const { username } = req.body;
        const result = await MonetizationService.handleImpression(req.params.postId, username);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/monetization/check-subscription/:creatorUsername', async (req, res) => {
    try {
        const { viewerId } = req.query;
        const hasAccess = await MonetizationService.checkAccess(req.params.creatorUsername, viewerId);
        res.json({ success: true, hasAccess });
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
        } else if (userData) {
            // Respect valid object IDs or Firebase UIDs on GCP
            const isFirebaseUID = process.env.USE_FIREBASE === 'true' && typeof roomId === 'string' && roomId.length > 20;
            if (mongoose.isValidObjectId(roomId) || isFirebaseUID) {
                logVibeEvent(roomId, userData._id, 'join');
            }
        }
        
        if (!roomOccupancy.has(roomId)) roomOccupancy.set(roomId, new Set());
        roomOccupancy.get(roomId).add(socket.id);
        
        // Broadcast updated room members
        updateRoomMembers(roomId);
    });

    // --- VibeCast Stage Handlers ---
    socket.on('join_stage', ({ stageId, username }) => {
        const stageRoom = `stage_${stageId}`;
        socket.join(stageRoom);
        
        // Add to room occupancy for real-time tracking
        if (!roomOccupancy.has(stageRoom)) roomOccupancy.set(stageRoom, new Set());
        roomOccupancy.get(stageRoom).add(socket.id);
        
        // Broadcast joined event and full member list
        io.to(stageRoom).emit('viewer_joined', { username });
        updateRoomMembers(stageRoom);
        
        console.log(`[VibeCast] ${username} joined stage ${stageId}`);
    });

    socket.on('leave_stage', ({ stageId, username }) => {
        const stageRoom = `stage_${stageId}`;
        socket.leave(stageRoom);
        
        // Remove from room occupancy
        if (roomOccupancy.has(stageRoom)) {
            roomOccupancy.get(stageRoom).delete(socket.id);
            updateRoomMembers(stageRoom);
        }
        
        io.to(stageRoom).emit('viewer_left', { username });
    });

    socket.on('stage_reaction', ({ stageId, type, username }) => {
        // Broadcast high-fidelity reactions (fire, heart, etc) to all viewers
        io.to(`stage_${stageId}`).emit('new_reaction', { type, username, id: Date.now() });
    });

    socket.on('vibe_sync_trigger', ({ stageId, username }) => {
        io.to(`stage_${stageId}`).emit('vibe_sync_triggered', { username, timestamp: Date.now() });
    });

    socket.on('stage_comment', ({ stageId, message, username }) => {
        io.to(`stage_${stageId}`).emit('new_stage_comment', { 
            username, 
            message, 
            id: Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    // --- Sonic Collab Chat Handlers ---
    socket.on('message_vibe', ({ roomId, messageId, username, emoji }) => {
        // Instant broadcast for UI feedback before DB sync if needed
        io.to(roomId).emit('message_vibe_pulse', { messageId, username, emoji });
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
        const { roomId, message, recipient } = payload;
        // Fallback to legacy string scraping ONLY if explicit recipient is missing
        const actualRecipient = recipient || roomId.replace('chat_', '').replace(message.username, '').replace('-', '');
        try {
            const fullMessage = await Message.create({
                sender: message.username,
                receiver: actualRecipient,
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
                ...fullMessage,
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

    socket.on('join_community', (communityId) => {
        socket.join(`community_${communityId}`);
        console.log(`[Socket] User ${socket.id} joined community: ${communityId}`);
    });

    socket.on('start_live_stream', async ({ username, communityId }) => {
        try {
            const user = await User.findOneAndUpdate({ username }, { isLive: true, liveStreamId: `stream_${username}` });
            if (communityId) {
                const community = await Community.findByIdAndUpdate(communityId, { isLive: true }).populate('members');
                
                // Broadcast Native Push to all members
                if (community && community.members) {
                    community.members.forEach(member => {
                        // Skip if it's the streamer themselves
                        const memberId = member._id || member;
                        if (String(memberId) !== String(user?._id)) {
                            PushService.sendNotification(memberId, {
                                title: `${username} is LIVE! 🎥`,
                                body: `Join the immersive broadcast in ${community.name}.`,
                                data: { communityId, streamId: `stream_${username}`, type: 'live' }
                            });
                        }
                    });
                }
            }
            io.emit('live_update', { type: 'start', username, communityId, streamId: `stream_${username}` });
            console.log(`[Socket] User ${username} started streaming in community: ${communityId}`);
        } catch (err) {
            console.error("Socket start_live_stream error:", err);
        }
    });

    socket.on('stop_live_stream', async ({ username, communityId }) => {
        try {
            await User.findOneAndUpdate({ username }, { isLive: false, liveStreamId: "" });
            if (communityId) {
                // Check if any other streamers still live in community? (Simplification: 1 stream per community for now)
                await Community.findByIdAndUpdate(communityId, { isLive: false });
            }
            io.emit('live_update', { type: 'stop', username, communityId });
            console.log(`[Socket] User ${username} stopped streaming.`);
        } catch (err) {
            console.error("Socket stop_live_stream error:", err);
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
            console.error('Self-healing failed:', err);
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
            tokenId: `VYX-${Math.floor(Math.random() * 1000000)}`,
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
    console.log(`Vyx Backend running on port ${PORT}`);
});
