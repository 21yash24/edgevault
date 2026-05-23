"use client";
import { useTradeStore, usePropFirmStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import {
  Bell, AlertTriangle, CheckCircle, XCircle, Shield, TrendingDown,
  Trophy, Clock, Flame, DollarSign, Target, Zap, ChevronDown, BellOff,
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [dismissed, setDismissed] = useState<string[]>([]);

  const allAlerts = useMemo(() => generateAlerts(trades, challenges), [trades, challenges]);
  const alerts = allAlerts.filter((a) => {
    if (dismissed.includes(a.id)) return false;
    if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
    if (readFilter === "unread" && a.read) return false;
    return true;
  });

  const unreadCount = allAlerts.filter((a) => !a.read && !dismissed.includes(a.id)).length;

  const formatAlertTime = (d: Date) => {
    if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
    if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
    return format(d, "MMM d, h:mm a");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl">Alerts</h1>
          <p className="text-sm text-text-secondary mt-1">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {dismissed.length > 0 && (
          <button onClick={() => setDismissed([])} className="text-xs text-accent-violet hover:underline">
            Restore dismissed
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "All" },
          { id: "risk", label: "Risk", icon: Shield },
          { id: "prop", label: "Prop Firm", icon: Trophy },
          { id: "performance", label: "Performance", icon: Zap },
          { id: "system", label: "System", icon: Bell },
        ].map((f) => (
          <button key={f.id} onClick={() => setCategoryFilter(f.id)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              categoryFilter === f.id ? "bg-accent-green/10 text-accent-green border border-accent-green/20" : "bg-bg-card text-text-muted border border-border-subtle")}>
            {f.icon && <f.icon size={12} />}
            {f.label}
          </button>
        ))}
        <div className="ml-auto">
          <button onClick={() => setReadFilter(readFilter === "all" ? "unread" : "all")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              readFilter === "unread" ? "bg-accent-violet/10 text-accent-violet border border-accent-violet/20" : "bg-bg-card text-text-muted border border-border-subtle")}>
            <BellOff size={12} /> {readFilter === "unread" ? "Unread only" : "All alerts"}
          </button>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        <AnimatePresence>
          {alerts.map((alert, i) => {
            const style = typeStyles[alert.type];
            return (
              <motion.div key={alert.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className={cn("p-4 rounded-xl border transition-all", style.bg, style.border, !alert.read && "ring-1 ring-offset-0", !alert.read && alert.type === "danger" && "ring-accent-coral/30", !alert.read && alert.type === "success" && "ring-accent-green/30")}>
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", style.bg)}>
                    <alert.icon size={18} className={style.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium">{alert.title}</h3>
                      <span className="text-[10px] text-text-muted whitespace-nowrap">{formatAlertTime(alert.timestamp)}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2.5">
                      {alert.actionLabel && alert.actionHref && (
                        <a href={alert.actionHref}
                          className={cn("text-xs font-medium hover:underline", style.icon)}>
                          {alert.actionLabel} →
                        </a>
                      )}
                      <button onClick={() => setDismissed([...dismissed, alert.id])}
                        className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                        Dismiss
                      </button>
                    </div>
                  </div>
                  {!alert.read && (
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-2",
                      alert.type === "danger" ? "bg-accent-coral" : alert.type === "success" ? "bg-accent-green" : "bg-accent-violet")} />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {alerts.length === 0 && (
        <GlassCard className="text-center py-12">
          <CheckCircle size={40} className="mx-auto text-accent-green mb-3 opacity-40" />
          <p className="text-sm text-text-muted">No alerts to show</p>
          <p className="text-xs text-text-muted mt-1">You&apos;re all caught up!</p>
        </GlassCard>
      )}
    </div>
  );
}
