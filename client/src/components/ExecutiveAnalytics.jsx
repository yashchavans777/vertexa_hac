import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Lock, AlertTriangle, ChevronRight, Terminal, Cpu, Database, Clock } from 'lucide-react';

export default function ExecutiveAnalytics() {
  return (
    <div className="flex flex-col h-full gap-6 text-slate-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Security Overview</h1>
        <p className="text-sm text-slate-500">Monitor and authorize autonomous AI actions in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Hero Section */}
        <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-widest font-bold text-cyan-400 uppercase bg-cyan-950/40 px-2 py-1 rounded">
              AI Agent Security Gateway
            </span>
            <span className="text-[10px] tracking-widest font-bold text-slate-500 uppercase">
              L4 Proxy Active
            </span>
          </div>

          <h2 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
            Every AI action.<br />
            <span className="text-[#F01616] glow-crimson-text">Verified</span><br />
            before execution.
          </h2>

          <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
            ActionGate intercepts autonomous agent payloads, evaluates high-stakes policy invariants in under 10ms, and prevents irreversible system mutations with cryptographic proof.
          </p>

          <div className="flex items-center gap-4 pt-4">
            <button className="flex items-center gap-2 bg-[#F01616] hover:bg-[#d01313] text-white px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_#F01616]">
              <Activity size={16} />
              Open Live Gateway
            </button>
            <button className="flex items-center gap-2 bg-transparent hover:bg-slate-800 border border-slate-700 text-white px-6 py-3 rounded-lg font-bold text-sm transition-all">
              <Database size={16} />
              View Audit Trail
            </button>
          </div>
          
          {/* Small stats under buttons */}
          <div className="flex items-center gap-8 pt-4 border-t border-slate-800/50">
             <div className="space-y-1">
                <div className="text-white font-mono text-sm">10ms</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">P99 Policy Gate</div>
             </div>
             <div className="space-y-1">
                <div className="text-white font-mono text-sm">100%</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Payload Integrity</div>
             </div>
             <div className="space-y-1">
                <div className="text-white font-mono text-sm">0</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Unverified Mutations</div>
             </div>
          </div>
        </div>

        {/* Right Widget: Intercept Core */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6 flex flex-col relative overflow-hidden"
          style={{ background: '#0B0F19' }}
        >
          {/* Top red accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#F01616] shadow-[0_0_15px_#F01616]" />
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-mono text-sm font-bold tracking-widest text-white flex items-center gap-2">
              <Shield size={16} className="text-[#F01616]" />
              INTERCEPT CORE
            </h3>
            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">
              NO BYPASS
            </span>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-3 gap-2 mb-6">
             <div className="bg-slate-900/50 p-2 rounded border border-slate-800 text-center">
                <div className="text-2xl font-mono text-white mb-1">9k</div>
                <div className="text-[9px] uppercase text-slate-500">Analyzed</div>
             </div>
             <div className="bg-[#F01616]/10 p-2 rounded border border-[#F01616]/30 text-center">
                <div className="text-2xl font-mono text-[#F01616] mb-1">312</div>
                <div className="text-[9px] uppercase text-[#F01616]">Blocked</div>
             </div>
             <div className="bg-amber-500/10 p-2 rounded border border-amber-500/30 text-center">
                <div className="text-2xl font-mono text-amber-500 mb-1">18</div>
                <div className="text-[9px] uppercase text-amber-500">Held</div>
             </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700/50 mb-6 flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Inspected Intent</span>
              <span className="text-[10px] text-cyan-400 font-mono">Agent: db_admin_01</span>
            </div>
            <div className="font-mono text-xs text-[#F01616] bg-black p-3 rounded border border-slate-800 mb-3">
              "action": "execute_sql",<br/>
              "query": "DROP TABLE users;"
            </div>
            <div className="flex items-center justify-between">
               <span className="bg-[#F01616]/20 text-[#F01616] text-[10px] px-2 py-1 rounded border border-[#F01616]/30 uppercase tracking-wider font-bold">
                 Risk: Tier 3 - Impact
               </span>
               <span className="text-xs font-mono text-slate-500">TTL: 14s</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-auto">
            <button className="bg-[#F01616] hover:bg-[#d01313] text-white text-xs font-bold py-2.5 rounded transition-colors shadow-[0_0_10px_rgba(240,22,22,0.3)]">
              Deny Action
            </button>
            <button className="bg-transparent hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold py-2.5 rounded transition-colors">
              Authorize Payload
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-5 border-l-4 border-l-cyan-400">
          <h4 className="text-[10px] text-slate-500 tracking-widest uppercase mb-2">Active Agents</h4>
          <div className="text-3xl font-mono text-white font-bold mb-2">18,429</div>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <Activity size={12} />
            <span>2.4% avg agent active volume</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-5 border-l-4 border-l-amber-500">
          <h4 className="text-[10px] text-slate-500 tracking-widest uppercase mb-2">Human Pending</h4>
          <div className="text-3xl font-mono text-white font-bold mb-2">23</div>
          <div className="flex items-center gap-1 text-xs text-amber-500">
            <Clock size={12} />
            <span>Average decision time: 4s</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-5 border-l-4 border-l-[#F01616]">
          <h4 className="text-[10px] text-slate-500 tracking-widest uppercase mb-2">Anomalies Deflected</h4>
          <div className="text-3xl font-mono text-[#F01616] font-bold mb-2">312</div>
          <div className="flex items-center gap-1 text-xs text-[#F01616]">
            <AlertTriangle size={12} />
            <span>12 today Critical Risk</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-5 border-l-4 border-l-emerald-500">
          <h4 className="text-[10px] text-slate-500 tracking-widest uppercase mb-2">Cryptographic Chain</h4>
          <div className="text-3xl font-mono text-white font-bold mb-2">100%</div>
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <Lock size={12} />
            <span>Audit Chain Verified SHA-256</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
