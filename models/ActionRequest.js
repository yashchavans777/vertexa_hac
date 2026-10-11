const mongoose = require('mongoose');

const ActionRequestSchema = new mongoose.Schema(
  {
    agent_id: { type: String, required: true, index: true },
    tool_name: { type: String, default: null, index: true },
    target: { type: String, default: null },
    parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
    intent: { type: String, default: null },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    decision: {
      type: String,
      default: 'PENDING',
      index: true
    },
    status: {
      type: String,
      default: 'PENDING',
      index: true
    },
    decision_path: {
      type: String,
      default: 'AI_INFORMED_RULE_ENGINE'
    },
    risk_score: { type: Number, default: null },
    rule_triggered: { type: String, default: 'POLICY_EVALUATION' },
    reason: { type: String, default: null },
    session_id: { type: String, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.models.ActionRequest || mongoose.model('ActionRequest', ActionRequestSchema);
