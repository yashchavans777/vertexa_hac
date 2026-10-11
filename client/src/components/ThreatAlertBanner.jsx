import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldX, Terminal, Cpu, X, Zap } from 'lucide-react';
import socketService from '../services/socket.service';

export const ThreatAlertBanner = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsubscribe = socketService.onActionBlocked((payload) => {
      const alertId = `${Date.now()}-${Math.random()}`;
      const newAlert = {
        id: alertId,
        toolName: payload.toolName || payload.tool || 'system:unauthorized_call',
        agentId: payload.agentId || 'rogue_agent',
        riskScore: payload.riskScore ?? 85,
        policyMatched: payload.policyMatched || payload.reason || 'POLICY_ZERO_TRUST_DENY',
        timestamp: new Date().toLocaleTimeString(),
      };

      setAlerts((prev) => [newAlert, ...prev].slice(0, 4));

      setTimeout(() => {
        setAlerts((current) => current.filter((item) => item.id !== alertId));
      }, 5000);
    });

    return () => unsubscribe();
  }, []);

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => dismissAlert(alert.id)}
            className="pointer-events-auto cursor-pointer relative overflow-hidden rounded-xl bg-slate-950/95 backdrop-blur-2xl border-2 border-[#F01616] font-mono text-white p-4 transition-all hover:scale-[1.02]"
            style={{
              boxShadow: '0 0 25px rgba(240, 22, 22, 0.65), inset 0 0 15px rgba(240, 22, 22, 0.2)'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#F01616] animate-pulse" />

            <div className="flex items-start gap-3.5">
              <div className="shrink-0 p-2.5 rounded-lg bg-[#F01616] text-white shadow-[0_0_15px_#F01616]">
                <ShieldX className="w-6 h-6 animate-pulse" />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black tracking-widest text-[#F01616] flex items-center gap-1.5 uppercase">
                    <Zap className="w-3.5 h-3.5 fill-[#F01616]" />
                    ACTION INTERCEPTED & BLOCKED
                  </span>
                  <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                </div>

                <div className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                  <Terminal className="w-4 h-4 text-[#F01616]" />
                  <span className="truncate">{alert.toolName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-1 text-slate-300 truncate">
                    <Cpu className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{alert.agentId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Risk: </span>
                    <span className="font-extrabold text-[#F01616]">{alert.riskScore}/100</span>
                  </div>
                </div>

                <div className="text-[10px] bg-[#F01616]/10 border border-[#F01616]/40 text-rose-200 px-2 py-0.5 rounded truncate">
                  Trigger: <span className="text-white font-semibold">{alert.policyMatched}</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissAlert(alert.id);
                }}
                className="text-slate-400 hover:text-white transition-colors p-1"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ThreatAlertBanner;
