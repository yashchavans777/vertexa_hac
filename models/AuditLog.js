const mongoose = require('mongoose');
const crypto = require('crypto');

const AuditLogSchema = new mongoose.Schema(
  {
    action_id: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
    original_payload: { type: mongoose.Schema.Types.Mixed, default: null },
    final_decision: { type: String, default: null },
    decision_reason: { type: String, default: null },
    decision_path: { type: String, default: 'AI_INFORMED_RULE_ENGINE' },
    record_hash: { type: String, default: null },

    event_type: { type: String, default: 'ACTION_EVALUATION', index: true },
    agent_id: { type: String, default: 'unknown_agent', index: true },
    tool_name: { type: String, default: 'unknown_tool', index: true },
    target: { type: String, default: null },
    parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
    decision: { type: String, default: 'ALLOWED', index: true },
    risk_score: { type: Number, default: null },
    rule_triggered: { type: String, default: 'N/A' },
    reason: { type: String, default: 'No reason specified' },
    action_request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ActionRequest', default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip_address: { type: String, default: '127.0.0.1' },
    user_agent: { type: String, default: 'ActionGate-AgentEngine/1.0' },
    cryptographic_hash: { type: String, default: null, index: true },
    previous_hash: { type: String, default: null },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

/**
 * Step 1 & Step 10: Cryptographic Tamper-Proof Audit Pre-Save Hook
 * Generates immutable SHA-256 digests over critical fields.
 */
AuditLogSchema.pre('save', function (next) {
  // 1. Generate payloadToSign for event format
  const payloadToSign = `${this.agent_id || ''}|${this.tool_name || ''}|${this.decision || this.final_decision || ''}|${(this.timestamp || this.createdAt || new Date()).toISOString ? (this.timestamp || this.createdAt || new Date()).toISOString() : ''}|${JSON.stringify(this.parameters || this.original_payload || {})}`;
  this.cryptographic_hash = crypto.createHash('sha256').update(payloadToSign).digest('hex');

  // 2. Generate canonical record_hash for verify_audit_integrity.js
  const hashPayload = {
    action_id: this.action_id ? this.action_id.toString() : (this._id ? this._id.toString() : ''),
    original_payload: this.original_payload || this.parameters || {},
    final_decision: this.final_decision || this.decision || 'Allowed',
    decision_reason: this.decision_reason || this.reason || 'Verified',
    decision_path: this.decision_path || 'AI_Rule_Engine',
    timestamp: (this.createdAt || this.timestamp || new Date()).toISOString ? (this.createdAt || this.timestamp || new Date()).toISOString() : new Date().toISOString()
  };

  const canonicalString = JSON.stringify(hashPayload, Object.keys(hashPayload).sort());
  this.record_hash = crypto.createHash('sha256').update(canonicalString).digest('hex');

  next();
});

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
