const Policy = require('../models/policy.model');

// Registered trusted AI Agents permitted to request tool invocations
const TRUSTED_AGENTS = new Set([
  'agent_finance_v1',
  'agent_support_v2',
  'agent_devops_v1',
  'agent_auditor_v1',
  'agent_security_guard',
  'autonomous-agent-07',
  'agent_worker_v1',
  'TreasuryOperator-09',
  'RefundProcessor Agent',
  'InfraScale Orchestrator'
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
 * @param {Object} conditions - Declared policy conditional constraints
 * @param {Object} riskAnalysis - Real-time AI risk analysis metrics
 * @param {Object} payloadArguments - Arguments supplied to the tool
 * @returns {boolean} True if all specified policy conditions are satisfied
 */
function evaluateConditions(conditions, riskAnalysis, payloadArguments = {}) {
  if (!conditions || Object.keys(conditions).length === 0) {
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
 * @param {Object} aiAgentPayload - { toolName: string, arguments: Object, agentId?: string }
 * @param {Object} aiRiskAnalysis - { riskScore: number, blastRadius: string|number, isReversible: boolean }
 * @returns {Promise<Object>} Resolved evaluation result containing effect, matchedPolicyName, decisionReason
 */
async function evaluatePayloadAgainstPolicies(aiAgentPayload, aiRiskAnalysis) {
  const { toolName, arguments: toolArguments = {}, agentId } = aiAgentPayload || {};
  const riskAnalysis = aiRiskAnalysis || {};

  // Check agent registration if provided
  if (agentId && !TRUSTED_AGENTS.has(agentId)) {
    return {
      effect: 'BLOCK',
      matchedPolicyName: 'UNREGISTERED_AGENT_DENIAL',
      decisionReason: `Untrusted Agent Identity: Agent '${agentId}' is not registered in the trusted enterprise directory.`,
      priority: 999,
      evaluatedConditions: {}
    };
  }

  // Fetch all active policies sorted by priority DESC
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

  // Fallback heuristic if dynamic policy database has no matches
  const sanitizedTool = (toolName || '').toLowerCase().trim();
  if (TOOL_CATEGORIES.DESTRUCTIVE.has(sanitizedTool)) {
    return {
      effect: 'BLOCK',
      matchedPolicyName: 'SYSTEM_DESTRUCTIVE_SAFEGUARD',
      decisionReason: `Destructive Operation Intercepted: Tool '${sanitizedTool}' categorized as irreversible destructive action.`,
      priority: -1,
      evaluatedConditions: {}
    };
  }

  if (TOOL_CATEGORIES.MUTATING.has(sanitizedTool)) {
    return {
      effect: 'REQUIRE_APPROVAL',
      matchedPolicyName: 'SYSTEM_MUTATING_HOLD',
      decisionReason: `State-Modifying Action Held: Tool '${sanitizedTool}' requires human authorization prior to execution.`,
      priority: -1,
      evaluatedConditions: {}
    };
  }

  // Default Deny: Zero-Trust baseline
  return {
    effect: 'BLOCK',
    matchedPolicyName: 'SYSTEM_DEFAULT_DENY',
    decisionReason: `Default Deny: No active security policy authorized tool "${toolName || 'UNKNOWN'}" under current risk constraints.`,
    priority: -1,
    evaluatedConditions: {}
  };
}

module.exports = {
  evaluatePayloadAgainstPolicies,
  isToolMatch,
  evaluateConditions,
  TRUSTED_AGENTS,
  TOOL_CATEGORIES
};
