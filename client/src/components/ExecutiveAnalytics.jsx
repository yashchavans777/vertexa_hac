import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Radio,
  Zap,
  Lock,
  ArrowRight,
  Terminal,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
  FileCode,
  Users,
  Database,
  ExternalLink,
} from 'lucide-react';

/* ─── Color Tokens ─────────────────────────────────────────────── */
const C_RED = '#F01616';        // Strict Constraint: Hex #F01616
const C_CYAN = '#00F5FF';
const C_AMBER = '#FFB800';
const C_EMERALD = '#00E676';

export default function ExecutiveAnalytics() {
  const [interceptStatus, setInterceptStatus] = useState('BLOCKED');
  const [actionFeedback, setActionFeedback] = useState(null);

  const triggerFeedback = (message, type = 'danger') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 w-full font-mono">
      {/* ── Toast Notification ─────────────────────────────────── */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="fixed top-6 right-8 z-50 px-4 py-2.5 rounded-lg text-xs font-mono flex items-center gap-2 border shadow-2xl backdrop-blur-xl"
            style={{
              background: '#0B0F19',
              borderColor: actionFeedback.type === 'danger' ? C_RED : C_EMERALD,
              color: actionFeedback.type === 'danger' ? '#FF6B6B' : C_EMERALD,
              boxShadow: actionFeedback.type === 'danger' 
                ? '0 0 24px rgba(240, 22, 22, 0.4)' 
                : '0 0 24px rgba(0, 230, 118, 0.3)',
            }}
          >
            {actionFeedback.type === 'danger' ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} />}
            <span className="font-bold tracking-wide">{actionFeedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[rgba(0,245,255,0.1)]">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest text-white uppercase"
              style={{ background: C_RED, boxShadow: `0 0 10px ${C_RED}` }}
            >
              SOC COMMAND
            </span>
            <h1 className="text-lg font-bold tracking-[0.25em] uppercase text-white">
              Security Overview
            </h1>
          </div>
          <p className="text-xs tracking-wider text-[#64748B] mt-1">
            Real-time telemetry, zero-trust gatekeeping, and automated cryptographic action verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-[rgba(0,245,255,0.2)] bg-[rgba(15,22,35,0.7)] text-xs text-[#94A3B8]">
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: C_EMERALD }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: C_EMERALD }}
            />
          </span>
          <span className="text-[11px] tracking-wider text-slate-300">
            ENFORCEMENT ENGINE ACTIVE
          </span>
        </div>
      </div>

      {/* ── Middle Split: Left Hero & Right Intercept Widget ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* ── 2. Left Hero Section ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-7 glass-panel p-6 md:p-8 flex flex-col justify-between relative overflow-hidden"
          style={{
            background: 'var(--bg-glass)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-30"
            style={{ background: C_RED }}
          />

          <div className="space-y-6 relative z-10">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] tracking-widest uppercase border border-[rgba(0,245,255,0.2)] bg-[rgba(0,245,255,0.05)] text-[#00F5FF]">
              <Radio size={12} className="animate-pulse" />
              <span>ZERO-TRUST AGENT GUARDRAILS</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              Every AI action.{' '}
              <span
                className="font-extrabold inline-block tracking-tight"
                style={{
                  color: C_RED,
                  textShadow: `0 0 14px ${C_RED}, 0 0 28px rgba(240, 22, 22, 0.65)`,
                }}
              >
                Verified
              </span>{' '}
              before execution.
            </h2>

            <p className="text-xs md:text-sm text-[#94A3B8] leading-relaxed max-w-xl">
              ActionGate intercepts autonomous agent tool calls in real time. Payloads are checked against declarative enterprise policies, cryptographically sealed with forward-chaining SHA-256 hashes, and gated for mandatory human approval whenever risk thresholds are breached.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <motion.button
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => triggerFeedback('Live Gateway route engaged. Monitoring active pipeline.', 'danger')}
                className="px-5 py-3 rounded-lg text-xs font-bold tracking-widest text-white uppercase flex items-center gap-2 transition-all cursor-pointer"
                style={{
                  background: C_RED,
                  boxShadow: `0 0 20px ${C_RED}, inset 0 0 10px rgba(255, 255, 255, 0.2)`,
                }}
              >
                <Zap size={14} />
                <span>Open Live Gateway</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => triggerFeedback('Navigating to Cryptographic Audit Ledger.', 'success')}
                className="px-5 py-3 rounded-lg text-xs font-bold tracking-widest uppercase flex items-center gap-2 border transition-all cursor-pointer text-[#00F5FF] bg-transparent"
                style={{
                  borderColor: 'rgba(0, 245, 255, 0.35)',
                  boxShadow: '0 0 12px rgba(0, 245, 255, 0.1)',
                }}
              >
                <Lock size={14} />
                <span>View Audit Trail</span>
              </motion.button>
            </div>
          </div>

          {/* 3 Small Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-8 mt-6 border-t border-[rgba(0,245,255,0.1)] relative z-10">
            <div className="p-3 rounded-lg bg-[rgba(11,15,25,0.6)] border border-[rgba(0,245,255,0.12)] space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] uppercase tracking-wider">
                <Clock size={11} className="text-[#00F5FF]" />
                <span>Latency SLA</span>
              </div>
              <div className="text-xs md:text-sm font-bold text-white tracking-wide">
                10ms P99 Policy Gate
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[rgba(11,15,25,0.6)] border border-[rgba(0,245,255,0.12)] space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] uppercase tracking-wider">
                <ShieldCheck size={11} className="text-[#00E676]" />
                <span>Non-Repudiation</span>
              </div>
              <div className="text-xs md:text-sm font-bold text-white tracking-wide">
                100% Payload Integrity
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[rgba(11,15,25,0.6)] border border-[rgba(0,245,255,0.12)] space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-[#64748B] uppercase tracking-wider">
                <AlertOctagon size={11} style={{ color: C_RED }} />
                <span>Leak Defenses</span>
              </div>
              <div className="text-xs md:text-sm font-bold text-white tracking-wide">
                0 Unverified Mutations
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── 3. Right Widget ("Intercept Core") ───────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-5 glass-panel rounded-xl flex flex-col justify-between relative overflow-hidden"
          style={{
            background: 'var(--bg-glass)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Top Red Border Line */}
          <div
            className="w-full h-[3px]"
            style={{
              background: C_RED,
              boxShadow: `0 0 16px ${C_RED}, 0 0 32px ${C_RED}`,
            }}
          />

          <div className="p-5 md:p-6 space-y-4 flex-1">
            {/* Widget Title Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(240,22,22,0.2)]">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} style={{ color: C_RED }} />
                <span className="text-xs font-bold tracking-widest uppercase text-white">
                  Intercept Core
                </span>
              </div>

              {/* Tag: Risk: Tier 3 - Impact */}
              <span
                className="px-2.5 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase text-white flex items-center gap-1"
                style={{
                  background: C_RED,
                  boxShadow: `0 0 10px ${C_RED}`,
                }}
              >
                <AlertOctagon size={10} />
                <span>Risk: Tier 3 - Impact</span>
              </span>
            </div>

            {/* Simulated Blocked Action Header Info */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#64748B]">INITIATING AGENT:</span>
                <span className="text-[#00F5FF] font-bold tracking-wide">
                  agent_sql_infiltrator_07
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#64748B]">TARGET DATABASE:</span>
                <span className="text-white">postgresql://prod-db/users</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#64748B]">GATEWAY INTERCEPT:</span>
                <span
                  className="font-bold px-1.5 py-0.2 rounded text-[10px]"
                  style={{
                    background: 'rgba(240,22,22,0.15)',
                    color: C_RED,
                    border: '1px solid rgba(240,22,22,0.3)',
                  }}
                >
                  BLOCKED (403 FORBIDDEN)
                </span>
              </div>
            </div>

            {/* Code Block / SQL Payload Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                <span className="flex items-center gap-1">
                  <Terminal size={11} />
                  <span>INTERCEPTED PAYLOAD</span>
                </span>
                <span className="text-[9px] text-[#F01616]">MUTATION_DISALLOWED</span>
              </div>

              <div
                className="p-3.5 rounded-lg border font-mono text-xs overflow-x-auto relative"
                style={{
                  background: '#070B12',
                  borderColor: 'rgba(240, 22, 22, 0.3)',
                  boxShadow: 'inset 0 0 12px rgba(240, 22, 22, 0.08)',
                }}
              >
                <div className="text-[#64748B] text-[10px] mb-1">
                  // Unsanitized destructive DDL operation flagged:
                </div>
                <code className="text-white font-bold block">
                  <span style={{ color: C_RED }}>DROP</span>{' '}
                  <span style={{ color: C_CYAN }}>TABLE</span> users;
                </code>
                <div className="text-[10px] text-[#64748B] mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <span>Blast Radius: 100/100</span>
                  <span className="text-rose-400">Policy: StrictDatabaseProtection</span>
                </div>
              </div>
            </div>

            {/* Threat Description */}
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Autonomous agent attempted destructive schema mutation without quorum authorization. The declarative policy engine halted execution and cryptographically committed the refusal to the audit ledger.
            </p>
          </div>

          {/* Bottom Action Buttons */}
          <div
            className="p-4 bg-[rgba(11,15,25,0.7)] border-t border-[rgba(0,245,255,0.08)] grid grid-cols-2 gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setInterceptStatus('DENIED_CONFIRMED');
                triggerFeedback('Action dropped. Incident logged to Security Operations Center.', 'danger');
              }}
              className="py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                background: C_RED,
                boxShadow: `0 0 14px ${C_RED}`,
              }}
            >
              <ShieldAlert size={13} />
              <span>Deny Action</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setInterceptStatus('AUTHORIZE_REQUESTED');
                triggerFeedback('Separation of Duties violation: Self-authorization blocked. Escalated to dual-control quorum.', 'danger');
              }}
              className="py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-300 border border-[rgba(255,255,255,0.15)] bg-transparent hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck size={13} />
              <span>Authorize Payload</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ── 4. Bottom Metrics Grid (4 columns) ───────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Agents (Cyan border) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="glass-panel p-5 rounded-xl border relative overflow-hidden flex flex-col justify-between"
          style={{
            borderColor: 'rgba(0, 245, 255, 0.4)',
            boxShadow: '0 0 20px rgba(0, 245, 255, 0.1)',
            background: 'var(--bg-glass)',
          }}
        >
          <div
            className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none"
            style={{ background: 'rgba(0, 245, 255, 0.15)' }}
          />

          <div className="flex items-center justify-between text-[#64748B] text-[10px] uppercase tracking-widest font-semibold mb-2">
            <span>Active Agents</span>
            <div className="p-1.5 rounded-md bg-[rgba(0,245,255,0.1)] text-[#00F5FF]">
              <Users size={14} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              18,429
            </div>
            <div className="text-[10px] text-[#00F5FF] flex items-center gap-1">
              <span>●</span>
              <span>100% Identity Certified</span>
            </div>
          </div>
        </motion.div>

        {/* Metric 2: Human Pending (Amber border) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="glass-panel p-5 rounded-xl border relative overflow-hidden flex flex-col justify-between"
          style={{
            borderColor: 'rgba(255, 184, 0, 0.4)',
            boxShadow: '0 0 20px rgba(255, 184, 0, 0.1)',
            background: 'var(--bg-glass)',
          }}
        >
          <div
            className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none"
            style={{ background: 'rgba(255, 184, 0, 0.15)' }}
          />

          <div className="flex items-center justify-between text-[#64748B] text-[10px] uppercase tracking-widest font-semibold mb-2">
            <span>Human Pending</span>
            <div className="p-1.5 rounded-md bg-[rgba(255,184,0,0.1)] text-[#FFB800]">
              <Activity size={14} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[#FFB800] tracking-tight">
              23
            </div>
            <div className="text-[10px] text-[#94A3B8] flex items-center gap-1">
              <span>Awaiting dual-control quorum</span>
            </div>
          </div>
        </motion.div>

        {/* Metric 3: Anomalies Deflected (Red border) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.26 }}
          className="glass-panel p-5 rounded-xl border relative overflow-hidden flex flex-col justify-between"
          style={{
            borderColor: 'rgba(240, 22, 22, 0.5)',
            boxShadow: '0 0 24px rgba(240, 22, 22, 0.18)',
            background: 'var(--bg-glass)',
          }}
        >
          <div
            className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none"
            style={{ background: 'rgba(240, 22, 22, 0.2)' }}
          />

          <div className="flex items-center justify-between text-[#64748B] text-[10px] uppercase tracking-widest font-semibold mb-2">
            <span>Anomalies Deflected</span>
            <div
              className="p-1.5 rounded-md text-white"
              style={{ background: C_RED, boxShadow: `0 0 10px ${C_RED}` }}
            >
              <ShieldAlert size={14} />
            </div>
          </div>

          <div className="space-y-1">
            <div
              className="text-3xl font-extrabold tracking-tight"
              style={{
                color: C_RED,
                textShadow: `0 0 12px ${C_RED}`,
              }}
            >
              312
            </div>
            <div className="text-[10px] text-rose-400 flex items-center gap-1">
              <span>Zero-day and SQL vectors neutralized</span>
            </div>
          </div>
        </motion.div>

        {/* Metric 4: Cryptographic Chain (Emerald border) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.34 }}
          className="glass-panel p-5 rounded-xl border relative overflow-hidden flex flex-col justify-between"
          style={{
            borderColor: 'rgba(0, 230, 118, 0.4)',
            boxShadow: '0 0 20px rgba(0, 230, 118, 0.1)',
            background: 'var(--bg-glass)',
          }}
        >
          <div
            className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl pointer-events-none"
            style={{ background: 'rgba(0, 230, 118, 0.15)' }}
          />

          <div className="flex items-center justify-between text-[#64748B] text-[10px] uppercase tracking-widest font-semibold mb-2">
            <span>Cryptographic Chain</span>
            <div className="p-1.5 rounded-md bg-[rgba(0,230,118,0.1)] text-[#00E676]">
              <Lock size={14} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[#00E676] tracking-tight">
              100%
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span>SHA-256 forward-linked unbroken</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
