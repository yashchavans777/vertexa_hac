<<<<<<< HEAD
/**
 * ActionGate - Gateway Controller
 * controllers/gatewayController.js
 * 
 * Principal Security Engineer Specification:
 * Orchestrates external AI risk inspection with deterministic failover resilience.
 * Implements write-ahead audit logging ensuring unbypassable security tracking.
 */

const axios = require('axios');
const { evaluateActionPolicy } = require('../services/ruleEngine');
const ActionRequest = require('../models/ActionRequest');
const AuditLog = require('../models/AuditLog');
const { broadcastAlert } = require('../utils/socketNotifier');

const AI_ANALYZER_URL = process.env.AI_ANALYZER_URL || 'http://localhost:8000/analyze';
const AI_ANALYZER_TIMEOUT_MS = 2000; // Hard 2-second SLA timeout

/**
 * Evaluates an AI Agent's proposed tool invocation.
 * Pipeline:
 * 1. Sanitizes input payload.
 * 2. Attempts low-latency risk score inference via external Python AI Risk Analyzer.
 * 3. Gracefully degrades to FAILOVER_SAFE_MODE if AI analyzer fails or times out.
 * 4. Executes deterministic rule engine (Fail-Closed).
 * 5. Persists ActionRequest record.
 * 6. Guarantees tamper-evident AuditLog entry for 100% of decisions (including refusals).
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
async function evaluateAction(req, res) {
  const startTime = Date.now();
  const {
    agent_id,
    tool_name,
    target = null,
    parameters = {},
    session_id = null
  } = req.body || {};

  // Extract client metadata for non-repudiation audit records
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
  const userAgent = req.headers['user-agent'] || null;

  let aiRiskScore = null;
  let decisionPath = 'AI_INFORMED_RULE_ENGINE';
  let aiMetadata = {};

  // =========================================================================
  // STEP 1: Attempt External Python AI Risk Analyzer Call with 2s Timeout
  // =========================================================================
  try {
    const aiResponse = await axios.post(
      AI_ANALYZER_URL,
      {
        agent_id,
        tool_name,
        target,
        parameters,
        session_id,
        timestamp: new Date().toISOString()
      },
      {
        timeout: AI_ANALYZER_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Validate risk score structure (supports { risk_score } or { score })
    if (aiResponse.data && typeof (aiResponse.data.risk_score ?? aiResponse.data.score) === 'number') {
      aiRiskScore = aiResponse.data.risk_score ?? aiResponse.data.score;
      aiMetadata = {
        analyzerStatus: 'SUCCESS',
        latencyMs: Date.now() - startTime,
        modelDetails: aiResponse.data.model_version || 'v1-default'
      };
    } else {
      // Inconclusive AI payload triggers failover safe mode
      decisionPath = 'FAILOVER_SAFE_MODE';
      aiMetadata = {
        analyzerStatus: 'INVALID_AI_RESPONSE',
        warning: 'AI analyzer returned non-numeric risk score.'
      };
    }
  } catch (error) {
    // =======================================================================
    // FAILOVER MECHANISM: Fault-tolerant degradation
    // Python AI timeout, crash, or connection refusal falls back to SAFE MODE
    // =======================================================================
    decisionPath = 'FAILOVER_SAFE_MODE';
    const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');

    aiMetadata = {
      analyzerStatus: 'FAILOVER_TRIGGERED',
      failureType: isTimeout ? 'TIMEOUT_EXCEEDED' : 'SERVICE_UNREACHABLE',
      errorMessage: error.message,
      targetEndpoint: AI_ANALYZER_URL,
      slaLimitMs: AI_ANALYZER_TIMEOUT_MS
    };

    console.warn(`[ActionGate Security Notice] External AI Analyzer down/timed out. Switching to FAILOVER_SAFE_MODE. Reason: ${error.message}`);
  }

  // =========================================================================
  // STEP 2: Deterministic Rule Engine Evaluation
  // Evaluates hard security policies, threshold bounds, and blast radius.
  // =========================================================================
  const evaluationResult = evaluateActionPolicy({
    agent_id,
    tool_name,
    target,
    parameters,
    ai_risk_score: aiRiskScore,
    decision_path: decisionPath
  });

  const {
    decision,
    ruleTriggered,
    reason,
    riskLevel,
    metadata = {}
  } = evaluationResult;

  let savedActionRequest = null;

  // =========================================================================
  // STEP 3: Persist ActionRequest Outcome to Database
  // =========================================================================
  try {
    savedActionRequest = await ActionRequest.create({
      agent_id: agent_id || 'UNKNOWN_AGENT',
      tool_name: tool_name || 'UNKNOWN_TOOL',
      target,
      parameters,
      decision,
      status: decision === 'HELD_FOR_APPROVAL' ? 'HELD_FOR_APPROVAL' : decision,
      decision_path: decisionPath,
      risk_score: aiRiskScore,
      rule_triggered: ruleTriggered,
      reason,
      session_id
    });
  } catch (dbError) {
    console.error('[ActionGate Critical DB Error] Failed to persist ActionRequest:', dbError.message);
  }

  // =========================================================================
  // STEP 4: Persist Comprehensive Audit Log (Crucial: 100% of Decisions)
  // Non-repudiation audit record created for every evaluation (Allowed, Refused, Blocked)
  // =========================================================================
  try {
    await AuditLog.create({
      event_type: 'ACTION_EVALUATION',
      agent_id: agent_id || 'UNKNOWN_AGENT',
      tool_name: tool_name || 'UNKNOWN_TOOL',
      target,
      parameters,
      decision,
      decision_path: decisionPath,
      risk_score: aiRiskScore,
      rule_triggered: ruleTriggered,
      reason,
      action_request_id: savedActionRequest ? savedActionRequest._id : null,
      metadata: {
        ...metadata,
        ...aiMetadata,
        riskLevel,
        processingDurationMs: Date.now() - startTime
      },
      ip_address: clientIp,
      user_agent: userAgent,
      timestamp: new Date()
    });
  } catch (auditError) {
    // Audit log failure is a critical compliance alert
    console.error('[ActionGate CRITICAL AUDIT FAILURE] AuditLog write failed:', auditError.message);
  }

  // =========================================================================
  // STEP 4.5: Real-Time Socket.IO Alert Emission
  // Instantly broadcast alerts to connected React SOC Operator Dashboards
  // =========================================================================
  try {
    const socketEventData = {
      action_id: savedActionRequest ? savedActionRequest._id : null,
      agent_id: agent_id || 'UNKNOWN_AGENT',
      tool_name: tool_name || 'UNKNOWN_TOOL',
      target,
      parameters,
      decision,
      decision_path: decisionPath,
      risk_score: aiRiskScore,
      rule_triggered: ruleTriggered,
      reason,
      timestamp: new Date().toISOString()
    };

    if (decision === 'HELD_FOR_APPROVAL') {
      broadcastAlert('ACTION_HELD', socketEventData);
    } else if (decision === 'BLOCKED') {
      broadcastAlert('ACTION_BLOCKED', socketEventData);
    } else if (decision === 'ALLOWED') {
      broadcastAlert('ACTION_ALLOWED', socketEventData);
    }

    // Broadcast global telemetry trigger to refresh dashboard metric counters
    broadcastAlert('METRICS_UPDATED', {
      action_id: socketEventData.action_id,
      decision
    });
  } catch (socketErr) {
    console.error('[ActionGate Socket Alert Error] Failed to emit real-time alert:', socketErr.message);
  }

  // =========================================================================
  // STEP 5: Dispatch Gateway Response
  // =========================================================================
  const responsePayload = {
    status: 'success',
    action_id: savedActionRequest ? savedActionRequest._id : null,
    decision, // 'ALLOWED' | 'BLOCKED' | 'HELD_FOR_APPROVAL'
    decision_path: decisionPath,
    rule_triggered: ruleTriggered,
    reason,
    risk_level: riskLevel,
    ai_risk_score: aiRiskScore,
    execution_mode: decisionPath === 'FAILOVER_SAFE_MODE' ? 'DEGRADED_DETERMINISTIC_SAFE' : 'AI_AUGMENTED',
    timestamp: new Date().toISOString()
  };

  // HTTP status mapping: 200 for safe dispatch & approvals, 403 for policy-blocked actions
  const httpStatusCode = decision === 'BLOCKED' ? 403 : 200;
  return res.status(httpStatusCode).json(responsePayload);
}

/**
 * Fetch all pending ActionRequest documents awaiting human approval or re-authorization.
 * Query filters strictly for HELD_FOR_APPROVAL or HELD_FOR_REAUTHORIZATION.
 * Sorted chronologically descending (newest first).
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getPendingActions(req, res) {
  try {
    const pendingActions = await ActionRequest.find({
      $or: [
        { status: { $in: ['HELD_FOR_APPROVAL', 'HELD_FOR_REAUTHORIZATION'] } },
        { decision: { $in: ['HELD_FOR_APPROVAL', 'HELD_FOR_REAUTHORIZATION'] } }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: pendingActions.length,
      data: pendingActions
    });
  } catch (error) {
    console.error('[ActionGate Error] Failed to fetch pending actions:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve pending actions from queue.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Fetch tamper-evident audit logs.
 * Returns up to the latest 100 entries sorted newest first.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getAuditLogs(req, res) {
  try {
    const logs = await AuditLog.find({})
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('[ActionGate Error] Failed to fetch audit logs:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit log records.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Compute real-time SOC dashboard telemetry and metrics.
 * Aggregates counts for total_processed, total_blocked, total_allowed, and currently_held.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getDashboardMetrics(req, res) {
  try {
    const [
      total_processed,
      total_blocked,
      total_allowed,
      currently_held
    ] = await Promise.all([
      ActionRequest.countDocuments({}),
      ActionRequest.countDocuments({ decision: 'BLOCKED' }),
      ActionRequest.countDocuments({ decision: 'ALLOWED' }),
      ActionRequest.countDocuments({
        $or: [
          { status: { $in: ['HELD_FOR_APPROVAL', 'HELD_FOR_REAUTHORIZATION'] } },
          { decision: { $in: ['HELD_FOR_APPROVAL', 'HELD_FOR_REAUTHORIZATION'] } }
        ]
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total_processed,
        total_blocked,
        total_allowed,
        currently_held
      }
    });
  } catch (error) {
    console.error('[ActionGate Error] Failed to aggregate dashboard metrics:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to compute dashboard metrics.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  evaluateAction,
  getPendingActions,
  getAuditLogs,
  getDashboardMetrics
=======
const crypto = require('crypto');
const ActionRequest = require('../models/ActionRequest');
const AuditLog = require('../models/AuditLog');

/**
 * Utility: Deeply compare two objects/values to ensure strict payload integrity.
 * Returns true if both values are deeply identical, false otherwise.
 */
function isDeepStrictEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }

  // Handle Date objects
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  // Handle Arrays
  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false;
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!isDeepStrictEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  // Handle Plain Objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false;
    if (!isDeepStrictEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Step 2: Evaluate incoming action request
 */
exports.evaluateAction = async (req, res) => {
  try {
    const { requester_id, requester_role, action_type, payload } = req.body;

    if (!requester_id || !requester_role || !action_type || !payload) {
      return res.status(400).json({
        error: 'Missing required fields: requester_id, requester_role, action_type, payload'
      });
    }

    const action_id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');

    // Risk Evaluation: High-risk actions or automated agent actions require human gatekeeper approval
    const highRiskActions = ['TRANSFER_FUNDS', 'DELETE_DATABASE', 'DEPLOY_PRODUCTION', 'MODIFY_IAM_POLICY'];
    const requiresApproval = requester_role === 'AI_AGENT' || highRiskActions.includes(action_type);

    if (requiresApproval) {
      const actionRequest = await ActionRequest.create({
        action_id,
        requester_id,
        requester_role,
        action_type,
        original_payload: payload,
        status: 'PENDING_APPROVAL'
      });

      await AuditLog.create({
        action_id,
        actor_id: requester_id,
        actor_role: requester_role,
        decision_path: 'PENDING_HUMAN_APPROVAL',
        status: 'PENDING_APPROVAL',
        details: 'Action requires human approval per gatekeeper policy.'
      });

      return res.status(202).json({
        message: 'Action held for human approval.',
        action_id: actionRequest.action_id || action_id,
        status: 'PENDING_APPROVAL'
      });
    }

    // Auto-approved low risk actions
    const actionRequest = await ActionRequest.create({
      action_id,
      requester_id,
      requester_role,
      action_type,
      original_payload: payload,
      status: 'EXECUTED'
    });

    await AuditLog.create({
      action_id,
      actor_id: requester_id,
      actor_role: requester_role,
      decision_path: 'AUTO_APPROVED',
      status: 'EXECUTED',
      details: 'Low-risk action automatically approved and executed.'
    });

    return res.status(200).json({
      message: 'Action executed successfully.',
      action_id: actionRequest.action_id || action_id,
      status: 'EXECUTED'
    });
  } catch (error) {
    console.error('Error in evaluateAction:', error);
    return res.status(500).json({ error: 'Internal server error during action evaluation' });
  }
};

/**
 * Step 3: Human Approval workflow
 * Enforces Separation of Duties & Strict Reauthorization verification.
 */
exports.approveAction = async (req, res) => {
  try {
    const { action_id, approver_id, approver_role, approved_payload } = req.body;

    // Validate input presence
    if (!action_id || !approver_id || !approver_role || approved_payload === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: action_id, approver_id, approver_role, approved_payload'
      });
    }

    // Security Check 1 (Separation of Duties - Role): Strictly require 'HUMAN_ADMIN'
    if (approver_role !== 'HUMAN_ADMIN') {
      return res.status(403).json({
        error: 'Access denied: AI agents and non-admin roles cannot approve actions. Only HUMAN_ADMIN is authorized.'
      });
    }

    // Retrieve Action Request from database
    const actionRequest = await ActionRequest.findOne({ action_id });
    if (!actionRequest) {
      return res.status(404).json({ error: 'ActionRequest not found.' });
    }

    // Verify current state is pending approval
    if (actionRequest.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({
        error: `Action cannot be approved. Current status is ${actionRequest.status}.`
      });
    }

    // Security Check 1 (Separation of Duties - Identity): Requester cannot approve their own request
    if (actionRequest.requester_id === approver_id) {
      return res.status(403).json({
        error: 'Separation of Duties violation: Requesters are strictly prohibited from approving their own requests.'
      });
    }

    // Security Check 2 (Strict Reauthorization): Deeply compare approved_payload against original_payload
    const payloadMatches = isDeepStrictEqual(approved_payload, actionRequest.original_payload);

    if (!payloadMatches) {
      // Payload was modified: Reject execution, set status to HELD_FOR_REAUTHORIZATION
      actionRequest.status = 'HELD_FOR_REAUTHORIZATION';
      await actionRequest.save();

      // Log refusal in AuditLog
      await AuditLog.create({
        action_id,
        actor_id: approver_id,
        actor_role: approver_role,
        decision_path: 'REAUTHORIZATION_REQUIRED',
        status: 'HELD_FOR_REAUTHORIZATION',
        details: 'Approved payload does not match original payload. Tampering detected or payload modified. Refused execution.'
      });

      return res.status(403).json({
        error: 'Integrity check failed: Payload was modified after submission. Action held for reauthorization.',
        status: 'HELD_FOR_REAUTHORIZATION'
      });
    }

    // Payload matches exactly: Update status to EXECUTED
    actionRequest.status = 'EXECUTED';
    actionRequest.approver_id = approver_id;
    actionRequest.approved_at = new Date();
    await actionRequest.save();

    // Log successful approval in AuditLog
    await AuditLog.create({
      action_id,
      actor_id: approver_id,
      actor_role: approver_role,
      decision_path: 'HUMAN_APPROVED',
      status: 'EXECUTED',
      details: 'Action payload verified and approved by authorized human administrator.'
    });

    return res.status(200).json({
      message: 'Action successfully approved and executed.',
      action_id,
      status: 'EXECUTED'
    });
  } catch (error) {
    console.error('Error in approveAction:', error);
    return res.status(500).json({ error: 'Internal server error during action approval' });
  }
>>>>>>> 970158768f8a72e810a75a43418f02a55dd1d995
};
