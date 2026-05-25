"use client";

import { useTradeStore, usePropFirmStore, useSettingsStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Bell, AlertTriangle, CheckCircle, XCircle, Shield, TrendingDown,
  Trophy, Clock, Flame, DollarSign, Target, Zap, ChevronDown, BellOff,
  ToggleLeft, ToggleRight, Radio, Sliders, Smartphone, Send, Mail
} from "lucide-react";
import { format, isToday, isYesterday, subDays, differenceInDays } from "date-fns";

type AlertType = "danger" | "warning" | "info" | "success";
type AlertCategory = "risk" | "prop" | "performance" | "system";

interface Alert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon: React.ElementType;
  actionLabel?: string;
  actionHref?: string;
}

function generateAlerts(
  trades: ReturnType<typeof useTradeStore.getState>["trades"],
  challenges: ReturnType<typeof usePropFirmStore.getState>["challenges"]
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Check consecutive losses
  let consecutiveLosses = 0;
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].result === "loss") consecutiveLosses++;
    else break;
  }
  if (consecutiveLosses >= 3) {
    alerts.push({
      id: "loss-streak", type: "danger", category: "risk",
      title: `${consecutiveLosses} Consecutive Losses`,
      message: `You're on a ${consecutiveLosses}-loss streak. Consider taking a break and reviewing your recent trades before placing the next one.`,
      timestamp: new Date(trades[trades.length - 1]?.exitDate || now), read: false, icon: Flame,
      actionLabel: "View Journal", actionHref: "/journal",
    });
  }

  // Daily P&L check (simulated for today)
  const todayTrades = trades.filter((t) => {
    try { return t.entryDate.startsWith(format(now, "yyyy-MM-dd")); } catch { return false; }
  });
  const todayPnl = todayTrades.reduce((s, t) => s + t.netPnl, 0);
  if (todayPnl < -300) {
    alerts.push({
      id: "daily-loss", type: "danger", category: "risk",
      title: "Daily Loss Limit Warning",
      message: `Today's P&L is ${formatCurrency(todayPnl)}. You're approaching your daily loss limit.`,
      timestamp: now, read: false, icon: Shield,
      actionLabel: "Risk Manager", actionHref: "/risk",
    });
  }

  // Prop firm alerts
  for (const c of challenges) {
    const profitPct = (c.currentPnl / c.accountSize) * 100;
    const drawdownPct = ((c.highWaterMark - c.currentBalance) / c.accountSize) * 100;
    const daysUsed = differenceInDays(now, new Date(c.startDate));
    const daysLeft = c.rules.maxDuration > 0 ? c.rules.maxDuration - daysUsed : null;

    if (profitPct >= c.rules.profitTarget * 0.8 && profitPct < c.rules.profitTarget) {
      alerts.push({
        id: `prop-close-${c.id}`, type: "success", category: "prop",
        title: `${c.firmName} — Near Profit Target!`,
        message: `${profitPct.toFixed(2)}% of ${c.rules.profitTarget}% target reached. ${(c.rules.profitTarget - profitPct).toFixed(2)}% to go!`,
        timestamp: now, read: false, icon: Trophy,
        actionLabel: "View Challenge", actionHref: "/prop-tracker",
      });
    }

    if (drawdownPct >= c.rules.maxDrawdown * 0.7) {
      alerts.push({
        id: `prop-dd-${c.id}`, type: "warning", category: "prop",
        title: `${c.firmName} — Drawdown Warning`,
        message: `Current drawdown is ${drawdownPct.toFixed(2)}% (limit: ${c.rules.maxDrawdown}%). Trade carefully.`,
        timestamp: now, read: false, icon: AlertTriangle,
        actionLabel: "View Challenge", actionHref: "/prop-tracker",
      });
    }

    if (daysLeft !== null && daysLeft <= 5 && daysLeft > 0) {
      alerts.push({
        id: `prop-time-${c.id}`, type: "warning", category: "prop",
        title: `${c.firmName} — ${daysLeft} Days Left`,
        message: `Only ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining in your ${c.phase} challenge.`,
        timestamp: now, read: false, icon: Clock,
      });
    }
  }

  // Performance insights
  const lastWeekTrades = trades.filter((t) => {
    try { return new Date(t.entryDate) >= subDays(now, 7); } catch { return false; }
  });
  const weekWinRate = lastWeekTrades.length > 0
    ? (lastWeekTrades.filter((t) => t.result === "win").length / lastWeekTrades.length) * 100 : 0;

  if (lastWeekTrades.length >= 5 && weekWinRate >= 70) {
    alerts.push({
      id: "hot-streak", type: "success", category: "performance",
      title: "You're on Fire! 🔥",
      message: `${weekWinRate.toFixed(0)}% win rate over ${lastWeekTrades.length} trades this week. Keep up the consistency!`,
      timestamp: now, read: false, icon: Zap,
    });
  }

  if (lastWeekTrades.length >= 5 && weekWinRate < 40) {
    alerts.push({
      id: "cold-streak", type: "warning", category: "performance",
      title: "Performance Review Needed",
      message: `Only ${weekWinRate.toFixed(0)}% win rate this week. Review your playbook and identify what's changed.`,
      timestamp: now, read: false, icon: Target,
      actionLabel: "View Analytics", actionHref: "/analytics",
    });
  }

  // System alerts
  alerts.push({
    id: "system-welcome", type: "info", category: "system",
    title: "EDGEVAULT Trading OS",
    message: "All modules operational. Firebase sync ready to configure. AI analysis engine running in mock mode.",
    timestamp: subDays(now, 1), read: true, icon: Bell,
    actionLabel: "Settings", actionHref: "/settings",
  });

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

