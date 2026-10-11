/**
 * ActionGate Cryptographic Audit Integrity Verifier
 * 
 * Step 10: Standalone verification tool to detect audit record tampering
 * and demonstrate cryptographic non-repudiation for live evaluation.
 * 
 * Usage:
 *   node scripts/verify_audit_integrity.js                  # Normal verification scan
 *   node scripts/verify_audit_integrity.js --simulate-tamper # Injects a bypass breach, then verifies
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

// ANSI Terminal Color Codes
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  boldRed: '\x1b[1;31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Recalculates expected SHA-256 hash using the canonical serialization
 * logic defined in models/AuditLog.js
 */
function recalculateRecordHash(doc) {
  const timestamp = doc.createdAt instanceof Date ? doc.createdAt.toISOString() : (doc.createdAt || '');

  const hashPayload = {
    action_id: doc.action_id ? doc.action_id.toString() : '',
    original_payload: doc.original_payload,
    final_decision: doc.final_decision,
    decision_reason: doc.decision_reason,
    decision_path: doc.decision_path,
    timestamp: timestamp
  };

  const serialized = JSON.stringify(hashPayload, Object.keys(hashPayload).sort());
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

/**
 * Simulates an adversary or rogue DBA bypassing the application layer
 * by directly mutating MongoDB collection documents via raw driver.
 */
async function simulateTampering() {
  console.log(`\n${COLORS.yellow}[!] INJECTING LIVE SIMULATED BREACH...${COLORS.reset}`);
  
  const rawCollection = mongoose.connection.collection('auditlogs');
  const targetRecord = await rawCollection.findOne();

  if (!targetRecord) {
    console.log(`${COLORS.yellow}[-] No audit records found to simulate tampering.${COLORS.reset}`);
    return null;
  }

  const tamperedPayload = {
    ...targetRecord.original_payload,
    unauthorized_mutation: 'MALICIOUS_DBA_PAYLOAD_TAMPER_DETECTED',
    tampered_at: new Date().toISOString()
  };

  // Directly bypass Mongoose pre-save hooks to simulate direct DB manipulation
  await rawCollection.updateOne(
    { _id: targetRecord._id },
    { $set: { original_payload: tamperedPayload } }
  );

  console.log(`${COLORS.yellow}[!] Direct DB mutation applied to Action ID: ${targetRecord.action_id || targetRecord._id}${COLORS.reset}`);
  console.log(`${COLORS.dim}    Payload altered without recalculating SHA-256 record_hash.${COLORS.reset}\n`);
  
  return targetRecord._id;
}

/**
 * Main verification routine
 */
async function verifyAuditIntegrity() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/actiongate';

  console.log(`${COLORS.cyan}================================================================${COLORS.reset}`);
  console.log(`${COLORS.cyan}${COLORS.bold}   ACTIONGATE :: CRYPTOGRAPHIC AUDIT LOG INTEGRITY VERIFIER     ${COLORS.reset}`);
  console.log(`${COLORS.cyan}================================================================${COLORS.reset}`);
  console.log(`${COLORS.dim}Connecting to MongoDB...${COLORS.reset}`);

  try {
    await mongoose.connect(mongoUri);
    console.log(`${COLORS.green}[✓] Connected to MongoDB database successfully.${COLORS.reset}\n`);

    // Check if live tampering simulation was requested via CLI flag
    if (process.argv.includes('--simulate-tamper') || process.argv.includes('--tamper')) {
      await simulateTampering();
    }

    console.log(`${COLORS.white}${COLORS.bold}Scanning AuditLog ledger documents...${COLORS.reset}\n`);

    const auditLogs = await AuditLog.find().sort({ createdAt: 1 }).lean();

    if (auditLogs.length === 0) {
      console.log(`${COLORS.yellow}[!] No audit log records found in the database.${COLORS.reset}`);
      await mongoose.disconnect();
      return;
    }

    let scannedCount = 0;
    let validCount = 0;
    let tamperedCount = 0;

    for (const record of auditLogs) {
      scannedCount++;
      const actionIdStr = record.action_id ? record.action_id.toString() : record._id.toString();
      const storedHash = record.record_hash;
      const computedHash = recalculateRecordHash(record);

      if (storedHash && storedHash === computedHash) {
        validCount++;
        console.log(
          `${COLORS.green}[VERIFIED]${COLORS.reset} Record #${scannedCount} | Action ID: ${COLORS.white}${actionIdStr}${COLORS.reset} | Decision: ${record.final_decision} | Hash: ${COLORS.dim}${storedHash.substring(0, 16)}...${COLORS.reset}`
        );
      } else {
        tamperedCount++;
        console.log(
          `\n${COLORS.boldRed}🚨 [CRITICAL INTEGRITY VIOLATION DETECTED] 🚨${COLORS.reset}`
        );
        console.log(`${COLORS.boldRed}   Action ID      : ${actionIdStr}${COLORS.reset}`);
        console.log(`${COLORS.red}   Decision       : ${record.final_decision} (${record.decision_path})${COLORS.reset}`);
        console.log(`${COLORS.red}   Stored Hash    : ${storedHash || 'NULL / MISSING'}${COLORS.reset}`);
        console.log(`${COLORS.red}   Computed Hash  : ${computedHash}${COLORS.reset}`);
        console.log(`${COLORS.yellow}   Evidence       : Database record content does not match cryptographic seal!${COLORS.reset}\n`);
      }
    }

    console.log(`\n${COLORS.cyan}----------------------------------------------------------------${COLORS.reset}`);
    console.log(`${COLORS.bold}AUDIT INTEGRITY REPORT SUMMARY:${COLORS.reset}`);
    console.log(`Scanned ${COLORS.bold}${scannedCount}${COLORS.reset} records. ${COLORS.green}${validCount} valid${COLORS.reset}. ${tamperedCount > 0 ? `${COLORS.boldRed}${tamperedCount} tampered${COLORS.reset}` : `${COLORS.green}0 tampered${COLORS.reset}`}.`);
    console.log(`${COLORS.cyan}----------------------------------------------------------------${COLORS.reset}`);

    if (tamperedCount > 0) {
      console.log(`${COLORS.boldRed}[!] STATUS: LEDGER INTEGRITY COMPROMISED. TAMPERING IDENTIFIED.${COLORS.reset}\n`);
      process.exitCode = 1;
    } else {
      console.log(`${COLORS.green}[✓] STATUS: 100% UNTAMPERED LEDGER INTEGRITY CONFIRMED.${COLORS.reset}\n`);
      process.exitCode = 0;
    }

  } catch (error) {
    console.error(`\n${COLORS.boldRed}[ERROR] Integrity verification failed: ${error.message}${COLORS.reset}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log(`${COLORS.dim}Database connection closed.${COLORS.reset}`);
  }
}

// Execute the verification script directly
if (require.main === module) {
  verifyAuditIntegrity();
}

module.exports = {
  verifyAuditIntegrity,
  recalculateRecordHash,
  simulateTampering
};
