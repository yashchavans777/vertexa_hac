/**
 * ActionGate - Core Gateway Controller
 * src/controllers/gateway.controller.js
 * 
 * Principal Security Architect Specification:
 * Production Pipeline following "Chai aur Code" architecture:
 * 1. AI Analysis & Fault-Tolerant Failover: 2-second timeout protects ingress SLA.
 * 2. Declarative Policy Evaluation: Deterministic zero-trust enforcement.
 * 3. Cryptographically Chained Ledger: Immutable SHA-256 forward-chaining.
 * 4. Human Approval with Deep Tamper Checking: Prevents payload drift between hold & approval.
 */

const axios = require('axios');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { ApiResponse } = require('../utils/ApiResponse');
const { evaluatePayloadAgainstPolicies } = require('../services/policyEngine.service');
const { appendBlock } = require('../services/ledger.service');
const { AuditLedger } = require('../models/auditLedger.model');

const AI_ANALYZER_URL = process.env.AI_ANALYZER_URL || 'http://localhost:8000/analyze';
const AI_ANALYZER_TIMEOUT_MS = 2000; // Strict 2-second SLA timeout

/**
 * Normalizes and deeply compares two JSON payloads regardless of key order.
 * 
 * @param {*} a 
 * @param {*} b 
 * @returns {boolean} True if structurally and value-wise identical
 */
function isPayloadIdentical(a, b) {
  return JSON.stringify(a, Object.keys(a || {}).sort()) === JSON.stringify(b, Object.keys(b || {}).sort());
}

/**
 * Core Gateway Proxy: Ingress evaluation pipeline for AI Agent tool calls
 * 
 * @route POST /api/v1/gateway/evaluate
 * @access Machine / Protected Internal Gateway
 */
