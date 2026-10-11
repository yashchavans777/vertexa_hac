/**
 * ActionGate - Production Database Seeder
 * scripts/seedDatabase.js
 * 
 * Principal Data Engineer Specification:
 * Populates MongoDB with highly realistic, production-grade test telemetry:
 * - 7 Active Held Requests awaiting SOC Human-in-the-Loop authorization.
 * - 40 Cryptographically Sealed Audit Logs reflecting historical AI Agent decisions.
 * Triggers Mongoose pre-save cryptographic hashing hooks for tamper-proof verification.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Resolve model schemas
const ActionRequest = require('../models/ActionRequest');
const AuditLog = require('../models/AuditLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/actiongate';

// ANSI Console styling constants
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

/**
 * High-stakes, realistic pending actions awaiting SOC Human-in-the-Loop approval
 */
const HELD_ACTION_REQUESTS = [
  {
    agent_id: 'agent_finance_v1',
    tool_name: 'transfer_funds',
    target: 'SWIFT://CHASE_GLOBAL_SETTLEMENT',
    parameters: {
      amount: 8500,
      currency: 'USD',
      recipient_account: 'acct_corporate_vendor_9912',
      invoice_reference: 'INV-2026-X881',
      settlement_urgency: 'EXPEDITED'
    },
    decision: 'HELD_FOR_APPROVAL',
    status: 'HELD_FOR_APPROVAL',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 68,
    rule_triggered: 'RULE_3_MUTATION_WITHIN_SAFE_THRESHOLDS',
    reason: 'State-modifying financial transfer requires secondary human dual-control quorum before disbursement.',
    session_id: 'sess_fin_prod_8820'
  },
  {
    agent_id: 'agent_devops_v1',
    tool_name: 'update_firewall_rule',
    target: 'vpc-main-east-production/security-groups',
    parameters: {
      rule_id: 'sg-ingress-database-01',
      protocol: 'TCP',
      port_range: [5432, 5432],
      source_cidr: '198.51.100.24/32',
      action: 'ALLOW',
      justification: 'Emergency read-replica maintenance access for analytics pipeline'
    },
    decision: 'HELD_FOR_APPROVAL',
    status: 'HELD_FOR_APPROVAL',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 74,
    rule_triggered: 'RULE_3_NETWORK_INGRESS_MUTATION',
    reason: 'Dynamic modification of production perimeter firewall requires network security officer sign-off.',
    session_id: 'sess_net_ops_4102'
  },
  {
    agent_id: 'agent_support_v2',
    tool_name: 'escalate_user_privilege',
    target: 'IAM::Tenant_Enterprise_AcmeCorp',
    parameters: {
      user_id: 'usr_tier3_lead_jchen',
      elevated_role: 'TENANT_SUPPORT_DEBUGGER',
      duration_minutes: 60,
      ticket_id: 'JIRA-SEC-9921',
      breakglass: true
    },
    decision: 'HELD_FOR_APPROVAL',
    status: 'HELD_FOR_APPROVAL',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 79,
    rule_triggered: 'RULE_3_PRIVILEGE_ESCALATION_GATE',
    reason: 'Temporary elevation of user privileges to breakglass debugger level requires human authorization.',
    session_id: 'sess_iam_escalate_301'
  },
  {
    agent_id: 'agent_devops_v1',
    tool_name: 'patch_config',
    target: 'k8s://cluster-core-prod/ingress-controller',
    parameters: {
      config_map: 'nginx-ingress-conf',
      changes: {
        ssl_protocols: 'TLSv1.2 TLSv1.3',
        client_max_body_size: '50m',
        proxy_read_timeout: '120s'
      },
      restart_workloads: true
    },
    decision: 'HELD_FOR_APPROVAL',
    status: 'HELD_FOR_APPROVAL',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 64,
    rule_triggered: 'RULE_3_MUTATION_WITHIN_SAFE_THRESHOLDS',
    reason: 'Live cluster ingress config patch requires DevOps staging verification before rollout.',
    session_id: 'sess_k8s_patch_778'
  },
  {
    agent_id: 'agent_finance_v1',
    tool_name: 'create_api_token',
    target: 'api-gateway://stripe-payments-v2',
    parameters: {
      token_name: 'automated_reconciliation_bot_q4',
      scopes: ['charges.read', 'refunds.write', 'disputes.read'],
      expiration_days: 30
    },
    decision: 'HELD_FOR_APPROVAL',
    status: 'HELD_FOR_APPROVAL',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 82,
    rule_triggered: 'RULE_3_CREDENTIAL_ISSUANCE_SAFEGUARD',
    reason: 'Generation of payment gateway write-scoped API token held for AppSec team verification.',
    session_id: 'sess_token_gen_991'
  },
  {
    agent_id: 'agent_support_v2',
    tool_name: 'send_email',
    target: 'smtp://corporate-outbound.internal',
    parameters: {
      recipients: ['legal@acme.corp', 'security-alert@acme.corp', 'compliance@acme.corp'],
      subject: 'URGENT: Third-Party Vendor Data Processing Amendment Consent',
      attachment_count: 2,
      classification: 'CONFIDENTIAL'
    },
    decision: 'HELD_FOR_APPROVAL',
    status: 'HELD_FOR_APPROVAL',
    decision_path: 'FAILOVER_SAFE_MODE',
    risk_score: 61,
    rule_triggered: 'RULE_3_MUTATION_WITHIN_SAFE_THRESHOLDS',
    reason: 'State-modifying email dispatch containing legal classification evaluated under Failover Safe Mode.',
    session_id: 'sess_comm_failover_021'
  },
  {
    agent_id: 'agent_security_guard',
    tool_name: 'restart_service',
    target: 'systemd://auth-service.production',
    parameters: {
      service_name: 'vault-agent.service',
      graceful_timeout_seconds: 30,
      reason: 'Automated memory leak reclamation trigger'
    },
    decision: 'HELD_FOR_APPROVAL',
    status: 'HELD_FOR_APPROVAL',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 72,
    rule_triggered: 'RULE_3_CORE_INFRA_SERVICE_RESTART',
    reason: 'Restarting identity and secret service in production requires operator confirmation.',
    session_id: 'sess_sec_guard_112'
  }
];

