import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionCard } from './ActionCard';
import { 
  ShieldAlert, 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  AlertOctagon, 
  Radio, 
  ShieldCheck 
} from 'lucide-react';
import socketService from '../services/socket.service';

const API_BASE_URL = 'http://localhost:5000/api/v1/gateway';

export const LiveQueue = () => {
  const [pendingActions, setPendingActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, title, message) => {
    setToast({ type, title, message, id: Date.now() });
    setTimeout(() => {
      setToast((curr) => (curr?.id === toast?.id ? null : curr));
    }, 6000);
  };

  const fetchPendingActions = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/pending`, {
        headers: {
          'x-user-role': 'HUMAN_ADMIN'
        }
      });
      const data = response.data?.data || response.data || [];
      setPendingActions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load pending queue:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingActions();

    const unsubHeld = socketService.onActionHeld((newAction) => {
      setPendingActions((prev) => {
        const exists = prev.some((a) => (a._id || a.actionId) === (newAction._id || newAction.actionId));
        if (exists) return prev;
        return [newAction, ...prev];
      });
    });

    const unsubAllowed = socketService.onActionAllowed((allowedAction) => {
      const id = allowedAction._id || allowedAction.actionId;
      setPendingActions((prev) => prev.filter((a) => (a._id || a.actionId) !== id));
    });

    return () => {
      unsubHeld();
      unsubAllowed();
    };
  }, [fetchPendingActions]);

  const handleApproval = async (actionId, editedPayload, decision, isPayloadModified) => {
    setProcessingId(actionId);
    try {
      const payloadBody = {
        actionId,
        decision,
        editedPayload,
        approverRole: 'HUMAN_ADMIN',
        notes: isPayloadModified ? 'Operator modified parameters in SOC view' : 'Operator approved original parameters'
      };

      const response = await axios.post(`${API_BASE_URL}/approve`, payloadBody, {
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'HUMAN_ADMIN'
        }
      });

      showToast(
        'success',
        `Action ${decision}`,
        response.data?.message || `Successfully committed decision [${decision}] to ledger.`
      );

      setPendingActions((prev) => prev.filter((a) => (a._id || a.actionId) !== actionId));
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
    <div className="relative w-full max-w-7xl mx-auto space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-start gap-3 rounded-xl p-4 shadow-2xl backdrop-blur-xl border font-mono text-sm max-w-md ${
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
              <div className="text-xs text-slate-300 leading-relaxed">{toast.message}</div>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="ml-auto text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wider font-mono flex items-center gap-2">
              LIVE ACTION AUTHORIZATION QUEUE
              <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {pendingActions.length} Pending
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Role: <span className="text-cyan-400">HUMAN_ADMIN</span> | Stream: <span className="text-emerald-400">SOCKET_CONNECTED</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchPendingActions()}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-mono border border-slate-700/70 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Sync Queue
        </button>
      </div>

      {loading && pendingActions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-800/60 bg-slate-900/30 backdrop-blur-md space-y-3">
          <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
          <p className="text-sm font-mono text-slate-400">Interrogating Gateway for Held Actions...</p>
        </div>
      ) : pendingActions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-800/60 bg-slate-900/20 backdrop-blur-md text-center space-y-3"
        >
          <ShieldCheck className="w-12 h-12 text-emerald-400/80 mb-1" />
          <h3 className="text-lg font-bold text-white font-mono">All Systems Clear</h3>
          <p className="text-xs text-slate-400 max-w-sm font-mono">
            No agent actions currently held for approval. Gateway evaluating actions autonomously.
          </p>
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
