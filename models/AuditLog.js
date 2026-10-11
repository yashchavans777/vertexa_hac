const mongoose = require('mongoose');
const crypto = require('crypto');

const AuditLogSchema = new mongoose.Schema(
  {
    event_type: { type: String, default: 'ACTION_EVALUATION', index: true },
    agent_id: { type: String, required: true, index: true },
    tool_name: { type: String, required: true, index: true },
    target: { type: String, default: null },
    parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
    decision: {
      type: String,
      enum: ['ALLOWED', 'BLOCKED', 'HELD_FOR_APPROVAL', 'HELD', 'EXECUTED'],
      required: true,
      index: true
    },
    decision_path: {
      type: String,
      enum: ['AI_INFORMED_RULE_ENGINE', 'FAILOVER_SAFE_MODE', 'HUMAN_OVERRIDE'],
      default: 'AI_INFORMED_RULE_ENGINE'
    },
    risk_score: { type: Number, default: null },
    rule_triggered: { type: String, default: 'N/A' },
    reason: { type: String, default: 'No reason specified' },
    action_request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ActionRequest', default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip_address: { type: String, default: '127.0.0.1' },
    user_agent: { type: String, default: 'ActionGate-AgentEngine/1.0' },
    cryptographic_hash: { type: String, index: true },
    previous_hash: { type: String, default: null },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

/**
 * Step 1 Cryptographic Tamper-Proof Audit Hook
 * Generates an immutable SHA-256 seal computed over critical fields
 */
AuditLogSchema.pre('save', function (next) {
  const payloadToSign = `${this.agent_id}|${this.tool_name}|${this.decision}|${this.timestamp?.toISOString() || ''}|${JSON.stringify(this.parameters || {})}`;
  this.cryptographic_hash = crypto.createHash('sha256').update(payloadToSign).digest('hex');
  next();
});

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
