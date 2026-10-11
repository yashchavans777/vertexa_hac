import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  Hash, 
  Cpu, 
  Clock, 
  Link2, 
  Key, 
  GitCommit 
} from 'lucide-react';

const getStatusConfig = (decision, isTampered = false) => {
  const normDecision = (decision || '').toUpperCase();
  
  if (isTampered || normDecision === 'BLOCKED' || normDecision === 'REJECTED_TAMPERED' || normDecision === 'REJECTED') {
    return {
      borderLeft: 'border-l-[#F01616]',
      text: 'text-[#F01616]',
      bgBadge: 'bg-[#F01616]/10 border-[#F01616]/40',
      glow: 'shadow-[0_0_20px_rgba(240,22,22,0.35)]',
      icon: ShieldX,
      label: isTampered ? 'TAMPERED / INVALID' : normDecision
    };
  }

  if (normDecision === 'HELD' || normDecision === 'HELD_FOR_APPROVAL') {
    return {
      borderLeft: 'border-l-amber-500',
      text: 'text-amber-400',
      bgBadge: 'bg-amber-950/40 border-amber-500/40',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      icon: ShieldAlert,
      label: 'HELD FOR APPROVAL'
    };
  }

  return {
    borderLeft: 'border-l-emerald-500',
    text: 'text-emerald-400',
    bgBadge: 'bg-emerald-950/40 border-emerald-500/40',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    icon: ShieldCheck,
    label: 'ALLOWED'
  };
};

export const LedgerBlock = ({ block, isLast = false, isTamperedBlock = false }) => {
  const status = getStatusConfig(block.decision || block.action || 'ALLOWED', isTamperedBlock);
  const StatusIcon = status.icon;

  const previousHash = block.previousHash || block.prevHash || '0000000000000000000000000000000000000000000000000000000000000000';
  const currentHash = block.hash || block.currentHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  return (
    <div className="relative">
      <motion.div
        layout
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className={`relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl border-l-[6px] ${status.borderLeft} transition-all duration-300 hover:border-slate-700/80 hover:bg-slate-900/90 hover-card-scale box-border ${
          isTamperedBlock ? 'ring-2 ring-[#F01616] shadow-[0_0_30px_rgba(240,22,22,0.45)]' : ''
        }`}
      >
        <div className="p-5 sm:p-6 space-y-4 box-border">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                <Hash className="w-3.5 h-3.5" />
                BLOCK #{block.index ?? block.blockIndex ?? 0}
              </span>
              <span className="text-slate-500 font-mono text-xs">
                NONCE: {block.nonce ?? '0x7F'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {block.timestamp ? new Date(block.timestamp).toLocaleString() : 'GENESIS'}
              </span>

              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold ${status.bgBadge} ${status.text} ${status.glow}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{status.label}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-slate-500">AGENT_ID</div>
                <div className="text-slate-200 font-medium truncate">{block.agentId || 'kernel-controller'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <GitCommit className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-slate-500">TOOL_NAME</div>
                <div className="text-cyan-300 font-medium truncate">{block.toolName || block.tool || 'system:auth'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <Key className="w-4 h-4 text-purple-400 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-slate-500">DECISION_PATH</div>
                <div className="text-purple-300 font-medium truncate">{block.decisionPath || 'POLICY_AI_HYBRID'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/90 border border-slate-800/80 p-3 space-y-2 font-mono text-[11px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-500 text-[10px] tracking-wide uppercase shrink-0">
                <Link2 className="w-3.5 h-3.5 text-slate-500" />
                PREVIOUS_HASH:
              </span>
              <span className="text-slate-400 truncate tracking-tight bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800 select-all">
                {previousHash}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="flex items-center gap-1.5 text-cyan-400 text-[10px] tracking-wide uppercase shrink-0">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                BLOCK_HASH (SHA-256):
              </span>
              <span className={`tracking-tight px-2 py-0.5 rounded border select-all truncate ${
                isTamperedBlock 
                  ? 'bg-[#F01616]/10 text-[#F01616] border-[#F01616]/50 shadow-[0_0_12px_rgba(240,22,22,0.3)]' 
                  : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40'
              }`}>
                {currentHash}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {!isLast && (
        <div className="flex flex-col items-center justify-center my-1.5 h-8">
          <div className="w-[2px] h-full bg-gradient-to-b from-cyan-500/60 via-cyan-400 to-cyan-500/30 relative">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerBlock;
