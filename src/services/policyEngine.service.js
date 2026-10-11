<<<<<<< HEAD
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
=======
const Policy = require('../models/policy.model');

/**
 * Normalized blast radius scoring dictionary.
 * Maps qualitative impact categorizations to quantitative scales (0-100)
 * for fine-grained numerical boundary evaluations.
 */
const BLAST_RADIUS_WEIGHTS = {
  READ_ONLY: 5,
  READ_ONLY_EPHEMERAL: 5,
  LOCAL_LOW: 20,
  LOCAL_MUTATION: 40,
  TENANT_MEDIUM: 60,
  DATASET_MUTATION: 75,
  PRODUCTION_INFRASTRUCTURE: 90,
  INFRASTRUCTURE_DATA_LOSS: 95,
  PERSISTENCE_LAYER_DESTRUCTION: 100,
  GLOBAL_AUTHENTICATION_BREACH: 100,
  CRITICAL_INFRASTRUCTURE: 100
};

/**
 * Matches a requested toolName against a target tool pattern.
 * Supports exact string matches, global wildcards ('*'), and prefix wildcards ('get_*').
 *
 * @param {string} toolName - The tool invoked by the AI agent
 * @param {string} pattern - Pattern defined in the policy's targetTools
 * @returns {boolean} True if pattern matches toolName
 */
