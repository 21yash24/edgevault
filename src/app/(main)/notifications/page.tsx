"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { useNotificationStore, useTradeStore } from "@/stores";
import { 
  Bell, AlertTriangle, Briefcase, Zap, Info, ShieldAlert,
  CheckCircle2, Trash2, CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { id: "all", label: "All" },
  { id: "risk", label: "Risk" },
  { id: "trade", label: "Trades" },
  { id: "prop", label: "Prop Firms" },
  { id: "insight", label: "Insights" },
  { id: "system", label: "System" },
];

export default function NotificationsPage() {
  const { notifications, addNotification, markRead, markAllRead, clearAll } = useNotificationStore();
  const { trades } = useTradeStore();
  const [activeTab, setActiveTab] = useState("all");

  // Generate seed notifications on first load if empty
  useEffect(() => {
    if (notifications.length === 0) {
      addNotification({
        type: "system",
        title: "Welcome to EdgeVault",
        description: "Your trading journal is ready. Start by logging your first trade or importing your history.",
        severity: "info",
      });
      
      // If they have trades, generate an insight
      if (trades.length > 0) {
        setTimeout(() => {
          addNotification({
            type: "insight",
            title: "Performance Analysis Ready",
            description: "Your AI Coach has analyzed your recent trades. You have a strong edge in the NY AM session.",
            severity: "info",
          });
        }, 1000);
      }
    }
  }, []);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter(n => n.type === activeTab);
  }, [notifications, activeTab]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string, severity?: string) => {
    switch (type) {
      case "risk": return severity === "critical" ? <ShieldAlert className="text-accent-coral" /> : <AlertTriangle className="text-accent-violet" />;
      case "trade": return <Briefcase className="text-accent-green" />;
      case "prop": return <Target className="text-accent-blue" />;
      case "insight": return <Zap className="text-accent-violet" />;
      default: return <Info className="text-text-muted" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-inter)] font-black tracking-tight text-text-primary flex items-center gap-2">
            <Bell className="text-accent-blue" /> Notifications
            {unreadCount > 0 && (
              <span className="bg-accent-blue text-bg-base text-[10px] px-2 py-0.5 rounded-full font-black ml-2">
                {unreadCount} NEW
              </span>
            )}
          </h1>
          <p className="text-sm text-text-muted mt-1">Updates on your trading, risk alerts, and AI insights.</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-border-subtle hover:border-accent-green/40 rounded-xl text-xs font-bold transition-all text-text-secondary hover:text-text-primary">
              <CheckSquare size={14} /> Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-border-subtle hover:border-accent-coral/40 rounded-xl text-xs font-bold transition-all text-text-secondary hover:text-text-primary">
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-border-subtle pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-bold transition-all relative",
              activeTab === tab.id ? "text-accent-blue" : "text-text-muted hover:text-text-primary"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="notif-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
              <Bell className="mx-auto h-12 w-12 text-text-muted opacity-20 mb-4" />
              <h3 className="text-lg font-bold text-text-primary">All Caught Up</h3>
              <p className="text-sm text-text-secondary mt-1">You have no {activeTab !== 'all' ? activeTab : ''} notifications.</p>
            </motion.div>
          ) : (
            filteredNotifications.map((notif) => (
              <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                <GlassCard className={cn(
                  "p-4 transition-all hover:bg-bg-secondary flex gap-4 cursor-pointer relative overflow-hidden",
                  !notif.read && "border-accent-blue/30 bg-accent-blue/5"
                )} onClick={() => !notif.read && markRead(notif.id)}>
                  {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-blue" />}
                  <div className="mt-1">
                    {getIcon(notif.type, notif.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className={cn("font-bold", !notif.read ? "text-text-primary" : "text-text-secondary")}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] font-[family-name:var(--font-space-mono)] text-text-muted whitespace-nowrap ml-4">
                        {new Date(notif.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={cn("text-sm mt-1", !notif.read ? "text-text-secondary" : "text-text-muted")}>
                      {notif.description}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-accent-blue" />
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Temporary Target icon since it wasn't imported from lucide-react in getIcon
function Target(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
