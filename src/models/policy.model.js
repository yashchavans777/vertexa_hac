const mongoose = require('mongoose');

/**
 * Enterprise Policy-as-Code Schema (AWS IAM Style)
 * Represents declarative governance rules enforced by the ActionGate engine.
 */
const policySchema = new mongoose.Schema(
  {
    policyName: {
      type: String,
      required: [true, 'policyName is required'],
      unique: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    targetTools: {
      type: [String],
      required: [true, 'targetTools array is required'],
      validate: {
        validator: (tools) => Array.isArray(tools) && tools.length > 0,
        message: 'At least one target tool must be specified'
      }
    },
    effect: {
      type: String,
      enum: {
        values: ['ALLOW', 'BLOCK', 'REQUIRE_APPROVAL'],
        message: '{VALUE} is not a valid policy effect. Must be ALLOW, BLOCK, or REQUIRE_APPROVAL'
      },
      required: [true, 'effect is required']
    },
    conditions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    priority: {
      type: Number,
      default: 0,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Policy', policySchema);
