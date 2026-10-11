import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Code,
  Layers,
  Terminal,
  Zap,
} from 'lucide-react';
import SimulateActionFab from './SimulateActionFab';

/* ─── Strict Color Tokens ─────────────────────────────────────── */
const C_BLOCK_DANGER = '#F01616'; // Strict: rgb(240, 22, 22)
const C_ALLOW_EMERALD = '#00E676';
const C_APPROVAL_AMBER = '#FFB800';
const C_CYAN = '#00F5FF';
const C_BG_CARD = 'rgba(15, 22, 35, 0.75)';

/* ─── Default Mock Policies for Instant Hackathon Demonstration ── */
const SEED_POLICIES = [
  {
    _id: 'pol-001',
    policyName: 'StrictPersistenceGuard',
    description: 'Block all destructive database mutations and schema drops across environments.',
    targetTools: ['drop_database', 'delete_table', 'truncate_*', 'purge_logs'],
    effect: 'BLOCK',
    priority: 100,
    isActive: true,
    conditions: {
      maxBlastRadius: 0,
      isReversible: false,
      maxRiskScore: 90,
    },
  },
  {
    _id: 'pol-002',
    policyName: 'InfrastructureChangeGate',
    description: 'Require human admin authorization for production cluster reconfigurations.',
    targetTools: ['resize_cluster', 'deploy_service', 'update_dns', 'modify_iam_role'],
    effect: 'REQUIRE_APPROVAL',
    priority: 80,
    isActive: true,
    conditions: {
      maxBlastRadius: 75,
      isReversible: true,
      maxRiskScore: 70,
    },
  },
  {
    _id: 'pol-003',
    policyName: 'ReadOnlyTelemetryWhitelist',
    description: 'Allow telemetry, status inspections, and non-state-mutating read actions.',
    targetTools: ['get_*', 'describe_*', 'list_*', 'fetch_metrics', 'read_logs'],
    effect: 'ALLOW',
    priority: 50,
    isActive: true,
    conditions: {
      maxBlastRadius: 20,
      isReversible: true,
      maxRiskScore: 25,
    },
  },
  {
    _id: 'pol-004',
    policyName: 'CredentialStoreEgressLock',
    description: 'Absolute block on private keys, auth token dumps, and credential retrieval tools.',
    targetTools: ['dump_credentials', 'export_private_keys', 'read_env_secrets'],
    effect: 'BLOCK',
    priority: 95,
    isActive: false, // Inactive critical rule to demonstrate operator alarm state
    conditions: {
      maxBlastRadius: 0,
      isReversible: false,
      maxRiskScore: 100,
    },
  },
];

