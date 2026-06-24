"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore, useGamificationStore } from "@/stores";
import { useAuth } from "@/components/providers/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard, BookOpen, BarChart3, Target,
  Shield, Bell, Settings, ChevronRight, Zap,
  Trophy, PlugZap, Brain, Notebook, Globe
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-accent-green" },
  { href: "/journal", label: "Journal", icon: BookOpen, color: "text-accent-blue" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, color: "text-accent-violet" },
  { href: "/notebook", label: "Notebook", icon: Notebook, color: "text-yellow-500 dark:text-yellow-400" },
  { href: "/playbook", label: "Playbook", icon: Target, color: "text-orange-500 dark:text-orange-400" },
  { href: "/ai-coach", label: "AI Coach", icon: Brain, color: "text-pink-500 dark:text-pink-400" },
  { href: "/prop-tracker", label: "Prop Tracker", icon: Trophy, color: "text-amber-500 dark:text-yellow-500" },
  { href: "/risk", label: "Risk Manager", icon: Shield, color: "text-accent-coral" },
  { href: "/integrations", label: "Integrations", icon: PlugZap, color: "text-accent-blue" },
  { href: "/alerts", label: "Smart Alerts", icon: Bell, color: "text-accent-coral", badge: 3 },
  { href: "/markets", label: "Markets Hub", icon: Globe, color: "text-accent-green" },
  { href: "/settings", label: "Settings", icon: Settings, color: "text-text-muted" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { xp, streak, getLevel } = useGamificationStore();
  const levelInfo = getLevel();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 flex flex-col md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--sidebar-border)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
        }}
        animate={{ width: sidebarCollapsed ? 68 : 236 }}
        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
      {/* Logo */}
      <div
        className="h-16 flex items-center px-3.5 gap-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <Link href="/dashboard" className="flex items-center">
          <Logo collapsed={sidebarCollapsed} />
        </Link>
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
                "flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-150 group relative",
              )}
              style={{
                color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
              }}
            >
              {/* Active background */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: "var(--sidebar-item-active-bg)",
                    border: "1px solid var(--sidebar-item-active-border)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}

              {/* Hover state */}
              {!isActive && (
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ background: "var(--sidebar-item-hover)" }}
                />
              )}

              {/* Icon container */}
              <div
                className={cn(
                  "relative z-10 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150",
                  isActive ? "bg-accent-green/10" : ""
                )}
              >
                <item.icon
                  size={16}
                  className={cn(
                    "transition-all duration-150",
                    isActive ? item.color : "opacity-50 group-hover:opacity-80"
                  )}
                  style={{ color: isActive ? undefined : "var(--sidebar-text)" }}
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
                    <span
                      className={cn("text-xs whitespace-nowrap", isActive ? "font-bold" : "font-medium")}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="w-4 h-4 rounded-full bg-accent-coral text-white text-[9px] font-black flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-green ml-1 opacity-70" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed tooltip */}
              {sidebarCollapsed && (
                <div
                  className="absolute left-full ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-xl"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  }}
                >
                  {item.label}
                  {item.badge && (
                    <span className="ml-1.5 px-1 py-0.5 rounded bg-accent-coral text-white text-[8px] font-black">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom collapse button */}
      <div style={{ borderTop: "1px solid var(--sidebar-border)" }} className="flex flex-col">

        {/* Level Badge */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="px-3 pt-3 pb-1"
            >
              <div
                className="rounded-xl p-2.5"
                style={{ background: 'var(--sidebar-item-hover)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">⚡</span>
                    <span className="text-[11px] font-black" style={{ color: 'var(--text-primary)' }}>{levelInfo.name}</span>
                    <span
                      className="text-[9px] font-bold px-1 py-0.5 rounded"
                      style={{ background: 'rgba(0,255,178,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(0,255,178,0.2)' }}
                    >
                      Lv.{levelInfo.level}
                    </span>
                  </div>
                  {streak > 0 && (
                    <span className="text-[10px] font-black text-orange-400">🔥 {streak}d</span>
                  )}
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--border-subtle)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${levelInfo.progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ background: 'linear-gradient(90deg, var(--accent-green), var(--accent-violet))' }}
                  />
                </div>
                <div className="text-[8px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{xp} XP · {levelInfo.progress.toFixed(0)}% to Lv.{levelInfo.level + 1}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!sidebarCollapsed && (
           <div className="px-4 py-1 text-[8px] font-mono text-text-muted/40 uppercase tracking-widest truncate">
             UID: {user?.uid || 'offline'}
           </div>
        )}
        <button
          onClick={toggleSidebar}
          className="w-full h-11 flex items-center justify-center gap-2 transition-all duration-150 group"
          style={{ color: "var(--sidebar-text)" }}
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--sidebar-item-hover)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <motion.div animate={{ rotate: sidebarCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={15} />
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                Collapse
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
    </>
  );
}
