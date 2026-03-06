const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('../../shared/db');
const logger = require('../../shared/logger');
const { privacyMiddleware } = require('./middleware/privacy');


dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "DELETE"]
    }
});

const PORT = process.env.MESSAGING_SERVICE_PORT || 5003;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(privacyMiddleware);


// Expose io to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
const messageRoutes = require('./routes/messageRoutes');
const serverRoutes = require('./routes/serverRoutes');

app.use('/api/servers', serverRoutes);
app.use('/api', messageRoutes); // Handles /api/messages, /api/conversations

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'messaging-service', status: 'up' });
});

// Socket.IO logic
const voiceParticipants = {}; // channelId -> [{ userId, peerId }]
const onlineUsers = new Set();
const liveVibes = new Set();
const immersiveStates = {}; // channelId -> { markers: [] }


io.on('connection', (socket) => {
    logger.info(`[SOCKET] User connected: ${socket.id}`);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        onlineUsers.add(roomId);
        io.emit('user-status-change', { userId: roomId, status: 'online' });
        logger.info(`[SOCKET] Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('join-server-channel', ({ serverId, channelId }) => {
        const roomName = `server_${serverId}_${channelId}`;
        socket.join(roomName);
        logger.info(`[SOCKET] Socket ${socket.id} joined channel room: ${roomName}`);
    });

    socket.on('leave-server-channel', ({ serverId, channelId }) => {
        const roomName = `server_${serverId}_${channelId}`;
        socket.leave(roomName);
        logger.info(`[SOCKET] Socket ${socket.id} left channel room: ${roomName}`);
    });

    // --- Voice / Audio Space Events ---
    socket.on('join-voice', ({ channelId, userId, peerId, asListener }) => {
        socket.join(channelId);
        if (!voiceParticipants[channelId]) voiceParticipants[channelId] = [];

        // Remove existing if any (re-join)
        voiceParticipants[channelId] = voiceParticipants[channelId].filter(p => p.userId !== userId);
        voiceParticipants[channelId].push({ userId, peerId, asListener });

        socket.to(channelId).emit('user-joined-voice', { userId, peerId, asListener });
        io.to(channelId).emit('voice-participants-update', {
            channelId,
            participants: voiceParticipants[channelId]
        });

        logger.info(`[VOICE] User ${userId} joined ${channelId} (listener: ${asListener})`);
    });

    socket.on('leave-voice', ({ channelId, userId }) => {
        socket.leave(channelId);
        if (voiceParticipants[channelId]) {
            voiceParticipants[channelId] = voiceParticipants[channelId].filter(p => p.userId !== userId);
            io.to(channelId).emit('user-left-voice', { userId });
            io.to(channelId).emit('voice-participants-update', {
                channelId,
                participants: voiceParticipants[channelId]
            });
        }
        logger.info(`[VOICE] User ${userId} left ${channelId}`);
    });

    socket.on('voice-signal', (data) => {
        // data: { targetId, callerId, signal, metadata }
        io.to(data.targetId).emit('voice-signal', data);
    });

    socket.on('voice-caption', async (data) => {
        // data: { channelId, userId, username, text }
        let sentiment = null;
        if (data.text && data.text.trim().length > 0) {
            try {
                const axios = require('axios');
                const aiRes = await axios.post(`${process.env.CONTENT_SERVICE_URL || 'http://localhost:5004'}/ai/sentiment`, {
                    text: data.text
                });
                sentiment = aiRes.data;
            } catch (aiErr) {
                console.error('[VOICE-AI] Sentiment analysis failed:', aiErr.message);
            }
        }
        socket.to(data.channelId).emit('voice-caption', { ...data, sentiment });
    });

    // --- Vibe / Live Streaming Events ---
    socket.on('vibe-start', ({ hostEmail }) => {
        liveVibes.add(hostEmail);
        io.emit('vibe-status-change', { hostEmail, isLive: true });
        logger.info(`[VIBE] User ${hostEmail} started a live session`);
    });

    socket.on('vibe-stop', ({ hostEmail }) => {
        liveVibes.delete(hostEmail);
        io.emit('vibe-status-change', { hostEmail, isLive: false });
        logger.info(`[VIBE] User ${hostEmail} stopped their live session`);
    });

    // --- Immersive Board Events ---
    socket.on('add-immersive-marker', ({ channelId, marker }) => {
        if (!immersiveStates[channelId]) immersiveStates[channelId] = { markers: [] };
        immersiveStates[channelId].markers.push(marker);

        // Broadcast to others in the channel
        socket.to(channelId).emit('immersive-marker-added', marker);
        logger.info(`[IMMERSIVE] Marker added to ${channelId} by ${socket.id}`);
    });

    socket.on('get-immersive-state', ({ channelId }) => {
        const state = immersiveStates[channelId] || { markers: [] };
        socket.emit('immersive-state', state);
        // Also send existing markers individually or as bulk
        state.markers.forEach(m => socket.emit('immersive-marker-added', m));
    });


    socket.on('disconnect', () => {
        logger.info(`[SOCKET] User disconnected: ${socket.id}`);
        // Cleanup online status if we tracked it by socket.id 
        // For simplicity, we mostly rely on explicit 'join-room' as 'login'
    });
});

// Helper for Gateway/API to query status
app.get('/online-users', (req, res) => {
    res.json(Array.from(onlineUsers));
});

app.get('/active-vibe-sessions', (req, res) => {
    res.json(Array.from(liveVibes));
});

// Redis Bridge for Audio Spaces logic
const EVENT_CHANNEL = 'audio_space_events';
const USER_UPDATES_CHANNEL = 'user_updates';
const subClient = require('../../shared/redisClient').getSubClient();

if (subClient) {
    subClient.subscribe(EVENT_CHANNEL);
    subClient.subscribe(USER_UPDATES_CHANNEL);
    subClient.on('message', (channel, message) => {
        try {
            const parsed = JSON.parse(message);
            if (channel === EVENT_CHANNEL) {
                logger.info(`[REDIS-BRIDGE] Emitting ${parsed.event} to sockets`);
                io.emit(parsed.event, parsed.data);
            } else if (channel === USER_UPDATES_CHANNEL) {
                logger.info(`[REDIS-BRIDGE] User update received: ${parsed.type} for ${parsed.email}`);
                // Emit to the specific user's room
                io.to(parsed.email).emit('token-balance-updated', parsed);
            }
        } catch (e) {
            logger.error('[REDIS-BRIDGE] Error parsing message:', e.message);
        }
    });
}

httpServer.listen(PORT, () => {
    logger.info(`🚀 Messaging & Server Service running on port ${PORT}`);
});
