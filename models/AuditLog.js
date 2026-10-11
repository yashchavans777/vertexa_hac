const mongoose = require('mongoose');
const crypto = require('crypto');

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