/**
 * Historical Audit Log blueprints (50% ALLOWED, 30% BLOCKED, 20% HELD/EXECUTED)
 */
const AUDIT_LOG_BLUEPRINTS = [
  // ---------------------------------------------------------------------------
  // 50% ALLOWED: Read-only, verified low-risk agent actions
  // ---------------------------------------------------------------------------
  {
    agent_id: 'agent_auditor_v1',
    tool_name: 'fetch_logs',
    target: '/var/log/audit/access.log',
    parameters: { lines: 250, filter: 'status=401', timeframe: 'last_1h' },
    decision: 'ALLOWED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 12,
    rule_triggered: 'RULE_2_READ_ONLY_SAFE_PAYLOAD',
    reason: 'Read-only log inspection within verified boundaries and parameter limits.'
  },
  {
    agent_id: 'agent_support_v2',
    tool_name: 'read_email',
    target: 'mailbox://tier1_inbox/msg_99201',
    parameters: { message_id: 'msg_99201', headers_only: false },
    decision: 'ALLOWED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 8,
    rule_triggered: 'RULE_2_READ_ONLY_SAFE_PAYLOAD',
    reason: 'Safe inbox consumption for customer ticket resolution context.'
  },
  {
    agent_id: 'agent_devops_v1',
    tool_name: 'get_system_metrics',
    target: 'prometheus://node-exporter.cluster-us-east',
    parameters: { query: 'sum(rate(container_cpu_usage_seconds_total[5m]))', duration: '30m' },
    decision: 'ALLOWED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 5,
    rule_triggered: 'RULE_2_READ_ONLY_SAFE_PAYLOAD',
    reason: 'Telemetry metric gathering allowed without risk to workload state.'
  },
  {
    agent_id: 'agent_finance_v1',
    tool_name: 'query_read_replica',
    target: 'postgres://readonly-replica.us-east.aws/billing',
    parameters: { query: 'SELECT account_id, balance FROM accounts WHERE balance > 0 LIMIT 100;' },
    decision: 'ALLOWED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 14,
    rule_triggered: 'RULE_2_READ_ONLY_SAFE_PAYLOAD',
    reason: 'Deterministic read against isolated read-replica within safe row return limits.'
  },
  {
    agent_id: 'agent_security_guard',
    tool_name: 'search_knowledge_base',
    target: 'opensearch://sec-runbooks-v3',
    parameters: { query: 'incident response procedure ransomware isolation', max_results: 5 },
    decision: 'ALLOWED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 3,
    rule_triggered: 'RULE_2_READ_ONLY_SAFE_PAYLOAD',
    reason: 'Safe semantic lookup of SOC operational procedures.'
  },
  {
    agent_id: 'agent_devops_v1',
    tool_name: 'list_active_sessions',
    target: 'redis://cache-session-cluster:6379',
    parameters: { pattern: 'sess:user:*', count: 50 },
    decision: 'ALLOWED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 11,
    rule_triggered: 'RULE_2_READ_ONLY_SAFE_PAYLOAD',
    reason: 'Non-mutating active session inventory query approved.'
  },
  {
    agent_id: 'agent_auditor_v1',
    tool_name: 'fetch_logs',
    target: '/var/log/cloudtrail/management_events.json',
    parameters: { event_source: 'iam.amazonaws.com', max_results: 100 },
    decision: 'ALLOWED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 9,
    rule_triggered: 'RULE_2_READ_ONLY_SAFE_PAYLOAD',
    reason: 'Compliance audit trail sampling permitted under read-only policy.'
  },
  {
    agent_id: 'agent_support_v2',
    tool_name: 'read_email',
    target: 'mailbox://escalations/thread_8812',
    parameters: { thread_id: 'thread_8812', decrypt: false },
    decision: 'ALLOWED',
    decision_path: 'FAILOVER_SAFE_MODE',
    risk_score: 15,
    rule_triggered: 'RULE_2_READ_ONLY_SAFE_PAYLOAD',
    reason: 'Read-only action allowed deterministically during AI Analyzer failover.'
  },

  // ---------------------------------------------------------------------------
  // 30% BLOCKED: Malicious, destructive, unauthenticated, or threshold breaches
  // ---------------------------------------------------------------------------
  {
    agent_id: 'rogue_injected_agent_x',
    tool_name: 'drop_database',
    target: 'mongodb://production-cluster-01/users_financials',
    parameters: { cascade: true, force: true, drop_indexes: true },
    decision: 'BLOCKED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 99,
    rule_triggered: 'RULE_4_HIGHLY_DESTRUCTIVE_ACTION',
    reason: 'Blocked: Blast radius exceeds safety threshold. Tool drop_database is irreversible.'
  },
  {
    agent_id: 'agent_finance_v1',
    tool_name: 'transfer_funds',
    target: 'SWIFT://OFFSHORE_UNKNOWN_NODE',
    parameters: { amount: 500000, currency: 'USD', recipient_account: 'acct_unverified_anonymous' },
    decision: 'BLOCKED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 95,
    rule_triggered: 'RULE_3_MUTATION_THRESHOLD_EXCEEDED',
    reason: 'Blocked: Transfer amount ($500000) exceeds maximum autonomous ceiling ($10000).'
  },
  {
    agent_id: 'unknown_agent_exploit',
    tool_name: 'bulk_delete_users',
    target: 'sql://auth-db-primary/users',
    parameters: { where_clause: 'created_at < 2026-01-01', hard_delete: true },
    decision: 'BLOCKED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 98,
    rule_triggered: 'RULE_1_IDENTITY_OR_TOOL_UNRECOGNIZED',
    reason: 'Blocked: Untrusted or unregistered agent identity: unknown_agent_exploit.'
  },
  {
    agent_id: 'agent_devops_v1',
    tool_name: 'purge_logs',
    target: '/var/log/audit/tamper_log',
    parameters: { rm_rf: true, silence_alerts: true },
    decision: 'BLOCKED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 97,
    rule_triggered: 'RULE_4_HIGHLY_DESTRUCTIVE_ACTION',
    reason: 'Blocked: Purging compliance audit trails is strictly prohibited by security baseline.'
  },
  {
    agent_id: 'compromised_support_bot',
    tool_name: 'update_user_role',
    target: 'IAM::Tenant_Enterprise',
    parameters: { new_role: 'SUPER_ADMIN', user_id: 'external_attacker_id' },
    decision: 'BLOCKED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 96,
    rule_triggered: 'RULE_3_MUTATION_THRESHOLD_EXCEEDED',
    reason: 'Blocked: Autonomous privilege escalation to SUPER_ADMIN is strictly forbidden.'
  },
  {
    agent_id: 'agent_auditor_v1',
    tool_name: 'fetch_logs',
    target: '/etc/shadow',
    parameters: { raw_blob: 'A'.repeat(8192) },
    decision: 'BLOCKED',
    decision_path: 'AI_INFORMED_RULE_ENGINE',
    risk_score: 91,
    rule_triggered: 'RULE_2_READ_ONLY_PAYLOAD_EXCEEDED',
    reason: 'Blocked: Payload size exceeds 4KB safety boundary. Potential injection or exfiltration.'
  },

  // ---------------------------------------------------------------------------
  // 20% HELD / EXECUTED: Past actions held for review and approved by human admins
  // ---------------------------------------------------------------------------
  {
    agent_id: 'agent_finance_v1',
    tool_name: 'transfer_funds',
    target: 'ACH://STRIPE_PAYOUT_BATCH',
    parameters: { amount: 4800, currency: 'USD', batch_id: 'batch_2026_oct_01' },
    decision: 'EXECUTED',
    decision_path: 'HUMAN_OVERRIDE',
    risk_score: 65,
    rule_triggered: 'RULE_3_MUTATION_WITHIN_SAFE_THRESHOLDS',
    reason: 'Held by ActionGate; authorized and executed following verification by SOC Human Admin.'
  },
  {
    agent_id: 'agent_devops_v1',
    tool_name: 'restart_service',
    target: 'systemd://payment-worker-pool',
    parameters: { instance_count: 8, graceful: true },
    decision: 'EXECUTED',
    decision_path: 'HUMAN_OVERRIDE',
    risk_score: 62,
    rule_triggered: 'RULE_3_MUTATION_WITHIN_SAFE_THRESHOLDS',
    reason: 'Action held for human dual-control; approved by DevOps lead for memory recycling.'
  },
  {
    agent_id: 'agent_support_v2',
    tool_name: 'send_email',
    target: 'smtp://customer-notification.corp',
    parameters: { recipients: ['ciso@customer-enterprise.com'], subject: 'Scheduled Maintenance Notice' },
    decision: 'EXECUTED',
    decision_path: 'HUMAN_OVERRIDE',
    risk_score: 58,
    rule_triggered: 'RULE_3_MUTATION_WITHIN_SAFE_THRESHOLDS',
    reason: 'Customer-facing broadcast released by Human Communications Officer.'
  },
  {
    agent_id: 'agent_finance_v1',
    tool_name: 'patch_config',
    target: 'billing-engine://tier-rates',
    parameters: { enterprise_discount_pct: 12.5, contract_id: 'CNT-99120' },
    decision: 'EXECUTED',
    decision_path: 'HUMAN_OVERRIDE',
    risk_score: 71,
    rule_triggered: 'RULE_3_MUTATION_WITHIN_SAFE_THRESHOLDS',
    reason: 'Held mutation executed following signed human authorization ticket approval.'
  }
];

