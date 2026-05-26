"use client";
import { Bell, Search, Plus, Moon, Sun, ShieldAlert, Trophy, Zap, Info, X, Slash, Command } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTradeStore } from "@/stores";
import { formatCurrency } from "@/lib/utils";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Dashboard", subtitle: "Your trading command center" },
  "/journal": { title: "Trade Journal", subtitle: "All executions & reviews" },
  "/journal/new": { title: "Log New Trade", subtitle: "Record your execution" },
  "/analytics": { title: "Analytics", subtitle: "Deep performance insights" },
  "/notebook": { title: "Trading Notebook", subtitle: "Session plans & daily notes" },
  "/playbook": { title: "Playbook", subtitle: "Your strategy library" },
  "/ai-coach": { title: "AI Trade Coach", subtitle: "Personalized coaching" },
  "/prop-tracker": { title: "Prop Tracker", subtitle: "Challenge monitoring" },
  "/risk": { title: "Risk Manager", subtitle: "Position & risk controls" },
  "/integrations": { title: "Integrations", subtitle: "Connect your broker" },
  "/alerts": { title: "Smart Alerts", subtitle: "Rules & notifications" },
  "/markets": { title: "Markets Hub", subtitle: "Live market data" },
  "/settings": { title: "Settings", subtitle: "App configuration" },
};

interface DropdownNotification {
  id: string;
  type: "violation" | "prop" | "insight" | "system";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const mockQuickNotifs: DropdownNotification[] = [
  { id: "q-1", type: "violation", title: "Daily Loss Limit Exceeded", description: "Session losses hit -$540 (limit -$500). Cooldown lock active.", time: "10m ago", read: false },
  { id: "q-2", type: "prop", title: "Apex Target Near!", description: "82% of profit target reached on your $50k evaluation.", time: "45m ago", read: false },
  { id: "q-3", type: "insight", title: "High Psychological Friction", description: "Fear/hesitancy self-reported on last 3 trades.", time: "2h ago", read: false }
];

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { trades } = useTradeStore();
  
  const pageInfo = pageTitles[pathname] ?? { title: "EdgeVault", subtitle: "Pro Trading OS" };

  // Today's P&L
  const todayPnl = trades
    .filter(t => t.entryDate?.startsWith(new Date().toISOString().split("T")[0]))
    .reduce((s, t) => s + t.netPnl, 0);
  const hasTodayTrades = trades.some(t => t.entryDate?.startsWith(new Date().toISOString().split("T")[0]));

