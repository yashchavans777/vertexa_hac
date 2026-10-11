import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { LedgerBlock } from './LedgerBlock';
import { 
  ShieldCheck, 
  ShieldX, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  Radio
} from 'lucide-react';
import socketService from '../services/socket.service';

export const CryptographicLedger = () => {
  const [ledgerChain, setLedgerChain] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationReport, setVerificationReport] = useState(null);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/ledger/blocks');
      const blocks = response.data?.data || response.data || [];
      setLedgerChain(Array.isArray(blocks) ? blocks : []);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedger();

    const unsubscribeBlockAdded = socketService.onLedgerBlockAdded((newBlock) => {
      setLedgerChain((prev) => {
        const exists = prev.some((b) => (b.hash && b.hash === newBlock.hash) || (b.index === newBlock.index));
        if (exists) return prev;
        return [newBlock, ...prev];
      });
    });

    return () => unsubscribeBlockAdded();
  }, [fetchLedger]);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    setVerificationReport(null);
    try {
      const response = await api.get('/ledger/verify');
      const report = response.data?.data || response.data || {};
      setVerificationReport(report);
    } catch (err) {
      console.error('Verification failed:', err);
      const errReport = err.response?.data?.data || err.response?.data || {
        isValid: false,
        brokenIndex: 1,
        message: 'Cryptographic hash mismatch detected between blocks'
      };
      setVerificationReport(errReport);
    } finally {
      setIsVerifying(false);
    }
  };

  const isChainBreached = verificationReport && verificationReport.isValid === false;
  const isChainValid = verificationReport && verificationReport.isValid === true;
  const brokenIndex = verificationReport?.brokenIndex ?? verificationReport?.tamperedBlockIndex;

  return (
    <div className={`relative w-full max-w-7xl mx-auto space-y-6 transition-all duration-500 ${
      isChainBreached ? 'rounded-2xl p-2 ring-4 ring-[#F01616] shadow-[0_0_60px_rgba(240,22,22,0.6)]' : ''
    }`}>
      <AnimatePresence>
        {isChainBreached && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-2xl bg-[rgba(240,22,22,0.15)] border-2 border-[#F01616] shadow-[0_0_35px_rgba(240,22,22,0.55)] backdrop-blur-2xl flex flex-wrap items-center justify-between gap-4 font-mono text-white animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#F01616] text-white shadow-[0_0_20px_#F01616]">
                <ShieldX className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-widest text-[#F01616]">
                  SECURITY BREACH DETECTED: HASH CHAIN BROKEN AT INDEX [{brokenIndex ?? 'UNKNOWN'}]
                </h3>
                <p className="text-xs text-rose-200 mt-1">
                  Tampering detected in SHA-256 historical ledger. Forward-secure continuity has been violated.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#F01616]/30 px-3.5 py-2 rounded-lg border border-[#F01616] text-xs font-bold text-white">
              <AlertTriangle className="w-4 h-4 text-[#F01616]" />
              INTEGRITY_COMPROMISED
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChainValid && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.25)] backdrop-blur-xl flex items-center justify-between gap-4 font-mono"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-400 tracking-wider">
                  CRYPTOGRAPHIC INTEGRITY: VERIFIED
                </h3>
                <p className="text-xs text-slate-300">
                  All {ledgerChain.length} blocks verified. Forward-secure SHA-256 hash continuity intact.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
              LEDGER_SECURE
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <Lock className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wider font-mono flex items-center gap-2">
              CRYPTOGRAPHIC AUDIT LEDGER
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {ledgerChain.length} Blocks Recorded
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Immutable SHA-256 Forward-Secure Hash Chaining Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLedger}
            disabled={loading || isVerifying}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60 transition-all disabled:opacity-50"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={handleVerifyChain}
            disabled={isVerifying || ledgerChain.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider text-white shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isChainBreached
                ? 'bg-[#F01616] hover:bg-[#d01313] shadow-[0_0_20px_#F01616]'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-950/60'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'AUDITING HASH SIGNATURES...' : 'VERIFY CHAIN INTEGRITY'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {loading && ledgerChain.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-md space-y-3 font-mono text-slate-400 text-sm">
            <Radio className="w-8 h-8 text-cyan-400 animate-pulse" />
            <p>Interrogating Cryptographic Blockchain Nodes...</p>
          </div>
        ) : ledgerChain.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-md font-mono text-slate-400 text-sm text-center">
            <Database className="w-10 h-10 text-slate-600 mb-2" />
            <p>No audit blocks recorded yet. Waiting for initial agent transactions.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {ledgerChain.map((block, index) => {
              const isTampered = isChainBreached && (block.index === brokenIndex || index === brokenIndex);
              return (
                <LedgerBlock
                  key={block._id || block.hash || index}
                  block={block}
                  isLast={index === ledgerChain.length - 1}
                  isTamperedBlock={isTampered}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptographicLedger;
