const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

// ── Production Middleware Stack ──────────────────────────────────────────────

// HTTP header hardening via Helmet (removes X-Powered-By, sets CSP, etc.)
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// JSON body parsing with a strict 16kb request size cap to mitigate DoS payloads
app.use(express.json({ limit: "16kb" }));

// URL-encoded body parsing (e.g., HTML forms)
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ── Route Declarations ───────────────────────────────────────────────────────

// Step 12: AI Gateway – action evaluation and human approval workflow
const gatewayRouter = require("./routes/gateway.routes");

// Step 14: Ledger – tamper-proof AuditLog retrieval
const ledgerRouter = require("./routes/ledger.routes");

// Step 13: Policy-as-Code – declarative enterprise security policies
const policyRouter = require("./routes/policy.routes");

app.use("/api/v1/gateway", gatewayRouter);
app.use("/api/v1/ledger", ledgerRouter);
app.use("/api/v1/policies", policyRouter);

module.exports = app;
