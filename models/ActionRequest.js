const mongoose = require('mongoose');

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