function isToolMatch(toolName, pattern) {
  if (!toolName || !pattern) return false;
  if (pattern === '*') return true;
  if (pattern.toLowerCase() === toolName.toLowerCase()) return true;

  // Support glob wildcard matching like "get_*" or "delete_*"
  if (pattern.includes('*')) {
    const escapedRegex = pattern
      .split('*')
      .map((str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');
    const regex = new RegExp(`^${escapedRegex}$`, 'i');
    return regex.test(toolName);
  }

  return false;
}

/**
 * Evaluates contextual execution conditions against real-time AI risk telemetry.
 *
 * Supported Conditions:
 * - maxRiskScore (Number): Rejects if calculated risk exceeds threshold
 * - minRiskScore (Number): Matches if risk score is equal to or above minimum
 * - maxBlastRadius (Number | String): Caps maximum allowable blast radius
 * - isReversible (Boolean): Enforces reversibility requirements
 * - requireExplicitArguments (Array<String>): Enforces presence of required arguments
 *
 * @param {Object} conditions - Declared policy conditional constraints
 * @param {Object} riskAnalysis - Real-time AI risk analysis metrics
 * @param {Object} payloadArguments - Arguments supplied to the tool
 * @returns {boolean} True if all specified policy conditions are satisfied
 */
function evaluateConditions(conditions, riskAnalysis, payloadArguments = {}) {
  if (!conditions || Object.keys(conditions).length === 0) {
    // Unconditional policy match
    return true;
  }

  const { riskScore = 0, blastRadius = 'LOCAL_LOW', isReversible = false } = riskAnalysis;

  // 1. Evaluate maxRiskScore threshold
  if (conditions.maxRiskScore !== undefined && conditions.maxRiskScore !== null) {
    if (Number(riskScore) > Number(conditions.maxRiskScore)) {
      return false;
    }
  }

  // 2. Evaluate minRiskScore threshold
  if (conditions.minRiskScore !== undefined && conditions.minRiskScore !== null) {
    if (Number(riskScore) < Number(conditions.minRiskScore)) {
      return false;
    }
  }

  // 3. Evaluate isReversible requirement
  if (conditions.isReversible !== undefined && conditions.isReversible !== null) {
    if (Boolean(isReversible) !== Boolean(conditions.isReversible)) {
      return false;
    }
  }

  // 4. Evaluate blast radius limits (supports numeric and qualitative string metrics)
  if (conditions.maxBlastRadius !== undefined && conditions.maxBlastRadius !== null) {
    let currentRadiusScore = 0;
    if (typeof blastRadius === 'number') {
      currentRadiusScore = blastRadius;
    } else if (typeof blastRadius === 'string') {
      const normalizedKey = blastRadius.toUpperCase().trim();
      currentRadiusScore = BLAST_RADIUS_WEIGHTS[normalizedKey] !== undefined 
        ? BLAST_RADIUS_WEIGHTS[normalizedKey] 
        : 50;
    }

    let thresholdScore = 0;
    if (typeof conditions.maxBlastRadius === 'number') {
      thresholdScore = conditions.maxBlastRadius;
    } else if (typeof conditions.maxBlastRadius === 'string') {
      const normalizedKey = conditions.maxBlastRadius.toUpperCase().trim();
      thresholdScore = BLAST_RADIUS_WEIGHTS[normalizedKey] !== undefined 
        ? BLAST_RADIUS_WEIGHTS[normalizedKey] 
        : 50;
    }

    if (currentRadiusScore > thresholdScore) {
      return false;
    }
  }

  // 5. Evaluate required argument presence if specified
  if (Array.isArray(conditions.requireExplicitArguments)) {
    for (const requiredArg of conditions.requireExplicitArguments) {
      if (payloadArguments[requiredArg] === undefined || payloadArguments[requiredArg] === null) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Enterprise Declarative Policy Evaluator
 *
 * Implements deterministic Policy-as-Code evaluation:
 * 1. Fetches all active policies ordered by priority (descending).
 * 2. Matches toolName against targetTools.
 * 3. Evaluates runtime conditions (riskScore, blastRadius, isReversible).
 * 4. Yields the winning effect (ALLOW, BLOCK, REQUIRE_APPROVAL).
 * 5. Strictly enforces Zero Trust "Default Deny" if no policy matches.
 *
 * @param {Object} aiAgentPayload - { toolName: string, arguments: Object }
 * @param {Object} aiRiskAnalysis - { riskScore: number, blastRadius: string|number, isReversible: boolean }
 * @returns {Promise<Object>} Resolved evaluation result containing effect, matchedPolicyName, decisionReason
 */
async function evaluatePayloadAgainstPolicies(aiAgentPayload, aiRiskAnalysis) {
  const { toolName, arguments: toolArguments = {} } = aiAgentPayload || {};
  const riskAnalysis = aiRiskAnalysis || {};

  // Fetch all active policies sorted by priority DESC (higher priority evaluated first)
  const activePolicies = await Policy.find({ isActive: true })
    .sort({ priority: -1, createdAt: 1 })
    .lean();

  for (const policy of activePolicies) {
    const isTargeted = policy.targetTools.some((targetPattern) =>
      isToolMatch(toolName, targetPattern)
    );

    if (isTargeted) {
      const conditionsSatisfied = evaluateConditions(
        policy.conditions,
        riskAnalysis,
        toolArguments
      );

      if (conditionsSatisfied) {
        return {
          effect: policy.effect,
          matchedPolicyName: policy.policyName,
          decisionReason: `Policy Matched: "${policy.policyName}" evaluated with effect ${policy.effect}.`,
          priority: policy.priority,
          evaluatedConditions: policy.conditions
        };
      }
    }
  }

  // Default Deny: In an Enterprise Zero-Trust architecture, anything not explicitly permitted is blocked
  return {
    effect: 'BLOCK',
    matchedPolicyName: 'SYSTEM_DEFAULT_DENY',
    decisionReason: `Default Deny: No active security policy authorized tool "${toolName || 'UNKNOWN'}" under current risk constraints.`,
    priority: -1,
    evaluatedConditions: {}
>>>>>>> 970158768f8a72e810a75a43418f02a55dd1d995
  };
}

module.exports = {
  evaluatePayloadAgainstPolicies,
<<<<<<< HEAD
  TRUSTED_AGENTS,
  TOOL_CATEGORIES
=======
  isToolMatch,
  evaluateConditions
>>>>>>> 970158768f8a72e810a75a43418f02a55dd1d995
};
