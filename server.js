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
