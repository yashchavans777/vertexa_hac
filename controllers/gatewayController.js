const crypto = require('crypto');
const ActionRequest = require('../models/ActionRequest');
const AuditLog = require('../models/AuditLog');

function isDeepStrictEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }
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
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false;
    if (!isDeepStrictEqual(obj1[key], obj2[key])) return false;
  }
  return true;
}

exports.evaluateAction = async (req, res) => {
  try {
    const { requester_id, agent_id, requester_role, action_type, tool_name, payload, parameters } = req.body || {};
    const finalRequester = requester_id || agent_id;
    const finalTool = action_type || tool_name;
    const finalPayload = payload || parameters || {};

    if (!finalRequester || !finalTool) {
      return res.status(400).json({
        error: 'Missing required fields: agent_id (or requester_id) and tool_name (or action_type)'
      });
    }

    const action_id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const highRiskActions = ['TRANSFER_FUNDS', 'DELETE_DATABASE', 'DEPLOY_PRODUCTION', 'MODIFY_IAM_POLICY', 'drop_database'];
    const requiresApproval = requester_role === 'AI_AGENT' || highRiskActions.includes(finalTool.toUpperCase ? finalTool.toUpperCase() : finalTool);

    if (requiresApproval) {
      const actionRequest = await ActionRequest.create({
        agent_id: finalRequester,
        tool_name: finalTool,
        parameters: finalPayload,
        status: 'PENDING',
        decision: 'HELD_FOR_APPROVAL'
      });

      await AuditLog.create({
        action_id: actionRequest._id,
        agent_id: finalRequester,
        tool_name: finalTool,
        decision: 'HELD_FOR_APPROVAL',
        final_decision: 'Held',
        decision_reason: 'Action requires human approval per gatekeeper policy.',
        decision_path: 'AI_INFORMED_RULE_ENGINE',
        original_payload: finalPayload
      });

      return res.status(202).json({
        message: 'Action held for human approval.',
        action_id: actionRequest._id,
        status: 'PENDING'
      });
    }

    const actionRequest = await ActionRequest.create({
      agent_id: finalRequester,
      tool_name: finalTool,
      parameters: finalPayload,
      status: 'EXECUTED',
      decision: 'ALLOWED'
    });

    await AuditLog.create({
      action_id: actionRequest._id,
      agent_id: finalRequester,
      tool_name: finalTool,
      decision: 'ALLOWED',
      final_decision: 'Allowed',
      decision_reason: 'Low-risk action automatically approved and executed.',
      decision_path: 'AUTO_APPROVED',
      original_payload: finalPayload
    });

    return res.status(200).json({
      message: 'Action executed successfully.',
      action_id: actionRequest._id,
      status: 'EXECUTED'
    });
  } catch (error) {
    console.error('Error in evaluateAction:', error);
    return res.status(500).json({ error: 'Internal server error during action evaluation' });
  }
};

exports.approveAction = async (req, res) => {
  try {
    const { action_id, approver_id, approver_role, approved_payload } = req.body || {};

    if (!action_id || !approver_id || !approver_role || approved_payload === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: action_id, approver_id, approver_role, approved_payload'
      });
    }

    if (approver_role !== 'HUMAN_ADMIN') {
      return res.status(403).json({
        error: 'Access denied: AI agents and non-admin roles cannot approve actions. Only HUMAN_ADMIN is authorized.'
      });
    }

    const actionRequest = await ActionRequest.findById(action_id);
    if (!actionRequest) {
      return res.status(404).json({ error: 'ActionRequest not found.' });
    }

    if (actionRequest.agent_id === approver_id) {
      return res.status(403).json({
        error: 'Separation of Duties violation: Requesters are strictly prohibited from approving their own requests.'
      });
    }

    const originalPayload = actionRequest.parameters || actionRequest.payload || {};
    const payloadMatches = isDeepStrictEqual(approved_payload, originalPayload);

    if (!payloadMatches) {
      actionRequest.status = 'HELD_FOR_REAUTHORIZATION';
      actionRequest.decision = 'BLOCKED';
      await actionRequest.save();

      await AuditLog.create({
        action_id: actionRequest._id,
        agent_id: approver_id,
        decision: 'BLOCKED',
        final_decision: 'Blocked',
        decision_path: 'REAUTHORIZATION_REQUIRED',
        decision_reason: 'Approved payload does not match original payload. Refused execution.',
        original_payload: approved_payload
      });

      return res.status(403).json({
        error: 'Integrity check failed: Payload was modified after submission. Action held for reauthorization.',
        status: 'HELD_FOR_REAUTHORIZATION'
      });
    }

    actionRequest.status = 'EXECUTED';
    actionRequest.decision = 'ALLOWED';
    await actionRequest.save();

    await AuditLog.create({
      action_id: actionRequest._id,
      agent_id: approver_id,
      decision: 'ALLOWED',
      final_decision: 'Allowed',
      decision_path: 'HUMAN_APPROVED',
      decision_reason: 'Action verified and approved by authorized human administrator.',
      original_payload: approved_payload
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
