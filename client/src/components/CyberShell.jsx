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
];

/* ── Sidebar NavItem Component ────────────────────────────────── */
function SidebarNavItem({ item, active, onClick }) {
  const Icon = item.icon;
  const isActive = active === item.id;

  return (
    <button
      onClick={() => onClick(item.id)}
      className={`
        group relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left
        transition-all duration-150 cursor-pointer font-medium text-xs select-none
        ${isActive
          ? 'bg-[#181D2A] text-white font-semibold shadow-inner'
          : 'text-slate-400 hover:text-slate-200 hover:bg-[#131722]/80'
        }
      `}
    >
      {/* Active Left Indicator */}
      {isActive && (
        <span
          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
          style={{
            background: '#EF233C',
            boxShadow: '0 0 10px #EF233C',
          }}
        />
      )}

      <Icon
        size={17}
        className={`shrink-0 transition-colors ${
          isActive ? 'text-[#EF233C]' : 'text-slate-400 group-hover:text-slate-200'
        }`}
      />

      <span className="truncate flex-1 tracking-wide">{item.label}</span>

      {/* Pill Badge (e.g. 23, 6) */}
      {item.badge !== undefined && (
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono shrink-0"
          style={{
            backgroundColor: item.badgeColor === '#FF4D4D' ? 'rgba(239, 35, 60, 0.2)' : '#192030',
            color: item.badgeColor === '#FF4D4D' ? '#FF5C6E' : '#94A3B8',
            border: item.badgeColor === '#FF4D4D' ? '1px solid rgba(239, 35, 60, 0.4)' : '1px solid #28334A',
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

  return (
    <div className="relative min-h-screen w-full bg-[#080A10] text-slate-100 font-sans flex flex-col overflow-hidden selection:bg-[#EF233C]/30 selection:text-white">
      {/* Cosmic threat backdrop with neon red lasers, starfield & orbital torus */}
      <CosmicThreatBackground />

      <div className="relative z-10 flex flex-1 h-screen overflow-hidden">
        {/* ── Left Sidebar (verbatim Image 2) ────────────────────────── */}
        <aside className="w-64 shrink-0 flex flex-col border-r border-slate-800/80 bg-[#0A0D15]/90 backdrop-blur-xl z-20">
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
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
          <div className="px-3 pb-3">
            <div className="p-3 rounded-xl bg-[#0F131D]/90 border border-slate-800/80 shadow-inner flex flex-col gap-1">
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

          {/* User Profile Card */}
          <div className="px-4 py-3 border-t border-slate-800/80 flex items-center justify-between bg-[#0A0D15]">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Elena Vance"
                className="w-8 h-8 rounded-full object-cover border border-slate-700/80 ring-2 ring-slate-800"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white leading-tight">
                  Elena Vance
                </span>
                <span className="text-[10px] text-slate-400 font-mono leading-tight">
                  Lead SecOps / NetSec
                </span>
              </div>
            </div>

            <button
              title="Settings"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Settings size={15} />
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Header Bar */}
          <header className="h-16 shrink-0 px-8 border-b border-slate-800/80 bg-[#0A0D15]/75 backdrop-blur-md flex items-center justify-between z-20">
            {/* Left: View Title & Subtitle */}
            <div className="flex flex-col">
              <h2 className="text-base font-extrabold text-white tracking-tight leading-tight">
                {activeTab === 'overview' && 'Security Overview'}
                {activeTab === 'queue' && 'Live Actions Queue'}
                {activeTab === 'approvals' && 'Human Approval Queue'}
                {activeTab === 'agents' && 'Connected Autonomous Agents'}
                {activeTab === 'policies' && 'Policy Engine & Guardrails'}
                {activeTab === 'ledger' && 'Cryptographic Audit Trail'}
                {activeTab === 'chaos' && 'Chaos & Adversarial Lab'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === 'overview' && 'Monitor and authorize autonomous AI actions in real time.'}
                {activeTab === 'queue' && 'Real-time telemetry stream of agent intents undergoing gateway inspection.'}
                {activeTab === 'approvals' && 'High-impact payloads requiring cryptographic human-in-the-loop sign-off.'}
                {activeTab === 'agents' && 'Autonomous agents registered under zero-trust authorization bounds.'}
                {activeTab === 'policies' && 'Define deterministic invariants, allowed tools, and threshold limits.'}
                {activeTab === 'ledger' && 'Immutable SHA-256 Merkle chain with verifiable forensic integrity proofs.'}
                {activeTab === 'chaos' && 'Simulate MITM tampering, malicious prompt injections, and failover.'}
              </p>
            </div>

            {/* Right: Search, Status, Notification, Avatar */}
            <div className="flex items-center gap-4">
              {/* Search Bar with ⌘K */}
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search actions, agents, policies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-72 pl-9 pr-11 py-1.5 rounded-xl text-xs bg-[#111624]/90 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#EF233C]/50 transition-all font-sans"
                />
                <kbd className="absolute right-3 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60">
                  ⌘K
                </kbd>
              </div>

              {/* Gateway Online status pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E1522] border border-slate-800 text-xs font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
                <span className="text-slate-300 text-[11px]">
                  Gateway Online - 99.99%
                </span>
              </div>

              {/* Notification Bell */}
              <button
                className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-[#111624] border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell size={15} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF233C] ring-2 ring-[#0A0D15]" />
              </button>

              {/* Top User Avatar */}
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Elena Vance"
                className="w-8 h-8 rounded-full object-cover border border-slate-700/80 ring-2 ring-slate-800 cursor-pointer"
              />
            </div>
          </header>

          {/* Main Content Body */}
          <main className="flex-1 overflow-y-auto px-8 py-6 relative z-10 scrollbar-thin scrollbar-thumb-slate-800">
            {children}
          </main>

          {/* Bottom Status Footer */}
          <footer className="h-8 shrink-0 px-8 border-t border-slate-800/80 bg-[#090C12]/95 backdrop-blur-md flex items-center justify-between text-[11px] font-mono text-slate-400 z-20">
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
