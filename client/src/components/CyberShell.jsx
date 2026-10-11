import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  BookLock,
  ShieldCheck,
  Swords,
  Cpu,
  Wifi,
  Clock,
  ChevronRight,
  BarChart2,
  Zap,
} from 'lucide-react';

/* ── Navigation items ─────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'queue',      label: 'Live Queue',             icon: Activity,    accent: '#00F5FF' },
  { id: 'ledger',     label: 'Cryptographic Ledger',   icon: BookLock,    accent: '#00E676' },
  { id: 'policies',   label: 'Policy Engine',          icon: ShieldCheck, accent: '#FFB800' },
  { id: 'analytics',  label: 'Threat Analytics',       icon: BarChart2,   accent: '#00F5FF' },
  { id: 'chaos',      label: 'Chaos Lab',              icon: Zap,         accent: '#F01616' },
];

/* ── Real-time digital clock ──────────────────────────────────── */
function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');
  return (
    <span className="font-mono text-xs tracking-widest" style={{ color: 'var(--accent-cyan)' }}>
      {pad(time.getHours())}:{pad(time.getMinutes())}:{pad(time.getSeconds())}
      <span className="ml-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
        {Intl.DateTimeFormat('en', { timeZoneName: 'short' }).format(time).split(' ').pop()}
      </span>
    </span>
  );
}

/* ── Sidebar NavItem ──────────────────────────────────────────── */
function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  const isActive = active === item.id;

  return (
    <motion.button
      onClick={() => onClick(item.id)}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.97 }}
      className={`
        group relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
        transition-all duration-200 cursor-pointer border border-transparent
        ${isActive ? 'nav-item-active' : ''}
      `}
      style={{
        color: isActive ? item.accent : 'var(--text-secondary)',
        borderColor: isActive ? `${item.accent}22` : 'transparent',
        background: isActive ? `${item.accent}10` : 'transparent',
      }}
    >
      {/* Active left border glow */}
      {isActive && (
        <motion.span
          layoutId="nav-indicator"
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
          style={{ background: item.accent, boxShadow: `0 0 8px ${item.accent}` }}
        />
      )}

      <Icon
        size={16}
        className="shrink-0 transition-all duration-200"
        style={{ color: isActive ? item.accent : 'var(--text-secondary)' }}
      />

      <span className="text-xs font-medium tracking-wider uppercase truncate">
        {item.label}
      </span>

      {isActive && (
        <ChevronRight size={12} className="ml-auto shrink-0" style={{ color: item.accent }} />
      )}
    </motion.button>
  );
}

/* ── Top Header ───────────────────────────────────────────────── */
function TopHeader({ connectedAgents }) {
  return (
    <header
      className="glass-panel h-14 flex items-center justify-between px-6 shrink-0 rounded-none"
      style={{
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        borderRadius: 0,
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Left: brand */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-7 h-7 rounded"
          style={{ background: 'var(--accent-cyan-dim)', border: '1px solid var(--border-active)' }}
        >
          <Cpu size={14} style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <div>
          <span className="text-sm font-bold tracking-[0.2em] uppercase glow-cyan-text"
            style={{ color: 'var(--accent-cyan)' }}>
            ActionGate
          </span>
          <span className="ml-2 text-[10px] tracking-widest uppercase"
            style={{ color: 'var(--text-dim)' }}>
            v1.0 — AI Authorization Engine
          </span>
        </div>
      </div>

      {/* Right: status indicators */}
      <div className="flex items-center gap-6">
        {/* System Online */}
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full pulse-online"
            style={{ background: 'var(--accent-emerald)' }}
          />
          <span className="text-xs font-medium tracking-widest uppercase glow-emerald-text"
            style={{ color: 'var(--accent-emerald)' }}>
            System Online
          </span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Connected Agents */}
        <div className="flex items-center gap-2">
          <Wifi size={13} style={{ color: 'var(--text-secondary)' }} />
          <span className="text-[11px] tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Agents:
          </span>
          <motion.span
            key={connectedAgents}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold"
            style={{ color: 'var(--accent-cyan)' }}
          >
            {connectedAgents}
          </motion.span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px" style={{ background: 'var(--border-subtle)' }} />

        {/* Clock */}
        <div className="flex items-center gap-2">
          <Clock size={13} style={{ color: 'var(--text-secondary)' }} />
          <DigitalClock />
        </div>
      </div>
    </header>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────── */
function Sidebar({ activeView, onNavigate }) {
  return (
    <aside
      className="glass-panel flex flex-col shrink-0 rounded-none"
      style={{
        width: '220px',
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRadius: 0,
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Sidebar brand section */}
      <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <p className="text-[9px] tracking-[0.3em] uppercase font-medium"
          style={{ color: 'var(--text-dim)' }}>
          Navigation
        </p>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={activeView}
            onClick={onNavigate}
          />
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--accent-emerald)', boxShadow: '0 0 6px var(--accent-emerald)' }}
          />
          <span className="text-[9px] tracking-[0.25em] uppercase" style={{ color: 'var(--text-dim)' }}>
            Gateway Active
          </span>
        </div>
      </div>
    </aside>
  );
}

/* ── Shell mount animation variants ──────────────────────────── */
const shellVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut', staggerChildren: 0.08 },
  },
};

const panelVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

/* ── CyberShell ───────────────────────────────────────────────── */
export default function CyberShell({ children, activeTab, onTabChange }) {
  const [internalActiveView, setInternalActiveView] = useState('queue');
  const activeView = activeTab !== undefined ? activeTab : internalActiveView;
  const setActiveView = onTabChange || setInternalActiveView;
  // Mock fluctuating agent count
  const [connectedAgents, setConnectedAgents] = useState(7);

  useEffect(() => {
    const id = setInterval(() => {
      setConnectedAgents((n) => Math.max(1, n + Math.floor(Math.random() * 3) - 1));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* CRT Scanline overlay — purely decorative */}
      <div className="crt-overlay" aria-hidden="true" />

      {/* Root shell */}
      <motion.div
        variants={shellVariants}
        initial="hidden"
        animate="visible"
        className="cyber-grid-bg flex flex-col"
        style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}
      >
        {/* Top Header */}
        <motion.div variants={panelVariants}>
          <TopHeader connectedAgents={connectedAgents} />
        </motion.div>

        {/* Body: sidebar + main */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <motion.div variants={panelVariants}>
            <Sidebar activeView={activeView} onNavigate={setActiveView} />
          </motion.div>

          {/* Main Content Area */}
          <motion.main
            variants={panelVariants}
            className="flex-1 overflow-y-auto p-6"
            style={{ background: 'transparent' }}
          >
            {/* View label breadcrumb */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[9px] tracking-[0.3em] uppercase"
                style={{ color: 'var(--text-dim)' }}>
                ActionGate
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>/</span>
              <span className="text-[9px] tracking-[0.3em] uppercase"
                style={{ color: 'var(--accent-cyan)' }}>
                {NAV_ITEMS.find(i => i.id === activeView)?.label || activeView}
              </span>
            </div>

            {/* Scrollable glass content container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="glass-panel min-h-[calc(100vh-10rem)] p-6"
              >
                {typeof children === 'function' ? children(activeView) : children}
              </motion.div>
            </AnimatePresence>
          </motion.main>
        </div>
      </motion.div>
    </>
  );
}