const typeStyles: Record<AlertType, { bg: string; border: string; icon: string }> = {
  danger: { bg: "bg-accent-coral/5", border: "border-accent-coral/20", icon: "text-accent-coral" },
  warning: { bg: "bg-yellow-500/5", border: "border-yellow-500/20", icon: "text-yellow-500" },
  info: { bg: "bg-accent-violet/5", border: "border-accent-violet/20", icon: "text-accent-violet" },
  success: { bg: "bg-accent-green/5", border: "border-accent-green/20", icon: "text-accent-green" },
};

export default function AlertsPage() {
  const { trades } = useTradeStore();
  const { challenges } = usePropFirmStore();
  const { settings, updateSettings } = useSettingsStore();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"active" | "history">("active");

  const allAlerts = useMemo(() => generateAlerts(trades, challenges), [trades, challenges]);

  // Active alerts (not dismissed)
  const activeAlerts = useMemo(() => {
    return allAlerts.filter((a) => {
      if (dismissedIds.includes(a.id)) return false;
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (readFilter === "unread" && a.read) return false;
      return true;
    });
  }, [allAlerts, dismissedIds, categoryFilter, readFilter]);

  // Dismissed alerts (History)
  const dismissedAlerts = useMemo(() => {
    return allAlerts.filter((a) => dismissedIds.includes(a.id));
  }, [allAlerts, dismissedIds]);

  const unreadCount = allAlerts.filter((a) => !a.read && !dismissedIds.includes(a.id)).length;

  const formatAlertTime = (d: Date) => {
    if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
    if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
    return format(d, "MMM d, h:mm a");
  };

  // Smart alert toggles local state
  const [smartToggles, setSmartToggles] = useState({
    telegram: true,
    browser: false,
    drawdownWarning: true,
    lossBreaker: true,
    dailyAiReport: true,
    smsAlerts: false
  });

  const toggleSmartTrigger = (key: keyof typeof smartToggles) => {
    setSmartToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl text-text-primary">
            Smart Alerts & Risk Compliance
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {unreadCount > 0 ? `${unreadCount} unread active risk alert${unreadCount !== 1 ? "s" : ""}` : "All active conditions compliant"}
          </p>
        </div>
        {dismissedIds.length > 0 && (
          <button 
            onClick={() => setDismissedIds([])} 
            className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-border-subtle hover:bg-white/[0.05] text-xs font-semibold text-text-secondary transition-all active:scale-95"
          >
            Restore History
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2/3 Side: Active Alerts feed & History */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Sub tabs for Active Feed vs History */}
          <div className="flex gap-4 border-b border-border-subtle/30 pb-2">
            <button
              onClick={() => setActiveSubTab("active")}
              className={cn(
                "pb-2 text-sm font-semibold border-b-2 transition-all relative active:scale-98",
                activeSubTab === "active" ? "border-accent-green text-accent-green" : "border-transparent text-text-muted hover:text-text-secondary"
              )}
            >
              Active Triggers ({activeAlerts.length})
              {activeSubTab === "active" && (
                <motion.div layoutId="activeAlertSubTab" className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-accent-green" />
              )}
            </button>

            <button
              onClick={() => setActiveSubTab("history")}
              className={cn(
                "pb-2 text-sm font-semibold border-b-2 transition-all relative active:scale-98",
                activeSubTab === "history" ? "border-accent-green text-accent-green" : "border-transparent text-text-muted hover:text-text-secondary"
              )}
            >
              Alert History ({dismissedAlerts.length})
              {activeSubTab === "history" && (
                <motion.div layoutId="activeAlertSubTab" className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-accent-green" />
              )}
            </button>
          </div>

          {activeSubTab === "active" ? (
            <div className="space-y-4">
              
              {/* Category Filters for active */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "All Types" },
                  { id: "risk", label: "Risk Limits", icon: Shield },
                  { id: "prop", label: "Prop Challenges", icon: Trophy },
                  { id: "performance", label: "Performance", icon: Zap },
                  { id: "system", label: "System Alerts", icon: Bell },
                ].map((f) => (
                  <button key={f.id} onClick={() => setCategoryFilter(f.id)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      categoryFilter === f.id ? "bg-accent-green/10 text-accent-green border border-accent-green/20" : "bg-bg-card text-text-muted border border-border-subtle hover:bg-white/[0.02]")}>
                    {f.icon && <f.icon size={11} />}
                    {f.label}
                  </button>
                ))}
                
                <div className="ml-auto">
                  <button onClick={() => setReadFilter(readFilter === "all" ? "unread" : "all")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      readFilter === "unread" ? "bg-accent-violet/10 text-accent-violet border border-accent-violet/20 animate-pulse" : "bg-bg-card text-text-muted border border-border-subtle")}>
                    <BellOff size={11} /> {readFilter === "unread" ? "Unread Only" : "All Messages"}
                  </button>
                </div>
              </div>

              {/* Alert List */}
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {activeAlerts.map((alert, i) => {
                    const style = typeStyles[alert.type];
                    return (
                      <motion.div key={alert.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                        className={cn("p-4 rounded-xl border transition-all relative group", 
                          style.bg, style.border, 
                          !alert.read && "ring-1 ring-offset-0", 
                          !alert.read && alert.type === "danger" && "ring-accent-coral/30", 
                          !alert.read && alert.type === "success" && "ring-accent-green/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border", style.bg, style.border)}>
                            <alert.icon size={18} className={style.icon} />
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold text-text-primary">{alert.title}</h3>
                              <span className="text-[9px] text-text-muted font-[family-name:var(--font-space-mono)] whitespace-nowrap">{formatAlertTime(alert.timestamp)}</span>
                            </div>
                            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{alert.message}</p>
                            
                            <div className="flex items-center gap-3 mt-3">
                              {alert.actionLabel && alert.actionHref && (
                                <a href={alert.actionHref} className={cn("text-xs font-bold hover:underline flex items-center gap-0.5", style.icon)}>
                                  {alert.actionLabel} →
                                </a>
                              )}
                              <button onClick={() => setDismissedIds([...dismissedIds, alert.id])}
                                className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                                Archive
                              </button>
                            </div>
                          </div>

                          {!alert.read && (
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-2 absolute right-4 top-4 animate-ping",
                              alert.type === "danger" ? "bg-accent-coral" : alert.type === "success" ? "bg-accent-green" : "bg-accent-violet")} />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {activeAlerts.length === 0 && (
                  <GlassCard className="text-center py-16">
                    <CheckCircle size={40} className="mx-auto text-accent-green mb-3 opacity-30" />
                    <p className="text-sm font-bold text-text-secondary">All clear. Excellent discipline!</p>
                    <p className="text-xs text-text-muted mt-1">No active risk limits or challenges triggered.</p>
                  </GlassCard>
                )}
              </div>

            </div>
          ) : (
            // History tab content
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {dismissedAlerts.map((alert) => {
                  const style = typeStyles[alert.type];
                  return (
                    <motion.div key={alert.id}
                      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                      className={cn("p-4 rounded-xl border opacity-60 bg-white/[0.01] border-border-subtle flex items-center justify-between gap-4")}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-border-subtle/50 flex items-center justify-center flex-shrink-0 text-text-muted">
                          <alert.icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-text-primary truncate">{alert.title}</h4>
                          <span className="text-[8px] text-text-muted font-[family-name:var(--font-space-mono)]">{formatAlertTime(alert.timestamp)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setDismissedIds(prev => prev.filter(id => id !== alert.id))}
                        className="text-[10px] font-bold text-accent-violet hover:underline flex-shrink-0"
                      >
                        Restore
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {dismissedAlerts.length === 0 && (
                <div className="text-center py-16 text-text-muted">
                  <Clock size={32} className="mx-auto opacity-15 mb-2" />
                  <p className="text-xs font-semibold">No alert history available</p>
                  <p className="text-[10px] mt-0.5">Archived alert logs will be retained here.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right 1/3 Side: Smart Trigger toggles */}
        <div className="xl:col-span-1 space-y-6">
          
          <div className="flex items-center justify-between px-1">
            <span className="font-[family-name:var(--font-syne)] font-bold text-xs uppercase tracking-wider text-text-muted">Smart Rules & Sync</span>
            <Sliders size={14} className="text-text-muted" />
          </div>

          <div className="space-y-4">
            
            {/* Telegram Channel Toggle Card */}
            <GlassCard className="p-4 border-border-subtle/70 hover:border-accent-violet/20 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0088cc]/10 flex items-center justify-center border border-[#0088cc]/20">
                    <Send size={18} className="text-[#0088cc]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Telegram Sync Alerts</h4>
                    <p className="text-[9px] text-text-muted mt-0.5">Stream violations to private chat</p>
                  </div>
                </div>

                <button onClick={() => toggleSmartTrigger("telegram")} className="text-text-secondary active:scale-90 transition-all">
                  {smartToggles.telegram ? (
                    <ToggleRight size={32} className="text-accent-green" />
                  ) : (
                    <ToggleLeft size={32} className="text-text-muted" />
                  )}
                </button>
              </div>
            </GlassCard>

            {/* SMS/Twilio alerts */}
            <GlassCard className="p-4 border-border-subtle/70 hover:border-accent-violet/20 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-coral/10 flex items-center justify-center border border-accent-coral/20">
                    <Smartphone size={18} className="text-accent-coral" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">SMS Emergency Alerts</h4>
                    <p className="text-[9px] text-text-muted mt-0.5">SMS text on critical 5% drawdown</p>
                  </div>
                </div>

                <button onClick={() => toggleSmartTrigger("smsAlerts")} className="text-text-secondary active:scale-90 transition-all">
                  {smartToggles.smsAlerts ? (
                    <ToggleRight size={32} className="text-accent-green" />
                  ) : (
                    <ToggleLeft size={32} className="text-text-muted" />
                  )}
                </button>
              </div>
            </GlassCard>

            {/* Email reports */}
            <GlassCard className="p-4 border-border-subtle/70 hover:border-accent-violet/20 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-violet/10 flex items-center justify-center border border-accent-violet/20">
                    <Mail size={18} className="text-accent-violet" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Daily AI Coaching Digest</h4>
                    <p className="text-[9px] text-text-muted mt-0.5">Email containing discipline score</p>
                  </div>
                </div>

                <button onClick={() => toggleSmartTrigger("dailyAiReport")} className="text-text-secondary active:scale-90 transition-all">
                  {smartToggles.dailyAiReport ? (
                    <ToggleRight size={32} className="text-accent-green" />
                  ) : (
                    <ToggleLeft size={32} className="text-text-muted" />
                  )}
                </button>
              </div>
            </GlassCard>

            {/* Prop Drawdown alert */}
            <GlassCard className="p-4 border-border-subtle/70 hover:border-accent-violet/20 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                    <Trophy size={18} className="text-yellow-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Critical Drawdown Warnings</h4>
                    <p className="text-[9px] text-text-muted mt-0.5">Alert at 70% threshold of rules</p>
                  </div>
                </div>

                <button onClick={() => toggleSmartTrigger("drawdownWarning")} className="text-text-secondary active:scale-90 transition-all">
                  {smartToggles.drawdownWarning ? (
                    <ToggleRight size={32} className="text-accent-green" />
                  ) : (
                    <ToggleLeft size={32} className="text-text-muted" />
                  )}
                </button>
              </div>
            </GlassCard>

            {/* Cooldown Lock trigger */}
            <GlassCard className="p-4 border-border-subtle/70 hover:border-accent-violet/20 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-green/10 flex items-center justify-center border border-accent-green/20">
                    <Shield size={18} className="text-accent-green" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Daily Loss Cooldown lock</h4>
                    <p className="text-[9px] text-text-muted mt-0.5">Lock platform on daily limit hits</p>
                  </div>
                </div>

                <button onClick={() => toggleSmartTrigger("lossBreaker")} className="text-text-secondary active:scale-90 transition-all">
                  {smartToggles.lossBreaker ? (
                    <ToggleRight size={32} className="text-accent-green" />
                  ) : (
                    <ToggleLeft size={32} className="text-text-muted" />
                  )}
                </button>
              </div>
            </GlassCard>

          </div>

        </div>

      </div>

    </div>
  );
}
