const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const gatewayRouter = require("./routes/gateway.routes");
const ledgerRouter = require("./routes/ledger.routes");
const policyRouter = require("./routes/policy.routes");
const { errorHandler } = require("./middlewares/error.middleware");

const app = express();

// ── Production Middleware Stack ──────────────────────────────────────────────

// HTTP header hardening via Helmet
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// JSON body parsing with a strict 16kb request size cap to mitigate DoS payloads
app.use(express.json({ limit: "16kb" }));

// URL-encoded body parsing
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ONLINE",
    system: "ActionGate Enterprise Security Engine",
    timestamp: new Date().toISOString(),
  });
});

// ── Versioned Production API Routes ──────────────────────────────────────────
app.use("/api/v1/gateway", gatewayRouter);
app.use("/api/v1/ledger", ledgerRouter);
app.use("/api/v1/policies", policyRouter);

// Backward Compatibility Aliases
app.use("/api/gateway", gatewayRouter);

// Centralized Global Error Handler (MUST BE REGISTERED LAST)
app.use(errorHandler);

module.exports = app;
module.exports.app = app;
