"use client";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useUIStore, useTradeStore, usePlaybookStore, useAccountStore, usePropFirmStore, useSettingsStore } from "@/stores";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();
  const { initializeTrades, listenToTrades } = useTradeStore();
  const { listenToPlaybooks } = usePlaybookStore();
  const { listenToAccounts } = useAccountStore();
  const { listenToChallenges } = usePropFirmStore();
  const { listenToSettings } = useSettingsStore();
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
      return () => {
        unsubTrades();
        unsubPlaybooks();
        unsubAccounts();
        unsubChallenges();
        unsubSettings();
      };
    }
  }, [initializeTrades, listenToTrades, listenToPlaybooks, listenToAccounts, listenToChallenges, listenToSettings, user?.uid]);

  useEffect(() => {
    if (!loading && !isDemoMode && !user) {
      router.push("/login");
    }
  }, [user, loading, isDemoMode, router]);

  if (loading && !isDemoMode) {
    return <div className="min-h-screen bg-bg-base flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar />
      <motion.div
        className="flex flex-col min-h-screen"
        animate={{ marginLeft: sidebarCollapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: "easeInOut" as const }}
      >
        <Topbar />
        <main className="flex-1 p-6 gradient-mesh">{children}</main>
      </motion.div>
    </div>
  );
}
