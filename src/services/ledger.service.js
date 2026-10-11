/**
 * ActionGate - Cryptographic Ledger Service
 * src/services/ledger.service.js
 * 
 * Principal Cryptography & Backend Engineer Specification:
 * - Implements canonical SHA-256 forward-secure hash chaining.
 * - Handles concurrency sequence collisions with atomic retry loops.
 * - Performs mathematical traversal to verify blockchain-like chain integrity.
 */
const crypto = require('crypto');
const { AuditLedger, GENESIS_PREVIOUS_HASH } = require('../models/auditLedger.model');
const { ApiError } = require('../utils/ApiError');

/**
 * Computes deterministic SHA-256 hash across canonical block attributes.
 * Schema: index + previousHash + JSON.stringify(payload) + finalDecision + decisionPath + timestampISO
 * 
 * @param {Object} block
 * @returns {string} Hex-encoded SHA-256 digest
 */
function calculateBlockHash({ index, previousHash, payload, finalDecision, decisionPath, timestamp, nonce = 0 }) {
  const timestampStr = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  const serializedPayload = JSON.stringify(payload || {});
  
  const rawString = `${index}${previousHash}${serializedPayload}${finalDecision}${decisionPath}${timestampStr}${nonce}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * Appends a new verified action evaluation block to the immutable ledger.
 * Resolves concurrency/sequence collisions via atomic retries.
 * 
 * @param {Object} blockData
 * @param {number} [retryCount=0]
 * @returns {Promise<Object>} Created ledger block document
 */
async function appendBlock(blockData, retryCount = 0) {
  const MAX_RETRIES = 5;

  try {
    // 1. Fetch the latest block to determine sequential index and previous hash
    const latestBlock = await AuditLedger.findOne({}).sort({ index: -1 }).lean();

    const nextIndex = latestBlock ? latestBlock.index + 1 : 0;
    const previousHash = latestBlock ? latestBlock.currentHash : GENESIS_PREVIOUS_HASH;
    const blockTimestamp = blockData.timestamp ? new Date(blockData.timestamp) : new Date();
    const nonce = blockData.nonce || 0;
    const resolvedDecisionPath =
      blockData.decisionPath ||
      'Action intercepted by REQUIRE_APPROVAL policy';

    // 2. Deterministically compute currentHash over block properties
    const currentHash = calculateBlockHash({
      index: nextIndex,
      previousHash,
      payload: blockData.payload,
      finalDecision: blockData.finalDecision,
      decisionPath: resolvedDecisionPath,
      timestamp: blockTimestamp,
      nonce
    });

    // 3. Construct block document
    const newBlock = new AuditLedger({
      index: nextIndex,
      previousHash,
      timestamp: blockTimestamp,
      actionId: blockData.actionId || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      agentId: blockData.agentId || 'UNKNOWN_AGENT',
      toolName: blockData.toolName || 'UNKNOWN_TOOL',
      payload: blockData.payload || {},
      finalDecision: blockData.finalDecision,
      decisionPath: resolvedDecisionPath,
      decisionReason: blockData.decisionReason || 'Decision recorded in audit ledger',
      nonce,
      currentHash
    });

    // 4. Save to MongoDB
    return await newBlock.save();

  } catch (error) {
    // Detect duplicate key collision on 'index' due to concurrent workers
    if (error.code === 11000 && retryCount < MAX_RETRIES) {
      const backoffMs = Math.floor(Math.random() * 50) + 10;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      return appendBlock(blockData, retryCount + 1);
    }

    throw new ApiError(500, `Failed to append block to cryptographic ledger: ${error.message}`, [error.message]);
  }
}

/**
 * Verifies mathematical integrity of the entire forward-chained ledger.
 * 
 * Traversal logic:
 * 1. Checks that block 0 points to GENESIS_PREVIOUS_HASH.
 * 2. Checks that block[i].previousHash matches block[i - 1].currentHash.
 * 3. Recalculates block[i].currentHash from data and verifies against stored currentHash.
 * 
 * @returns {Promise<Object>} Verification report with compromised index if detected
 */
async function verifyChainIntegrity() {
  const blocks = await AuditLedger.find({}).sort({ index: 1 }).lean();
  const totalBlocks = blocks.length;

  if (totalBlocks === 0) {
    return {
      isValid: true,
      totalBlocks: 0,
      compromisedIndex: null,
      verificationTimestamp: new Date(),
      message: 'Ledger is empty. No blocks to verify.'
    };
  }

  for (let i = 0; i < totalBlocks; i++) {
    const current = blocks[i];

    // Check index sequence continuity
    if (current.index !== i) {
      return {
        isValid: false,
        totalBlocks,
        compromisedIndex: current.index,
        failedRule: 'SEQUENCE_DISCONTINUITY',
        expectedIndex: i,
        foundIndex: current.index,
        verificationTimestamp: new Date()
      };
    }

    // Genesis Block check
    if (i === 0) {
      if (current.previousHash !== GENESIS_PREVIOUS_HASH) {
        return {
          isValid: false,
          totalBlocks,
          compromisedIndex: 0,
          failedRule: 'INVALID_GENESIS_PREVIOUS_HASH',
          storedPreviousHash: current.previousHash,
          expectedPreviousHash: GENESIS_PREVIOUS_HASH,
          verificationTimestamp: new Date()
        };
      }
    } else {
      // Chain Link check: previousHash MUST equal preceding currentHash
      const previous = blocks[i - 1];
      if (current.previousHash !== previous.currentHash) {
        return {
          isValid: false,
          totalBlocks,
          compromisedIndex: current.index,
          failedRule: 'BROKEN_HASH_CHAIN_LINK',
          storedPreviousHash: current.previousHash,
          precedingCurrentHash: previous.currentHash,
          verificationTimestamp: new Date()
        };
      }
    }

    // Mathematical Recalculation Check
    const recalculatedHash = calculateBlockHash({
      index: current.index,
      previousHash: current.previousHash,
      payload: current.payload,
      finalDecision: current.finalDecision,
      decisionPath: current.decisionPath,
      timestamp: current.timestamp,
      nonce: current.nonce || 0
    });

    if (recalculatedHash !== current.currentHash) {
      return {
        isValid: false,
        totalBlocks,
        compromisedIndex: current.index,
        failedRule: 'DATA_TAMPER_HASH_MISMATCH',
        storedHash: current.currentHash,
        recalculatedHash,
        verificationTimestamp: new Date()
      };
    }
  }

  return {
    isValid: true,
    totalBlocks,
    compromisedIndex: null,
    latestBlockHash: blocks[totalBlocks - 1].currentHash,
    verificationTimestamp: new Date(),
    message: 'Cryptographic audit ledger integrity mathematically confirmed. Zero tampering detected.'
  };
}

module.exports = {
  calculateBlockHash,
  appendBlock,
  verifyChainIntegrity
};
