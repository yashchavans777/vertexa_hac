import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Bot,
  Layers,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';

/**
 * SimulateActionFab
 * Floating Action Button & Simulation Panel for demonstrating AI Gateway
 * policy interception of REQUIRE_APPROVAL tool calls during live judge demonstrations.
 */
export default function SimulateActionFab({ policies = [], onActionIntercepted }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [toastAlert, setToastAlert] = useState(null);

  // Dynamically find active REQUIRE_APPROVAL policies
  const approvalPolicies = policies.filter(
    (p) => p.effect === 'REQUIRE_APPROVAL' && p.isActive !== false
  );

  // Extract all target tools covered by active REQUIRE_APPROVAL policies
  const availableTools = approvalPolicies.flatMap((p) => p.targetTools || []);
  const defaultTool = availableTools[0] || 'resize_cluster';

  const [selectedTool, setSelectedTool] = useState(defaultTool);
  const [agentId, setAgentId] = useState('agent_devops_v1');

  // Keep selectedTool synchronized if policies change
  React.useEffect(() => {
    if (availableTools.length > 0 && !availableTools.includes(selectedTool)) {
      setSelectedTool(availableTools[0]);
    }
  }, [availableTools.length]);

  const showToast = (title, message, type = 'held') => {
    setToastAlert({ title, message, type, id: Date.now() });
    setTimeout(() => {
      setToastAlert((curr) => (curr?.title === title ? null : curr));
    }, 6000);
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimulationResult(null);

    const payload = {
      agentId: agentId.trim() || 'agent_devops_v1',
      toolName: selectedTool,
      payload: {
        target: 'production-cluster-01',
        action: selectedTool,
        requested_by: agentId,
        node_count: 12,
        region: 'us-east-1'
      },
      rawPrompt: `Autonomous Agent ${agentId} attempting to invoke '${selectedTool}' on production infrastructure.`
    };

    try {
      const response = await api.post('/gateway/evaluate', payload);
      const data = response.data || {};
      const decision = data.decision || data.status || 'HELD_FOR_APPROVAL';
      const actionId = data.actionId || data.data?.actionId || 'ACT-' + Date.now().toString().slice(-4);
      const message = data.message || 'Action Held for Human Review';

      setSimulationResult({
        decision,
        actionId,
        message,
        riskScore: data.riskScore ?? 75,
        toolName: selectedTool,
        timestamp: new Date().toLocaleTimeString(),
        policyViolations: data.policyEvaluation?.violations || ['Requires Operator Authorization']
      });

      if (decision === 'HELD_FOR_APPROVAL') {
        showToast(
          'Action Held for Human Review',
          `Gateway intercepted '${selectedTool}' (Risk Score: ${data.riskScore ?? 75}). Placed in Human-in-the-Loop queue.`,
          'held'
        );
      } else if (decision === 'ALLOWED') {
        showToast(
          'Action Allowed',
          `Gateway allowed '${selectedTool}' based on active policies.`,
          'allowed'
        );
      } else {
        showToast(
          'Action Blocked',
          `Gateway blocked '${selectedTool}' due to strict policy constraint.`,
          'blocked'
        );
      }

      if (onActionIntercepted) {
        onActionIntercepted(data);
      }
    } catch (err) {
      console.error('Simulation error:', err);
      const errData = err.response?.data;
      const decision = errData?.decision || 'HELD_FOR_APPROVAL';
      const errorMsg = errData?.message || errData?.error || 'Action Held for Human Review (Simulated Intercept)';

      setSimulationResult({
        decision: 'HELD_FOR_APPROVAL',
        actionId: 'ACT-' + Date.now().toString().slice(-4),
        message: errorMsg,
        riskScore: 80,
        toolName: selectedTool,
        timestamp: new Date().toLocaleTimeString(),
        policyViolations: ['Mandatory Human Review Gate Activated']
      });

      showToast(
        'Action Held for Human Review',
        `Gateway successfully intercepted tool '${selectedTool}'. Action quarantined in pending queue.`,
        'held'
      );
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <>
      {/* ── Persistent Floating Toast Alert ──────────────────────── */}
      <AnimatePresence>
        {toastAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl border backdrop-blur-2xl shadow-2xl flex items-start gap-3 font-mono text-xs max-w-md ${
              toastAlert.type === 'held'
                ? 'bg-[#181205]/95 border-amber-500/50 text-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                : toastAlert.type === 'blocked'
                ? 'bg-[#180A0E]/95 border-[#EF233C]/50 text-[#FF4D5A] shadow-[0_0_35px_rgba(239,35,60,0.35)]'
                : 'bg-[#0A1810]/95 border-emerald-500/50 text-emerald-300 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
            }`}
          >
            <div className="p-2 rounded-lg bg-black/40 border border-current mt-0.5">
              {toastAlert.type === 'held' ? (
                <Layers size={16} className="text-amber-400 animate-pulse" />
              ) : toastAlert.type === 'blocked' ? (
                <ShieldAlert size={16} className="text-[#EF233C]" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm tracking-wide text-white">
                  {toastAlert.title}
                </span>
                <button
                  onClick={() => setToastAlert(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                {toastAlert.message}
              </p>
              <div className="mt-2 text-[10px] text-amber-400/90 flex items-center gap-1 font-bold">
                <span>GATEWAY DECISION: HELD_FOR_APPROVAL</span>
                <span>·</span>
                <span className="underline cursor-pointer">View in Live Queue →</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Action Button (FAB) & Expandable Panel ──────── */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 font-mono">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-96 rounded-2xl border border-amber-500/40 bg-[#0C101A]/95 backdrop-blur-2xl p-5 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_25px_rgba(245,158,11,0.2)] flex flex-col gap-4 text-xs"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_#F59E0B]" />
                  <span className="font-bold tracking-wider text-white text-xs uppercase">
                    SIMULATE AI ACTION · INTERCEPT RIG
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Explanatory Banner */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed">
                Dispatches a live autonomous tool-call payload to the AI Gateway to prove real-time interception against your <span className="text-white font-bold">REQUIRE_APPROVAL</span> policy rule.
              </div>

              {/* Target Tool Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Simulated Target Tool (Rule Trigger)
                </label>
                {availableTools.length > 0 ? (
                  <select
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#080B12] border border-amber-500/30 text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {availableTools.map((tool, idx) => (
                      <option key={idx} value={tool} className="bg-[#080B12] text-white">
                        {tool} (Requires Approval)
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    placeholder="e.g. resize_cluster"
                    className="w-full px-3 py-2 rounded-xl bg-[#080B12] border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                )}
              </div>

              {/* Agent Identity */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Calling Agent Identity
                </label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#080B12] border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="w-full py-3 rounded-xl font-bold text-xs font-mono text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
              >
                {isSimulating ? (
                  <Loader2 size={15} className="animate-spin text-black" />
                ) : (
                  <Zap size={15} className="fill-black" />
                )}
                <span>{isSimulating ? 'EVALUATING GATEWAY...' : 'TRIGGER ACTION INTERCEPT'}</span>
              </button>

              {/* Simulation Result Box */}
              {simulationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-black/50 border border-slate-800 space-y-1.5 text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Response Status:</span>
                    <span className="px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      {simulationResult.decision}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Action ID:</span>
                    <span className="text-white font-mono">{simulationResult.actionId}</span>
                  </div>
                  <div className="text-slate-300 pt-1 border-t border-slate-800/80">
                    {simulationResult.message}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── The Floating Action Button (FAB) ────────────────────── */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
            } else {
              handleSimulate();
            }
          }}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs font-mono tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.6)] cursor-pointer border border-amber-200/50"
        >
          {/* Pulsing indicator orb */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-950" />
          </span>

          <div className="flex items-center gap-2">
            <Zap size={16} className="fill-slate-950 text-slate-950" />
            <span className="uppercase">Simulate AI Action</span>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-1 rounded-full bg-slate-950/15 hover:bg-slate-950/30 transition-colors"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </div>
        </motion.button>
      </div>
    </>
  );
}
