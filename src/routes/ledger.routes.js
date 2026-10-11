/**
 * ActionGate - Cryptographic Ledger Route Registry
 * src/routes/ledger.routes.js
 * 
 * Exposes endpoints for paginated chain retrieval, integrity verification,
 * and deliberate tamper demonstration for the SOC dashboard.
 */
const express = require('express');
const router = express.Router();
const {
  getLedgerChain,
  verifyAuditIntegrity,
  simulateTamperTest
} = require('../controllers/ledger.controller');

/**
 * @route   GET /api/v1/ledger
 * @route   GET /api/v1/ledger/blocks
 * @desc    Fetch paginated cryptographic audit blocks
 */
router.get('/', getLedgerChain);
router.get('/blocks', getLedgerChain);

/**
 * @route   GET /api/v1/ledger/verify
 * @desc    Traverse the ledger and verify cryptographic SHA-256 forward-chaining
 */
router.get('/verify', verifyAuditIntegrity);

/**
 * @route   POST /api/v1/ledger/simulate-tamper
 * @route   GET  /api/v1/ledger/simulate-tamper
 * @desc    Deliberately corrupt a database block to demonstrate mathematical tamper detection
 */
router.post('/simulate-tamper', simulateTamperTest);
router.get('/simulate-tamper', simulateTamperTest);

module.exports = router;

