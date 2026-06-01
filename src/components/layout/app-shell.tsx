"use client";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useUIStore, useTradeStore, usePlaybookStore, useAccountStore, usePropFirmStore, useSettingsStore, useNotebookStore } from "@/stores";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();
  const { initializeTrades, listenToTrades } = useTradeStore();
  const { listenToPlaybooks } = usePlaybookStore();
  const { listenToAccounts } = useAccountStore();
  const { listenToChallenges } = usePropFirmStore();
  const { listenToSettings } = useSettingsStore();
  const { listenToNotebook } = useNotebookStore();
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
    </div>
  );
}
