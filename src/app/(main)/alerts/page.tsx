"use client";

import { useTradeStore, usePropFirmStore, useSettingsStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import {
  Bell, AlertTriangle, CheckCircle, Shield, TrendingDown,
  Trophy, Clock, Flame, DollarSign, Target, Zap, BellOff,
  ToggleLeft, ToggleRight, Sliders, Smartphone, Send, Mail, Plus, Trash2, Save
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

interface CustomRule {
  id: string;
  name: string;
  metric: "daily_loss" | "loss_streak" | "win_rate_7d" | "max_trades_day" | "daily_profit";
  condition: "below" | "above";
  threshold: number;
  enabled: boolean;
  severity: "warning" | "danger" | "success";
}

const METRIC_LABELS: Record<CustomRule["metric"], { label: string; unit: string; icon: React.ElementType; color: string }> = {
  daily_loss: { label: "Daily Loss", unit: "$", icon: DollarSign, color: "text-accent-coral" },
  loss_streak: { label: "Loss Streak", unit: " trades", icon: Flame, color: "text-orange-400" },
  win_rate_7d: { label: "7-Day Win Rate", unit: "%", icon: Target, color: "text-accent-violet" },
  max_trades_day: { label: "Trades Per Day", unit: " trades", icon: Zap, color: "text-accent-blue" },
  daily_profit: { label: "Daily Profit", unit: "$", icon: Trophy, color: "text-accent-green" },
};

function generateAlerts(
  trades: ReturnType<typeof useTradeStore.getState>["trades"],
  challenges: ReturnType<typeof usePropFirmStore.getState>["challenges"],
  customRules: CustomRule[]
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  let consecutiveLosses = 0;
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].result === "loss") consecutiveLosses++;
    else break;
  }
  if (consecutiveLosses >= 3) {
    alerts.push({
      id: "loss-streak", type: "danger", category: "risk",
      title: `${consecutiveLosses} Consecutive Losses`,
      message: `You're on a ${consecutiveLosses}-loss streak. Consider taking a break before placing the next trade.`,
      timestamp: new Date(trades[trades.length - 1]?.exitDate || now), read: false, icon: Flame,
      actionLabel: "View Journal", actionHref: "/journal",
    });
  }

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

  for (const c of challenges) {
    const profitPct = (c.currentPnl / c.accountSize) * 100;
    const drawdownPct = ((c.highWaterMark - c.currentBalance) / c.accountSize) * 100;
    const daysUsed = differenceInDays(now, new Date(c.startDate));
    const daysLeft = c.rules.maxDuration > 0 ? c.rules.maxDuration - daysUsed : null;

    if (profitPct >= c.rules.profitTarget * 0.8 && profitPct < c.rules.profitTarget) {
      alerts.push({
        id: `prop-close-${c.id}`, type: "success", category: "prop",
        title: `${c.firmName} — Near Profit Target!`,
        message: `${profitPct.toFixed(2)}% of ${c.rules.profitTarget}% target reached.`,
        timestamp: now, read: false, icon: Trophy,
        actionLabel: "View Challenge", actionHref: "/prop-tracker",
      });
    }

    if (drawdownPct >= c.rules.maxDrawdown * 0.7) {
      alerts.push({
        id: `prop-dd-${c.id}`, type: "warning", category: "prop",
        title: `${c.firmName} — Drawdown Warning`,
        message: `Current drawdown is ${drawdownPct.toFixed(2)}% (limit: ${c.rules.maxDrawdown}%).`,
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

  const lastWeekTrades = trades.filter((t) => {
    try { return new Date(t.entryDate) >= subDays(now, 7); } catch { return false; }
  });
  const weekWinRate = lastWeekTrades.length > 0
    ? (lastWeekTrades.filter((t) => t.result === "win").length / lastWeekTrades.length) * 100 : 0;

  if (lastWeekTrades.length >= 5 && weekWinRate >= 70) {
    alerts.push({
      id: "hot-streak", type: "success", category: "performance",
      title: "You're on Fire! 🔥",
      message: `${weekWinRate.toFixed(0)}% win rate over ${lastWeekTrades.length} trades this week.`,
      timestamp: now, read: false, icon: Zap,
    });
  }

  if (lastWeekTrades.length >= 5 && weekWinRate < 40) {
    alerts.push({
      id: "cold-streak", type: "warning", category: "performance",
      title: "Performance Review Needed",
      message: `Only ${weekWinRate.toFixed(0)}% win rate this week. Review your playbook.`,
      timestamp: now, read: false, icon: Target,
      actionLabel: "View Analytics", actionHref: "/analytics",
    });
  }

  // Custom rules
  for (const rule of customRules.filter(r => r.enabled)) {
    let value = 0;
    let triggered = false;

    if (rule.metric === "daily_loss") {
      value = todayPnl;
      triggered = rule.condition === "below" ? value < -rule.threshold : value > rule.threshold;
    } else if (rule.metric === "daily_profit") {
      value = todayPnl;
      triggered = rule.condition === "above" ? value > rule.threshold : value < rule.threshold;
    } else if (rule.metric === "loss_streak") {
      value = consecutiveLosses;
      triggered = rule.condition === "above" ? value >= rule.threshold : value <= rule.threshold;
    } else if (rule.metric === "win_rate_7d") {
      value = weekWinRate;
      triggered = rule.condition === "below" ? value < rule.threshold : value > rule.threshold;
    } else if (rule.metric === "max_trades_day") {
      value = todayTrades.length;
      triggered = rule.condition === "above" ? value >= rule.threshold : value <= rule.threshold;
    }

    if (triggered) {
      const meta = METRIC_LABELS[rule.metric];
      alerts.push({
        id: `custom-${rule.id}`,
        type: rule.severity,
        category: "risk",
        title: `Rule Triggered: ${rule.name}`,
        message: `${meta.label} hit ${value.toFixed(rule.metric === "win_rate_7d" ? 1 : 0)}${meta.unit}. Your threshold is ${rule.condition} ${rule.threshold}${meta.unit}.`,
        timestamp: now, read: false,
        icon: meta.icon,
      });
    }
  }

  alerts.push({
    id: "system-welcome", type: "info", category: "system",
    title: "EDGEVAULT Trading OS",
    message: "All modules operational. Firebase sync ready to configure.",
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

const DEFAULT_RULES: CustomRule[] = [
  { id: "r1", name: "Daily Loss Cap", metric: "daily_loss", condition: "below", threshold: 500, enabled: true, severity: "danger" },
  { id: "r2", name: "Loss Streak Guard", metric: "loss_streak", condition: "above", threshold: 3, enabled: true, severity: "warning" },
  { id: "r3", name: "Win Rate Floor", metric: "win_rate_7d", condition: "below", threshold: 40, enabled: false, severity: "warning" },
  { id: "r4", name: "Overtrading Alert", metric: "max_trades_day", condition: "above", threshold: 6, enabled: false, severity: "warning" },
];

export default function AlertsPage() {
  const { trades } = useTradeStore();
  const { challenges } = usePropFirmStore();
  const { settings } = useSettingsStore();

  const [notifiedAlertIds, setNotifiedAlertIds] = useState<Set<string>>(new Set());

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"active" | "history">("active");

  const [customRules, setCustomRules] = useState<CustomRule[]>(DEFAULT_RULES);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState<Omit<CustomRule, "id">>({
    name: "", metric: "daily_loss", condition: "below", threshold: 300, enabled: true, severity: "danger"
  });

  const allAlerts = useMemo(() => generateAlerts(trades, challenges, customRules), [trades, challenges, customRules]);

  const activeAlerts = useMemo(() => allAlerts.filter((a) => {
    if (dismissedIds.includes(a.id)) return false;
    if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
    if (readFilter === "unread" && a.read) return false;
    return true;
  }), [allAlerts, dismissedIds, categoryFilter, readFilter]);

  const dismissedAlerts = useMemo(() => allAlerts.filter((a) => dismissedIds.includes(a.id)), [allAlerts, dismissedIds]);
  const unreadCount = allAlerts.filter((a) => !a.read && !dismissedIds.includes(a.id)).length;

  const formatAlertTime = (d: Date) => {
    if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
    if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
    return format(d, "MMM d, h:mm a");
  };

  const [channels, setChannels] = useState({
    telegram: true, smsAlerts: false, dailyAiReport: true, drawdownWarning: true, lossBreaker: true,
  });
  const toggleChannel = (k: keyof typeof channels) => setChannels(p => ({ ...p, [k]: !p[k] }));

  const addCustomRule = () => {
    if (!newRule.name.trim()) return;
    setCustomRules(prev => [...prev, { ...newRule, id: `r-${Date.now()}` }]);
    setShowAddRule(false);
    setNewRule({ name: "", metric: "daily_loss", condition: "below", threshold: 300, enabled: true, severity: "danger" });
  };

  const deleteRule = (id: string) => setCustomRules(prev => prev.filter(r => r.id !== id));
  const toggleRule = (id: string) => setCustomRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  // Trigger Telegram alerts for new "danger" or "warning" items
  useEffect(() => {
    if (!channels.telegram || !settings.api.telegramToken || !settings.api.telegramChatId) return;

    const newHighSeverityAlerts = activeAlerts.filter(
      (a) => (a.type === "danger" || a.type === "warning") && !notifiedAlertIds.has(a.id)
    );

    if (newHighSeverityAlerts.length > 0) {
      newHighSeverityAlerts.forEach(async (alert) => {
        const icon = alert.type === "danger" ? "🚨" : "⚠️";
        const message = `${icon} *EDGEVAULT ALERT* ${icon}\n\n*${alert.title}*\n${alert.message}`;
        
        try {
          await fetch("/api/telegram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: settings.api.telegramToken,
              chatId: settings.api.telegramChatId,
              message,
            }),
          });
        } catch (err) {
          console.error("Failed to send telegram alert:", err);
        }
      });

      setNotifiedAlertIds((prev) => {
        const next = new Set(prev);
        newHighSeverityAlerts.forEach((a) => next.add(a.id));
        return next;
      });
    }
  }, [activeAlerts, channels.telegram, settings.api, notifiedAlertIds]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-inter)] font-black text-2xl text-text-primary">
            Smart Alerts &amp; Risk Compliance
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {unreadCount > 0 ? `${unreadCount} unread active alert${unreadCount !== 1 ? "s" : ""}` : "All active conditions compliant"}
          </p>
        </div>
        {dismissedIds.length > 0 && (
          <button onClick={() => setDismissedIds([])}
            className="px-3 py-1.5 rounded-lg bg-bg-card border border-border-subtle hover:border-accent-violet/30 text-xs font-semibold text-text-secondary transition-all">
            Restore History
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT: Alert Feed */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex gap-4 border-b border-border-subtle/30 pb-2">
            {(["active", "history"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveSubTab(tab)}
                className={cn("pb-2 text-sm font-semibold border-b-2 transition-all relative capitalize",
                  activeSubTab === tab ? "border-accent-green text-accent-green" : "border-transparent text-text-muted hover:text-text-secondary")}>
                {tab === "active" ? `Active Triggers (${activeAlerts.length})` : `Alert History (${dismissedAlerts.length})`}
                {activeSubTab === tab && <motion.div layoutId="alertTab" className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-accent-green" />}
              </button>
            ))}
          </div>

          {activeSubTab === "active" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "All Types" },
                  { id: "risk", label: "Risk Limits", icon: Shield },
                  { id: "prop", label: "Prop Challenges", icon: Trophy },
                  { id: "performance", label: "Performance", icon: Zap },
                  { id: "system", label: "System", icon: Bell },
                ].map((f) => (
                  <button key={f.id} onClick={() => setCategoryFilter(f.id)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      categoryFilter === f.id ? "bg-accent-green/10 text-accent-green border border-accent-green/20" : "bg-bg-card text-text-muted border border-border-subtle hover:border-accent-violet/20")}>
                    {f.icon && <f.icon size={11} />}
                    {f.label}
                  </button>
                ))}
                <div className="ml-auto">
                  <button onClick={() => setReadFilter(readFilter === "all" ? "unread" : "all")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      readFilter === "unread" ? "bg-accent-violet/10 text-accent-violet border border-accent-violet/20" : "bg-bg-card text-text-muted border border-border-subtle")}>
                    <BellOff size={11} /> {readFilter === "unread" ? "Unread Only" : "All"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {activeAlerts.map((alert) => {
                    const style = typeStyles[alert.type];
                    return (
                      <motion.div key={alert.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                        className={cn("p-4 rounded-xl border transition-all relative group", style.bg, style.border,
                          !alert.read && alert.type === "danger" && "ring-1 ring-accent-coral/30",
                          !alert.read && alert.type === "success" && "ring-1 ring-accent-green/30"
                        )}>
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
                                <a href={alert.actionHref} className={cn("text-xs font-bold hover:underline", style.icon)}>
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
                            <div className={cn("w-2 h-2 rounded-full absolute right-4 top-4 animate-ping",
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
                    <p className="text-xs text-text-muted mt-1">No active risk limits triggered.</p>
                  </GlassCard>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {dismissedAlerts.map((alert) => (
                  <motion.div key={alert.id}
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl border opacity-60 bg-bg-card border-border-subtle flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-bg-secondary/40 border border-border-subtle flex items-center justify-center text-text-muted">
                        <alert.icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-text-primary truncate">{alert.title}</h4>
                        <span className="text-[8px] text-text-muted font-[family-name:var(--font-space-mono)]">{formatAlertTime(alert.timestamp)}</span>
                      </div>
                    </div>
                    <button onClick={() => setDismissedIds(prev => prev.filter(id => id !== alert.id))}
                      className="text-[10px] font-bold text-accent-violet hover:underline">Restore</button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {dismissedAlerts.length === 0 && (
                <div className="text-center py-16 text-text-muted">
                  <Clock size={32} className="mx-auto opacity-15 mb-2" />
                  <p className="text-xs font-semibold">No archived alerts</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Rule Builder + Channels */}
        <div className="xl:col-span-1 space-y-6">

          {/* ─── Dynamic Rule Builder ─── */}
          <GlassCard className="border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Sliders size={13} className="text-accent-violet" />
                Custom Alert Rules
              </h3>
              <button
                onClick={() => setShowAddRule(!showAddRule)}
                className={cn("flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all",
                  showAddRule
                    ? "bg-accent-violet/10 border-accent-violet/30 text-accent-violet"
                    : "bg-bg-secondary/20 border-border-subtle text-text-muted hover:border-accent-violet/20 hover:text-accent-violet")}
              >
                <Plus size={12} /> New Rule
              </button>
            </div>

            <AnimatePresence>
              {showAddRule && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4">
                  <div className="bg-accent-violet/5 border border-accent-violet/15 rounded-xl p-3 space-y-2.5">
                    <input
                      type="text" value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))}
                      placeholder="Rule name (e.g. Overtrading limit)"
                      className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent-violet/40 transition-colors"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={newRule.metric} onChange={e => setNewRule(p => ({ ...p, metric: e.target.value as CustomRule["metric"] }))}
                        className="bg-bg-card border border-border-subtle rounded-lg px-2 py-2 text-xs focus:outline-none transition-colors">
                        {Object.entries(METRIC_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <select value={newRule.condition} onChange={e => setNewRule(p => ({ ...p, condition: e.target.value as CustomRule["condition"] }))}
                        className="bg-bg-card border border-border-subtle rounded-lg px-2 py-2 text-xs focus:outline-none transition-colors">
                        <option value="below">Falls Below</option>
                        <option value="above">Rises Above</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={newRule.threshold}
                        onChange={e => setNewRule(p => ({ ...p, threshold: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors"
                        placeholder="Threshold value" />
                      <select value={newRule.severity} onChange={e => setNewRule(p => ({ ...p, severity: e.target.value as CustomRule["severity"] }))}
                        className="bg-bg-card border border-border-subtle rounded-lg px-2 py-2 text-xs focus:outline-none transition-colors">
                        <option value="warning">⚠️ Warning</option>
                        <option value="danger">🔴 Danger</option>
                        <option value="success">✅ Success</option>
                      </select>
                    </div>
                    <button onClick={addCustomRule}
                      className="w-full bg-accent-violet text-white text-xs font-bold py-2 rounded-lg hover:bg-accent-violet/90 transition-colors flex items-center justify-center gap-1.5">
                      <Save size={12} /> Save Rule
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {customRules.map(rule => {
                const meta = METRIC_LABELS[rule.metric];
                return (
                  <div key={rule.id} className={cn("flex items-center gap-2 p-2.5 rounded-xl border transition-all",
                    rule.enabled ? "border-border-subtle bg-bg-card" : "border-border-subtle/40 bg-bg-secondary/20 opacity-50")}>
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                      rule.severity === "danger" ? "bg-accent-coral/10" : rule.severity === "warning" ? "bg-yellow-500/10" : "bg-accent-green/10")}>
                      <meta.icon size={13} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-text-primary truncate">{rule.name}</div>
                      <div className="text-[9px] text-text-muted">{meta.label} {rule.condition} {rule.threshold}{meta.unit}</div>
                    </div>
                    <button onClick={() => toggleRule(rule.id)} className="flex-shrink-0">
                      {rule.enabled
                        ? <ToggleRight size={22} className="text-accent-green" />
                        : <ToggleLeft size={22} className="text-text-muted" />}
                    </button>
                    <button onClick={() => deleteRule(rule.id)} className="flex-shrink-0 text-text-muted hover:text-accent-coral transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* ─── Notification Channels ─── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-bold text-xs uppercase tracking-wider text-text-muted">Delivery Channels</span>
            </div>
            {[
              { key: "telegram" as const, icon: Send, label: "Telegram Alerts", sub: "Stream violations to private chat", color: "text-[#0088cc]", bg: "bg-[#0088cc]/10", border: "border-[#0088cc]/20" },
              { key: "smsAlerts" as const, icon: Smartphone, label: "SMS Emergency", sub: "Text on critical 5% drawdown", color: "text-accent-coral", bg: "bg-accent-coral/10", border: "border-accent-coral/20" },
              { key: "dailyAiReport" as const, icon: Mail, label: "Daily AI Digest", sub: "Email your discipline score", color: "text-accent-violet", bg: "bg-accent-violet/10", border: "border-accent-violet/20" },
              { key: "drawdownWarning" as const, icon: Trophy, label: "Drawdown Warnings", sub: "Alert at 70% of your rules", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
              { key: "lossBreaker" as const, icon: Shield, label: "Daily Loss Lock", sub: "Lock platform on limit hits", color: "text-accent-green", bg: "bg-accent-green/10", border: "border-accent-green/20" },
            ].map(item => (
              <GlassCard key={item.key} className="p-4 hover:border-accent-violet/20 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", item.bg, item.border)}>
                      <item.icon size={18} className={item.color} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{item.label}</h4>
                      <p className="text-[9px] text-text-muted mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleChannel(item.key)} className="active:scale-90 transition-all">
                    {channels[item.key]
                      ? <ToggleRight size={32} className="text-accent-green" />
                      : <ToggleLeft size={32} className="text-text-muted" />}
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
