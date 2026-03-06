process.env.SERVICE_NAME = 'user-service';
require('../../shared/instrumentation');
require('dotenv').config();
const logger = require('../../shared/logger');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('../../shared/db');
const userRoutes = require('./routes/userRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const moderationRoutes = require('./routes/moderationRoutes');

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 5002;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'user-service', status: 'up' });
});

// Routes
app.use('/api/gamification', gamificationRoutes);
app.use('/', userRoutes);

app.listen(PORT, () => {
    logger.info(`🚀 User Service running on port ${PORT}`);
});
