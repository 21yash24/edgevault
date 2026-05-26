"use client";

import { useState, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  Bell, BellOff, ShieldAlert, Trophy, Zap, Info, Check, 
  Trash2, RotateCcw, AlertTriangle, ArrowRight, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NotificationItem {
  id: string;
  category: "violation" | "prop" | "insight" | "system";
  severity: "danger" | "warning" | "success" | "info";
  title: string;
  description: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  actionHref?: string;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    category: "violation",
    severity: "danger",
    title: "Daily Loss Limit Violation Triggered",
    description: "Your session losses on NQ hit -$540, exceeding your pre-set limit of -$500. Trading has been disabled for the next 2 hours in according with your discipline cooldown settings.",
    time: "10m ago",
    read: false,
    actionLabel: "View Risk Rules",
    actionHref: "/risk"
  },
  {
    id: "notif-2",
    category: "prop",
    severity: "success",
    title: "Apex Futures Challenge - Target Approaching!",
    description: "Congratulations! You have completed 82% of your profit target ($2,460 of $3,000) on your $50K Apex Futures account. Maximum drawdown is healthy at 1.4%.",
    time: "45m ago",
    read: false,
    actionLabel: "Track Progress",
    actionHref: "/prop-tracker"
  },
  {
    id: "notif-3",
    category: "insight",
    severity: "warning",
    title: "Unusual Psychological Friction Detected",
    description: "You self-reported a highly 'fearful' emotional state on your last three trades, which directly correlated with early exits and a loss of -$240 in captured R-multiple.",
    time: "2h ago",
    read: false,
    actionLabel: "Talk to AI Coach",
    actionHref: "/ai-coach"
  },
  {
    id: "notif-4",
    category: "prop",
    severity: "warning",
    title: "Apex Drawdown Danger Level",
    description: "Your live trailing drawdown is currently at 4.2%, which is 70% of the maximum allowed limit of 6.0% for your funded account. De-leverage immediately.",
    time: "5h ago",
    read: true,
    actionLabel: "Review Rules",
    actionHref: "/prop-tracker"
  },
  {
    id: "notif-5",
    category: "system",
    severity: "info",
    title: "EdgeVault OS Updated to Version 2.5",
    description: "We've deployed massive upgrades: AI Coach macro chat engine, Economic Calendar news filters, community Trader Arena rankings, and playbook imports are now live.",
    time: "1d ago",
    read: true
  },
  {
    id: "notif-6",
    category: "insight",
    severity: "success",
    title: "Win Streak Achievement unlocked! 🔥",
    description: "You've executed 5 consecutive winning trades on the NQ 'IFVG Re-entry' setup without violating any risk parameters. Your consistency factor is outstanding.",
    time: "1d ago",
    read: true,
    actionLabel: "View Playbook",
    actionHref: "/playbook"
  },
  {
    id: "notif-7",
    category: "violation",
    severity: "warning",
    title: "Contract Size Warning",
    description: "You entered a long trade on ES with 4 contracts, exceeding your optimal risk-managed contract size of 2 contracts. Risk per trade spike hit 2.1%.",
    time: "2d ago",
    read: true,
    actionLabel: "Adjust Settings",
    actionHref: "/settings"
  },
  {
    id: "notif-8",
    category: "system",
    severity: "success",
    title: "Firebase Cloud Sync Status Operational",
    description: "Your local journal and playbook databases have successfully synchronized with EdgeVault Cloud Services. Your configurations are secured globally.",
    time: "3d ago",
    read: true
  },
  {
    id: "notif-9",
    category: "insight",
    severity: "info",
    title: "Weekly Performance Digest Ready",
    description: "Weekly metrics: $1,420 net P&L, 62% win rate, 2.45 profit factor. Your NY AM session setups returned the highest average expectancy of +1.8R.",
    time: "4d ago",
    read: true,
    actionLabel: "View Analytics",
    actionHref: "/analytics"
  },
  {
    id: "notif-10",
    category: "violation",
    severity: "danger",
    title: "Broke Checklist Rules Before Entry",
    description: "You executed a short entry on NQ without checking off the 'Displacement & IFVG Formed' criteria, resulting in a pre-flight compliance bypass.",
    time: "5d ago",
    read: true,
    actionLabel: "Resolve Violation",
    actionHref: "/risk"
  }
];

const categoryIcons = {
  violation: ShieldAlert,
  prop: Trophy,
  insight: Zap,
  system: Info
};

