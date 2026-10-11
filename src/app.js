/**
 * ActionGate - Express Application Configuration
 * src/app.js
 * 
 * Central Express App Configuration following "Chai aur Code" production architecture:
 * Mounts standard middlewares, versioned API routes (/api/v1/...),
 * and binds the centralized global error handler.
 */
const express = require('express');
const cors = require('cors');

const ledgerRoutes = require('./routes/ledger.routes');
const gatewayRoutes = require('../routes/gatewayRoutes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Standard Production Middlewares
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'ActionGate Enterprise Security Engine',
    timestamp: new Date().toISOString()
  });
});

// Versioned Production API Routes
app.use('/api/v1/ledger', ledgerRoutes);

// Legacy/Root Gateway Route Registration (Backward Compatibility)
app.use('/api/gateway', gatewayRoutes);

// Centralized Global Error Handler (MUST BE REGISTERED LAST)
app.use(errorHandler);

module.exports = { app };
