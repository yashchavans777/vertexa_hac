/**
 * ActionGate - Core Deterministic Policy Engine
 * services/ruleEngine.js
 * 
 * Principal Security Engineer Specification:
 * Implements strict zero-trust boundary verification for AI Agent tool calls.
 * Evaluates agent identities, tool classifications, destructive risk tiers,
 * and payload constraints with defense-in-depth safety guarantees.
 */

// Known registered agents permitted to interact with ActionGate
const KNOWN_AGENTS = new Set([
  'agent_finance_v1',
  'agent_support_v2',
  'agent_devops_v1',
  'agent_auditor_v1',
  'agent_security_guard'
]);

// Classification of Tool Capabilities & Blast Radius
const TOOL_DEFINITIONS = {
  // Read-Only Tools (Deterministic Safety Tier 1)
  READ_ONLY: new Set([
    'fetch_logs',
    'read_email',
    'get_system_metrics',
    'query_read_replica',
    'search_knowledge_base',
    'list_active_sessions'
  ]),

  // Mutating / State-Changing Tools (Requires Human/Tiered Approval Tier 2)
  MUTATING: new Set([
    'transfer_funds',
    'send_email',
    'update_user_role',
    'create_api_token',
    'patch_config',
    'restart_service'
  ]),

  // Destructive / Irreversible Tools (Explicit Hard Block Tier 3)
  DESTRUCTIVE: new Set([
    'drop_database',
    'bulk_delete_users',
    'purge_logs',
    'force_reboot_cluster',
    'delete_s3_bucket',
    'wipe_audit_trail'
  ])
};

// Maximum allowed payload size for read-only operations (4KB safety limit)
const MAX_READ_ONLY_PAYLOAD_BYTES = 4096;

// Safety thresholds for mutating actions (Defense-in-depth limits)
const MUTATING_THRESHOLDS = {
  transfer_funds: {
    maxAmount: 10000, // Maximum single transaction value in USD
    allowedCurrencies: ['USD', 'EUR', 'GBP']
  },
  send_email: {
    maxRecipients: 10
  },
  update_user_role: {
    forbiddenRoles: ['SUPER_ADMIN', 'SECURITY_OFFICER']
  }
};

/**
 * Calculates raw byte size of arbitrary parameters
 * @param {Object} params 
 * @returns {number} byte length
 */
function calculatePayloadSize(params) {
  if (!params) return 0;
  return Buffer.byteLength(JSON.stringify(params), 'utf8');
}

/**
 * Evaluates safety thresholds for state-mutating actions
 * @param {string} tool 
 * @param {Object} parameters 
 * @returns {{ isSafe: boolean, reason?: string }}
 */
function evaluateMutationThresholds(tool, parameters = {}) {
  const threshold = MUTATING_THRESHOLDS[tool];
  if (!threshold) {
    // If no specific threshold is declared, treat as standard mutation
    return { isSafe: true };
  }

  if (tool === 'transfer_funds') {
    const amount = Number(parameters.amount);
    const currency = parameters.currency ? String(parameters.currency).toUpperCase() : 'USD';

    if (isNaN(amount) || amount <= 0) {
      return { isSafe: false, reason: 'Invalid or missing transfer amount.' };
    }
    if (amount > threshold.maxAmount) {
      return {
        isSafe: false,
        reason: `Transfer amount ($${amount}) exceeds maximum autonomous threshold ($${threshold.maxAmount}).`
      };
    }
    if (!threshold.allowedCurrencies.includes(currency)) {
      return {
        isSafe: false,
        reason: `Currency '${currency}' is not permitted for automated transfer.`
      };
    }
  }

  if (tool === 'send_email') {
    const recipients = Array.isArray(parameters.recipients)
      ? parameters.recipients
      : (parameters.to ? [parameters.to] : []);

    if (recipients.length > threshold.maxRecipients) {
      return {
        isSafe: false,
        reason: `Recipient count (${recipients.length}) exceeds safety ceiling (${threshold.maxRecipients}).`
      };
    }
  }

  if (tool === 'update_user_role') {
    const targetRole = String(parameters.new_role || '').toUpperCase();
    if (threshold.forbiddenRoles.includes(targetRole)) {
      return {
        isSafe: false,
        reason: `Autonomous escalation to restricted role '${targetRole}' is strictly forbidden.`
      };
    }
  }

  return { isSafe: true };
}