const severityStyles = {
  danger: { bg: "bg-accent-coral/5", border: "border-accent-coral/20 hover:border-accent-coral/40 shadow-[0_0_15px_rgba(255,45,85,0.02)]", icon: "text-accent-coral", dot: "bg-accent-coral" },
  warning: { bg: "bg-yellow-500/5", border: "border-yellow-500/20 hover:border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.02)]", icon: "text-yellow-500", dot: "bg-yellow-500" },
  success: { bg: "bg-accent-green/5", border: "border-accent-green/20 hover:border-accent-green/40 shadow-[0_0_15px_rgba(0,255,178,0.02)]", icon: "text-accent-green", dot: "bg-accent-green" },
  info: { bg: "bg-accent-violet/5", border: "border-accent-violet/20 hover:border-accent-violet/40 shadow-[0_0_15px_rgba(143,0,255,0.02)]", icon: "text-accent-violet", dot: "bg-accent-violet" }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<"all" | "violation" | "prop" | "insight" | "system">("all");
  const [dismissed, setDismissed] = useState<NotificationItem[]>([]);

  const filteredNotifs = useMemo(() => {
    return notifications.filter(n => activeTab === "all" || n.category === activeTab);
  }, [notifications, activeTab]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setDismissed(prev => [...prev, ...notifications]);
    setNotifications([]);
  };

  const handleDismiss = (id: string) => {
    const itemToDismiss = notifications.find(n => n.id === id);
    if (itemToDismiss) {
      setDismissed(prev => [...prev, itemToDismiss]);
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleRestore = () => {
    setNotifications(prev => [...prev, ...dismissed].sort((a, b) => {
      // Keep initial mock order
      const aIdx = initialNotifications.findIndex(x => x.id === a.id);
      const bIdx = initialNotifications.findIndex(x => x.id === b.id);
      return aIdx - bIdx;
    }));
    setDismissed([]);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-inter)] font-bold text-2xl text-text-primary flex items-center gap-2">
            Notification Center <Bell size={22} className="text-accent-green" />
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread system and risk alerts` : "No new notifications"}
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          {dismissed.length > 0 && (
            <button
              onClick={handleRestore}
              className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-border-subtle hover:bg-white/[0.05] text-xs font-semibold text-text-secondary flex items-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw size={13} /> Restore Dismissed
            </button>
          )}

          {notifications.length > 0 && (
            <>
              <button
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 rounded-xl bg-white/[0.02] border border-border-subtle hover:bg-accent-green/10 hover:border-accent-green/30 hover:text-accent-green text-xs font-semibold text-text-secondary flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Check size={13} /> Mark All Read
              </button>
              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 rounded-xl bg-accent-coral/10 border border-accent-coral/25 text-accent-coral hover:bg-accent-coral/15 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Trash2 size={13} /> Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border-subtle/30 pb-3">
        {[
          { id: "all", label: "All Alerts", icon: Bell },
          { id: "violation", label: "Rule Violations", icon: ShieldAlert, count: notifications.filter(n => n.category === "violation").length },
          { id: "prop", label: "Prop Challenges", icon: Trophy, count: notifications.filter(n => n.category === "prop").length },
          { id: "insight", label: "Performance Insights", icon: Zap, count: notifications.filter(n => n.category === "insight").length },
          { id: "system", label: "System Status", icon: Info, count: notifications.filter(n => n.category === "system").length }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95",
                isActive 
                  ? "bg-accent-green/10 text-accent-green border-accent-green/30 shadow-[0_0_15px_rgba(0,255,178,0.05)]" 
                  : "bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary hover:bg-white/[0.03]"
              )}
            >
              <tab.icon size={13} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[9px] font-bold font-[family-name:var(--font-space-mono)]",
                  isActive ? "bg-accent-green text-bg-base" : "bg-white/[0.05] text-text-secondary"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3.5">
        <AnimatePresence initial={false}>
          {filteredNotifs.map((notif) => {
            const style = severityStyles[notif.severity];
            const Icon = categoryIcons[notif.category];

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                <GlassCard className={cn(
                  "p-4 border transition-all relative",
                  style.bg,
                  style.border
                )}>
                  
                  {/* Left Edge color block */}
                  <div className={cn(
                    "absolute left-0 top-4 bottom-4 w-1 rounded-r",
                    style.dot
                  )} />

                  <div className="flex items-start gap-4">
                    
                    {/* Glowing circular icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 relative shadow-inner",
                      style.bg,
                      style.border
                    )}>
                      <Icon size={18} className={style.icon} />
                      {!notif.read && (
                        <span className={cn(
                          "absolute top-[-2px] right-[-2px] w-2.5 h-2.5 rounded-full border border-bg-base animate-pulse",
                          style.dot
                        )} />
                      )}
                    </div>

                    {/* Middle Text details */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h3 className={cn(
                          "text-sm font-semibold text-text-primary flex items-center gap-2",
                          !notif.read && "font-extrabold"
                        )}>
                          {notif.title}
                        </h3>
                        <span className="text-[10px] text-text-muted font-[family-name:var(--font-space-mono)]">
                          {notif.time}
                        </span>
                      </div>

                      <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                        {notif.description}
                      </p>

                      {/* Bottom actions */}
                      <div className="flex items-center gap-4 mt-3">
                        {notif.actionLabel && notif.actionHref && (
                          <Link 
                            href={notif.actionHref}
                            className={cn(
                              "text-xs font-semibold hover:underline flex items-center gap-1",
                              style.icon
                            )}
                          >
                            {notif.actionLabel} <ArrowRight size={12} />
                          </Link>
                        )}

                        <button
                          onClick={() => handleDismiss(notif.id)}
                          className="text-[11px] text-text-muted hover:text-text-secondary transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>

                    </div>

                    {/* Dismiss quick button on absolute right */}
                    {!notif.read && (
                      <div className="absolute right-4 top-4">
                        <span className={cn("w-1.5 h-1.5 rounded-full block", style.dot)} />
                      </div>
                    )}

                  </div>

                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredNotifs.length === 0 && (
          <GlassCard className="text-center py-16">
            <BellOff size={40} className="mx-auto text-text-muted mb-4 opacity-15" />
            <p className="text-sm font-semibold text-text-secondary">No alerts in this category</p>
            <p className="text-xs text-text-muted mt-1">You are perfectly risk-compliant and updated!</p>
          </GlassCard>
        )}
      </div>

    </div>
  );
}
