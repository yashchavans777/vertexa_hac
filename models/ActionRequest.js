const mongoose = require('mongoose');

<<<<<<< HEAD
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
=======
const actionRequestSchema = new mongoose.Schema(
  {
    agent_id: {
      type: String,
      required: [true, 'agent_id is required'],
      trim: true,
      index: true
    },
    intent: {
      type: String,
      required: [true, 'intent is required'],
      trim: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'payload is required']
    },
    risk_score: {
      type: Number,
      required: [true, 'risk_score is required'],
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'allowed', 'blocked', 'held'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending',
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ActionRequest', actionRequestSchema);
>>>>>>> 970158768f8a72e810a75a43418f02a55dd1d995