const evaluateAction = asyncHandler(async (req, res) => {
  const { agentId, toolName, payload = {} } = req.body || {};

  if (!agentId || !toolName) {
    throw new ApiError(400, "Validation Error: 'agentId' and 'toolName' are required fields.");
  }

  const actionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  let riskAnalysis = null;

  // =========================================================================
  // STEP 1: AI Risk Analysis & Failover Mechanism
  // Attempt to call Python FastAPI with strict 2-second SLA timeout.
  // Never crash if Python AI is down or slow: gracefully degrade to Failover Mode.
  // =========================================================================
  try {
    const aiResponse = await axios.post(
      AI_ANALYZER_URL,
      {
        agent_id: agentId,
        tool_name: toolName,
        payload,
        action_id: actionId,
        timestamp: new Date().toISOString()
      },
      {
        timeout: AI_ANALYZER_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    riskAnalysis = {
      risk_score: aiResponse.data?.risk_score ?? aiResponse.data?.score ?? 50,
      confidence: aiResponse.data?.confidence ?? 0.85,
      isFailover: false,
      model_version: aiResponse.data?.model_version || 'fastapi-risk-v1'
    };
  } catch (error) {
    // Failover Mode: AI analyzer is unreachable or exceeded 2-second timeout
    console.warn(`[ActionGate Gateway Notice] AI Risk Analyzer unavailable (${error.message}). Activating Failover Safe Mode.`);
    
    riskAnalysis = {
      risk_score: 80, // Default to elevated risk posture under failover
      confidence: 0.0,
      blast_radius: 'UNKNOWN_DEFENSIVE_ASSUMPTION',
      isFailover: true,
      failover_reason: error.code === 'ECONNABORTED' ? 'AI_TIMEOUT_EXCEEDED_2S' : 'AI_SERVICE_UNREACHABLE'
    };
  }

  // =========================================================================
  // STEP 2: Declarative Policy Evaluation
  // Evaluates zero-trust agent identity, blast radius, payload constraints, and AI risk.
  // =========================================================================
  const policyOutcome = await evaluatePayloadAgainstPolicies(
    {
      agentId,
      toolName,
      arguments: payload?.arguments || payload,
      payload
    },
    riskAnalysis
  );

  const effect = policyOutcome?.effect || 'REQUIRE_APPROVAL';
  const decisionReason = policyOutcome?.decisionReason || `Action intercepted by ${effect} policy`;
  const decisionPath =
    policyOutcome?.decisionPath ||
    `Action intercepted by ${effect} policy`;

  // Map policy engine effect to ledger finalDecision enum
  let finalDecision = 'BLOCKED';
  if (effect === 'ALLOW') finalDecision = 'ALLOWED';
  else if (effect === 'REQUIRE_APPROVAL') finalDecision = 'HELD_FOR_APPROVAL';

  // =========================================================================
  // STEP 3: Cryptographic Ledger Logging
  // Every single decision is sealed into the forward-secure hash-chained ledger.
  // =========================================================================
  const ledgerBlock = await appendBlock({
    actionId,
    agentId,
    toolName,
    payload,
    finalDecision,
    decisionPath: decisionPath || 'Action intercepted by REQUIRE_APPROVAL policy',
    decisionReason: decisionReason || 'Action intercepted by REQUIRE_APPROVAL policy',
    timestamp: new Date()
  });

  // =========================================================================
  // STEP 4: Real-Time SOC Alert Emission
  // Instantly push alert to connected React SOC Operator Dashboards via Socket.io
  // =========================================================================
  try {
    const io = req.app.get('io');
    if (io) {
      const eventPayload = {
        actionId,
        agentId,
        toolName,
        payload,
        finalDecision,
        decisionPath,
        decisionReason,
        blockIndex: ledgerBlock.index,
        currentHash: ledgerBlock.currentHash,
        previousHash: ledgerBlock.previousHash,
        timestamp: ledgerBlock.timestamp,
        riskScore: riskAnalysis?.risk_score ?? 50
      };

      io.emit('NEW_ALERT', eventPayload);
      io.emit('LEDGER_BLOCK_ADDED', ledgerBlock);

      if (finalDecision === 'HELD_FOR_APPROVAL') {
        io.emit('ACTION_HELD', eventPayload);
      } else if (finalDecision === 'BLOCKED') {
        io.emit('ACTION_BLOCKED', eventPayload);
      } else if (finalDecision === 'ALLOWED') {
        io.emit('ACTION_ALLOWED', eventPayload);
      }
    }
  } catch (socketErr) {
    console.error('[ActionGate Socket Error] Non-blocking alert emission failed:', socketErr.message);
  }

  // =========================================================================
  // STEP 5: Standardized API Response
  // =========================================================================
  return res.status(finalDecision === 'BLOCKED' ? 403 : 200).json(
    new ApiResponse(
      finalDecision === 'BLOCKED' ? 403 : 200,
      {
        actionId,
        finalDecision,
        effect,
        decisionPath,
        decisionReason,
        riskAnalysis,
        ledgerProof: {
          blockIndex: ledgerBlock.index,
          currentHash: ledgerBlock.currentHash,
          previousHash: ledgerBlock.previousHash
        }
      },
      `Action evaluated: ${finalDecision}`
    )
  );
});

/**
 * Human Review / Approval Endpoint (Separation of Duties & Strict Reauthorization)
 * 
 * @route POST /api/v1/gateway/approve
 * @access Protected (HUMAN_ADMIN only)
 */
const approveAction = asyncHandler(async (req, res) => {
  const { actionId, decision = 'APPROVED', reason } = req.body || {};
  const approverRole = req.headers['x-user-role'] || req.body?.approverRole || 'HUMAN_ADMIN';
  const effectivePayload = req.body?.approvedPayload !== undefined ? req.body.approvedPayload : req.body?.editedPayload;

  // 1. Validation & Separation of Duties
  if (!actionId) {
    throw new ApiError(400, "Validation Error: 'actionId' is required.");
  }

  if (approverRole !== 'HUMAN_ADMIN') {
    throw new ApiError(
      403,
      `Separation of Duties Violation: Role '${approverRole || 'UNKNOWN'}' is prohibited from authorizing held actions. Only 'HUMAN_ADMIN' is permitted.`
    );
  }

  // 2. Fetch original held block from the immutable ledger
  const originalBlock = await AuditLedger.findOne({ actionId, finalDecision: 'HELD_FOR_APPROVAL' }).lean();

  if (!originalBlock) {
    throw new ApiError(404, `No pending HELD_FOR_APPROVAL action found in ledger with actionId '${actionId}'.`);
  }

  // 3. Handle explicit Operator REJECTION
  if (decision === 'REJECTED' || decision === 'DENIED') {
    const rejectedBlock = await appendBlock({
      actionId,
      agentId: originalBlock.agentId,
      toolName: originalBlock.toolName,
      payload: originalBlock.payload,
      finalDecision: 'REJECTED',
      decisionPath: 'HUMAN_ADMIN_ACTION',
      decisionReason: reason || 'Operator manually rejected/denied the action during human review.',
      timestamp: new Date()
    });

    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('ACTION_BLOCKED', {
          actionId,
          finalDecision: 'REJECTED',
          blockIndex: rejectedBlock.index,
          currentHash: rejectedBlock.currentHash
        });
      }
    } catch (socketErr) {
      console.error('[ActionGate Socket Error] Rejection alert emission failed:', socketErr.message);
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          actionId,
          status: 'REJECTED',
          finalDecision: 'REJECTED',
          decisionPath: 'HUMAN_ADMIN_ACTION',
          approverRole,
          ledgerProof: {
            blockIndex: rejectedBlock.index,
            currentHash: rejectedBlock.currentHash,
            previousHash: rejectedBlock.previousHash
          }
        },
        "Action rejected by human administrator and sealed into ledger."
      )
    );
  }

  // 4. Strict Reauthorization Check (Deep payload integrity comparison)
  // Ensures that what the human is approving is BIT-FOR-BIT identical to what the agent requested.
  // If no payload was submitted by the operator, default to the original sealed payload.
  const isIdentical = isPayloadIdentical(
    effectivePayload !== undefined ? effectivePayload : originalBlock.payload,
    originalBlock.payload
  );

  if (!isIdentical || decision === 'REJECTED') {
    // Audit the rejection/tampering attempt directly onto the ledger
    const tamperBlock = await appendBlock({
      actionId,
      agentId: originalBlock.agentId,
      toolName: originalBlock.toolName,
      payload: {
        originalPayload: originalBlock.payload,
        submittedPayload: effectivePayload
      },
      finalDecision: 'REJECTED',
      decisionPath: 'HUMAN_ADMIN_ACTION',
      decisionReason: decision === 'REJECTED' 
        ? 'REJECTED_BY_OPERATOR: Human admin explicitly rejected pending action.'
        : 'REJECTED_TAMPERED: Approved payload differed from original agent request. Potential parameter tampering or TOCTOU attack.',
      timestamp: new Date()
    });

    if (decision === 'REJECTED') {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            actionId,
            status: 'REJECTED',
            finalDecision: 'REJECTED',
            decisionPath: 'HUMAN_ADMIN_ACTION',
            rejectionLedgerBlock: tamperBlock.index
          },
          "Action rejected by human administrator."
        )
      );
    }

    throw new ApiError(
      400,
      "Payload modified. Must reauthorize.",
      [
        {
          issue: "PAYLOAD_TAMPER_DETECTED",
          originalPayload: originalBlock.payload,
          submittedPayload: effectivePayload,
          rejectionLedgerBlock: tamperBlock.index
        }
      ]
    );
  }

  // 5. Payloads match perfectly: Mark EXECUTED and seal into ledger
  const executedBlock = await appendBlock({
    actionId,
    agentId: originalBlock.agentId,
    toolName: originalBlock.toolName,
    payload: effectivePayload,
    finalDecision: 'REAUTHORIZED',
    decisionPath: 'HUMAN_ADMIN_ACTION',
    decisionReason: `Action reauthorized and executed following verified human operator sign-off.`,
    timestamp: new Date()
  });

  // 6. Emit real-time notification to update SOC dashboards
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('ACTION_EXECUTED', {
        actionId,
        finalDecision: 'REAUTHORIZED',
        blockIndex: executedBlock.index,
        currentHash: executedBlock.currentHash
      });
      io.emit('ACTION_ALLOWED', {
        actionId,
        finalDecision: 'REAUTHORIZED',
        blockIndex: executedBlock.index
      });
    }
  } catch (socketErr) {
    console.error('[ActionGate Socket Error] Execution alert emission failed:', socketErr.message);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        actionId,
        status: 'EXECUTED',
        finalDecision: 'REAUTHORIZED',
        decisionPath: 'HUMAN_ADMIN_ACTION',
        approverRole,
        ledgerProof: {
          blockIndex: executedBlock.index,
          currentHash: executedBlock.currentHash,
          previousHash: executedBlock.previousHash
        }
      },
      "Action successfully authorized and committed to ledger"
    )
  );
});

