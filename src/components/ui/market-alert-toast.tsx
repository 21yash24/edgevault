"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Zap, AlertTriangle, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketAlert {
  id: string;
  type: "volatility" | "news" | "opportunity";
  title: string;
  message: string;
  duration?: number;
}

const DEMO_ALERTS: MarketAlert[] = [
  {
    id: "alert-1",
    type: "volatility",
    title: "Volatility Spike",
    message: "High trading volume detected in NQ. Prepare for rapid price action.",
    duration: 8000,
  },
  {
    id: "alert-2",
    type: "news",
    title: "Breaking News",
    message: "CPI Data just released: Core Inflation rises 0.3% MoM.",
    duration: 10000,
  },
];

export function MarketAlertToastSystem() {
  const [activeAlerts, setActiveAlerts] = useState<MarketAlert[]>([]);

  // Simulation: Trigger random alerts to show the system working
  useEffect(() => {
    // Show first alert after 3 seconds
    const t1 = setTimeout(() => {
      addAlert(DEMO_ALERTS[0]);
    }, 3000);

    // Show second alert after 15 seconds
    const t2 = setTimeout(() => {
      addAlert(DEMO_ALERTS[1]);
    }, 15000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const addAlert = (alert: MarketAlert) => {
    setActiveAlerts((prev) => [...prev, alert]);
    if (alert.duration) {
      setTimeout(() => {
        removeAlert(alert.id);
      }, alert.duration);
    }
  };

  const removeAlert = (id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-3 pointer-events-none w-80">
      <AnimatePresence>
        {activeAlerts.map((alert) => {
          let style = { bg: "", border: "", iconColor: "", glow: "", Icon: Zap };
          if (alert.type === "volatility") {
            style = { bg: "bg-accent-coral/10", border: "border-accent-coral/30", iconColor: "text-accent-coral", glow: "shadow-[0_0_30px_rgba(255,45,85,0.2)]", Icon: AlertTriangle };
          } else if (alert.type === "news") {
            style = { bg: "bg-accent-violet/10", border: "border-accent-violet/30", iconColor: "text-accent-violet", glow: "shadow-[0_0_30px_rgba(143,0,255,0.2)]", Icon: Zap };
          } else {
            style = { bg: "bg-accent-green/10", border: "border-accent-green/30", iconColor: "text-accent-green", glow: "shadow-[0_0_30px_rgba(0,255,178,0.2)]", Icon: TrendingUp };
          }

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "relative overflow-hidden pointer-events-auto backdrop-blur-xl border rounded-2xl p-4 flex gap-3",
                style.bg, style.border, style.glow
              )}
            >
              {/* Background Glow Animation */}
              <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-50 animate-pulse", style.bg)} />

              <div className={cn("mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border bg-bg-card", style.border)}>
                <style.Icon size={16} className={style.iconColor} />
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">{alert.title}</h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">{alert.message}</p>
              </div>

              <button
                onClick={() => removeAlert(alert.id)}
                className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
