const express = require('express');
const router = express.Router();
const Report = require('../../../shared/models/Report');
const authenticate = require('../../../shared/middleware/auth');

// GET /api/moderation/reports
router.get('/reports', async (req, res) => {
    try {
        const reports = await Report.find({}).sort({ createdAt: -1 });
        res.json(reports);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/moderation/reports
router.post('/reports', async (req, res) => {
    try {
        const report = await Report.create(req.body);
        res.status(201).json(report);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// PATCH /api/moderation/reports/:reportId
router.patch('/reports/:reportId', async (req, res) => {
    try {
        const report = await Report.findByIdAndUpdate(
            req.params.reportId,
            { $set: req.body },
            { new: true }
        );
        res.json(report);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
