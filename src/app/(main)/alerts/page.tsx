"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { useAlertRuleStore, useNotificationStore, useTradeStore } from "@/stores";
import { AlertRule } from "@/lib/types";
import { 
  BellRing, ShieldAlert, TrendingDown, Target, Plus, 
  Trash2, Activity, Zap, CheckCircle2, XCircle
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const METRICS = [
  { value: "dailyLoss", label: "Daily Loss Limit ($)" },
  { value: "lossStreak", label: "Consecutive Loss Streak" },
  { value: "winRate7d", label: "7-Day Win Rate Below (%)" },
  { value: "maxTradesDay", label: "Max Trades Per Day" },
  { value: "dailyProfit", label: "Daily Profit Target ($)" },
  { value: "drawdown", label: "Account Drawdown (%)" },
];

export default function AlertsPage() {
  const { rules, addRule, updateRule, deleteRule, toggleRule } = useAlertRuleStore();
  const { notifications, addNotification } = useNotificationStore();
  const { trades } = useTradeStore();
  
  const [showBuilder, setShowBuilder] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AlertRule>>({
    name: "", metric: "dailyLoss", operator: "<=", threshold: 500, severity: "warning", enabled: true
  });

  // Evaluate Rules Logic (Simplified for client side demo)
  useEffect(() => {
    if (!trades.length || !rules.length) return;
    
    // Evaluate Daily Loss
    const today = new Date().toISOString().split("T")[0];
    const todaysTrades = trades.filter(t => t.entryDate.startsWith(today));
    const dailyPnl = todaysTrades.reduce((s, t) => s + t.netPnl, 0);
    
    rules.filter(r => r.enabled).forEach(rule => {
      let triggered = false;
      let title = "";
      let description = "";

      if (rule.metric === "dailyLoss" && dailyPnl <= -rule.threshold) {
        triggered = true;
        title = "Daily Loss Limit Reached";
        description = `You have lost ${formatCurrency(dailyPnl)}. Threshold is ${formatCurrency(-rule.threshold)}.`;
      } else if (rule.metric === "maxTradesDay" && todaysTrades.length >= rule.threshold) {
        triggered = true;
        title = "Overtrading Alert";
        description = `You have taken ${todaysTrades.length} trades today. Limit is ${rule.threshold}.`;
      } else if (rule.metric === "dailyProfit" && dailyPnl >= rule.threshold) {
        triggered = true;
        title = "Daily Profit Target Reached!";
        description = `Great job! You reached +${formatCurrency(dailyPnl)} today (Target: ${formatCurrency(rule.threshold)}). Consider locking in gains.`;
      } else if (rule.metric === "lossStreak") {
        let streak = 0;
        const sorted = [...trades].sort((a,b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
        for (const t of sorted) {
          if (t.result === "loss") streak++;
          else break;
        }
        if (streak >= rule.threshold) {
          triggered = true;
          title = "Consecutive Loss Streak Alert";
          description = `You have suffered ${streak} consecutive losses. Threshold is ${rule.threshold}. Take a 15 minute break.`;
        }
      } else if (rule.metric === "winRate7d") {
        const nowMs = Date.now();
        const trades7d = trades.filter(t => nowMs - new Date(t.entryDate).getTime() <= 7 * 24 * 3600 * 1000);
        if (trades7d.length >= 5) {
          const wr = (trades7d.filter(t => t.result === "win").length / trades7d.length) * 100;
          if (wr < rule.threshold) {
            triggered = true;
            title = "7-Day Win Rate Dip";
            description = `Your 7-day win rate dropped to ${wr.toFixed(0)}% (Threshold: ${rule.threshold}%). Review playbook alignment.`;
          }
        }
      } else if (rule.metric === "drawdown") {
        let maxPeak = 0;
        let cum = 0;
        let currentDD = 0;
        const chronological = [...trades].sort((a,b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
        for (const t of chronological) {
          cum += t.netPnl;
          if (cum > maxPeak) maxPeak = cum;
          const dd = maxPeak > 0 ? ((maxPeak - cum) / maxPeak) * 100 : 0;
          if (dd > currentDD) currentDD = dd;
        }
        if (currentDD >= rule.threshold) {
          triggered = true;
          title = "Account Drawdown Warning";
          description = `Peak-to-valley drawdown reached ${currentDD.toFixed(1)}% (Threshold: ${rule.threshold}%). Reduce position sizing.`;
        }
      }

      if (triggered) {
        // Prevent spamming (only notify if not triggered recently)
        const lastTrig = rule.lastTriggered ? new Date(rule.lastTriggered).getTime() : 0;
        const now = new Date().getTime();
        if (now - lastTrig > 1000 * 60 * 60) { // 1 hour debounce
          addNotification({
            type: "risk",
            title,
            description,
            severity: rule.severity,
          });
          updateRule(rule.id, { lastTriggered: new Date().toISOString() });
        }
      }
    });
  }, [trades, rules, updateRule, addNotification]);

  const handleSaveRule = () => {
    if (!newRule.name) return;
    addRule(newRule as Omit<AlertRule, "id" | "createdAt">);
    setShowBuilder(false);
    setNewRule({ name: "", metric: "dailyLoss", operator: "<=", threshold: 500, severity: "warning", enabled: true });
  };

  const riskNotifications = notifications.filter(n => n.type === "risk").slice(0, 20);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-inter)] font-black tracking-tight text-text-primary flex items-center gap-2">
            <BellRing className="text-accent-coral" /> Risk Alerts
          </h1>
          <p className="text-sm text-text-muted mt-1">Set up automated circuit breakers and risk notifications.</p>
        </div>
        <button 
          onClick={() => setShowBuilder(!showBuilder)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-violet/10 text-accent-violet hover:bg-accent-violet/20 rounded-xl font-bold transition-all text-sm"
        >
          {showBuilder ? <XCircle size={16} /> : <Plus size={16} />}
          {showBuilder ? "Cancel" : "Create Custom Rule"}
        </button>
      </div>

      <AnimatePresence>
        {showBuilder && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <GlassCard className="border-accent-violet/30 p-6 mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-accent-violet mb-4">Rule Builder</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Rule Name</label>
                  <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2 text-sm focus:border-accent-violet outline-none" placeholder="e.g., Tilt Breaker" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Metric</label>
                  <select value={newRule.metric} onChange={e => setNewRule({...newRule, metric: e.target.value as any})} className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2 text-sm focus:border-accent-violet outline-none">
                    {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Threshold</label>
                  <input type="number" value={newRule.threshold} onChange={e => setNewRule({...newRule, threshold: Number(e.target.value)})} className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2 text-sm focus:border-accent-violet outline-none" />
                </div>
                <div>
                  <button onClick={handleSaveRule} className="w-full py-2 bg-accent-violet hover:bg-accent-violet/90 text-white font-bold rounded-xl transition-all">Save Rule</button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-text-muted">Active Rules</h2>
          {rules.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border-subtle rounded-2xl">
              <ShieldAlert className="mx-auto h-8 w-8 text-text-muted mb-3 opacity-50" />
              <p className="text-sm text-text-secondary">No alert rules configured.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {rules.map(rule => (
                <GlassCard key={rule.id} className={cn("p-4 transition-all flex items-center justify-between", !rule.enabled && "opacity-60")}>
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleRule(rule.id)} className={cn("w-12 h-6 rounded-full transition-colors relative", rule.enabled ? "bg-accent-green" : "bg-bg-secondary")}>
                      <div className={cn("absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform", rule.enabled && "translate-x-6")} />
                    </button>
                    <div>
                      <h4 className="font-bold text-text-primary">{rule.name}</h4>
                      <div className="text-xs text-text-muted flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-bg-secondary rounded text-[10px] uppercase tracking-wider">{METRICS.find(m => m.value === rule.metric)?.label || rule.metric}</span>
                        <span>{rule.operator} {rule.threshold}</span>
                        {rule.lastTriggered && <span>• Last: {new Date(rule.lastTriggered).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteRule(rule.id)} className="p-2 text-text-muted hover:text-accent-coral hover:bg-accent-coral/10 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-text-muted">Alert History</h2>
          <GlassCard className="p-0 overflow-hidden border-border-subtle">
            {riskNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-accent-green mb-2 opacity-50" />
                <p className="text-xs text-text-muted">No recent alerts triggered. You are trading safely.</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle/50">
                {riskNotifications.map(notif => (
                  <div key={notif.id} className="p-4 flex gap-3">
                    <div className={cn("mt-0.5", notif.severity === "critical" ? "text-accent-coral" : "text-accent-violet")}>
                      <Activity size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{notif.title}</h4>
                      <p className="text-xs text-text-secondary mt-1">{notif.description}</p>
                      <span className="text-[10px] text-text-muted mt-2 block">{new Date(notif.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