/**
 * Generates an expanded set of 40 audit log entries with realistic past timestamps
 */
function generateAuditLogDataset(totalCount = 40) {
  const generatedLogs = [];
  const now = Date.now();

  for (let i = 0; i < totalCount; i++) {
    // Select blueprint rotating through the realistic templates
    const blueprint = AUDIT_LOG_BLUEPRINTS[i % AUDIT_LOG_BLUEPRINTS.length];

    // Distribute timestamps over the last 48 hours in descending chronological order
    const randomMinutesAgo = (i * 70) + Math.floor(Math.random() * 25);
    const logTimestamp = new Date(now - randomMinutesAgo * 60 * 1000);

    generatedLogs.push({
      ...blueprint,
      event_type: 'ACTION_EVALUATION',
      ip_address: `10.0.4.${(i % 50) + 10}`,
      user_agent: `ActionGate-Client/v2.1 (NodeJS/v20; AgentRuntime/${blueprint.agent_id})`,
      metadata: {
        latencyMs: Math.floor(Math.random() * 85) + 15,
        executionPosture: blueprint.decision === 'EXECUTED' ? 'HUMAN_APPROVED' : 'AUTONOMOUS_GATEWAY',
        seedIndex: i + 1
      },
      timestamp: logTimestamp
    });
  }

  return generatedLogs;
}