/**
 * Deterministic Policy Rule Engine
 * 
 * @param {Object} action
 * @param {string} action.agent_id - Unique identifier of the initiating AI Agent
 * @param {string} action.tool_name - Target tool being invoked
 * @param {string} action.target - Target resource or endpoint
 * @param {Object} action.parameters - Parameters provided by the agent
 * @param {number} [action.ai_risk_score] - Optional risk score (0.0 to 1.0) from ML analyzer
 * @param {string} [action.decision_path] - 'AI_INFORMED_RULE_ENGINE' | 'FAILOVER_SAFE_MODE'
 * 
 * @returns {Object} evaluation outcome
 */
function evaluateActionPolicy({
  agent_id,
  tool_name,
  target,
  parameters = {},
  ai_risk_score = null,
  decision_path = 'AI_INFORMED_RULE_ENGINE'
}) {
  const sanitizedAgentId = typeof agent_id === 'string' ? agent_id.trim() : '';
  const sanitizedTool = typeof tool_name === 'string' ? tool_name.trim().toLowerCase() : '';
  const payloadBytes = calculatePayloadSize(parameters);

  // =========================================================================
  // RULE 1: Identity & Tool Legitimacy Verification (Zero-Trust)
  // Unknown agents or unrecognized tools MUST return BLOCKED.
  // =========================================================================
  const isAgentKnown = KNOWN_AGENTS.has(sanitizedAgentId);
  const isToolRecognized = (
    TOOL_DEFINITIONS.READ_ONLY.has(sanitizedTool) ||
    TOOL_DEFINITIONS.MUTATING.has(sanitizedTool) ||
    TOOL_DEFINITIONS.DESTRUCTIVE.has(sanitizedTool)
  );

  if (!isAgentKnown || !isToolRecognized) {
    const refusalReason = !isAgentKnown
      ? `Untrusted or unregistered agent identity: '${agent_id || 'UNKNOWN'}'`
      : `Unrecognized or unauthorized tool invocation: '${tool_name || 'UNKNOWN'}'`;

    return {
      decision: 'BLOCKED',
      ruleTriggered: 'RULE_1_IDENTITY_OR_TOOL_UNRECOGNIZED',
      riskLevel: 'CRITICAL',
      reason: refusalReason,
      decisionPath: decision_path,
      aiRiskScore: ai_risk_score,
      metadata: { payloadBytes, isAgentKnown, isToolRecognized }
    };
  }

  // =========================================================================
  // RULE 4: Destructive Action Interception (Fail-Closed)
  // If the tool is highly destructive or irreversible, return BLOCKED.
  // Prioritized before mutations to enforce blast-radius containment.
  // =========================================================================
  if (TOOL_DEFINITIONS.DESTRUCTIVE.has(sanitizedTool)) {
    return {
      decision: 'BLOCKED',
      ruleTriggered: 'RULE_4_HIGHLY_DESTRUCTIVE_ACTION',
      riskLevel: 'CRITICAL',
      reason: `Tool '${sanitizedTool}' is classified as irreversible/destructive. Autonomous execution prohibited.`,
      decisionPath: decision_path,
      aiRiskScore: ai_risk_score,
      metadata: { target, payloadBytes }
    };
  }

  // =========================================================================
  // AI-Assisted Anomaly Check (When running in AI_INFORMED_RULE_ENGINE mode)
  // If external AI detected extreme risk (> 0.85), escalate to BLOCKED immediately.
  // =========================================================================
  if (
    decision_path === 'AI_INFORMED_RULE_ENGINE' &&
    typeof ai_risk_score === 'number' &&
    ai_risk_score >= 0.85
  ) {
    return {
      decision: 'BLOCKED',
      ruleTriggered: 'RULE_AI_CRITICAL_RISK_OVERRIDE',
      riskLevel: 'CRITICAL',
      reason: `External AI Risk Analyzer flagged anomalous risk level (${ai_risk_score.toFixed(2)}).`,
      decisionPath: decision_path,
      aiRiskScore: ai_risk_score,
      metadata: { payloadBytes }
    };
  }

  // =========================================================================
  // RULE 2: Read-Only Tool Evaluation
  // If tool is read-only and payload size is small, return ALLOWED.
  // =========================================================================
  if (TOOL_DEFINITIONS.READ_ONLY.has(sanitizedTool)) {
    if (payloadBytes > MAX_READ_ONLY_PAYLOAD_BYTES) {
      return {
        decision: 'BLOCKED',
        ruleTriggered: 'RULE_2_READ_ONLY_PAYLOAD_EXCEEDED',
        riskLevel: 'HIGH',
        reason: `Read-only action rejected: Payload size (${payloadBytes} bytes) exceeds safety cap (${MAX_READ_ONLY_PAYLOAD_BYTES} bytes). Potential exfiltration or injection vector.`,
        decisionPath: decision_path,
        aiRiskScore: ai_risk_score,
        metadata: { payloadBytes, maxAllowed: MAX_READ_ONLY_PAYLOAD_BYTES }
      };
    }

    return {
      decision: 'ALLOWED',
      ruleTriggered: 'RULE_2_READ_ONLY_SAFE_PAYLOAD',
      riskLevel: 'LOW',
      reason: `Read-only operation within verified parameters and size constraints.`,
      decisionPath: decision_path,
      aiRiskScore: ai_risk_score,
      metadata: { payloadBytes }
    };
  }

  // =========================================================================
  // RULE 3: Data Mutation & State Modification Evaluation
  // If the tool modifies data within safe thresholds, return HELD_FOR_APPROVAL.
  // If exceeding safe thresholds, return BLOCKED.
  // =========================================================================
  if (TOOL_DEFINITIONS.MUTATING.has(sanitizedTool)) {
    const thresholdCheck = evaluateMutationThresholds(sanitizedTool, parameters);

    if (!thresholdCheck.isSafe) {
      return {
        decision: 'BLOCKED',
        ruleTriggered: 'RULE_3_MUTATION_THRESHOLD_EXCEEDED',
        riskLevel: 'HIGH',
        reason: thresholdCheck.reason,
        decisionPath: decision_path,
        aiRiskScore: ai_risk_score,
        metadata: { payloadBytes, tool: sanitizedTool }
      };
    }

    // In Failover Safe Mode, state-modifying actions are marked with extra caution
    const safeModeNote = decision_path === 'FAILOVER_SAFE_MODE'
      ? ' [Executed under Failover Safe Mode - Human quorum required]'
      : '';

    return {
      decision: 'HELD_FOR_APPROVAL',
      ruleTriggered: 'RULE_3_MUTATION_WITHIN_SAFE_THRESHOLDS',
      riskLevel: decision_path === 'FAILOVER_SAFE_MODE' ? 'HIGH' : 'MEDIUM',
      reason: `State-modifying action requires secondary human authorization before execution.${safeModeNote}`,
      decisionPath: decision_path,
      aiRiskScore: ai_risk_score,
      metadata: { payloadBytes, tool: sanitizedTool }
    };
  }

  // Catch-all fail-closed fallback
  return {
    decision: 'BLOCKED',
    ruleTriggered: 'RULE_FALLTHROUGH_FAIL_CLOSED',
    riskLevel: 'HIGH',
    reason: 'Action failed deterministic safety evaluation default policy.',
    decisionPath: decision_path,
    aiRiskScore: ai_risk_score,
    metadata: { payloadBytes }
  };
}

module.exports = {
  evaluateActionPolicy,
  KNOWN_AGENTS,
  TOOL_DEFINITIONS,
  MUTATING_THRESHOLDS,
  MAX_READ_ONLY_PAYLOAD_BYTES
};
