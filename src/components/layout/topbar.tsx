"use client";
import { Bell, Search, Plus, Moon, Sun, ShieldAlert, Trophy, Zap, Info, X } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DropdownNotification {
  id: string;
  type: "violation" | "prop" | "insight" | "system";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const mockQuickNotifs: DropdownNotification[] = [
  {
    id: "q-1",
    type: "violation",
    title: "Daily Loss Limit Exceeded",
    description: "Session losses hit -$540 (limit -$500). Cooldown lock active.",
    time: "10m ago",
    read: false
  },
  {
    id: "q-2",
    type: "prop",
    title: "Apex Target Near!",
    description: "82% of profit target reached on your $50k evaluation.",
    time: "45m ago",
    read: false
  },
  {
    id: "q-3",
    type: "insight",
    title: "High Psychological Friction",
    description: "Fear/hesitancy self-reported on last 3 trades.",
    time: "2h ago",
    read: false
  }
];

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Outside click listener
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className="h-16 border-b border-border-subtle/50 bg-bg-base/60 backdrop-blur-2xl flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-6 flex-1 max-w-xl">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/5 border border-accent-green/10">
          <div className="relative w-2 h-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75 animate-ping"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green shadow-[0_0_8px_rgba(0,255,178,0.8)]"></span>
          </div>
          <span className="text-[10px] font-[family-name:var(--font-space-mono)] text-accent-green font-bold uppercase tracking-widest">Live Sync Active</span>
        </div>
        
        <div className="relative w-full group max-w-sm hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-green transition-colors" />
          <input
            type="text"
            placeholder="Search trades, symbols..."
            className="w-full glass bg-transparent border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green focus:shadow-[0_0_20px_rgba(0,255,178,0.15)] transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded border border-border-subtle backdrop-blur-md">⌘K</kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 relative" ref={dropdownRef}>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/journal/new"
            className="flex items-center gap-2 bg-accent-green/10 hover:bg-accent-green/20 text-accent-green px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 shadow-[0_0_15px_rgba(0,255,178,0.1)] hover:shadow-[0_0_30px_rgba(0,255,178,0.25)] border border-accent-green/20"
          >
            <Plus size={16} />
            <span className="hidden sm:inline font-bold tracking-wide">LOG TRADE</span>
          </Link>
        </motion.div>

        {mounted && (
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl glass hover:border-accent-violet hover:shadow-[0_0_15px_rgba(123,97,255,0.2)] text-text-secondary hover:text-text-primary transition-all"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>
        )}

        {/* Bell Alert Trigger */}
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
          className={cn(
            "relative w-9 h-9 flex items-center justify-center rounded-xl glass transition-all",
            notifDropdownOpen 
              ? "border-accent-coral shadow-[0_0_15px_rgba(255,45,85,0.25)] text-text-primary" 
              : "hover:border-accent-coral hover:shadow-[0_0_15px_rgba(255,45,85,0.2)] text-text-secondary hover:text-text-primary"
          )}
        >
          <Bell size={16} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-coral rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-[0_0_10px_rgba(255,45,85,0.5)]">3</span>
        </motion.button>

        {/* Dynamic Dropdown Panel */}
        <AnimatePresence>
          {notifDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 top-12 w-80 rounded-2xl border border-border-subtle bg-bg-card/90 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] z-50 overflow-hidden"
            >
              {/* Dropdown Header */}
              <div className="px-4 py-3 border-b border-border-subtle/50 flex items-center justify-between bg-white/[0.01]">
                <span className="text-xs font-bold text-text-primary font-[family-name:var(--font-syne)] flex items-center gap-1.5">
                  Critical Alerts <span className="w-1.5 h-1.5 bg-accent-coral rounded-full animate-ping" />
                </span>
                <Link 
                  href="/notifications" 
                  onClick={() => setNotifDropdownOpen(false)}
                  className="text-[10px] text-accent-green hover:underline font-semibold"
                >
                  View All Hub
                </Link>
              </div>

              {/* Quick List */}
              <div className="divide-y divide-border-subtle/30 max-h-72 overflow-y-auto">
                {mockQuickNotifs.map((notif) => {
                  let Icon = Info;
                  let color = "text-accent-violet";
                  if (notif.type === "violation") {
                    Icon = ShieldAlert;
                    color = "text-accent-coral";
                  } else if (notif.type === "prop") {
                    Icon = Trophy;
                    color = "text-accent-green";
                  } else if (notif.type === "insight") {
                    Icon = Zap;
                    color = "text-yellow-500";
                  }

                  return (
                    <div key={notif.id} className="p-3 hover:bg-white/[0.02] transition-colors flex gap-2.5 items-start">
                      <div className={cn("w-7 h-7 rounded-lg bg-white/[0.03] border border-border-subtle/50 flex items-center justify-center flex-shrink-0 mt-0.5", color)}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-text-primary truncate">{notif.title}</p>
                          <span className="text-[8px] text-text-muted font-[family-name:var(--font-space-mono)] whitespace-nowrap">{notif.time}</span>
                        </div>
                        <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed line-clamp-2">{notif.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom footer button */}
              <div className="p-2 border-t border-border-subtle/50 bg-bg-card/40 text-center">
                <Link
                  href="/alerts"
                  onClick={() => setNotifDropdownOpen(false)}
                  className="block w-full py-1.5 bg-white/[0.02] border border-border-subtle rounded-lg text-[10px] font-bold text-text-secondary hover:text-text-primary transition-all"
                >
                  Configure Smart Triggers
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-green to-accent-violet flex items-center justify-center text-sm font-bold cursor-pointer shadow-[0_0_15px_rgba(0,255,178,0.3)] border border-white/10">
          Y
        </motion.div>
      </div>
    </header>
  );
}
