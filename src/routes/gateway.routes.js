/**
 * ActionGate - Core Gateway Route Registry
 * src/routes/gateway.routes.js
 * 
 * Principal Security Architect Specification:
 * Maps ingress action evaluation and human dual-control reauthorization endpoints.
 */

const express = require('express');
const router = express.Router();
const {
  evaluateAction,
  approveAction,
  getPendingActions
} = require('../controllers/gateway.controller');

/**
 * @route   GET /api/v1/gateway/pending
 * @desc    Fetch active actions held for operator authorization
 * @access  Protected (HUMAN_ADMIN)
 */
router.get('/pending', getPendingActions);

/**
 * @route   POST /api/v1/gateway/evaluate
 * @desc    Autonomous AI agent ingress evaluation pipeline (AI Analysis, Policy Engine, Hash-Chained Ledger)
 * @access  Internal Protected Gateway / Machine
 */
router.post('/evaluate', evaluateAction);

/**
 * @route   POST /api/v1/gateway/approve
 * @desc    Human-in-the-loop review and deep reauthorization check (Separation of Duties)
 * @access  Protected (HUMAN_ADMIN only)
 */
router.post('/approve', approveAction);

module.exports = router;
