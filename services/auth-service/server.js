process.env.SERVICE_NAME = 'auth-service';
require('../../shared/instrumentation');
require('dotenv').config();
const logger = require('../../shared/logger');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('../../shared/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 5001;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
// The gateway will proxy /api/auth/* to this service
// If we want this service to be agnostic of the /api/auth prefix, 
// the gateway should strip it or we mount it at /api/auth
app.use('/', authRoutes);

app.get('/health', (req, res) => {
    res.json({ service: 'auth-service', status: 'up' });
});

app.listen(PORT, () => {
    logger.info(`🚀 Auth Service running on port ${PORT}`);
});
