import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Zap,
  ShieldAlert,
  Bot,
  Sliders,
  Lock,
  Search,
  Bell,
  Settings,
  Shield,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Flame,
  Menu,
} from 'lucide-react';
import CosmicThreatBackground from './CosmicThreatBackground';

/* ── Navigation items matching Image 2 ─────────────────────────── */
const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',        icon: LayoutDashboard },
  { id: 'queue',     label: 'Live Actions',    icon: Zap },
  { id: 'approvals', label: 'Approval Queue',  icon: ShieldAlert, badge: 23, badgeColor: '#FF4D4D' },
  { id: 'agents',    label: 'Agents',          icon: Bot, badge: 6, badgeColor: '#1E2538' },
  { id: 'policies',  label: 'Policies',        icon: Sliders },
  { id: 'ledger',    label: 'Audit Trail',     icon: Lock },
  { id: 'chaos',     label: 'Chaos Lab',       icon: Flame },
  { id: 'settings',  label: 'Settings',        icon: Settings },
];

/* ── Notification feed for the bell dropdown (pending count derives from NAV_ITEMS) ── */
const PENDING_APPROVALS = NAV_ITEMS.find((i) => i.id === 'approvals')?.badge ?? 0;
const CONNECTED_AGENTS = NAV_ITEMS.find((i) => i.id === 'agents')?.badge ?? 0;
const NOTIFICATIONS = [
  { id: 1, tone: 'critical', time: 'now', title: `${PENDING_APPROVALS} actions awaiting approval`, detail: 'Human sign-off required in the Approval Queue.' },
  { id: 2, tone: 'ok', time: '2m', title: `${CONNECTED_AGENTS} agents connected`, detail: 'All agents operating under zero-trust authorization bounds.' },
  { id: 3, tone: 'ok', time: '8m', title: 'Audit chain verified', detail: 'SHA-256 forward-chaining integrity proof passed.' },
];

