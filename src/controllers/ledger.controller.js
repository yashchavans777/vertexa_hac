/**
 * ActionGate - Cryptographic Ledger Controller
 * src/controllers/ledger.controller.js
 * 
 * Production Pattern:
 * Employs asyncHandler, ApiResponse, and ApiError exclusively.
 * Exposes endpoints for paginated chain retrieval, live integrity proofs,
 * and deliberate tamper simulation for hackathon jury demonstrations.
 */
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/ApiResponse');
const { ApiError } = require('../utils/ApiError');
const { AuditLedger } = require('../models/auditLedger.model');
const { verifyChainIntegrity } = require('../services/ledger.service');

/**
 * @desc    Get paginated cryptographic audit ledger blocks
 * @route   GET /api/v1/ledger
 * @access  Protected (SOC Admin)
 */
const getLedgerChain = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [blocks, totalCount] = await Promise.all([
    AuditLedger.find({})
      .sort({ index: -1 }) // Newest blocks first for dashboard view
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLedger.countDocuments({})
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Disable browser and intermediary proxy caching completely
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        blocks,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      },
      "Audit ledger chain fetched successfully"
    )
  );
});

/**
 * @desc    Cryptographically verify the mathematical integrity of the forward-chained ledger
 * @route   GET /api/v1/ledger/verify
 * @access  Protected (SOC Admin)
 */
const verifyAuditIntegrity = asyncHandler(async (req, res) => {
  const verificationResult = await verifyChainIntegrity();

  const statusCode = verificationResult.isValid ? 200 : 409;
  const message = verificationResult.isValid
    ? "Cryptographic chain integrity verified. All hashes and links valid."
    : `Chain integrity compromised! Mathematical mismatch detected at block index ${verificationResult.compromisedIndex}.`;

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  return res.status(statusCode).json(
    new ApiResponse(statusCode, verificationResult, message)
  );
});

/**
 * @desc    Simulate ledger tampering by directly mutating a block in MongoDB (Hackathon Demo Feature)
 * @route   POST /api/v1/ledger/simulate-tamper
 * @access  Protected (SOC Admin / Demo Mode)
 */
const simulateTamperTest = asyncHandler(async (req, res) => {
  const { targetIndex, tamperedDecision = 'ALLOWED', tamperedPayload = { tampered: true, malicious_actor: 'bypass_bot' } } = req.body || {};

  // Find candidate block: specified targetIndex or the latest block
  let targetBlock;
  if (typeof targetIndex === 'number') {
    targetBlock = await AuditLedger.findOne({ index: targetIndex });
  } else {
    // Pick the most recent block with index > 0 if available, else index 0
    targetBlock = await AuditLedger.findOne({}).sort({ index: -1 });
  }

  if (!targetBlock) {
    throw new ApiError(404, "No blocks available in the audit ledger to simulate tampering.");
  }

  const originalState = {
    index: targetBlock.index,
    finalDecision: targetBlock.finalDecision,
    payload: targetBlock.payload,
    currentHash: targetBlock.currentHash
  };

  // Directly mutate block data in MongoDB WITHOUT updating currentHash
  // This breaks the cryptographic seal so verifyChainIntegrity() will catch it
  await AuditLedger.updateOne(
    { _id: targetBlock._id },
    {
      $set: {
        finalDecision: tamperedDecision,
        payload: tamperedPayload,
        decisionReason: "TAMPERED_BY_DEMO_EXPLOIT: Unauthorized database row mutation"
      }
    }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tamperedBlockIndex: targetBlock.index,
        originalState,
        tamperedState: {
          index: targetBlock.index,
          finalDecision: tamperedDecision,
          payload: tamperedPayload,
          unalteredStoredHash: targetBlock.currentHash
        },
        instruction: "Click 'Verify Ledger' or call GET /api/v1/ledger/verify to observe mathematical detection."
      },
      `Block #${targetBlock.index} deliberately corrupted in datastore for verification demo.`
    )
  );
});

module.exports = {
  getLedgerChain,
  verifyAuditIntegrity,
  simulateTamperTest
};
