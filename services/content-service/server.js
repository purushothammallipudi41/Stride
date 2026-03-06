process.env.SERVICE_NAME = 'content-service';
require('../../shared/instrumentation');
require('dotenv').config();
const logger = require('../../shared/logger');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('../../shared/db');
const cron = require('node-cron');
const { processScheduledPosts } = require('./tasks/schedulingTask');

// Routes
const postRoutes = require('./routes/postRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const audiusRoutes = require('./routes/audiusRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const articleRoutes = require('./routes/articleRoutes');
const storyRoutes = require('./routes/storyRoutes');

const app = express();
const PORT = process.env.CONTENT_SERVICE_PORT || 5004;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'content-service', status: 'up' });
});

// Mount Routes
app.use('/posts', postRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/ai', aiRoutes);
app.use('/audius', audiusRoutes);
app.use('/spaces', spaceRoutes);
app.use('/articles', articleRoutes);
app.use('/stories', storyRoutes);

// Tasks
const { precomputeForYouFeeds } = require('./tasks/feedTask');

app.listen(PORT, () => {
    logger.info(`🚀 Content Service running on port ${PORT}`);

    // Initial run
    setTimeout(precomputeForYouFeeds, 5000);

    // Schedule every 30 minutes
    setInterval(precomputeForYouFeeds, 30 * 60 * 1000);

    // Schedule content publishing every minute
    cron.schedule('* * * * *', () => {
        logger.info('[SCHEDULER] Checking for scheduled posts...');
        processScheduledPosts();
    });
});