/* ── Sidebar NavItem Component ────────────────────────────────── */
function SidebarNavItem({ item, active, onClick }) {
  const Icon = item.icon;
  const isActive = active === item.id;

  return (
    <button
      onClick={() => onClick(item.id)}
      className={`
        group relative w-full min-w-0 flex items-center justify-between gap-3.5 px-4 py-3.5 my-1 rounded-xl text-left
        transition-all duration-200 cursor-pointer text-sm sm:text-base select-none overflow-hidden hover-card-scale
        ${isActive
          ? 'bg-red-500/10 text-white font-semibold border-l-4 border-[#EF233C] shadow-[0_0_18px_rgba(239,35,60,0.18)] pl-3.5'
          : 'text-slate-300 font-medium hover:text-white hover:bg-slate-800/60 border-l-4 border-transparent pl-3.5'
        }
      `}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <Icon
          size={22}
          className={`shrink-0 transition-colors ${
            isActive ? 'text-[#EF233C]' : 'text-slate-400 group-hover:text-red-400'
          }`}
        />
        <span className="truncate tracking-wide font-medium">{item.label}</span>
      </div>

      {/* Pill Badge (e.g. 23, 6) */}
      {item.badge !== undefined && (
        <span
          className="ml-auto shrink-0 relative z-10 inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-full text-xs leading-none font-bold font-mono tabular-nums select-none shadow-sm"
          style={{
            backgroundColor: item.badgeColor === '#FF4D4D' ? 'rgba(239, 35, 60, 0.22)' : '#192030',
            color: item.badgeColor === '#FF4D4D' ? '#FF5C6E' : '#94A3B8',
            border: item.badgeColor === '#FF4D4D' ? '1px solid rgba(239, 35, 60, 0.45)' : '1px solid #28334A',
            boxShadow: item.badgeColor === '#FF4D4D' ? '0 0 10px rgba(239, 35, 60, 0.25)' : 'none',
          }}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
}

export default function CyberShell({ children, activeTab = 'overview', onTabChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="relative min-h-screen w-full bg-[#080A10] text-slate-100 font-sans flex flex-col overflow-hidden selection:bg-[#EF233C]/30 selection:text-white">
      {/* Cosmic threat backdrop with neon red lasers, starfield & orbital torus */}
      <CosmicThreatBackground />

      <div className="relative z-10 flex flex-1 h-screen overflow-hidden">
        {/* ── Left Sidebar (verbatim Image 2) ────────────────────────── */}
        <aside
          className={`shrink-0 flex flex-col border-r bg-[#0A0D15]/90 backdrop-blur-xl z-20 transition-all duration-300 ease-in-out overflow-hidden ${
            sidebarOpen
              ? 'w-72 opacity-100 border-slate-800/80 pointer-events-auto visible'
              : 'w-0 opacity-0 border-transparent pointer-events-none invisible'
          }`}
          style={{
            minWidth: sidebarOpen ? '18rem' : '0px',
            maxWidth: sidebarOpen ? '18rem' : '0px',
          }}
        >
          {/* Inner wrapper with fixed width so contents do not squish during slide transition */}
          <div className="w-72 flex flex-col h-full min-h-0">
            {/* Logo Header */}
            <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF2D37] to-[#B80C19] shadow-[0_0_15px_rgba(239,35,60,0.5)]">
                  {/* Shield with 4-point star */}
                  <Shield size={18} className="text-white fill-white/20" />
                  <span className="absolute text-[10px] text-white font-black leading-none">✦</span>
                </div>
                <span className="text-base font-extrabold tracking-tight text-white">
                  ActionGate
                </span>
              </div>

              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-[#201014] text-[#FF4D5A] border border-[#EF233C]/30">
                v1.0.0-PROD
              </span>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-3.5 py-4 space-y-2 overflow-y-auto scrollbar-none">
              {NAV_ITEMS.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  active={activeTab}
                  onClick={onTabChange}
                />
              ))}
            </nav>

            {/* Bottom Status Box */}
            <div className="px-3 pb-4 pt-1">
              <div className="p-3 rounded-xl bg-[#0F131D]/90 border border-slate-800/80 shadow-inner flex flex-col gap-1 hover-card-scale">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    Gateway Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  All agent actions protected
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content Area ────────────────────────────────────────── */}
        <div className="flex-1 w-full min-w-0 max-w-full flex flex-col h-screen overflow-x-hidden overflow-y-hidden box-border transition-all duration-300 ease-in-out">
          {/* Top Header Bar */}
          <header className="h-16 shrink-0 px-8 sm:px-10 lg:px-12 border-b border-slate-800/80 bg-[#0A0D15]/85 backdrop-blur-md flex items-center justify-between z-20 box-border">
            {/* Left: Sidebar Toggle + View Title & Subtitle */}
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                aria-label="Toggle sidebar"
                className="shrink-0 p-2.5 rounded-xl text-slate-300 hover:text-white bg-[#111624] border border-slate-800 hover:border-slate-600 hover:bg-[#151B29] transition-all cursor-pointer hover-card-scale shadow-sm"
              >
                <Menu size={20} />
              </button>

              <div className="flex flex-col min-w-0">
                <h2 className="text-base font-extrabold text-white tracking-tight leading-tight">
                  {activeTab === 'overview' && 'Security Overview'}
                  {activeTab === 'queue' && 'Live Actions Queue'}
                  {activeTab === 'approvals' && 'Human Approval Queue'}
                  {activeTab === 'agents' && 'Connected Autonomous Agents'}
                  {activeTab === 'policies' && 'Policy Engine & Guardrails'}
                  {activeTab === 'ledger' && 'Cryptographic Audit Trail'}
                  {activeTab === 'chaos' && 'Chaos & Adversarial Lab'}
                  {activeTab === 'settings' && 'System & Gateway Settings'}
                </h2>
                <p className="text-xs text-slate-400 truncate">
                  {activeTab === 'overview' && 'Monitor and authorize autonomous AI actions in real time.'}
                  {activeTab === 'queue' && 'Real-time telemetry stream of agent intents undergoing gateway inspection.'}
                  {activeTab === 'approvals' && 'High-impact payloads requiring cryptographic human-in-the-loop sign-off.'}
                  {activeTab === 'agents' && 'Autonomous agents registered under zero-trust authorization bounds.'}
                  {activeTab === 'policies' && 'Define deterministic invariants, allowed tools, and threshold limits.'}
                  {activeTab === 'ledger' && 'Immutable SHA-256 Merkle chain with verifiable forensic integrity proofs.'}
                  {activeTab === 'chaos' && 'Simulate MITM tampering, malicious prompt injections, and failover.'}
                  {activeTab === 'settings' && 'Manage zero-trust gateway rules, cryptographic policies, and preferences.'}
                </p>
              </div>
            </div>

            {/* Right: Search, Status, Notifications */}
            <div className="flex items-center gap-4 flex-1 min-w-0 justify-end ml-8">
              {/* Search Bar with ⌘K — Modern, sleek SaaS dashboard style */}
              <div className="relative flex items-center w-full max-w-xl group">
                {/* Strictly left-aligned magnifying glass icon */}
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                  <Search size={18} />
                </div>

                <input
                  type="text"
                  placeholder="Search actions, agents, policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-[42px] pl-11 pr-16 text-sm text-slate-100 placeholder-slate-400/80 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_8px_rgba(0,0,0,0.3)] hover:border-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all duration-200 font-sans"
                />

                {/* Cleanly aligned ⌘K keyboard shortcut badge on far-right */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <kbd className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-mono font-medium text-slate-300 bg-slate-800/90 border border-slate-700/60 shadow-sm">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </div>

              {/* Gateway Online status pill */}
              <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E1522] border border-slate-800 text-xs font-mono font-medium hover-card-scale">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
                <span className="text-slate-300 text-[11px]">
                  Gateway Online - 99.99%
                </span>
              </div>

              {/* Notification Bell with dropdown panel */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                  title="Notifications"
                  className={`relative p-2.5 rounded-xl border transition-all cursor-pointer hover-card-scale ${
                    showNotifications
                      ? 'text-white bg-[#181D2A] border-[#EF233C]/60 shadow-[0_0_14px_rgba(239,35,60,0.35)]'
                      : 'text-slate-300 hover:text-white bg-[#111624] border-slate-800 hover:border-slate-600 hover:bg-[#151B29]'
                  }`}
                >
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#EF233C] ring-2 ring-[#0A0D15] animate-pulse" />
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-[#0D111C]/95 backdrop-blur-xl border border-slate-700/70 shadow-[0_18px_50px_rgba(0,0,0,0.6)] overflow-hidden z-40"
                    >
                      <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs font-bold text-white tracking-wide">Notifications</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EF233C]/15 text-[#FF5C6E] border border-[#EF233C]/30">
                          {NOTIFICATIONS.length} NEW
                        </span>
                      </div>

                      <div className="max-h-72 overflow-y-auto">
                        {NOTIFICATIONS.map((n) => (
                          <div
                            key={n.id}
                            className="px-4 py-3 border-b border-slate-800/50 last:border-b-0 hover:bg-[#141A28]/80 transition-colors cursor-pointer flex items-start gap-3"
                          >
                            <span
                              className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                                n.tone === 'critical'
                                  ? 'bg-[#EF233C] shadow-[0_0_8px_#EF233C]'
                                  : 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-white leading-snug">{n.title}</p>
                              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{n.detail}</p>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 shrink-0">{n.time}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          onTabChange('approvals');
                        }}
                        className="w-full px-4 py-2.5 text-[11px] font-mono font-bold tracking-wider text-[#FF5C6E] hover:text-white hover:bg-[#EF233C]/10 border-t border-slate-800/80 transition-colors cursor-pointer"
                      >
                        VIEW APPROVAL QUEUE →
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Invisible click-catcher: closes the dropdown when clicking anywhere else */}
              {showNotifications && (
                <div
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setShowNotifications(false)}
                />
              )}
            </div>
          </header>

          {/* Main Content Body */}
          <main className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden px-8 sm:px-10 lg:px-12 py-6 relative z-10 scrollbar-thin scrollbar-thumb-slate-800 box-border">
            {children}
          </main>

          {/* Bottom Status Footer */}
          <footer className="h-8 shrink-0 px-8 sm:px-10 lg:px-12 border-t border-slate-800/80 bg-[#090C12]/95 backdrop-blur-md flex items-center justify-between text-[11px] font-mono text-slate-400 z-20 box-border">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <Shield size={12} className="text-[#EF233C]" />
              <span>ActionGate Security Layer</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Gateway Active · 6 Agents Connected · Audit Chain Verified (SHA-256)</span>
            </div>

            <div className="text-slate-500 font-mono">
              Engine v1.0.0 · 42ms p99 latency
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
