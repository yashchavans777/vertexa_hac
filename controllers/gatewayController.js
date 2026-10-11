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
};
