import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Bot,
  Server,
  Zap,
  ArrowRight,
  TrendingUp,
  Clock,
  Ban,
  Link,
  Sliders,
  Check,
  RotateCcw,
  Briefcase,
  AlertTriangle,
  Lock,
} from 'lucide-react';

/* ─── Color Tokens ─────────────────────────────────────────────── */
const C_RED = '#EF233C';
const C_RED_GLOW = '#FF2D37';
const C_AMBER = '#FFB800';
const C_EMERALD = '#00E676';

export default function ExecutiveAnalytics({ onNavigate }) {
  const [quarantined, setQuarantined] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const showToast = (msg, type = 'info') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3200);
  };

  const handleQuarantine = () => {
    setQuarantined(true);
    setAuthorized(false);
    showToast('Action cluster.reboot quarantined and discarded.', 'danger');
  };

  const handleAuthorize = () => {
    setAuthorized(true);
    setQuarantined(false);
    showToast('Action payload approved. Quorum requirement satisfied.', 'success');
  };

  return (
    <div className="relative z-10 w-full flex flex-col gap-6 font-sans">
      {/* Toast Alert */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="fixed top-8 right-10 z-50 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2 border shadow-2xl backdrop-blur-2xl"
            style={{
              background: '#0D1117',
              borderColor: feedback.type === 'danger' ? '#EF233C' : '#00E676',
              color: feedback.type === 'danger' ? '#FF6B6B' : '#00E676',
              boxShadow: feedback.type === 'danger'
                ? '0 0 24px rgba(239, 35, 60, 0.4)'
                : '0 0 24px rgba(0, 230, 118, 0.3)',
            }}
          >
            {feedback.type === 'danger' ? <ShieldAlert size={15} /> : <ShieldCheck size={15} />}
            <span className="font-semibold">{feedback.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Hero Split: Left Content & Right Intercept Core ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">

        {/* ── Left Hero Section ─────────────────────────────────── */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 pt-2">
          
          {/* Pill Badge: AI AGENT SECURITY GATEWAY | L4 PROXY ACTIVE */}
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider w-fit bg-[#12161F]/90 border border-slate-800/80 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#EF233C] animate-pulse shadow-[0_0_8px_#EF233C]" />
            <span className="font-bold text-slate-300 tracking-wider">AI AGENT SECURITY GATEWAY</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1A202C] text-slate-400 border border-slate-700/60">
              L4 PROXY ACTIVE
            </span>
          </div>

          {/* Giant Headline with curved wavy underline on "Verified" */}
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black text-white tracking-tight leading-[1.12]">
              Every AI action.
            </h1>
            <div className="relative inline-block">
              <span
                className="text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight"
                style={{
                  color: C_RED_GLOW,
                  textShadow: '0 0 25px rgba(255, 45, 55, 0.55)',
                }}
              >
                Verified
              </span>
              {/* Hand-drawn style red wavy underline */}
              <svg
                className="absolute -bottom-2.5 left-0 w-full overflow-visible"
                height="10"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0 5 Q 25 9, 50 5 T 100 5"
                  fill="none"
                  stroke="#FF2D37"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 6px #FF2D37)' }}
                />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black text-white tracking-tight leading-[1.12]">
              before execution.
            </h1>
          </div>

          {/* Description Paragraph */}
          <p className="text-sm md:text-[15px] text-slate-400 font-normal leading-relaxed max-w-xl">
            ActionGate intercepts autonomous agent payloads, evaluates high-stakes policy invariants in under 12ms, and prevents irreversible system mutations with cryptographic proof.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <motion.button
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (onNavigate) onNavigate('queue');
                showToast('Routing to Live Gateway Execution Stream...', 'info');
              }}
              className="px-6 py-3.5 rounded-xl text-sm font-bold text-white flex items-center gap-2.5 shadow-lg transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #FF3B48 0%, #E61928 100%)',
                boxShadow: '0 0 24px rgba(239, 35, 60, 0.5), inset 0 1px 1px rgba(255,255,255,0.3)',
              }}
            >
              <Shield size={17} className="fill-white/20" />
              <span>Open Live Gateway</span>
              <ArrowRight size={16} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (onNavigate) onNavigate('ledger');
                showToast('Opening Cryptographic Audit Ledger...', 'info');
              }}
              className="px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 flex items-center gap-2.5 border border-slate-800 bg-[#121620]/80 hover:bg-[#161C28] hover:border-slate-700 transition-all cursor-pointer backdrop-blur-md"
            >
              <Lock size={16} className="text-slate-400" />
              <span>View Audit Trail</span>
            </motion.button>
          </div>

          {/* Micro Stats (12ms, 100%, 0 Void) */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/60 max-w-lg font-mono">
            <div>
              <div className="text-lg md:text-xl font-black text-white">12ms</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                P99 POLICY GATE
              </div>
            </div>

            <div>
              <div className="text-lg md:text-xl font-black text-white">100%</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                PAYLOAD INTEGRITY
              </div>
            </div>

            <div>
              <div className="text-lg md:text-xl font-black text-white">0 Void</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                UNCHECKED MUTATES
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Intercept Core Widget ────────────────────────── */}
        <div className="lg:col-span-5 w-full">
          <div
            className="rounded-2xl border border-slate-800/90 p-5 md:p-6 relative overflow-hidden backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(160deg, rgba(16, 21, 30, 0.92) 0%, rgba(10, 13, 20, 0.96) 100%)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(239, 35, 60, 0.08)',
            }}
          >
            {/* Ambient top red glow edge */}
            <div
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-16 rounded-full blur-2xl pointer-events-none"
              style={{ background: 'rgba(239, 35, 60, 0.25)' }}
            />

            {/* Header: ● INTERCEPT CORE | AG-9F4A21 ⊞ */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EF233C] animate-pulse shadow-[0_0_8px_#EF233C]" />
                <span className="text-xs font-black tracking-widest text-slate-200 uppercase font-mono">
                  INTERCEPT CORE
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1A202C] text-slate-400 border border-slate-700/60">
                  AG-9F4A21
                </span>
                <Sliders size={13} className="text-slate-400 hover:text-white cursor-pointer" />
              </div>
            </div>

            {/* Sub-Header: ⚡ INTERCEPT ACTIVE | HOLD-QUEUE : 1 / 1 */}
            <div className="flex items-center justify-between pt-3 pb-2 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-[#EF233C] font-bold">
                <Zap size={13} className="fill-[#EF233C]" />
                <span>INTERCEPT ACTIVE</span>
              </div>
              <div className="text-slate-500 font-semibold tracking-wider">
                HOLD-QUEUE : 1 / 1
              </div>
            </div>

            {/* Dynamic Interactive Pipeline Diagram */}
            <div className="my-3 py-3 px-2 rounded-xl bg-[#090C12]/90 border border-slate-800/80 flex items-center justify-between relative overflow-hidden">
              {/* Agent Node */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-10 h-10 rounded-xl bg-[#131924] border border-slate-700 flex items-center justify-center text-slate-300 shadow-md">
                  <Bot size={20} />
                </div>
                <span className="text-[10px] font-mono text-slate-400">ops-agent</span>
              </div>

              {/* Connecting Red Stream with restart_server pill */}
              <div className="flex-1 flex flex-col items-center justify-center px-1 relative">
                <span className="text-[9px] font-mono font-bold text-[#EF233C] mb-1">
                  restart_server
                </span>
                <div className="w-full flex items-center">
                  <div className="w-full h-0.5 border-b border-dashed border-[#EF233C]/80" />
                </div>
              </div>

              {/* ActionGate Center Shield Node */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-10 h-10 rounded-xl bg-[#200D12] border border-[#EF233C] flex items-center justify-center text-[#EF233C] shadow-[0_0_15px_rgba(239,35,60,0.3)]">
                  <Shield size={20} className="fill-[#EF233C]/20" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-200">ActionGate</span>
              </div>

              {/* Connecting Gray Stream with HOLD */}
              <div className="flex-1 flex flex-col items-center justify-center px-1 relative">
                <span className="text-[9px] font-mono font-bold text-slate-400 mb-1">
                  HOLD
                </span>
                <div className="w-full flex items-center">
                  <div className="w-full h-0.5 border-b border-dashed border-slate-700" />
                </div>
              </div>

              {/* Target Server Node */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-10 h-10 rounded-xl bg-[#131924] border border-slate-700 flex items-center justify-center text-slate-400 shadow-md">
                  <Server size={18} />
                </div>
                <span className="text-[10px] font-mono text-slate-400">prod-cluster</span>
              </div>
            </div>

            {/* Risk & TTL Meta row */}
            <div className="flex items-center justify-between text-xs font-mono py-1">
              <div>
                <span className="text-slate-400">Risk: </span>
                <span className="text-[#FFB800] font-bold">Tier-2 Impact</span>
              </div>
              <div className="text-slate-500">
                TTL: 142s
              </div>
            </div>

            {/* Inspected Intent Box */}
            <div className="mt-3 p-3.5 rounded-xl bg-[#090D14] border border-slate-800/90 font-mono space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-bold uppercase tracking-wider">
                  INSPECTED INTENT:
                </span>
                <span className="text-[#00E676] font-semibold">
                  SHA256: 4e9f...a02c
                </span>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed font-mono overflow-x-auto">
                <span className="text-slate-500">&#123;</span>
                <span className="text-slate-300">"action"</span>: <span className="text-amber-300">"cluster.reboot"</span>,{' '}
                <span className="text-slate-300">"zone"</span>: <span className="text-emerald-300">"us-east-1a"</span>,{' '}
                <span className="text-slate-300">"force"</span>: <span className="text-rose-400">false</span>
                <span className="text-slate-500">&#125;</span>
              </div>
            </div>

            {/* Bottom Decision Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-1 font-mono">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleQuarantine}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  quarantined
                    ? 'bg-[#EF233C] text-white border-[#EF233C]'
                    : 'bg-[#1C0F13] text-[#EF233C] border-[#EF233C]/40 hover:bg-[#2A1319]'
                }`}
              >
                <Ban size={13} />
                <span>Quarantine Action</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAuthorize}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  authorized
                    ? 'bg-[#00E676] text-black border-[#00E676]'
                    : 'bg-[#141A24] text-slate-200 border-slate-700 hover:bg-[#1A2230]'
                }`}
              >
                <Check size={13} />
                <span>Authorize Payload</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Metrics Grid (4 Columns) ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        
        {/* Metric 1: ACTIONS EVALUATED */}
        <div
          className="rounded-2xl p-5 border border-slate-800/90 relative overflow-hidden backdrop-blur-xl flex flex-col justify-between"
          style={{ background: 'rgba(13, 17, 24, 0.88)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              ACTIONS EVALUATED
            </span>
            <div className="w-7 h-7 rounded-full bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-[#EF233C]">
              <RotateCcw size={13} />
            </div>
          </div>

          <div className="my-2.5">
            <div className="text-3xl font-black text-white tracking-tight">
              18,429
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#00E676]">
            <TrendingUp size={13} />
            <span>+18.4% agent action volume</span>
          </div>
        </div>

        {/* Metric 2: HUMAN PENDING QUEUE */}
        <div
          className="rounded-2xl p-5 border border-slate-800/90 relative overflow-hidden backdrop-blur-xl flex flex-col justify-between"
          style={{ background: 'rgba(13, 17, 24, 0.88)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              HUMAN PENDING QUEUE
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-[#FFB800]">
              <Briefcase size={13} />
            </div>
          </div>

          <div className="my-2.5">
            <div className="text-3xl font-black text-white tracking-tight">
              23
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Clock size={13} />
            <span>Average decision time: 38s</span>
          </div>
        </div>

        {/* Metric 3: ANOMALIES DEFLECTED */}
        <div
          className="rounded-2xl p-5 border border-slate-800/90 relative overflow-hidden backdrop-blur-xl flex flex-col justify-between"
          style={{ background: 'rgba(13, 17, 24, 0.88)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              ANOMALIES DEFLECTED
            </span>
            <div className="w-7 h-7 rounded-full bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-[#EF233C]">
              <ShieldAlert size={13} />
            </div>
          </div>

          <div className="my-2.5">
            <div className="text-3xl font-black text-[#EF233C] tracking-tight">
              312
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <Ban size={13} className="text-[#EF233C]" />
            <span>Prompt injections & exfiltration halts</span>
          </div>
        </div>

        {/* Metric 4: CRYPTOGRAPHIC CHAIN */}
        <div
          className="rounded-2xl p-5 border border-slate-800/90 relative overflow-hidden backdrop-blur-xl flex flex-col justify-between"
          style={{ background: 'rgba(13, 17, 24, 0.88)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
              CRYPTOGRAPHIC CHAIN
            </span>
            <div className="w-7 h-7 rounded-full bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-[#00E676]">
              <Check size={13} />
            </div>
          </div>

          <div className="my-2.5">
            <div className="text-3xl font-black text-white tracking-tight">
              100%
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#00E676]">
            <Link size={13} />
            <span>Audit Chain Verified SHA-256</span>
          </div>
        </div>

      </div>
    </div>
  );
}
