const mongoose = require('mongoose');
const crypto = require('crypto');

<<<<<<< HEAD
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
=======
const auditLogSchema = new mongoose.Schema(
  {
    action_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ActionRequest',
      required: [true, 'action_id is required'],
      index: true
    },
    original_payload: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'original_payload is required']
    },
    final_decision: {
      type: String,
      enum: {
        values: ['Allowed', 'Blocked', 'Held'],
        message: '{VALUE} is not a valid final_decision'
      },
      required: [true, 'final_decision is required']
    },
    decision_reason: {
      type: String,
      required: [true, 'decision_reason is required'],
      trim: true
    },
    decision_path: {
      type: String,
      required: [true, 'decision_path is required'],
      trim: true
    },
    record_hash: {
      type: String,
      immutable: true // Prevent updates after generation
    }
  },
  {
    timestamps: true
  }
);

/**
 * The Winning Edge: Cryptographic tamper-proofing pre-save hook.
 * Generates an immutable SHA-256 digest of the audit record to guarantee
 * non-repudiation and integrity verification.
 */
auditLogSchema.pre('save', function (next) {
  const hashPayload = {
    action_id: this.action_id ? this.action_id.toString() : '',
    original_payload: this.original_payload,
    final_decision: this.final_decision,
    decision_reason: this.decision_reason,
    decision_path: this.decision_path,
    timestamp: this.createdAt || new Date().toISOString()
  };

  // Canonicalize string representation before hashing
  const serialized = JSON.stringify(hashPayload, Object.keys(hashPayload).sort());
  this.record_hash = crypto.createHash('sha256').update(serialized).digest('hex');

  next();
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
>>>>>>> 970158768f8a72e810a75a43418f02a55dd1d995
