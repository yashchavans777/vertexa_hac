import { motion } from 'framer-motion';
import CyberShell from './components/CyberShell';

function AwaitingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6">
      {/* Glowing animated ring */}
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute w-24 h-24 rounded-full"
          style={{
            border: '1px solid transparent',
            borderTopColor: 'var(--accent-cyan)',
            borderRightColor: 'rgba(0,245,255,0.3)',
            boxShadow: '0 0 20px var(--accent-cyan-glow)',
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute w-16 h-16 rounded-full"
          style={{
            border: '1px solid transparent',
            borderTopColor: 'rgba(0,245,255,0.5)',
            borderLeftColor: 'rgba(0,245,255,0.2)',
          }}
        />
        {/* Center dot */}
        <div
          className="w-3 h-3 rounded-full pulse-online"
          style={{ background: 'var(--accent-cyan)' }}
        />
      </div>

      {/* Label */}
      <div className="text-center space-y-2">
        <motion.p
          className="text-sm font-mono font-bold tracking-[0.4em] uppercase awaiting-pulse glow-cyan-text"
          style={{ color: 'var(--accent-cyan)' }}
        >
          ▸ AWAITING ACTION QUEUE DATA...
        </motion.p>
        <p className="text-[10px] tracking-[0.25em] uppercase"
          style={{ color: 'var(--text-dim)' }}>
          Connecting to ActionGate Gateway · Port 5000
        </p>
      </div>

      {/* Mock scan bar */}
      <div className="w-64 h-px overflow-hidden rounded-full"
        style={{ background: 'var(--border-subtle)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CyberShell>
      <AwaitingPlaceholder />
    </CyberShell>
  );
}
