const express = require('express');
const router = express.Router();
const DirectMessage = require('../../../shared/models/DirectMessage');
const Conversation = require('../../../shared/models/Conversation');
const ServerMessage = require('../../../shared/models/ServerMessage');
const AuditLog = require('../../../shared/models/AuditLog');
const authenticate = require('../../../shared/middleware/auth');
const Sticker = require('../../../shared/models/Sticker');
const ogs = require('open-graph-scraper');
const strideAIEngine = require('../../../shared/utils/StrideAIEngine');


// POST /api/messages/:messageId/report
router.post('/messages/:messageId/report', async (req, res) => {
    const { messageId } = req.params;
    const { serverId, userEmail, reason } = req.body;

    try {
        const log = new AuditLog({
            serverId: serverId,
            targetUserId: null,
            actorUserId: userEmail,
            action: 'MESSAGE_REPORTED',
            reason: reason || 'Inappropriate content',
            content: `MessageID: ${messageId}`
        });
        await log.save();
        res.json({ success: true, message: 'Report submitted successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

// GET /api/messages/:userEmail
router.get('/messages/:userEmail', async (req, res) => {
    const { userEmail } = req.params;
    try {
        const messages = await DirectMessage.find({
            $or: [{ from: userEmail }, { to: userEmail }]
        })
            .populate('replyTo')
            .sort({ timestamp: 1 });
        res.json(messages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/messages/:userEmail/:otherEmail
router.get('/messages/:userEmail/:otherEmail', async (req, res) => {
    const { userEmail, otherEmail } = req.params;
    try {
        const messages = await DirectMessage.find({
            $or: [
                { from: userEmail, to: otherEmail },
                { from: otherEmail, to: userEmail }
            ]
        })
            .populate('replyTo')
            .sort({ timestamp: 1 });
        res.json(messages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/messages/send
router.post('/messages/send', async (req, res) => {
    try {
        const { from, to, text, sharedContent, mediaUrl, mediaType, gif, replyTo, poll, type } = req.body;

        // --- Stride Native Moderation ---
        const safety = strideAIEngine.getSafetyScore(text);
        if (!safety.isSafe) {
            return res.status(400).json({
                error: 'Message rejected',
                reason: safety.reason,
                isModerated: true
            });
        }

        // --- AI Sentiment Integration ---
        let sentiment = null;
        if (text && text.trim().length > 0) {
            try {
                // We use our native engine for sentiment too
                sentiment = strideAIEngine.analyze(text);

                // Optional: Fallback/Enhancement via Content Service if needed
                // For now, native is faster and sufficient for real-time
            } catch (aiErr) {
                console.error('[MESSAGING-AI] Sentiment analysis failed:', aiErr.message);
            }
        }


        const message = await DirectMessage.create({
            from, to, text, sharedContent, mediaUrl, mediaType, gif, poll, type: type || 'text',
            sentiment, // Add sentiment to message record
            replyTo: replyTo || null,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent'
        });

        const populatedMsg = await DirectMessage.findById(message._id).populate('replyTo');

        // Sync Conversation
        const participants = [from, to].sort();
        let convo = await Conversation.findOne({ participants });
        const lastMsg = {
            sender: from,
            text: text || (sharedContent ? `Shared ${sharedContent.type || (type === 'location' ? 'Location' : 'Item')}` : ''),
            timestamp: new Date()
        };

        if (convo) {
            convo.lastMessage = lastMsg;
            convo.settings.forEach(s => {
                if (s.isHidden) s.isHidden = false;
            });
            await convo.save();
        } else {
            const validParticipants = participants.filter(p => !!p);
            if (validParticipants.length >= 2) {
                await Conversation.create({
                    participants: validParticipants,
                    settings: validParticipants.map(p => ({ email: p })),
                    lastMessage: lastMsg
                });
            }
        }

        if (req.io) {
            req.io.to(to).emit('receive-message', populatedMsg);
            req.io.to(from).emit('receive-message', populatedMsg);
        }
        res.json(populatedMsg);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/messages/:messageId
router.delete('/messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        let result = await DirectMessage.findByIdAndDelete(messageId);
        if (result) return res.json({ success: true });

        result = await ServerMessage.findByIdAndDelete(messageId);
        if (result) return res.json({ success: true });

        res.status(404).json({ error: 'Message not found' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/conversations/:email
router.get('/conversations/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const convos = await Conversation.find({ participants: email }).sort({ updatedAt: -1 });
        const visible = convos.filter(c => {
            const s = c.settings.find(st => st.email === email);
            return !s || !s.isHidden;
        });
        res.json(visible);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/conversations/action
router.post('/conversations/action', async (req, res) => {
    try {
        const { conversationId, userEmail, action } = req.body;
        const convo = await Conversation.findById(conversationId);
        if (!convo) return res.status(404).json({ error: 'Not found' });

        let s = convo.settings.find(st => st.email === userEmail);
        if (!s) {
            convo.settings.push({ email: userEmail });
            s = convo.settings[convo.settings.length - 1];
        }

        if (action === 'mute') s.isMuted = !s.isMuted;
        else if (action === 'hide') s.isHidden = true;
        else if (action === 'clear') s.lastClearedAt = new Date();
        else if (action === 'delete') {
            s.isHidden = true;
            s.lastClearedAt = new Date();
        }
        await convo.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/conversations/clear-all
router.post('/conversations/clear-all', async (req, res) => {
    try {
        const { userEmail } = req.body;
        if (!userEmail) return res.status(400).json({ error: 'User email required' });

        const convos = await Conversation.find({ participants: userEmail });
        for (const convo of convos) {
            let s = convo.settings.find(st => st.email === userEmail);
            if (!s) {
                convo.settings.push({ email: userEmail });
                s = convo.settings[convo.settings.length - 1];
            }
            s.isHidden = true;
            s.lastClearedAt = new Date();
            await convo.save();
        }
        res.json({ success: true, count: convos.length });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/stickers
router.get('/stickers', async (req, res) => {
    try {
        const { serverId } = req.query;
        const query = serverId ? { serverId: { $in: [serverId, 'global'] } } : { serverId: 'global' };
        const stickers = await Sticker.find(query);
        res.json(stickers);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/link-preview
router.get('/link-preview', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const options = { url };
        const { result } = await ogs(options);
        if (result.success) {
            res.json({
                title: result.ogTitle || result.twitterTitle || '',
                description: result.ogDescription || result.twitterDescription || '',
                image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '',
                siteName: result.ogSiteName || ''
            });
        } else {
            res.status(400).json({ error: 'Failed to fetch preview' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
