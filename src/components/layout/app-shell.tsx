"use client";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useUIStore, useTradeStore, usePlaybookStore, useAccountStore, usePropFirmStore, useSettingsStore, useNotebookStore, useGamificationStore } from "@/stores";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

function BadgeToast() {
  const { newBadge, dismissNewBadge } = useGamificationStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (newBadge) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dismissNewBadge();
      }, 4000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [newBadge, dismissNewBadge]);

  const tierColors: Record<string, { bg: string; border: string; glow: string; text: string }> = {
    bronze:   { bg: 'rgba(205,127,50,0.15)',  border: 'rgba(205,127,50,0.5)',  glow: 'rgba(205,127,50,0.25)',  text: '#cd7f32' },
    silver:   { bg: 'rgba(192,192,192,0.15)', border: 'rgba(192,192,192,0.5)', glow: 'rgba(192,192,192,0.25)', text: '#c0c0c0' },
    gold:     { bg: 'rgba(255,215,0,0.15)',   border: 'rgba(255,215,0,0.5)',   glow: 'rgba(255,215,0,0.25)',   text: '#ffd700' },
    platinum: { bg: 'rgba(0,255,178,0.15)',   border: 'rgba(0,255,178,0.5)',   glow: 'rgba(0,255,178,0.25)',   text: 'var(--accent-green)' },
  };

  return (
    <AnimatePresence>
      {newBadge && (
        <motion.div
          key={newBadge.id}
          initial={{ opacity: 0, y: 80, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed bottom-6 right-6 z-[9999] cursor-pointer select-none"
          onClick={dismissNewBadge}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
            style={{
              background: tierColors[newBadge.tier]?.bg || 'rgba(0,255,178,0.15)',
              border: `1px solid ${tierColors[newBadge.tier]?.border || 'rgba(0,255,178,0.5)'}`,
              boxShadow: `0 8px 40px ${tierColors[newBadge.tier]?.glow || 'rgba(0,255,178,0.25)'}, 0 0 0 1px rgba(255,255,255,0.05)`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Animated emoji icon */}
            <motion.span
              className="text-3xl"
              animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {newBadge.icon}
            </motion.span>

            {/* Text content */}
            <div>
              <div
                className="text-[9px] font-black uppercase tracking-widest mb-0.5"
                style={{ color: tierColors[newBadge.tier]?.text || 'var(--accent-green)' }}
              >
                🏆 Achievement Unlocked!
              </div>
              <div className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                {newBadge.name}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {newBadge.description}
              </div>
            </div>

            {/* Tier badge */}
            <span
              className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 capitalize"
              style={{
                background: tierColors[newBadge.tier]?.glow,
                color: tierColors[newBadge.tier]?.text || 'var(--accent-green)',
                border: `1px solid ${tierColors[newBadge.tier]?.border || 'rgba(0,255,178,0.5)'}`,
              }}
            >
              {newBadge.tier}
            </span>
          </div>

          {/* Auto-dismiss progress bar */}
          <motion.div
            className="h-0.5 rounded-full mt-1 mx-1"
            style={{ background: tierColors[newBadge.tier]?.text || 'var(--accent-green)', originX: 0 }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 4, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();
  const { initializeTrades, listenToTrades, trades } = useTradeStore();
  const { listenToPlaybooks } = usePlaybookStore();
  const { listenToAccounts } = useAccountStore();
  const { listenToChallenges } = usePropFirmStore();
  const { listenToSettings } = useSettingsStore();
  const { listenToNotebook } = useNotebookStore();
  const { checkAndUpdateStreak, checkBadges } = useGamificationStore();
  const { user, loading, isDemoMode } = useAuth();
  const router = useRouter();

  // Suppress harmless Recharts ResponsiveContainer warnings in dev mode
  useEffect(() => {
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('width(-1) and height(-1)')) return;
      originalConsoleWarn(...args);
    };
    return () => {
      console.warn = originalConsoleWarn;
    };
  }, []);

  useEffect(() => { 
    initializeTrades(); 
    if (user?.uid) {
      const unsubTrades = listenToTrades(user.uid);
      const unsubPlaybooks = listenToPlaybooks(user.uid);
      const unsubAccounts = listenToAccounts(user.uid);
      const unsubChallenges = listenToChallenges(user.uid);
      const unsubSettings = listenToSettings(user.uid);
      const unsubNotebook = listenToNotebook(user.uid);
      return () => {
        unsubTrades();
        unsubPlaybooks();
        unsubAccounts();
        unsubChallenges();
        unsubSettings();
        unsubNotebook();
      };
    }
  }, [initializeTrades, listenToTrades, listenToPlaybooks, listenToAccounts, listenToChallenges, listenToSettings, listenToNotebook, user?.uid]);

  // Run gamification checks whenever trades change
  useEffect(() => {
    if (trades && trades.length > 0) {
      checkAndUpdateStreak(trades);
      checkBadges(trades);
    }
  }, [trades, checkAndUpdateStreak, checkBadges]);

  useEffect(() => {
    if (!loading && !isDemoMode && !user) {
      router.push("/login");
    }
  }, [user, loading, isDemoMode, router]);

  if (loading && !isDemoMode) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center" style={{ background: "linear-gradient(135deg, #040814 0%, #060b18 50%, #0a0d1f 100%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(0,255,178,0.2), rgba(143,0,255,0.2))", border: "1px solid rgba(0,255,178,0.2)" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-t-accent-green border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <div className="font-[family-name:var(--font-inter)] font-black text-sm tracking-widest" style={{ background: "linear-gradient(90deg, #00FFB2, #8F00FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EDGEVAULT</div>
            <div className="text-[10px] text-text-muted font-bold mt-1 uppercase tracking-widest">Loading your trading OS...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base relative">
      <Sidebar />
      <div 
        className={cn(
          "flex flex-col min-h-screen transition-all duration-200 ease-out",
          sidebarCollapsed ? "md:ml-[72px]" : "md:ml-[240px]"
        )}
      >
        <Topbar />
        <main className="flex-1 p-4 md:p-6 gradient-mesh">{children}</main>
      </div>
      {/* Global Badge Toast Notification */}
      <BadgeToast />
    </div>
  );
}
