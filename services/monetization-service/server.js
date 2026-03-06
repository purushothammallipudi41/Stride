process.env.SERVICE_NAME = 'monetization-service';
require('../../shared/instrumentation');
require('dotenv').config();
const logger = require('../../shared/logger');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('../../shared/db');

// Routes
const adRoutes = require('./routes/adRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const creatorRoutes = require('./routes/creatorRoutes');


const app = express();
const PORT = process.env.MONETIZATION_SERVICE_PORT || 5005;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'monetization-service', status: 'up' });
});

// Mount Routes
app.use('/ads', adRoutes);
app.use('/marketplace', marketplaceRoutes);
app.use('/creator', creatorRoutes);


app.listen(PORT, () => {
    logger.info(`🚀 Monetization Service running on port ${PORT}`);
});