  useEffect(() => {
    setMounted(true);
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header 
      className="h-14 flex items-center justify-between px-6 sticky top-0 z-30 flex-shrink-0"
      style={{ 
        background: "rgba(4,8,20,0.85)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 1px 40px rgba(0,0,0,0.3)"
      }}
    >
      {/* Left: Page title */}
      <div className="flex items-center gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
          >
            <h2 className="font-[family-name:var(--font-inter)] font-black text-sm text-text-primary tracking-tight leading-none">{pageInfo.title}</h2>
            <p className="text-[10px] text-text-muted font-semibold mt-0.5 leading-none">{pageInfo.subtitle}</p>
          </motion.div>
        </AnimatePresence>

        {/* Live status */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,255,178,0.05)", border: "1px solid rgba(0,255,178,0.1)" }}>
          <div className="relative w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-accent-green opacity-70 animate-ping" style={{ animationDuration: "2s" }} />
            <span className="relative block w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_6px_rgba(0,255,178,0.8)]" />
          </div>
          <span className="text-[9px] font-[family-name:var(--font-space-mono)] text-accent-green font-bold uppercase tracking-widest">Live</span>
        </div>

        {/* Today P&L chip */}
        {hasTodayTrades && mounted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-[family-name:var(--font-space-mono)] font-bold",
              todayPnl >= 0 
                ? "text-accent-green" 
                : "text-accent-coral"
            )}
            style={{ 
              background: todayPnl >= 0 ? "rgba(0,255,178,0.06)" : "rgba(255,45,85,0.06)",
              border: todayPnl >= 0 ? "1px solid rgba(0,255,178,0.12)" : "1px solid rgba(255,45,85,0.12)"
            }}
          >
            Today: {todayPnl >= 0 ? "+" : ""}{formatCurrency(todayPnl)}
          </motion.div>
        )}
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex flex-1 max-w-xs mx-8">
        <div className={cn("relative w-full transition-all duration-200", searchFocused && "scale-[1.02]")}>
          <Search size={13} className={cn("absolute left-3 top-1/2 -translate-y-1/2 transition-colors", searchFocused ? "text-accent-green" : "text-text-muted")} />
          <input
            id="global-search"
            type="text"
            placeholder="Search trades, symbols..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full rounded-xl pl-9 pr-14 py-2 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none transition-all duration-200"
            style={{
              background: searchFocused ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.025)",
              border: searchFocused ? "1px solid rgba(0,255,178,0.25)" : "1px solid rgba(255,255,255,0.05)",
              boxShadow: searchFocused ? "0 0 20px rgba(0,255,178,0.08)" : "none",
            }}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <kbd className="text-[9px] text-text-muted/50 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] font-bold">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2" ref={dropdownRef}>
        {/* Log Trade CTA */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/journal/new"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-bg-base transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #00FFB2 0%, #00D4FF 100%)",
              boxShadow: "0 0 20px rgba(0,255,178,0.2), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <Plus size={13} className="stroke-[2.5]" />
            LOG TRADE
          </Link>
        </motion.div>

        {/* Theme Toggle */}
        {mounted && (
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text-primary transition-all duration-150"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        )}

        {/* Bell */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className={cn("w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150", notifDropdownOpen ? "text-text-primary" : "text-text-muted hover:text-text-primary")}
            style={{
              background: notifDropdownOpen ? "rgba(255,45,85,0.08)" : "rgba(255,255,255,0.03)",
              border: notifDropdownOpen ? "1px solid rgba(255,45,85,0.2)" : "1px solid rgba(255,255,255,0.06)",
              boxShadow: notifDropdownOpen ? "0 0 15px rgba(255,45,85,0.15)" : "none",
            }}
          >
            <Bell size={14} />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent-coral rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-[0_0_8px_rgba(255,45,85,0.5)]">3</span>
          </motion.button>

          <AnimatePresence>
            {notifDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                className="absolute right-0 top-10 w-80 rounded-2xl overflow-hidden z-50"
                style={{ background: "rgba(10,14,28,0.98)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)" }}
              >
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-xs font-black text-text-primary font-[family-name:var(--font-inter)] flex items-center gap-1.5">
                    Alerts <span className="w-1.5 h-1.5 bg-accent-coral rounded-full animate-pulse" />
                  </span>
                  <Link href="/notifications" onClick={() => setNotifDropdownOpen(false)} className="text-[10px] text-accent-green hover:underline font-semibold">View all</Link>
                </div>
                <div className="divide-y max-h-64 overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {mockQuickNotifs.map((notif) => {
                    let Icon = Info;
                    let color = "text-accent-violet";
                    let glowColor = "rgba(143,0,255,0.1)";
                    if (notif.type === "violation") { Icon = ShieldAlert; color = "text-accent-coral"; glowColor = "rgba(255,45,85,0.1)"; }
                    else if (notif.type === "prop") { Icon = Trophy; color = "text-accent-green"; glowColor = "rgba(0,255,178,0.1)"; }
                    else if (notif.type === "insight") { Icon = Zap; color = "text-yellow-400"; glowColor = "rgba(255,200,0,0.1)"; }
                    return (
                      <div key={notif.id} className="p-3.5 hover:bg-white/[0.02] transition-colors flex gap-3 items-start group cursor-pointer">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", color)} style={{ background: glowColor, border: "1px solid rgba(255,255,255,0.06)" }}>
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
                <div className="p-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <Link href="/alerts" onClick={() => setNotifDropdownOpen(false)}
                    className="block w-full py-2 rounded-xl text-[10px] font-bold text-center text-text-secondary hover:text-text-primary transition-colors"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    Configure Smart Triggers →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-bg-base cursor-pointer select-none"
          style={{ background: "linear-gradient(135deg, #00FFB2 0%, #8F00FF 100%)", boxShadow: "0 0 15px rgba(0,255,178,0.25), inset 0 1px 0 rgba(255,255,255,0.2)" }}
        >
          Y
        </motion.div>
      </div>
    </header>
  );
}
