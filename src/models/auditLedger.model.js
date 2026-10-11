/**
 * ActionGate - Cryptographic Chained Audit Ledger Model
 * src/models/auditLedger.model.js
 * 
 * Principal Cryptography Engineer Specification:
 * Implements a forward-secure, tamper-evident hash-chained block structure.
 * Every audit record's currentHash is cryptographically bound to the previous block's SHA-256 hash.
 */
const mongoose = require('mongoose');

const GENESIS_PREVIOUS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

const auditLedgerSchema = new mongoose.Schema(
  {
    index: {
      type: Number,
      required: [true, 'Block index is required'],
      unique: true,
      index: true
    },
    previousHash: {
      type: String,
      required: [true, 'Previous block hash is required']
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    actionId: {
      type: String,
      required: [true, 'Action ID is required'],
      index: true
    },
    agentId: {
      type: String,
      required: [true, 'Agent ID is required'],
      index: true
    },
    toolName: {
      type: String,
      required: [true, 'Tool name is required'],
      index: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Payload data is required'],
      default: {}
    },
    finalDecision: {
      type: String,
      enum: {
        values: ['ALLOWED', 'BLOCKED', 'HELD_FOR_APPROVAL', 'REAUTHORIZED', 'REJECTED'],
        message: '{VALUE} is not a valid final decision'
      },
      required: [true, 'Final decision is required'],
      index: true
    },
    decisionPath: {
      type: String,
      required: [true, 'Decision path is required'],
      default: 'Action intercepted by REQUIRE_APPROVAL policy',
      trim: true
    },
    decisionReason: {
      type: String,
      required: [true, 'Decision reason is required']
    },
    nonce: {
      type: Number,
      default: 0
    },
    currentHash: {
      type: String,
      required: [true, 'Current block hash is required'],
      unique: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const AuditLedger = mongoose.models.AuditLedger || mongoose.model('AuditLedger', auditLedgerSchema);

module.exports = {
  AuditLedger,
  GENESIS_PREVIOUS_HASH
};
