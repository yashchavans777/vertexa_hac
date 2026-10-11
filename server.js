<<<<<<< HEAD
/**
 * ActionGate - Core HTTP & Real-Time Gateway Server
 * server.js
 * 
 * Principal Full-Stack & Cryptography Engineer Specification:
 * Bootstraps Express HTTP server with integrated Socket.IO engine.
 * Mounts both legacy routes and enterprise v1 Ledger routes.
 * Integrates centralized global error handling middleware.
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const gatewayRoutes = require('./routes/gatewayRoutes');
const ledgerRoutes = require('./src/routes/ledger.routes');
const { errorHandler } = require('./src/middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/actiongate';
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// -----------------------------------------------------------------------------
// HTTP Middlewares
// -----------------------------------------------------------------------------
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------------------------------------------
// Create HTTP Server & Initialize Socket.IO
// -----------------------------------------------------------------------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Real-Time Socket Connection Handlers
io.on('connection', (socket) => {
  const clientIp = socket.handshake.address;
  console.log(`[ActionGate Real-Time] ⚡ SOC Operator Dashboard connected: ${socket.id} (IP: ${clientIp})`);

  socket.on('join_channel', (channelName) => {
    socket.join(channelName);
    console.log(`[ActionGate Real-Time] Socket ${socket.id} joined channel: ${channelName}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[ActionGate Real-Time] 🔌 SOC Operator Dashboard disconnected: ${socket.id} (Reason: ${reason})`);
  });
});

const v1GatewayRoutes = require('./src/routes/gateway.routes');

// Bind Socket.IO instance to app for controller access (req.app.get('io'))
app.set('io', io);

// -----------------------------------------------------------------------------
// Route Registrations
// -----------------------------------------------------------------------------
// Enterprise V1 API Routes
app.use('/api/v1/gateway', v1GatewayRoutes);
app.use('/api/v1/ledger', ledgerRoutes);

// Legacy Gateway Ingress Routes (Backward Compatibility)
app.use('/api/gateway', gatewayRoutes);

// Root health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'ActionGate Enterprise Security Ingress Gateway',
    timestamp: new Date().toISOString()
  });
});

// -----------------------------------------------------------------------------
// Centralized Error Handling Middleware (Registered after all routes)
// -----------------------------------------------------------------------------
app.use(errorHandler);

// -----------------------------------------------------------------------------
// Database Connection & Server Bootstrap
// -----------------------------------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log('[ActionGate Database] ✔ Connected to MongoDB successfully.');
      server.listen(PORT, () => {
        console.log(`[ActionGate Gateway] 🛡️  Server listening on http://localhost:${PORT}`);
        console.log(`[ActionGate Gateway] ⚡ Real-Time Socket.IO active for origin: ${ALLOWED_ORIGIN}`);
        console.log(`[ActionGate Gateway] 🔗 Cryptographic Ledger active at /api/v1/ledger`);
      });
    })
    .catch((err) => {
      console.error('[ActionGate Database Error] Failed to connect to MongoDB:', err.message);
      process.exit(1);
    });
}

// Export app, server, and io instance for notifications and testing
module.exports = {
  app,
  server,
  io
};
=======
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize database connection
connectDB();

const app = express();

// Security Middleware: Helmet secures HTTP response headers
app.use(helmet());

// Cross-Origin Resource Sharing configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Payload parsers with strict size limits to prevent Denial of Service (DoS) attacks
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Base health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});

// Routing logic and controllers will be mounted here in subsequent steps

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[ActionGate Server] Security gateway listening on port ${PORT}`);
});

// Graceful shutdown handling
process.on('unhandledRejection', (err) => {
  console.error(`[Critical Error] Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
>>>>>>> 970158768f8a72e810a75a43418f02a55dd1d995
