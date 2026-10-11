import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionCard } from './ActionCard';
import { 
  ShieldAlert, 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  AlertOctagon, 
  Radio, 
  ShieldCheck,
  Clock,
  Zap,
  Filter
} from 'lucide-react';
import socketService from '../services/socket.service';

/**
 * Normalizes an action object from various backend representations (AuditLedger or Gateway Action)
 */
function normalizeActionItem(item) {
  if (!item) return null;
  const id = item.actionId || item._id || item.id || `act_${Date.now()}`;
  return {
    _id: id,
    actionId: id,
    agentId: item.agentId || item.agent || 'autonomous_agent',
    toolName: item.toolName || item.action || 'unknown_tool',
    payload: item.payload || item.arguments || {},
    finalDecision: item.finalDecision || item.status || 'HELD_FOR_APPROVAL',
    decisionPath: item.decisionPath || 'Action intercepted by REQUIRE_APPROVAL policy',
    decisionReason: item.decisionReason || 'Requires human-in-the-loop authorization',
    riskScore: item.riskScore ?? item.riskAnalysis?.risk_score ?? 75,
    timestamp: item.timestamp || item.createdAt || new Date().toISOString()
  };
}

export const LiveQueue = () => {
  const [pendingActions, setPendingActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);

  const showToast = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() });
    setTimeout(() => {
      setToast((curr) => (curr?.id === toast?.id ? null : curr));
    }, 5000);
  };

  /**
   * Resilient Data Fetching:
   * 1. First calls GET /api/v1/gateway/pending
   * 2. If empty or as defensive fallback, interrogates GET /api/v1/ledger for any HELD_FOR_APPROVAL blocks
   */
  const fetchPendingActions = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      let resolvedItems = [];

      // 1. Primary endpoint: /gateway/pending
      try {
        const response = await api.get('/gateway/pending', {
          headers: { 'x-user-role': 'HUMAN_ADMIN' },
          timeout: 5000
        });

        const raw = response.data?.data !== undefined ? response.data.data : response.data;
        if (Array.isArray(raw) && raw.length > 0) {
          resolvedItems = raw.map(normalizeActionItem).filter(Boolean);
        }
      } catch (pendingErr) {
        console.warn('[LiveQueue] Primary /gateway/pending error, checking ledger fallback:', pendingErr.message);
      }

      // 2. Fallback check: if primary returned empty, inspect audit ledger
      if (resolvedItems.length === 0) {
        try {
          const ledgerRes = await api.get('/ledger?limit=50', { timeout: 5000 });
          const ledgerBlocks = ledgerRes.data?.data?.blocks || ledgerRes.data?.blocks || ledgerRes.data?.data || [];
          if (Array.isArray(ledgerBlocks)) {
            // Find blocks that are HELD_FOR_APPROVAL and not subsequent reauthorized/rejected
            const heldBlocks = ledgerBlocks.filter((b) => b.finalDecision === 'HELD_FOR_APPROVAL');
            const resolvedActionIds = new Set(
              ledgerBlocks
                .filter((b) => ['REAUTHORIZED', 'REJECTED', 'ALLOWED'].includes(b.finalDecision))
                .map((b) => b.actionId)
            );
            const activeHeld = heldBlocks.filter((b) => !resolvedActionIds.has(b.actionId));
            if (activeHeld.length > 0) {
              resolvedItems = activeHeld.map(normalizeActionItem).filter(Boolean);
            }
          }
        } catch (ledgerErr) {
          console.warn('[LiveQueue] Ledger fallback query failed:', ledgerErr.message);
        }
      }

      setPendingActions(resolvedItems);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load pending queue:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // ── Initial Fetch & Real-Time Event Listeners ────────────────────
  useEffect(() => {
    fetchPendingActions();

    // Socket: Live newly intercepted action
    const unsubHeld = socketService.onActionHeld((newAction) => {
      const normalized = normalizeActionItem(newAction);
      if (!normalized) return;

      setPendingActions((prev) => {
        const exists = prev.some((a) => (a._id || a.actionId) === normalized.actionId);
        if (exists) return prev;
        return [normalized, ...prev];
      });

      showToast(
        'warning',
        'New Action Intercepted',
        `Agent ${normalized.agentId} invoked ${normalized.toolName}. Awaiting review.`
      );
    });

    // Socket: Live allowed/resolved action
    const unsubAllowed = socketService.onActionAllowed((allowedAction) => {
      const id = allowedAction.actionId || allowedAction._id;
      setPendingActions((prev) => prev.filter((a) => (a.actionId || a._id) !== id));
    });

    // Socket: Live blocked action
    const unsubBlocked = socketService.onActionBlocked((blockedAction) => {
      const id = blockedAction.actionId || blockedAction._id;
      setPendingActions((prev) => prev.filter((a) => (a.actionId || a._id) !== id));
    });

    // Socket: Ledger block added
    const unsubBlock = socketService.onLedgerBlockAdded((block) => {
      if (block.finalDecision === 'HELD_FOR_APPROVAL') {
        fetchPendingActions(true);
      }
    });

    return () => {
      unsubHeld();
      unsubAllowed();
      unsubBlocked();
      unsubBlock();
    };
  }, [fetchPendingActions]);

  // ── Auto-Refresh Polling Interval (every 4 seconds) ───────────────
  useEffect(() => {
    if (!isAutoSyncEnabled) return;

    const intervalId = setInterval(() => {
      fetchPendingActions(true);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [isAutoSyncEnabled, fetchPendingActions]);

  // ── Approval / Rejection Handler ──────────────────────────────────
  const handleApproval = async (actionId, editedPayload, decision, isPayloadModified) => {
    setProcessingId(actionId);

    // Optimistically remove from state so the card instantly clears from the view
    setPendingActions((prev) => prev.filter((a) => (a._id || a.actionId) !== actionId));

    try {
      const payloadBody = {
        actionId,
        decision,
        approvedPayload: editedPayload,
        editedPayload,
        approverRole: 'HUMAN_ADMIN',
        reason: isPayloadModified
          ? 'Operator modified parameters in SOC view'
          : `Operator committed ${decision} decision in SOC Live Queue`
      };

      const response = await api.post('/gateway/approve', payloadBody, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'HUMAN_ADMIN'
        }
      });

      showToast(
        decision === 'APPROVED' ? 'success' : 'warning',
        `Action ${decision}`,
        response.data?.message || `Successfully committed decision [${decision}] to cryptographic ledger.`
      );
    } catch (err) {
      console.error('Decision dispatch error:', err);
      const statusCode = err.response?.status;
      const errorMsg = err.response?.data?.message || err.message;

      if (statusCode === 400 && isPayloadModified) {
        showToast(
          'warning',
          'Reauthorization Triggered (400)',
          `Payload was modified! Action gated for re-evaluation: ${errorMsg}`
        );
      } else {
        showToast(
          'error',
          'Authorization Failure',
          errorMsg || 'Failed to execute authorization decision.'
        );
      }
      // Re-fetch on error to ensure consistency
      fetchPendingActions(true);
    } finally {
      setProcessingId(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto space-y-6 pb-12 font-sans selection:bg-[#EF233C]/30 selection:text-white">
      {/* ── Toast Notifications ───────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-start gap-3 rounded-xl p-4 shadow-2xl backdrop-blur-xl border font-mono text-xs max-w-md ${
              toast.type === 'error'
                ? 'bg-slate-950/95 border-[#F01616] text-[#F01616] shadow-[0_0_20px_rgba(240,22,22,0.4)]'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-amber-950/80'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-950/80'
            }`}
          >
            {toast.type === 'error' && <AlertOctagon className="w-5 h-5 text-[#F01616] mt-0.5 shrink-0" />}
            {toast.type === 'warning' && <ShieldAlert className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />}
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />}
            <div className="space-y-1">
              <div className="font-bold tracking-wide">{toast.title}</div>
              <div className="text-[11px] text-slate-300 leading-relaxed">{toast.message}</div>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="ml-auto text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header Bar & Queue Controls ───────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#0C101A]/90 border border-slate-800/80 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="relative w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wider font-mono flex items-center gap-2.5">
              LIVE ACTION AUTHORIZATION QUEUE
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                pendingActions.length > 0 
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {pendingActions.length} Pending
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Role: <span className="text-cyan-400 font-bold">HUMAN_ADMIN</span> · Gate: <span className="text-amber-400 font-bold">ZERO_TRUST_QUARANTINE</span>
              {lastSynced && <span className="text-slate-500 ml-2">· Synced: {lastSynced}</span>}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Auto-Sync Toggle Badge */}
          <button
            onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer ${
              isAutoSyncEnabled
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle automated 4-second polling"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAutoSyncEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>{isAutoSyncEnabled ? 'AUTO-SYNC: 4s' : 'AUTO-SYNC: OFF'}</span>
          </button>

          {/* Sync Queue Button */}
          <button
            onClick={() => fetchPendingActions()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-lg shadow-cyan-950/50 border border-cyan-400/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-white' : ''}`} />
            <span>SYNC QUEUE</span>
          </button>
        </div>
      </div>

      {/* ── Main Queue Content Area ───────────────────────────────── */}
      {loading && pendingActions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-800/80 bg-[#0C101A]/60 backdrop-blur-xl space-y-3 font-mono">
          <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
          <p className="text-sm text-slate-300">Interrogating Gateway for Held Agent Actions...</p>
          <span className="text-xs text-slate-500">Querying /api/v1/gateway/pending & ledger matrix...</span>
        </div>
      ) : pendingActions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-800/80 bg-[#0C101A]/50 backdrop-blur-xl text-center space-y-3 font-mono shadow-2xl"
        >
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 mb-1">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-wide">All Systems Clear · 0 Actions Held</h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            No autonomous agent operations are currently quarantined for operator authorization. Trigger a test action via the <span className="text-amber-400 font-bold">Simulate AI Action</span> button to view real-time interception.
          </p>
          <button
            onClick={() => fetchPendingActions()}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Refresh Queue Now</span>
          </button>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {pendingActions.map((action) => (
              <ActionCard
                key={action._id || action.actionId || action.id}
                action={action}
                onDecision={handleApproval}
                isProcessing={processingId === (action._id || action.actionId || action.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default LiveQueue;
