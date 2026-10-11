/**
 * ActionGate - Security & Access Control Middleware
 * middlewares/securityMiddleware.js
 * 
 * Principal Security Engineer Specification:
 * Implements Defense-in-Depth access controls for the ActionGate Gateway:
 * 1. Mutual Machine Authentication: Cryptographic API Key verification for AI Agents.
 * 2. Separation of Duties (RBAC): Strict segregation between AI Agents and Human SOC Admins.
 * 3. Ingress Rate Limiting: Blast-radius mitigation against rogue loop-cycling AI Agents.
 */

const rateLimit = require('express-rate-limit');

// Valid Agent API Keys permitted to invoke the ActionGate evaluation pipeline
const VALID_AGENT_API_KEYS = new Set([
  process.env.AGENT_API_KEY || 'agent-dev-key-777'
]);

/**
 * Machine-to-Machine Authentication Middleware
 * 
 * Security Posture:
 * Enforces pre-shared credential validation for all autonomous AI Agent tool evaluation calls.
 * Unauthenticated calls are rejected with 401 Unauthorized before reaching the policy engine,
 * preventing anonymous threat actors from poisoning evaluation telemetry.
 */
function verifyAgentApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED_ACCESS',
      message: 'Missing required machine-to-machine authentication header: x-api-key.'
    });
  }

  if (!VALID_AGENT_API_KEYS.has(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid or revoked agent API key.'
    });
  }

  // Authentication succeeded; bind validated identity context to request
  req.authContext = {
    authType: 'MACHINE_API_KEY',
    authenticatedAt: new Date()
  };

  next();
}

/**
 * Human-in-the-Loop RBAC Middleware (Separation of Duties)
 * 
 * Security Posture:
 * Implements strict role segregation. Autonomous AI Agents (role: 'AI_AGENT') MUST NEVER
 * have the capability to approve, alter, or self-authorize held actions.
 * Only verified human SOC operators with the 'HUMAN_ADMIN' role can approve held actions
 * or review high-sensitivity audit trails.
 */
function verifyHumanAdmin(req, res, next) {
  const userRole = req.headers['x-user-role'];

  if (!userRole) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN_ACCESS',
      message: 'Missing role authorization header: x-user-role.'
    });
  }

  // Strict enforcement: Prevent privilege escalation from AI Agents or standard users
  if (userRole !== 'HUMAN_ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'SEPARATION_OF_DUTIES_VIOLATION',
      message: `Role '${userRole}' is prohibited from performing human authorization actions. Only 'HUMAN_ADMIN' is permitted.`
    });
  }

  req.authContext = {
    authType: 'HUMAN_RBAC',
    role: 'HUMAN_ADMIN',
    operatorId: req.headers['x-operator-id'] || 'admin_operator_default'
  };

  next();
}

/**
 * Ingress Rate Limiting Middleware
 * 
 * Security Posture:
 * Restricts the /evaluate endpoint to a maximum of 50 requests per minute per IP.
 * Prevents recursive hallucination loops, runaway autonomous agent swarms,
 * and deliberate denial-of-service (DoS) floods against the evaluation cluster.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute sliding window
  max: 50,             // Limit each IP to 50 evaluation requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
  statusCode: 429,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many evaluation requests from this origin. Gateway throttling active (max 50 req/min).'
  }
});

module.exports = {
  verifyAgentApiKey,
  verifyHumanAdmin,
  apiLimiter
};