export default function PolicyManager() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formEffect, setFormEffect] = useState('REQUIRE_APPROVAL');
  const [formTools, setFormTools] = useState('execute_command, scale_workers');
  const [formPriority, setFormPriority] = useState(60);
  const [formConditions, setFormConditions] = useState(
    JSON.stringify({ maxBlastRadius: 50, isReversible: true, maxRiskScore: 65 }, null, 2)
  );
  const [jsonError, setJsonError] = useState('');

  const API_BASE = '/policies';

  // ── Fetch Policies ──────────────────────────────────────────────
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_BASE);
      const data = res.data?.data?.policies || res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setPolicies(data);
      } else {
        setPolicies(SEED_POLICIES);
      }
    } catch {
      // Graceful fallback to seeded policies during local dev/demo
      setPolicies(SEED_POLICIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // ── Toggle Policy State ─────────────────────────────────────────
  const togglePolicy = async (policyId) => {
    const current = policies.find((p) => p._id === policyId);
    if (!current) return;
    const nextState = !current.isActive;

    // Optimistic UI update: toggles active state while keeping the policy card in the list
    setPolicies((prev) =>
      prev.map((p) => (p._id === policyId ? { ...p, isActive: nextState } : p))
    );

    try {
      // Sends PATCH request to update active state (NEVER a DELETE request)
      await api.patch(`${API_BASE}/${policyId}/toggle`, { isActive: nextState });
      showFeedback(`Policy ${nextState ? 'ACTIVATED' : 'DEACTIVATED'} on gateway.`, 'success');
    } catch (err) {
      console.warn('Backend toggle status:', err);
      // Keep optimistic update for local hackathon demo responsiveness
      showFeedback(`Policy state updated locally.`, 'warning');
    }
  };

  const showFeedback = (msg, type = 'success') => {
    setActionFeedback({ msg, type });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // ── Create New Policy ───────────────────────────────────────────
  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    setJsonError('');

    let parsedConditions = {};
    try {
      parsedConditions = JSON.parse(formConditions);
    } catch {
      setJsonError('Invalid JSON format in conditions block');
      return;
    }

    const targetToolsArr = formTools
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (targetToolsArr.length === 0) {
      setJsonError('Please specify at least one target tool pattern');
      return;
    }

    const newPolicyPayload = {
      policyName: formName.trim(),
      description: formDesc.trim(),
      effect: formEffect,
      targetTools: targetToolsArr,
      priority: Number(formPriority) || 0,
      conditions: parsedConditions,
      isActive: true,
    };

    try {
      setSubmitting(true);
      const res = await api.post(API_BASE, newPolicyPayload);
      const created = res.data?.data || { ...newPolicyPayload, _id: `pol-${Date.now()}` };
      setPolicies((prev) => [created, ...prev]);
      showFeedback(`Policy "${formName}" deployed successfully!`, 'success');
      resetForm();
    } catch {
      // Optimistic creation fallback for seamless presentation
      const mockCreated = { ...newPolicyPayload, _id: `pol-${Date.now()}` };
      setPolicies((prev) => [mockCreated, ...prev]);
      showFeedback(`Policy "${formName}" deployed locally.`, 'warning');
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormEffect('REQUIRE_APPROVAL');
    setFormTools('');
    setFormPriority(60);
    setFormConditions(
      JSON.stringify({ maxBlastRadius: 50, isReversible: true, maxRiskScore: 65 }, null, 2)
    );
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Action Feedback Toast ──────────────────────────────── */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-20 right-8 z-50 px-4 py-2.5 rounded-lg text-xs font-mono flex items-center gap-2 border shadow-xl"
            style={{
              background: '#0B0F19',
              borderColor: actionFeedback.type === 'warning' ? C_APPROVAL_AMBER : C_CYAN,
              color: actionFeedback.type === 'warning' ? C_APPROVAL_AMBER : C_CYAN,
            }}
          >
            {actionFeedback.type === 'warning' ? <AlertTriangle size={14} /> : <Check size={14} />}
            <span>{actionFeedback.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Subheader & Controls ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[rgba(0,245,255,0.1)]">
        <div>
          <h2 className="text-sm font-bold tracking-[0.25em] uppercase glow-cyan-text text-[#00F5FF]">
            Declarative Policy-as-Code Engine
          </h2>
          <p className="text-[10px] tracking-wider text-[#64748B] mt-0.5">
            Configure real-time authorization bounds, blast-radius constraints, and automated gatekeeper rules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Top-Right Prominent Trigger Button */}
          <button
            type="button"
            onClick={() => setIsSimulateOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-110 text-slate-950 shadow-[0_0_18px_rgba(245,158,11,0.5)] border border-amber-200/60 transition-all cursor-pointer active:scale-95"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
            <Zap size={13} className="fill-slate-950 text-slate-950" />
            <span>SIMULATE AI ACTION</span>
          </button>

          <button
            onClick={fetchPolicies}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[rgba(0,245,255,0.06)] hover:bg-[rgba(0,245,255,0.12)] border border-[rgba(0,245,255,0.2)] text-[#00F5FF] transition-all cursor-pointer"
          >
            <RotateCcw size={12} className={loading ? 'animate-spin' : ''} />
            <span>SYNC POLICIES</span>
          </button>

          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#00F5FF] text-[#0B0F19] font-bold hover:shadow-[0_0_16px_rgba(0,245,255,0.4)] transition-all cursor-pointer"
          >
            {isCreating ? <X size={13} /> : <Plus size={13} />}
            <span>{isCreating ? 'CANCEL' : 'NEW POLICY'}</span>
          </button>
        </div>
      </div>

      {/* ── Collapsible "Create Policy" Panel ──────────────────── */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleCreatePolicy}
              className="glass-panel p-6 border border-[#00F5FF]/30 rounded-xl relative space-y-4"
              style={{ background: C_BG_CARD }}
            >
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#00F5FF]">
                <Sliders size={14} />
                <span>Declare Security Policy Rules</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Policy Name */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#64748B] font-mono">
                    Policy Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. ProductionClusterGuard"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0F19] border border-[rgba(0,245,255,0.15)] focus:border-[#00F5FF] text-xs font-mono text-white outline-none"
                  />
                </div>

                {/* Effect */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#64748B] font-mono">
                    Enforcement Effect *
                  </label>
                  <select
                    value={formEffect}
                    onChange={(e) => setFormEffect(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0F19] border border-[rgba(0,245,255,0.15)] focus:border-[#00F5FF] text-xs font-mono text-white outline-none"
                  >
                    <option value="ALLOW">ALLOW (Automated Pass)</option>
                    <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL (Human Escalation)</option>
                    <option value="BLOCK">BLOCK (Immediate Intercept)</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#64748B] font-mono">
                    Evaluation Priority (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0F19] border border-[rgba(0,245,255,0.15)] focus:border-[#00F5FF] text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              {/* Description & Target Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#64748B] font-mono">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Operational intent and justification"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0F19] border border-[rgba(0,245,255,0.15)] focus:border-[#00F5FF] text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-[#64748B] font-mono">
                    Target Tools (Comma-separated or wildcards) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTools}
                    onChange={(e) => setFormTools(e.target.value)}
                    placeholder="e.g. drop_database, delete_user, rm_*"
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0F19] border border-[rgba(0,245,255,0.15)] focus:border-[#00F5FF] text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>

              {/* Conditions JSON */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wider text-[#64748B] font-mono flex items-center gap-1.5">
                    <Terminal size={11} />
                    <span>Evaluation Conditions (JSON Object)</span>
                  </label>
                  {jsonError && (
                    <span className="text-[10px] font-mono text-[#F01616] flex items-center gap-1">
                      <AlertTriangle size={11} />
                      {jsonError}
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={formConditions}
                  onChange={(e) => setFormConditions(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0B0F19] border border-[rgba(0,245,255,0.15)] focus:border-[#00F5FF] text-xs font-mono text-[#00F5FF] outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg text-xs font-mono text-[#64748B] hover:text-white transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg text-xs font-mono bg-[#00F5FF] text-[#0B0F19] font-bold hover:shadow-[0_0_16px_rgba(0,245,255,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'ENFORCING...' : 'ENFORCE POLICY'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Policy Cards Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((policy) => {
          const isBlockPolicy = policy.effect === 'BLOCK';
          const isDisabledBlock = isBlockPolicy && !policy.isActive;

          // Card Dynamic Styling
          let cardBorderColor = 'rgba(0, 245, 255, 0.12)';
          let cardBoxShadow = 'none';

          if (isDisabledBlock) {
            // STRICT REQUIREMENT: Critical disabled BLOCK firewall zone
            cardBorderColor = C_BLOCK_DANGER;
            cardBoxShadow = `0 0 24px rgba(240, 22, 22, 0.4), inset 0 0 16px rgba(240, 22, 22, 0.15)`;
          } else if (policy.isActive && isBlockPolicy) {
            cardBorderColor = 'rgba(240, 22, 22, 0.35)';
          } else if (policy.isActive) {
            cardBorderColor = 'rgba(0, 245, 255, 0.25)';
          }

          return (
            <motion.div
              key={policy._id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`glass-panel p-5 rounded-xl flex flex-col justify-between transition-all duration-300 relative hover-card-scale ${
                !policy.isActive && !isBlockPolicy ? 'opacity-40' : ''
              }`}
              style={{
                background: C_BG_CARD,
                borderColor: cardBorderColor,
                boxShadow: cardBoxShadow,
                borderWidth: isDisabledBlock ? 2 : 1,
              }}
            >
              {/* Critical Firewall Breach Warning Header */}
              {isDisabledBlock && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 mb-3 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase text-white animate-pulse"
                  style={{ background: C_BLOCK_DANGER }}
                >
                  <AlertTriangle size={13} />
                  <span>CRITICAL DEFENSE OFFLINE · FIREWALL DEACTIVATED</span>
                </div>
              )}

              <div>
                {/* ── Card Header ─────────────────────────────────────── */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono tracking-wider text-white">
                        {policy.policyName}
                      </span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold"
                        style={{
                          background: 'rgba(0, 245, 255, 0.1)',
                          color: C_CYAN,
                          border: '1px solid rgba(0, 245, 255, 0.25)',
                        }}
                      >
                        PRIORITY: {policy.priority}
                      </span>
                    </div>
                    {policy.description && (
                      <p className="text-[11px] text-[#64748B] leading-tight">
                        {policy.description}
                      </p>
                    )}
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-mono tracking-widest uppercase font-bold"
                      style={{
                        color: policy.isActive ? C_ALLOW_EMERALD : isDisabledBlock ? C_BLOCK_DANGER : '#64748B',
                      }}
                    >
                      {policy.isActive ? 'ACTIVE' : 'OFF'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePolicy(policy._id)}
                      className="w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer"
                      style={{
                        background: policy.isActive
                          ? C_ALLOW_EMERALD
                          : isDisabledBlock
                          ? C_BLOCK_DANGER
                          : '#334155',
                      }}
                    >
                      <motion.div
                        layout
                        className="bg-white w-4 h-4 rounded-full shadow-md"
                        animate={{ x: policy.isActive ? 20 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>

                {/* ── Target Tools Tags ───────────────────────────────── */}
                <div className="my-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-[#64748B] font-mono mr-1">
                    TARGETS:
                  </span>
                  {policy.targetTools?.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono tracking-tight"
                      style={{
                        background: 'rgba(0, 245, 255, 0.06)',
                        color: C_CYAN,
                        border: '1px solid rgba(0, 245, 255, 0.18)',
                      }}
                    >
                      {tool}
                    </span>
                  ))}
                </div>

                {/* ── Conditions JSON Box ─────────────────────────────── */}
                <div className="mt-2 mb-3">
                  <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-[#64748B] font-mono mb-1">
                    <Code size={10} />
                    <span>RUNTIME CONDITIONS:</span>
                  </div>
                  <pre
                    className="p-2.5 rounded-lg text-[10px] font-mono overflow-x-auto"
                    style={{
                      background: '#080C14',
                      border: '1px solid rgba(0, 245, 255, 0.1)',
                      color: policy.isActive ? '#94A3B8' : '#475569',
                    }}
                  >
                    {JSON.stringify(policy.conditions, null, 2)}
                  </pre>
                </div>
              </div>

              {/* ── Card Footer: Effect Badge ───────────────────────── */}
              <div
                className="pt-3 mt-2 flex items-center justify-between border-t"
                style={{ borderColor: 'rgba(0, 245, 255, 0.08)' }}
              >
                <span className="text-[9px] font-mono tracking-widest uppercase text-[#64748B]">
                  ENFORCEMENT EFFECT:
                </span>

                {policy.effect === 'BLOCK' ? (
                  // STRICT: rgb(240, 22, 22) with glowing effect & white text
                  <span
                    className="px-3 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase text-white flex items-center gap-1.5"
                    style={{
                      background: C_BLOCK_DANGER,
                      boxShadow: `0 0 14px ${C_BLOCK_DANGER}`,
                    }}
                  >
                    <ShieldAlert size={12} />
                    <span>BLOCK</span>
                  </span>
                ) : policy.effect === 'ALLOW' ? (
                  <span
                    className="px-3 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5"
                    style={{
                      background: 'rgba(0, 230, 118, 0.15)',
                      color: C_ALLOW_EMERALD,
                      border: `1px solid rgba(0, 230, 118, 0.35)`,
                    }}
                  >
                    <ShieldCheck size={12} />
                    <span>ALLOW</span>
                  </span>
                ) : (
                  <span
                    className="px-3 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5"
                    style={{
                      background: 'rgba(255, 184, 0, 0.15)',
                      color: C_APPROVAL_AMBER,
                      border: `1px solid rgba(255, 184, 0, 0.35)`,
                    }}
                  >
                    <Layers size={12} />
                    <span>REQUIRE APPROVAL</span>
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Simulate AI Action Floating Action Button (FAB) ───── */}
      <SimulateActionFab
        policies={policies}
        isOpen={isSimulateOpen}
        onToggle={setIsSimulateOpen}
      />
    </div>
  );
}
