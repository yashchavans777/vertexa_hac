import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  RotateCcw, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Cpu,
  Clock
} from 'lucide-react';

const getRiskBadgeConfig = (score) => {
  if (score < 30) {
    return {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.35)]',
      label: 'LOW RISK',
      indicatorBg: 'bg-emerald-400'
    };
  }
  if (score <= 70) {
    return {
      bg: 'bg-amber-950/40',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.35)]',
      label: 'ELEVATED RISK',
      indicatorBg: 'bg-amber-400'
    };
  }
  return {
    bg: 'bg-[#F01616]/10',
    border: 'border-[#F01616]/40',
    text: 'text-[#F01616]',
    glow: 'shadow-[0_0_20px_rgba(240,22,22,0.45)]',
    label: 'CRITICAL RISK',
    indicatorBg: 'bg-[#F01616]'
  };
};

export const ActionCard = ({ action, onDecision, isProcessing = false }) => {
  const initialFormattedJson = JSON.stringify(action.payload || {}, null, 2);
  const [jsonString, setJsonString] = useState(initialFormattedJson);
  const [jsonError, setJsonError] = useState(null);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    const formatted = JSON.stringify(action.payload || {}, null, 2);
    setJsonString(formatted);
    setIsModified(false);
    setJsonError(null);
  }, [action._id, action.actionId, action.payload]);

  const handleJsonChange = (e) => {
    const val = e.target.value;
    setJsonString(val);
    try {
      JSON.parse(val);
      setJsonError(null);
      setIsModified(val.trim() !== initialFormattedJson.trim());
    } catch (err) {
      setJsonError(err.message);
      setIsModified(true);
    }
  };

  const handleReset = () => {
    setJsonString(initialFormattedJson);
    setJsonError(null);
    setIsModified(false);
  };

  const executeDecision = (decision) => {
    if (jsonError) return;
    try {
      const parsedPayload = JSON.parse(jsonString);
      onDecision(action._id || action.actionId, parsedPayload, decision, isModified);
    } catch (err) {
      setJsonError("Invalid JSON structure: Cannot dispatch action.");
    }
  };

  const riskConfig = getRiskBadgeConfig(action.riskScore ?? 50);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`relative overflow-hidden rounded-2xl border bg-slate-900/60 backdrop-blur-xl transition-all duration-300 hover-card-scale box-border ${
        isModified 
          ? 'border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)]' 
          : 'border-slate-800/80 hover:border-slate-700/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]'
      }`}
    >
      <div 
        className={`h-1 w-full bg-gradient-to-r ${
          action.riskScore > 70 
            ? 'from-[#F01616] via-purple-600 to-[#F01616]' 
            : action.riskScore >= 30 
            ? 'from-amber-500 via-orange-500 to-yellow-400' 
            : 'from-emerald-500 via-teal-500 to-cyan-400'
        }`} 
      />

      <div className="p-6 sm:p-7 space-y-5 box-border">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-[200px]">
            {/* Explicit Action ID & Intercept Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 tracking-wider">
                ID: {action.actionId || action._id || 'UNKNOWN_ID'}
              </span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-950/50 text-amber-300 border border-amber-500/30">
                HELD FOR APPROVAL
              </span>
            </div>

            {/* Target Tool Header */}
            <div className="flex items-center gap-2 pt-1">
              <Terminal className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block -mb-0.5">Target Tool</span>
                <h3 className="font-mono text-lg font-bold tracking-tight text-white">
                  {action.toolName || action.tool || 'system:execute'}
                </h3>
              </div>
            </div>
            
            {/* Calling Agent & Timestamp */}
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 bg-slate-800/70 px-2.5 py-1 rounded-md border border-slate-700/50 text-slate-200">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 text-[10px]">Agent:</span>
                <span className="font-bold text-cyan-200">{action.agentId || 'autonomous_agent'}</span>
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {action.timestamp ? new Date(action.timestamp).toLocaleTimeString() : 'Pending Review'}
              </span>
            </div>
          </div>

          {/* Risk Score Gauge */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Risk Assessment</span>
            <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border ${riskConfig.bg} ${riskConfig.border} ${riskConfig.glow}`}>
              <span className={`h-2 w-2 rounded-full ${riskConfig.indicatorBg} animate-pulse`} />
              <span className="text-xs font-semibold tracking-wider font-mono uppercase text-slate-300">
                {riskConfig.label}
              </span>
              <span className={`text-base font-extrabold font-mono ${riskConfig.text}`}>
                {action.riskScore ?? 0}/100
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400 flex items-center gap-1.5">
              <span>PAYLOAD_SCHEMA</span>
              {isModified && (
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  MODIFIED (Requires Re-Auth)
                </span>
              )}
            </span>
            {jsonError ? (
              <span className="text-[#F01616] font-mono flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Syntax Error
              </span>
            ) : (
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Valid JSON
              </span>
            )}
          </div>

          <div className="relative group">
            <textarea
              rows={7}
              value={jsonString}
              onChange={handleJsonChange}
              disabled={isProcessing}
              placeholder="Enter JSON payload..."
              spellCheck={false}
              className={`w-full rounded-xl bg-slate-950/80 p-3.5 font-mono text-xs text-cyan-100 placeholder-slate-600 transition-all duration-200 outline-none resize-y border ${
                jsonError 
                  ? 'border-[#F01616]/60 focus:ring-1 focus:ring-[#F01616]' 
                  : isModified 
                  ? 'border-cyan-500/50 focus:ring-1 focus:ring-cyan-500' 
                  : 'border-slate-800 focus:border-slate-600 focus:ring-1 focus:ring-slate-700'
              }`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isModified || isProcessing}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-mono font-medium transition-all ${
              isModified && !isProcessing
                ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                : 'bg-slate-900/40 text-slate-600 border border-slate-800/50 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Payload
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => executeDecision('REJECTED')}
              disabled={isProcessing}
              className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F01616] to-[#b30e0e] hover:from-[#ff2d2d] hover:to-[#c71212] px-5 py-2.5 text-xs font-mono font-bold text-white shadow-lg shadow-[#F01616]/30 hover:shadow-[#F01616]/60 border border-[#ff4d4d]/40 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-white transition-transform group-hover:rotate-90 duration-200" />
              <span>REJECT ACTION</span>
            </button>

            <button
              type="button"
              onClick={() => executeDecision('APPROVED')}
              disabled={Boolean(jsonError) || isProcessing}
              className="group relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-400 px-6 py-2.5 text-xs font-mono font-bold text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/60 border border-emerald-400/40 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white transition-transform group-hover:scale-110 duration-200" />
              <span>APPROVE ACTION</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ActionCard;
