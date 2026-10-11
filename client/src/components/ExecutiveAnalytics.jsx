import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Lock,
  AlertTriangle,
  ChevronRight,
  Database,
  Clock,
  Zap,
  Bot,
  Server,
  CheckCircle2,
  XCircle,
  Sliders,
  Search,
  Filter,
  ArrowRight,
  Check,
  Ban,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';

/* ─── Color Constants ─────────────────────────────────────────── */
const C_RED = '#EF233C';
const C_RED_GLOW = '#FF2D37';
const C_AMBER = '#F59E0B';
const C_EMERALD = '#10B981';

export default function ExecutiveAnalytics({ onNavigate }) {
  /* ── Interactive State for Mutation Simulator ───────────────── */
  const [isMutated, setIsMutated] = useState(false);
  const [verifyingLedger, setVerifyingLedger] = useState(false);
  const [ledgerVerified, setLedgerVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  /* ── Live Stream Action Queue State ─────────────────────────── */
  const [streamActions, setStreamActions] = useState([
    {
      id: 'ACT-9842',
      agent: 'RefundProcessor Agent',
      agentIcon: Bot,
      action: 'execute_transfer',
      detail: 'amount: $14,200.00, destination: 0x4B...99a',
      warning: 'Threshold ($1,000) Exceeded',
      status: 'AWAITING_APPROVAL',
      latency: '38ms',
      timeAgo: '14s ago',
    },
    {
      id: 'ACT-9841',
      agent: 'DataOps Pipeline Agent',
      agentIcon: Database,
      action: 'DROP TABLE customer_pii_vault CASCADE;',
      detail: 'Rule: NO_DESTRUCTIVE_DDL_ALLOWED',
      status: 'BLOCKED_QUARANTINED',
      latency: '29ms',
      timeAgo: '1m ago',
    },
    {
      id: 'ACT-9840',
      agent: 'CustomerSupport Sentry',
      agentIcon: ShieldCheck,
      action: 'fetch_faq_article(article_id: 104)',
      detail: 'Read-only tier compliant',
      status: 'VERIFIED_PASSED',
      latency: '14ms',
      timeAgo: '3m ago',
    },
    {
      id: 'ACT-9839',
      agent: 'InfraScale Orchestrator',
      agentIcon: Server,
      action: "scale_ecs_service(cluster: 'prod-api', min: 4, max: 8)",
      detail: 'Within quota bounds',
      status: 'VERIFIED_PASSED',
      latency: '21ms',
      timeAgo: '6m ago',
    },
  ]);

  const handleAuthorizeAction = (id) => {
    setStreamActions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'VERIFIED_PASSED', warning: 'Human Approved' } : item
      )
    );
  };

  const handleRejectAction = (id) => {
    setStreamActions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'BLOCKED_QUARANTINED', warning: 'Human Denied' } : item
      )
    );
  };

  const handleVerifyLedger = () => {
    setVerifyingLedger(true);
    setTimeout(() => {
      setVerifyingLedger(false);
      setLedgerVerified(true);
      setTimeout(() => setLedgerVerified(false), 4000);
    }, 900);
  };

  return (
    <div className="flex flex-col gap-10 text-slate-300 font-sans pb-16 selection:bg-[#EF233C]/30 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: HERO & DYNAMIC TOPOLOGY MESH
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
        {/* Left Hero Column */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Badge: Enforcer Status */}
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1F0E14] border border-[#EF233C]/40 text-[#FF4D5A] text-[11px] font-mono font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(239,35,60,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF233C] animate-pulse" />
              <span>AGENT SECURITY GATEWAY · ZERO TRUST ENFORCER</span>
            </span>
          </div>

          {/* Large Headline with Glowing Red "Verified." & Curved SVG Underline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight">
            Every AI action.<br />
            <span className="relative inline-block my-1">
              <span
                className="text-[#EF233C] font-black"
                style={{
                  textShadow: '0 0 35px rgba(239, 35, 60, 0.75), 0 0 65px rgba(255, 45, 55, 0.35)',
                }}
              >
                Verified.
              </span>
              {/* Hand-drawn curved red underline SVG from reference */}
              <svg
                className="absolute -bottom-2.5 left-0 w-full h-5 overflow-visible pointer-events-none"
                viewBox="0 0 240 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 6 15 C 65 5, 170 24, 235 10"
                  stroke="#EF233C"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(239, 35, 60, 0.7))',
                  }}
                />
              </svg>
            </span><br />
            Before autonomous byte execution.
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed font-normal">
            ActionGate deterministically intercepts LLM runtime tool-calls, sandbox operations, and database modifications. Cryptographically provable human-in-the-loop authorization with real-time payload quarantine.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <motion.button
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate && onNavigate('queue')}
              className="flex items-center gap-2.5 bg-gradient-to-r from-[#FF2D37] to-[#D90429] hover:from-[#ff414a] hover:to-[#eb0d34] text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-[0_0_24px_rgba(239,35,60,0.5)] cursor-pointer"
            >
              <Shield size={17} className="fill-white/20" />
              <span>Open Live Gateway</span>
              <ChevronRight size={16} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate && onNavigate('ledger')}
              className="flex items-center gap-2.5 bg-[#121620]/90 hover:bg-[#182030] border border-slate-800 hover:border-slate-700 text-slate-200 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all backdrop-blur-md cursor-pointer"
            >
              <Lock size={16} className="text-slate-400" />
              <span>Audit Merkle Trail</span>
            </motion.button>
          </div>

          {/* Micro Stats Below Buttons */}
          <div className="flex items-center gap-8 pt-4 border-t border-slate-800/70 font-mono">
            <div className="space-y-1">
              <div className="text-white font-bold text-base sm:text-lg">42ms</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">P99 Policy Intercept</div>
            </div>
            <div className="space-y-1">
              <div className="text-white font-bold text-base sm:text-lg">100%</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Payload Immutability</div>
            </div>
            <div className="space-y-1">
              <div className="text-white font-bold text-base sm:text-lg">0</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Unauthorized Mutations</div>
            </div>
          </div>
        </div>

        {/* Right Hero Column: Dynamic Topology Mesh */}
        <div className="lg:col-span-5 flex flex-col">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-slate-800/90 bg-[#0C101A]/90 backdrop-blur-xl p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden"
            style={{
              boxShadow: '0 20px 45px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* Top Red Glow Accent Strip */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, #EF233C 30%, #FF3848 70%, transparent 100%)',
                boxShadow: '0 0 18px #EF233C',
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EF233C] animate-pulse shadow-[0_0_8px_#EF233C]" />
                <h3 className="text-xs font-bold tracking-widest text-white uppercase">
                  DYNAMIC TOPOLOGY MESH
                </h3>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#161D2E] text-slate-400 font-bold border border-slate-700/60">
                FLOW: AG-ENFORCE-9
              </span>
            </div>

            {/* Interactive Animated Topology Mesh Diagram */}
            <div className="relative h-64 rounded-xl bg-[#070A11] border border-slate-800/80 p-4 flex items-center justify-between overflow-hidden">
              {/* Subtle background matrix grid */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #EF233C 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Node 1: Agent Source */}
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-xl bg-[#141A28] border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-lg">
                  <Bot size={22} className="text-cyan-400" />
                </div>
                <span className="text-[11px] font-mono font-bold text-white">FinanceGPT</span>
                <span className="text-[9px] font-mono text-[#EF233C] bg-[#EF233C]/10 px-1.5 py-0.5 rounded border border-[#EF233C]/30">
                  Action Req
                </span>
              </div>

              {/* Connecting Dashed Laser to Gateway */}
              <div className="relative flex-1 flex items-center justify-center px-2">
                <svg className="w-full h-8 overflow-visible" preserveAspectRatio="none">
                  <line
                    x1="0"
                    y1="16"
                    x2="100%"
                    y2="16"
                    stroke="#EF233C"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                </svg>
              </div>

              {/* Node 2: Center Gateway Shield */}
              <div className="relative z-10 flex flex-col items-center gap-1.5">
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF2D37] to-[#B80C19] flex items-center justify-center text-white shadow-[0_0_24px_rgba(239,35,60,0.6)]">
                  <Shield size={26} className="fill-white/20" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="text-xs font-mono font-black text-white tracking-wider">GATEWAY</span>
                <span className="text-[9px] font-mono text-slate-400">Zero-Trust Evaluator</span>
              </div>

              {/* Connecting Routes Branching */}
              <div className="relative flex-1 flex flex-col justify-between h-36 px-2">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  {/* Branch to Auto-Pass (Green) */}
                  <path
                    d="M 0 72 C 30 72, 40 18, 100% 18"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {/* Branch to HITL Quarantine (Amber) */}
                  <path
                    d="M 0 72 C 30 72, 40 72, 100% 72"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeDasharray="5 3"
                    className="animate-pulse"
                  />
                  {/* Branch to Blocked Exfil (Crimson) */}
                  <path
                    d="M 0 72 C 30 72, 40 126, 100% 126"
                    fill="none"
                    stroke="#EF233C"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>

              {/* Node 3: Enforcement Destination Outputs */}
              <div className="relative z-10 flex flex-col justify-between h-36 py-1 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/40 px-2 py-1 rounded text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Auto-Pass</span>
                </div>

                <div className="flex items-center gap-1.5 bg-amber-950/40 border border-amber-500/40 px-2 py-1 rounded text-amber-400 font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>HITL Quarantine</span>
                </div>

                <div className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-500/40 px-2 py-1 rounded text-rose-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Blocked Exfil</span>
                </div>
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Deterministic HMAC Validated
              </span>
              <span className="text-slate-500">NODE: US-EAST-EDGE-04</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FOUR CORE METRIC CARDS WITH SPARKLINES (Image 4)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Intercepted Actions */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0C101A]/85 backdrop-blur-xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
              INTERCEPTED ACTIONS (24H)
            </span>
            <Zap size={15} className="text-[#EF233C]" />
          </div>

          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight">
              18,429
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-1 text-xs font-mono text-emerald-400">
              <Activity size={13} />
              <span>+18.4% agent action volume</span>
            </div>

            {/* Green smooth sparkline SVG */}
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 18 Q 20 22, 40 14 T 70 8 T 100 12"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Metric 2: Human Pending Queue */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0C101A]/85 backdrop-blur-xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
              HUMAN PENDING QUEUE
            </span>
            <span className="text-amber-400 text-xs font-mono font-bold">⚡</span>
          </div>

          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-tight">
              23
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
              <Clock size={13} />
              <span>Average decision time: 38s</span>
            </div>

            {/* Amber smooth sparkline SVG */}
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 12 Q 25 6, 50 18 T 80 10 T 100 16"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Metric 3: Anomalies Deflected (Crimson Glow) */}
        <div className="rounded-2xl border border-[#EF233C]/40 bg-[#160A0E]/85 backdrop-blur-xl p-6 flex flex-col justify-between shadow-[0_0_30px_rgba(239,35,60,0.18)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[#FF4D5A] uppercase font-bold">
              ANOMALIES DEFLECTED
            </span>
            <AlertTriangle size={15} className="text-[#EF233C]" />
          </div>

          <div className="my-3">
            <div
              className="text-3xl sm:text-4xl font-mono font-black text-[#EF233C] tracking-tight"
              style={{ textShadow: '0 0 25px rgba(239, 35, 60, 0.7)' }}
            >
              312
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-1 text-xs font-mono text-[#FF5C6E]">
              <Ban size={13} />
              <span>Prompt injections & exfiltration halts</span>
            </div>

            {/* Red alert sparkline SVG */}
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 20 Q 20 22, 40 18 T 65 4 T 80 20 T 100 8"
                fill="none"
                stroke="#EF233C"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Metric 4: Cryptographic Integrity */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0C101A]/85 backdrop-blur-xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
              CRYPTOGRAPHIC INTEGRITY
            </span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>

          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight">
              100%
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-1 text-xs font-mono text-emerald-400">
              <CheckCircle2 size={13} />
              <span>Audit Chain Verified (SHA-256)</span>
            </div>

            {/* Emerald flat verified sparkline SVG */}
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
              <line x1="0" y1="14" x2="100" y2="14" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: REAL-TIME AUTHORIZATION FEED (Image 2 & 3)
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#0C101A]/85 backdrop-blur-xl p-6 shadow-2xl flex flex-col gap-6">
        {/* Header and Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF233C] animate-pulse" />
              <h3 className="text-lg font-bold text-white tracking-tight">
                Real-Time Authorization Feed
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live telemetry stream of autonomous agent intent packets undergoing gateway enforcement.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-slate-500" />
              <input
                type="text"
                placeholder="Filter tool calls, agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 sm:w-64 pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[#111624] border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#EF233C]/50"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setSelectedFilter(selectedFilter === 'ALL' ? 'HELD' : 'ALL')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-[#131826] border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <Filter size={13} />
              <span>{selectedFilter === 'ALL' ? 'All Packets' : 'Held Only'}</span>
            </button>

            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">
              POLLING 50ms
            </span>
          </div>
        </div>

        {/* Action Items List */}
        <div className="space-y-3">
          {streamActions
            .filter((item) => {
              if (selectedFilter === 'HELD' && item.status !== 'AWAITING_APPROVAL') return false;
              if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (
                  item.agent.toLowerCase().includes(q) ||
                  item.action.toLowerCase().includes(q) ||
                  item.detail.toLowerCase().includes(q)
                );
              }
              return true;
            })
            .map((item) => {
              const Icon = item.agentIcon;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800/80 bg-[#080B12]/80 hover:bg-[#0D121F]/90 p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs"
                >
                  {/* Left: Agent & Action description */}
                  <div className="flex items-start md:items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#141A28] border border-slate-700/80 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-slate-300" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm tracking-tight">{item.agent}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {item.id}</span>
                      </div>
                      <div className="text-slate-400 mt-1 truncate">
                        <span className="text-[#FF4D5A] font-semibold">{item.action}</span>
                        <span className="text-slate-500 mx-2">·</span>
                        <span className="text-slate-300">{item.detail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status badge, latency, action buttons */}
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Status Badge */}
                    {item.status === 'AWAITING_APPROVAL' && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>AWAITING OPERATOR APPROVAL</span>
                      </span>
                    )}

                    {item.status === 'BLOCKED_QUARANTINED' && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#EF233C]/15 border border-[#EF233C]/40 text-[#FF4D5A] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EF233C]" />
                        <span>QUARANTINED & BLOCKED</span>
                      </span>
                    )}

                    {item.status === 'VERIFIED_PASSED' && (
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                        <Check size={11} />
                        <span>VERIFIED PASSED</span>
                      </span>
                    )}

                    {/* Latency & Timestamp */}
                    <div className="text-[11px] text-slate-500 hidden sm:block">
                      <span>{item.timeAgo}</span>
                      <span className="mx-1.5">·</span>
                      <span className="text-slate-400">Latency {item.latency}</span>
                    </div>

                    {/* Action buttons if awaiting approval */}
                    {item.status === 'AWAITING_APPROVAL' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAuthorizeAction(item.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#FF2D37] to-[#D90429] hover:from-[#ff414a] hover:to-[#eb0d34] shadow-[0_0_12px_rgba(239,35,60,0.4)] cursor-pointer"
                        >
                          Authorize
                        </button>
                        <button
                          onClick={() => handleRejectAction(item.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 hover:bg-slate-800 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: 3 ARCHITECTURE PILLARS (Image 2 & 3)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-[11px] font-mono tracking-[0.25em] text-[#FF4D5A] uppercase font-bold">
            SYSTEMIC GOVERNANCE
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            AI Analyzes. Policy Decides. Humans Govern.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Humans retain deterministic sovereignty over high-impact agency. No AI model is permitted direct database or infrastructure execution without signed policy clearance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Pillar 1 */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C101A]/85 backdrop-blur-xl p-6 flex flex-col justify-between shadow-xl space-y-5">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#141A28] border border-slate-700/80 flex items-center justify-center text-cyan-400">
                <Bot size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold">
                  01 // AUTONOMOUS INTENT
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                  AI Analyzes & Plans
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Foundation models propose actions based on prompts, tools, and vector embeddings. The agent believes it is triggering execution.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Agent Sandboxing</span>
              <span className="text-slate-400">RFC-9421</span>
            </div>
          </div>

          {/* Pillar 2: Featured Deterministic Gate */}
          <div className="rounded-2xl border border-[#EF233C]/50 bg-[#160A0E]/85 backdrop-blur-xl p-6 flex flex-col justify-between shadow-[0_0_25px_rgba(239,35,60,0.15)] space-y-5">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF2D37] to-[#B80C19] flex items-center justify-center text-white shadow-[0_0_15px_rgba(239,35,60,0.5)]">
                <Shield size={20} className="fill-white/20" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#FF4D5A] uppercase font-bold">
                  02 // DETERMINISTIC GATE
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                  Policy Evaluates
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                ActionGate intercepts the outbound request prior to wire egress. Static assertions, behavioral bounds, and zero-trust policies evaluate payload safety.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-[#FF5C6E]">
              <span>Zero Latency Loss</span>
              <span className="font-bold">p99 &lt; 12ms</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#0C101A]/85 backdrop-blur-xl p-6 flex flex-col justify-between shadow-xl space-y-5">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#141A28] border border-slate-700/80 flex items-center justify-center text-emerald-400">
                <Lock size={20} />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold">
                  03 // HUMAN SOVEREIGNTY
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                  Humans Approve Impact
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Financial disbursements, security downgrades, and production alterations require cryptographic HMAC human authorization.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800/70 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Signed Attestation</span>
              <span className="text-slate-400">mTLS / Dual-Key</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: TWO-COLUMN INTERACTIVE MODULES (Image 1, 2 & 3)
          Left: Payload Mutation Defense
          Right: Cryptographic Merkle Audit Chain
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module 1: Payload Mutation Defense */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0C101A]/85 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-[10px] tracking-widest uppercase font-bold text-[#FF4D5A]">
                ZERO-TRUST CRYPTOGRAPHIC GUARD
              </span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                Interactive Test
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Payload Mutation Defense
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simulate a Man-in-the-Middle (MITM) or agent prompt injection modifying the target URL after authorization signature has been generated.
            </p>
          </div>

          {/* Interactive Simulation Area */}
          <div className="rounded-xl bg-[#080B12] border border-slate-800/90 p-4 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Destination:</span>
              <button
                onClick={() => setIsMutated(!isMutated)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  isMutated
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/50'
                    : 'bg-[#EF233C]/20 border-[#EF233C]/50 text-[#FF4D5A] hover:bg-[#EF233C]/30 shadow-[0_0_10px_rgba(239,35,60,0.3)]'
                }`}
              >
                {isMutated ? '↺ Reset to Valid Endpoint' : '⚡ Click to Mutate Endpoint'}
              </button>
            </div>

            {/* Endpoint Display Box */}
            <div className="p-3 rounded-lg bg-[#04060A] border border-slate-800 flex items-center justify-between">
              <span className={isMutated ? 'text-[#FF4D5A] line-through' : 'text-emerald-400'}>
                {isMutated ? 'https://attacker-exfil.xyz/v1/intercepted-tokens' : 'https://api.stripe.com/v1/refunds'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isMutated
                    ? 'bg-[#EF233C]/20 text-[#FF4D5A] border border-[#EF233C]/40 animate-pulse'
                    : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isMutated ? 'TAMPERED / MUTATED' : 'UNTOUCHED'}
              </span>
            </div>

            {/* HMAC Hash Status */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">HMAC Hash Status:</span>
              <span
                className={`text-xs font-bold ${
                  isMutated ? 'text-[#EF233C] animate-pulse' : 'text-emerald-400'
                }`}
              >
                {isMutated ? 'INVALID (Cryptographic Signature Compromised)' : 'VALID (Signature Match)'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/70">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Lock size={12} className="text-[#EF233C]" />
              <span>Cryptographic Enforcement Policy</span>
            </span>
            <span className="text-slate-300 font-bold">STRICT_SHA256_REVOKE</span>
          </div>
        </div>

        {/* Module 2: Cryptographic Merkle Audit Chain */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0C101A]/85 backdrop-blur-xl p-6 shadow-2xl flex flex-col justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono">
              <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400">
                IMMUTABLE LEDGER
              </span>
              <button
                onClick={handleVerifyLedger}
                disabled={verifyingLedger}
                className="flex items-center gap-1.5 text-[11px] text-[#FF4D5A] hover:text-[#ff6b77] transition-colors cursor-pointer"
              >
                <RefreshCw size={12} className={verifyingLedger ? 'animate-spin' : ''} />
                <span>{verifyingLedger ? 'Verifying Proofs...' : ledgerVerified ? 'Proofs Verified ✓' : 'Verify Ledger Proofs'}</span>
              </button>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Cryptographic Merkle Audit Chain
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every authorized action and quarantine seal is permanently etched into an immutable SHA-256 Merkle chain, providing zero-trust forensic proof.
            </p>
          </div>

          {/* Blocks Sequence */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            {/* Block 1 */}
            <div className="p-3 rounded-xl bg-[#080B12] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>BLOCK #9842</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="text-white font-bold text-xs truncate">0x7F2a...9801</div>
              <div className="text-[10px] text-slate-500">8 Actions Sealed</div>
            </div>

            {/* Block 2 */}
            <div className="p-3 rounded-xl bg-[#080B12] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>BLOCK #9843</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="text-white font-bold text-xs truncate">0x4D81...3C99</div>
              <div className="text-[10px] text-slate-500">14 Actions Sealed</div>
            </div>

            {/* Block 3 */}
            <div className="p-3 rounded-xl bg-[#080B12] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>BLOCK #9844</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="text-white font-bold text-xs truncate">0x99A3...E714</div>
              <div className="text-[10px] text-slate-500">21 Actions Sealed</div>
            </div>

            {/* Block 4 (HEAD) */}
            <div className="p-3 rounded-xl bg-[#14080B] border border-[#EF233C]/40 space-y-1.5 shadow-[0_0_12px_rgba(239,35,60,0.2)]">
              <div className="flex items-center justify-between text-[10px] text-[#FF4D5A]">
                <span className="font-bold">BLOCK #9845</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF233C] animate-pulse" />
              </div>
              <div className="text-white font-bold text-xs truncate">0x3E11...0A42</div>
              <div className="text-[10px] text-slate-400">Signing Packets...</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/70">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={12} />
              <span>SHA-256 Merkle Root Integrity Validated</span>
            </span>
            <span className="text-slate-400">Compact Tree v2</span>
          </div>
        </div>
      </div>
    </div>
  );
}