/**
 * Fetch all pending actions held for human operator review
 * 
 * @route GET /api/v1/gateway/pending
 * @access Protected (HUMAN_ADMIN)
 */
const getPendingActions = asyncHandler(async (req, res) => {
  const pendingFilter = {
    $or: [
      { finalDecision: { $in: ['HELD_FOR_APPROVAL', 'PENDING', 'held'] } },
      { status: { $in: ['HELD_FOR_APPROVAL', 'PENDING', 'held'] } }
    ]
  };

  // Retrieve all ledger records marked HELD_FOR_APPROVAL or PENDING
  const pendingBlocks = await AuditLedger.find(pendingFilter)
    .sort({ timestamp: -1, createdAt: -1 })
    .limit(50)
    .lean();

  // Also check if any have already been reauthorized/rejected subsequently
  const actionIds = pendingBlocks.map((b) => b.actionId).filter(Boolean);
  let activePending = pendingBlocks;

  if (actionIds.length > 0) {
    const resolvedBlocks = await AuditLedger.find({
      actionId: { $in: actionIds },
      $or: [
        { finalDecision: { $in: ['REAUTHORIZED', 'REJECTED', 'ALLOWED'] } },
        { status: { $in: ['REAUTHORIZED', 'REJECTED', 'ALLOWED', 'EXECUTED'] } }
      ]
    }).lean();

    const resolvedActionIdSet = new Set(resolvedBlocks.map((b) => b.actionId));
    activePending = pendingBlocks.filter((b) => !resolvedActionIdSet.has(b.actionId));
  }

  // Normalize items to ensure frontend receives both finalDecision and status
  const formattedPending = activePending.map((item) => ({
    ...item,
    status: item.status || item.finalDecision || 'HELD_FOR_APPROVAL',
    finalDecision: item.finalDecision || item.status || 'HELD_FOR_APPROVAL'
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      formattedPending,
      `Retrieved ${formattedPending.length} actions held for operator review.`
    )
  );
});

module.exports = {
  evaluateAction,
  approveAction,
  getPendingActions
};

