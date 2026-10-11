/**
 * ActionGate - Declarative Policy Engine Service
 * src/services/policyEngine.service.js
 * 
 * Principal Security Architect Specification:
 * Evaluates proposed tool execution against declarative zero-trust policies,
 * agent registry constraints, mutation safety limits, and AI risk thresholds.
 */

// Registered trusted AI Agents permitted to request tool invocations
const TRUSTED_AGENTS = new Set([
  'agent_finance_v1',
  'agent_support_v2',
  'agent_devops_v1',
  'agent_auditor_v1',
  'agent_security_guard'
]);

// Deterministic Tool Capability Classifications
const TOOL_CATEGORIES = {
  READ_ONLY: new Set([
    'fetch_logs',
    'read_email',
    'get_system_metrics',
    'query_read_replica',
    'search_knowledge_base',
    'list_active_sessions'
  ]),
  MUTATING: new Set([
    'transfer_funds',
    'send_email',
    'update_user_role',
    'create_api_token',
    'patch_config',
    'restart_service',
    'update_firewall_rule',
    'escalate_user_privilege'
  ]),
  DESTRUCTIVE: new Set([
    'drop_database',
    'drop_production_db',
    'bulk_delete_users',
    'purge_logs',
    'force_reboot_cluster',
    'delete_s3_bucket',
    'wipe_audit_trail',
    'disable_2fa'
  ])
};

const MAX_READ_ONLY_PAYLOAD_SIZE = 4096;

/**
 * Evaluates an action payload and AI risk score against declarative security policies.
 * 
 * @param {Object} params
 * @param {string} params.agentId - Initiating agent ID
 * @param {string} params.toolName - Name of tool being called
 * @param {Object} params.payload - Parameters/arguments for the tool
 * @param {Object} params.riskAnalysis - Risk score and metadata from Python AI or Failover
 * 
 * @returns {{ effect: 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL', decisionReason: string, decisionPath: string }}
 */
function evaluatePayloadAgainstPolicies({ agentId, toolName, payload = {}, riskAnalysis = {} }) {
  const sanitizedAgent = String(agentId || '').trim();
  const sanitizedTool = String(toolName || '').trim().toLowerCase();
  const isFailover = riskAnalysis.isFailover === true;
  const riskScore = typeof riskAnalysis.risk_score === 'number' ? riskAnalysis.risk_score : 50;

  // 1. Identity Verification (Zero-Trust)
  if (!TRUSTED_AGENTS.has(sanitizedAgent)) {
    return {
      effect: 'BLOCK',
      decisionReason: `Zero-Trust Policy Violation: Unregistered or unauthorized agent identity '${agentId || 'UNKNOWN'}'.`,
      decisionPath: 'STRICT_POLICY_DENY'
    };
  }

  // 2. Destructive Tool Interception (Fail-Closed)
  if (TOOL_CATEGORIES.DESTRUCTIVE.has(sanitizedTool)) {
    return {
      effect: 'BLOCK',
      decisionReason: `Irreversible Action Intercepted: Tool '${sanitizedTool}' is classified as HIGHLY_DESTRUCTIVE. Autonomous execution strictly prohibited.`,
      decisionPath: 'STRICT_POLICY_DENY'
    };
  }

  // 3. AI Risk Critical Override
  if (!isFailover && riskScore >= 85) {
    return {
      effect: 'BLOCK',
      decisionReason: `AI Risk Threshold Exceeded: External analyzer computed critical anomaly risk (${riskScore}/100).`,
      decisionPath: 'AI_INFORMED_ENGINE'
    };
  }

  // 4. Failover Safe Mode Processing
  if (isFailover) {
    if (TOOL_CATEGORIES.MUTATING.has(sanitizedTool)) {
      return {
        effect: 'REQUIRE_APPROVAL',
        decisionReason: `Failover Safe Mode Active: Python AI unavailable. State-modifying action '${sanitizedTool}' held for mandatory human dual-control.`,
        decisionPath: 'FAILOVER_SAFE_MODE'
      };
    }

    return {
      effect: 'ALLOW',
      decisionReason: `Failover Safe Mode Active: Read-only tool '${sanitizedTool}' allowed deterministically under degraded baseline.`,
      decisionPath: 'FAILOVER_SAFE_MODE'
    };
  }

  // 5. Read-Only Policy
  if (TOOL_CATEGORIES.READ_ONLY.has(sanitizedTool)) {
    const payloadBytes = Buffer.byteLength(JSON.stringify(payload || {}), 'utf8');
    if (payloadBytes > MAX_READ_ONLY_PAYLOAD_SIZE) {
      return {
        effect: 'BLOCK',
        decisionReason: `Read-Only Payload Size Exceeded: Payload size (${payloadBytes} bytes) exceeds safety ceiling (${MAX_READ_ONLY_PAYLOAD_SIZE} bytes). Potential exfiltration vector.`,
        decisionPath: 'STRICT_POLICY_DENY'
      };
    }

    return {
      effect: 'ALLOW',
      decisionReason: `Autonomous Action Authorized: Read-only tool within normal operational parameters.`,
      decisionPath: 'AI_INFORMED_ENGINE'
    };
  }

  // 6. Mutating Operations Policy
  if (TOOL_CATEGORIES.MUTATING.has(sanitizedTool)) {
    if (sanitizedTool === 'transfer_funds') {
      const amount = Number(payload.amount);
      if (amount > 10000) {
        return {
          effect: 'BLOCK',
          decisionReason: `Autonomous Financial Limit Exceeded: Transfer amount ($${amount}) exceeds maximum threshold ($10,000).`,
          decisionPath: 'STRICT_POLICY_DENY'
        };
      }
    }

    return {
      effect: 'REQUIRE_APPROVAL',
      decisionReason: `State-Modifying Action Held: Tool '${sanitizedTool}' requires human authorization prior to execution.`,
      decisionPath: 'AI_INFORMED_ENGINE'
    };
  }

  // Fallback Catch-All
  return {
    effect: 'BLOCK',
    decisionReason: `Unrecognized Tool Action: Tool '${sanitizedTool}' not permitted in active policy catalog.`,
    decisionPath: 'STRICT_POLICY_DENY'
  };
}

module.exports = {
  evaluatePayloadAgainstPolicies,
  TRUSTED_AGENTS,
  TOOL_CATEGORIES
};
