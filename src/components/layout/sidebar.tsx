"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, BarChart3, Target,
  Shield, TrendingUp, Bell, Settings, ChevronLeft,
  ChevronRight, Zap, Trophy, PlugZap, Brain, Notebook, Globe
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-accent-green" },
  { href: "/journal", label: "Journal", icon: BookOpen, color: "text-accent-blue" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, color: "text-accent-violet" },
  { href: "/notebook", label: "Notebook", icon: Notebook, color: "text-yellow-400" },
  { href: "/playbook", label: "Playbook", icon: Target, color: "text-orange-400" },
  { href: "/ai-coach", label: "AI Coach", icon: Brain, color: "text-pink-400" },
  { href: "/prop-tracker", label: "Prop Tracker", icon: Trophy, color: "text-yellow-500" },
  { href: "/risk", label: "Risk Manager", icon: Shield, color: "text-accent-coral" },
  { href: "/integrations", label: "Integrations", icon: PlugZap, color: "text-accent-blue" },
  { href: "/alerts", label: "Smart Alerts", icon: Bell, color: "text-accent-coral", badge: 3 },
  { href: "/markets", label: "Markets Hub", icon: Globe, color: "text-accent-green" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-text-muted" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col"
      style={{
        background: "linear-gradient(180deg, rgba(6,10,22,0.98) 0%, rgba(8,12,26,0.98) 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "4px 0 40px rgba(0,0,0,0.4), inset -1px 0 0 rgba(255,255,255,0.03)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
      }}
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 gap-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <motion.div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 relative"
          style={{ background: "linear-gradient(135deg, rgba(0,255,178,0.2) 0%, rgba(143,0,255,0.2) 100%)", border: "1px solid rgba(0,255,178,0.25)" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Zap size={16} className="text-accent-green" />
          <div className="absolute inset-0 rounded-xl" style={{ background: "radial-gradient(circle at 50% 50%, rgba(0,255,178,0.1) 0%, transparent 70%)" }} />
        </motion.div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <div className="font-[family-name:var(--font-syne)] font-black text-base tracking-widest" style={{ background: "linear-gradient(90deg, #00FFB2, #8F00FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                EDGEVAULT
              </div>
              <div className="text-[8px] text-text-muted font-bold uppercase tracking-[0.2em] -mt-0.5">Pro Trading OS</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm transition-all duration-150 group relative",
                isActive ? "text-white" : "text-text-muted hover:text-text-primary"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "linear-gradient(135deg, rgba(0,255,178,0.08) 0%, rgba(143,0,255,0.05) 100%)", border: "1px solid rgba(0,255,178,0.12)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              
              {/* Hover state */}
              <div className={cn(
                "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                !isActive && "bg-white/[0.02]"
              )} />

              {/* Icon container */}
              <div className={cn(
                "relative z-10 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150",
                isActive
                  ? "bg-accent-green/15 shadow-[0_0_12px_rgba(0,255,178,0.2)]"
                  : "group-hover:bg-white/[0.04]"
              )}>
                <item.icon
                  size={16}
                  className={cn("transition-all duration-150", isActive ? item.color : "text-text-muted group-hover:text-text-secondary")}
                />
              </div>

              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.12 }}
                    className="relative z-10 flex-1 flex items-center justify-between overflow-hidden"
                  >
                    <span className={cn("text-xs font-semibold whitespace-nowrap", isActive ? "font-bold text-text-primary" : "")}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="w-4 h-4 rounded-full bg-accent-coral text-white text-[9px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(255,45,85,0.4)]">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <div className="w-1 h-1 rounded-full bg-accent-green shadow-[0_0_6px_rgba(0,255,178,0.8)]" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed tooltip */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-bg-card border border-border-subtle rounded-lg text-xs font-semibold text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-xl">
                  {item.label}
                  {item.badge && <span className="ml-1.5 px-1 py-0.5 rounded bg-accent-coral text-white text-[8px] font-black">{item.badge}</span>}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button
          onClick={toggleSidebar}
          className="w-full h-11 flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-150 hover:bg-white/[0.02] group"
        >
          <motion.div animate={{ rotate: sidebarCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={15} className="text-text-muted group-hover:text-text-primary transition-colors" />
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="ml-2 text-[10px] font-bold text-text-muted uppercase tracking-wider group-hover:text-text-secondary transition-colors"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
