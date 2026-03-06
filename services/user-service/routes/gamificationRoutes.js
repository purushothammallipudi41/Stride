const express = require('express');
const router = express.Router();
const User = require('../../../shared/models/User');
const auth = require('../../../shared/middleware/auth');

// ─── XP & Level Config ──────────────────────────────────────────────
const XP_PER_LEVEL = 500; // Each level requires 500 XP
const LEVEL_MULTIPLIER = 1.2; // XP needed grows by 20% per level

function xpForLevel(level) {
    return Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_MULTIPLIER, level - 1));
}

function computeLevel(totalXp) {
    let level = 1;
    let xpUsed = 0;
    while (true) {
        const needed = xpForLevel(level);
        if (xpUsed + needed > totalXp) break;
        xpUsed += needed;
        level++;
    }
    return { level, xpInCurrentLevel: totalXp - xpUsed, xpForNextLevel: xpForLevel(level) };
}

// ─── Achievement Definitions ────────────────────────────────────────
const ACHIEVEMENTS = [
    { id: 'first_post', label: 'First Post', emoji: '🏅', desc: 'Published your first post', xp: 50 },
    { id: 'streak_7', label: 'On Fire', emoji: '🔥', desc: '7-day login streak', xp: 100 },
    { id: 'streak_30', label: 'Unstoppable', emoji: '🌟', desc: '30-day login streak', xp: 300 },
    { id: 'likes_100', label: 'Fan Favourite', emoji: '❤️', desc: 'Received 100 likes on a post', xp: 150 },
    { id: 'followers_1k', label: 'Rising Star', emoji: '🚀', desc: 'Reached 1,000 followers', xp: 500 },
    { id: 'creator', label: 'Creator', emoji: '🎨', desc: 'Posted 10+ pieces of content', xp: 200 },
    { id: 'night_owl', label: 'Night Owl', emoji: '🦉', desc: 'Active between midnight and 4 AM', xp: 75 },
    { id: 'trendsetter', label: 'Trendsetter', emoji: '📈', desc: 'A post became trending', xp: 250 },
];

function checkAndAwardAchievements(user) {
    const earned = [];
    const existing = new Set(user.achievements || []);

    const hour = new Date().getHours();
    if ((hour >= 0 && hour < 4) && !existing.has('night_owl')) earned.push('night_owl');
    if (user.streak >= 7 && !existing.has('streak_7')) earned.push('streak_7');
    if (user.streak >= 30 && !existing.has('streak_30')) earned.push('streak_30');
    if ((user.stats?.followers || 0) >= 1000 && !existing.has('followers_1k')) earned.push('followers_1k');

    return earned;
}

// ─── Daily Check-in ─────────────────────────────────────────────────
// POST /api/gamification/checkin
router.post('/checkin', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        if (user.lastActiveDate === today) {
            return res.json({ alreadyCheckedIn: true, xp: user.xp, streak: user.streak, level: user.level });
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const isConsecutive = user.lastActiveDate === yesterday;

        user.streak = isConsecutive ? (user.streak || 0) + 1 : 1;
        user.lastActiveDate = today;

        const xpGain = 25 + Math.min(user.streak * 5, 75); // 25–100 XP based on streak
        user.xp = (user.xp || 0) + xpGain;
        user.weeklyXp = (user.weeklyXp || 0) + xpGain;

        // Recompute level
        const { level } = computeLevel(user.xp);
        user.level = level;

        // Check achievements
        const newAchievements = checkAndAwardAchievements(user);
        if (newAchievements.length > 0) {
            user.achievements = [...(user.achievements || []), ...newAchievements];
            const bonusXp = newAchievements.reduce((sum, id) => {
                const def = ACHIEVEMENTS.find(a => a.id === id);
                return sum + (def?.xp || 0);
            }, 0);
            user.xp += bonusXp;
            user.weeklyXp += bonusXp;
        }

        await user.save();

        res.json({
            xp: user.xp, xpGain, streak: user.streak, level: user.level,
            newAchievements,
            alreadyCheckedIn: false
        });
    } catch (err) {
        console.error('[CHECKIN]', err);
        res.status(500).json({ error: 'Check-in failed' });
    }
});

// ─── Gamification Profile ────────────────────────────────────────────
// GET /api/gamification/profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('xp level streak weeklyXp achievements lastActiveDate username avatar name');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { level, xpInCurrentLevel, xpForNextLevel } = computeLevel(user.xp);

        // Get user's rank on leaderboard
        const rank = await User.countDocuments({ weeklyXp: { $gt: user.weeklyXp } }) + 1;

        const allAchievements = ACHIEVEMENTS.map(a => ({
            ...a,
            earned: (user.achievements || []).includes(a.id)
        }));

        res.json({
            xp: user.xp,
            level,
            xpInCurrentLevel,
            xpForNextLevel,
            streak: user.streak || 0,
            weeklyXp: user.weeklyXp || 0,
            rank,
            achievements: allAchievements,
            lastActiveDate: user.lastActiveDate
        });
    } catch (err) {
        console.error('[GAMI PROFILE]', err);
        res.status(500).json({ error: 'Failed to load gamification profile' });
    }
});

// ─── Leaderboard ────────────────────────────────────────────────────
// GET /api/gamification/leaderboard
router.get('/leaderboard', auth, async (req, res) => {
    try {
        const top10 = await User.find({})
            .select('username name avatar weeklyXp level streak')
            .sort({ weeklyXp: -1 })
            .limit(10);

        const currentUser = await User.findById(req.user.id).select('username weeklyXp level');
        const myRank = await User.countDocuments({ weeklyXp: { $gt: currentUser.weeklyXp } }) + 1;

        res.json({
            leaderboard: top10.map((u, i) => ({
                rank: i + 1,
                username: u.username,
                name: u.name,
                avatar: u.avatar,
                weeklyXp: u.weeklyXp || 0,
                level: u.level || 1,
                streak: u.streak || 0,
                isCurrentUser: u._id.toString() === req.user.id
            })),
            myRank,
            myWeeklyXp: currentUser.weeklyXp || 0
        });
    } catch (err) {
        console.error('[LEADERBOARD]', err);
        res.status(500).json({ error: 'Failed to load leaderboard' });
    }
});

// ─── Internal XP Award ──────────────────────────────────────────────
// POST /api/gamification/award (called internally by other services)
router.post('/award', async (req, res) => {
    try {
        const { userId, action } = req.body;
        const XP_TABLE = { post: 50, comment: 10, story: 20, like_milestone: 25 };
        const xpGain = XP_TABLE[action] || 0;
        if (!xpGain || !userId) return res.json({ ok: true });

        const user = await User.findById(userId);
        if (!user) return res.json({ ok: true });

        user.xp = (user.xp || 0) + xpGain;
        user.weeklyXp = (user.weeklyXp || 0) + xpGain;
        const { level } = computeLevel(user.xp);
        user.level = level;

        // Check achievements
        const newAchievements = checkAndAwardAchievements(user);
        if (newAchievements.length) {
            user.achievements = [...(user.achievements || []), ...newAchievements];
        }

        await user.save();
        res.json({ ok: true, xp: user.xp, level: user.level, newAchievements });
    } catch (err) {
        console.error('[XP AWARD]', err);
        res.json({ ok: true }); // Non-blocking — never fail the caller
    }
});

module.exports = router;