/**
 * Main Database Seeder Orchestrator
 */
async function seedDatabase() {
  console.log(`${CYAN}${BOLD}====================================================================${RESET}`);
  console.log(`${CYAN}${BOLD}  🛡️   ACTIONGATE - PRODUCTION DATABASE SEEDING ENGINE              ${RESET}`);
  console.log(`${CYAN}${BOLD}====================================================================${RESET}`);
  console.log(`${YELLOW}→ Establishing connection to MongoDB at: ${RESET}${MONGO_URI}`);

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`${GREEN}✔ Connected to MongoDB successfully.${RESET}\n`);

    // 1. Wipe existing collections for pristine hackathon demonstration
    console.log(`${YELLOW}→ Wiping existing ActionRequest and AuditLog collections...${RESET}`);
    await ActionRequest.deleteMany({});
    await AuditLog.deleteMany({});
    console.log(`${GREEN}✔ Collections cleared successfully.${RESET}\n`);

    // 2. Insert active pending ActionRequest documents (The Holding Queue)
    console.log(`${MAGENTA}→ Seeding ${HELD_ACTION_REQUESTS.length} active HELD ActionRequests for Human Review...${RESET}`);
    const insertedRequests = await ActionRequest.insertMany(HELD_ACTION_REQUESTS);
    console.log(`${GREEN}✔ Inserted ${insertedRequests.length} pending actions into Holding Queue.${RESET}\n`);

    // 3. Insert cryptographically sealed AuditLogs one-by-one to trigger pre-save hooks
    const auditDataset = generateAuditLogDataset(40);
    console.log(`${MAGENTA}→ Seeding ${auditDataset.length} AuditLogs with SHA-256 Cryptographic Seals...${RESET}`);

    let sealedCount = 0;
    for (const logItem of auditDataset) {
      const doc = new AuditLog(logItem);
      // Calling .save() explicitly triggers the Mongoose pre('save') cryptographic hook
      await doc.save();
      sealedCount++;
    }
    console.log(`${GREEN}✔ Successfully sealed and persisted ${sealedCount} AuditLog records.${RESET}\n`);

    // 4. Summarize seeding output
    console.log(`${CYAN}${BOLD}====================================================================${RESET}`);
    console.log(`${GREEN}${BOLD}  ✨ DATABASE SEEDING COMPLETED WITH ZERO ERRORS                    ${RESET}`);
    console.log(`${CYAN}${BOLD}====================================================================${RESET}`);
    console.log(`${BOLD}Summary of Seeded Data:${RESET}`);
    console.log(`  ${YELLOW}├─ Active Pending Requests (Holding Queue):${RESET} ${insertedRequests.length} items`);
    console.log(`  ${GREEN}├─ Allowed Historical Audit Logs:${RESET}          20 entries (50%)`);
    console.log(`  ${RED}├─ Blocked Historical Audit Logs:${RESET}          12 entries (30%)`);
    console.log(`  ${MAGENTA}├─ Human-Approved Historical Audit Logs:${RESET}   8 entries (20%)`);
    console.log(`  ${CYAN}└─ Total Tamper-Proof Cryptographic Seals:${RESET} ${sealedCount} hashes computed`);
    console.log(`${CYAN}====================================================================${RESET}\n`);

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error(`\n${RED}${BOLD}❌ DATABASE SEEDING FAILED:${RESET}`, error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

// Execute seeder
seedDatabase();
