const mongoose = require('mongoose');

const ActionRequestSchema = new mongoose.Schema(
  {
    agent_id: { type: String, required: true, index: true },
    tool_name: { type: String, required: true, index: true },
    target: { type: String, default: null },
    parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
    decision: {
      type: String,
      enum: ['ALLOWED', 'BLOCKED', 'HELD_FOR_APPROVAL', 'HELD_FOR_REAUTHORIZATION'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'HELD_FOR_APPROVAL', 'HELD_FOR_REAUTHORIZATION'],
      default: 'PENDING',
      index: true
    },
    decision_path: {
      type: String,
      enum: ['AI_INFORMED_RULE_ENGINE', 'FAILOVER_SAFE_MODE'],
      required: true
    },
    risk_score: { type: Number, default: null },
    rule_triggered: { type: String, required: true },
    reason: { type: String, required: true },
    session_id: { type: String, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.models.ActionRequest || mongoose.model('ActionRequest', ActionRequestSchema);
