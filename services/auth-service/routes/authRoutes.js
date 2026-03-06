const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../../../shared/models/User');
const Session = require('../../../shared/models/Session');
const ServerMessage = require('../../../shared/models/ServerMessage');
const cache = require('../../../shared/redisClient');
const {
    generateVerificationCode,
    sendVerificationEmail,
    sendPasswordResetEmail
} = require('../../../shared/utils/email');
const auditLogger = require('../../../shared/auditLogger');

// POST /api/register
router.post('/register', async (req, res) => {
    try {
        const { username, name, email, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(409).json({ error: 'User already exists' });

        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Auto-Follow Logic
        const targetUsernames = ['stride', 'purushotham_mallipudi'];
        const targets = await User.find({ username: { $in: targetUsernames } });
        const initialFollowing = targets.map(t => t._id.toString());

        const newUser = await User.create({
            username,
            name: name || username,
            email,
            password,
            avatar: "",
            bio: "New to Stride! 🎵",
            isVerified: false,
            verificationRequired: true,
            verificationCode,
            verificationCodeExpires,
            following: initialFollowing,
            stats: {
                posts: 0,
                followers: 0,
                following: initialFollowing.length
            },
            serverProfiles: [{
                serverId: 0,
                nickname: username,
                avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`
            }]
        });

        for (const target of targets) {
            if (!target.followers.includes(newUser._id.toString())) {
                target.followers.push(newUser._id.toString());
                target.stats.followers = target.followers.length;
                await target.save();
            }
        }

        // Auto-Welcome Message
        try {
            const welcomeMsg = await ServerMessage.create({
                serverId: 0,
                channelId: 'welcome',
                userEmail: targets.find(t => t.username === 'stride')?.email || newUser.email,
                username: 'Stride Bot',
                avatar: '/logo.png',
                text: `Welcome @${username} to the Stride community! 🎉 We're glad to have you here.`,
                timestamp: new Date()
            });
            if (req.io) {
                req.io.to('server-0').emit('receive-server-message', welcomeMsg);
                req.io.to('server-0-welcome').emit('receive-server-message', welcomeMsg);
            }
        } catch (err) {
            console.error('[REGISTER] Failed to send welcome message:', err);
        }

        await sendVerificationEmail(email, verificationCode);

        await auditLogger.log({
            action: auditLogger.Actions.USER_REGISTERED,
            actorUserId: newUser.email,
            reason: 'Self-registration'
        });

        res.json({ success: true, email: newUser.email, message: 'Verification code sent' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const code = generateVerificationCode();
        user.resetPasswordCode = code;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        await sendPasswordResetEmail(email, code);
        res.json({ success: true, message: 'Reset code sent' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordCode: code,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired code' });

        user.password = newPassword;
        await user.save();

        await auditLogger.log({
            action: auditLogger.Actions.PASSWORD_CHANGE,
            actorUserId: user.email,
            reason: 'Password reset via email code'
        });

        res.json({ success: true, message: 'Password reset successful' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/verify
router.post('/verify', async (req, res) => {
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

// POST /api/resend-verification
router.post('/resend-verification', async (req, res) => {
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

// POST /api/login
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (user && user.password === password) {
            if (user.verificationRequired && user.isVerified === false) {
                return res.status(403).json({ error: 'Email not verified', email: user.email });
            }
            if (user.isTwoFactorEnabled) {
                return res.json({ success: true, requires2FA: true, email: user.email });
            }

            const token = uuidv4();
            const session = new Session({
                userId: user.email,
                token: token,
                device: req.headers['user-agent'] || 'Unknown Device',
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });
            await session.save();

            await cache.set(`session:${token}`, { userId: user.email, status: 'active' }, 86400 * 7);

            await auditLogger.log({
                action: auditLogger.Actions.LOGIN_SUCCESS,
                actorUserId: user.email,
                metadata: { device: req.headers['user-agent'], ip: req.ip }
            });

            res.json({ success: true, user, token });
        } else {
            if (identifier) {
                await auditLogger.log({
                    action: auditLogger.Actions.LOGIN_FAILED,
                    actorUserId: identifier,
                    reason: 'Invalid credentials'
                });
            }
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- 2FA Routes ---

// POST /api/auth/2fa/setup
router.post('/2fa/setup', async (req, res) => {
    try {
        const { email } = req.body;
        const secret = speakeasy.generateSecret({ name: `Stride (${email})` });
        const user = await User.findOneAndUpdate(
            { email },
            { $set: { twoFactorSecret: secret.base32 } },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        res.json({ success: true, secret: secret.base32, qrCodeUrl });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/2fa/verify
router.post('/2fa/verify', async (req, res) => {
    try {
        const { email, token } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (verified) {
            user.isTwoFactorEnabled = true;
            await user.save();

            await auditLogger.log({
                action: auditLogger.Actions.TWO_FA_ENABLED,
                actorUserId: user.email
            });

            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Invalid verification token' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/2fa/validate
router.post('/2fa/validate', async (req, res) => {
    try {
        const { email, token } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (verified) {
            const sessionToken = uuidv4();
            const session = new Session({
                userId: user.email,
                token: sessionToken,
                device: req.headers['user-agent'] || 'Unknown Device',
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent']
            });
            await session.save();
            await cache.set(`session:${sessionToken}`, { userId: user.email, status: 'active' }, 86400 * 7);

            await auditLogger.log({
                action: auditLogger.Actions.LOGIN_SUCCESS,
                actorUserId: email,
                metadata: { device: req.headers['user-agent'], ip: req.ip, note: '2FA Validated' }
            });

            res.json({ success: true, user, token: sessionToken });
        } else {
            res.status(400).json({ error: 'Invalid 2FA token' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/2fa/disable
router.post('/2fa/disable', async (req, res) => {
    try {
        const { email, token } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token
        });

        if (verified) {
            user.isTwoFactorEnabled = false;
            user.twoFactorSecret = undefined;
            await user.save();

            await auditLogger.log({
                action: auditLogger.Actions.TWO_FA_DISABLED,
                actorUserId: user.email
            });

            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Invalid token' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Session Routes ---

// GET /api/auth/sessions
router.get('/sessions', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email required' });
        const sessions = await Session.find({ userId: email }).sort({ lastActive: -1 });
        res.json(sessions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/auth/sessions/:sessionId
router.delete('/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await Session.findByIdAndDelete(sessionId);
        if (session) {
            await cache.del(`session:${session.token}`);

            await auditLogger.log({
                action: auditLogger.Actions.LOGOUT,
                actorUserId: session.userId,
                reason: 'Individual session revocation'
            });

            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Session not found' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/auth/sessions/clear
router.post('/sessions/clear', async (req, res) => {
    try {
        const { email, exceptToken } = req.body;
        const sessionsToRevoke = await Session.find({ userId: email, token: { $ne: exceptToken } });

        for (const s of sessionsToRevoke) {
            await cache.del(`session:${s.token}`);
        }

        await Session.deleteMany({ userId: email, token: { $ne: exceptToken } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
