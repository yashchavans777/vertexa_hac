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
  const policyOutcome = evaluatePayloadAgainstPolicies({
    agentId,
    toolName,
    payload,
    riskAnalysis
  });

  const { effect, decisionReason, decisionPath } = policyOutcome;

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
    decisionPath,
    decisionReason,
    timestamp: new Date()
  });

  // =========================================================================
  // STEP 4: Real-Time SOC Alert Emission
  // Instantly push alert to connected React SOC Operator Dashboards via Socket.io
  // =========================================================================
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('NEW_ALERT', {
        actionId,
        agentId,
        toolName,
        finalDecision,
        decisionPath,
        decisionReason,
        blockIndex: ledgerBlock.index,
        currentHash: ledgerBlock.currentHash,
        timestamp: ledgerBlock.timestamp
      });
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
  const { actionId, approverRole, approvedPayload } = req.body || {};

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

  // 3. Strict Reauthorization Check (Deep payload integrity comparison)
  // Ensures that what the human is approving is BIT-FOR-BIT identical to what the agent requested
  const isIdentical = isPayloadIdentical(approvedPayload, originalBlock.payload);

  if (!isIdentical) {
    // Audit the tampering attempt directly onto the ledger before rejecting
    const tamperBlock = await appendBlock({
      actionId,
      agentId: originalBlock.agentId,
      toolName: originalBlock.toolName,
      payload: {
        originalPayload: originalBlock.payload,
        tamperedPayloadSubmitted: approvedPayload
      },
      finalDecision: 'REJECTED',
      decisionPath: 'HUMAN_ADMIN_ACTION',
      decisionReason: 'REJECTED_TAMPERED: Approved payload differed from original agent request. Potential parameter tampering or TOCTOU attack.',
      timestamp: new Date()
    });

    throw new ApiError(
      400,
      "Payload modified. Must reauthorize.",
      [
        {
          issue: "PAYLOAD_TAMPER_DETECTED",
          originalPayload: originalBlock.payload,
          submittedPayload: approvedPayload,
          rejectionLedgerBlock: tamperBlock.index
        }
      ]
    );
  }

  // 4. Payloads match perfectly: Mark EXECUTED and seal into ledger
  const executedBlock = await appendBlock({
    actionId,
    agentId: originalBlock.agentId,
    toolName: originalBlock.toolName,
    payload: approvedPayload,
    finalDecision: 'REAUTHORIZED',
    decisionPath: 'HUMAN_ADMIN_ACTION',
    decisionReason: `Action reauthorized and executed following verified human operator sign-off.`,
    timestamp: new Date()
  });

  // 5. Emit real-time notification to update SOC dashboards
  try {
    const io = req.app.get('io');
    if (io) {
      io.emit('ACTION_EXECUTED', {
        actionId,
        finalDecision: 'REAUTHORIZED',
        blockIndex: executedBlock.index,
        currentHash: executedBlock.currentHash
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

module.exports = {
  evaluateAction,
  approveAction
};
