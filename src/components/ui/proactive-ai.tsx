"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingDown, AlertTriangle, Lightbulb, TrendingUp, Brain, Flame, Clock, ChevronRight } from "lucide-react";
import { GlassCard } from "./glass-card";
import { useEffect, useState, useMemo } from "react";
import { Trade } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { subDays } from "date-fns";

interface Insight {
  type: "warning" | "danger" | "success" | "insight";
  icon: React.ElementType;
  color: string;
  bg: string;
  borderColor: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

function generateInsights(trades: Trade[]): Insight[] {
  const insights: Insight[] = [];
  if (trades.length === 0) return insights;

  const now = new Date();
  const last7Days = trades.filter(t => {
    try { return new Date(t.entryDate) >= subDays(now, 7); } catch { return false; }
  });
  const last30Days = trades.filter(t => {
    try { return new Date(t.entryDate) >= subDays(now, 30); } catch { return false; }
  });

  // ──── LOSS STREAK ────
  let streak = 0;
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].result === "loss") streak++;
    else break;
  }
  if (streak >= 2) {
    insights.push({
      type: "danger",
      icon: Flame,
      color: "text-accent-coral",
      bg: "bg-accent-coral/8",
      borderColor: "border-accent-coral/20",
      title: `${streak}-Trade Loss Streak`,
      message: `You've lost ${streak} trades in a row. Consider stopping for the session or reviewing your last trades before placing another.`,
      actionLabel: "Review Journal",
      actionHref: "/journal",
    });
  }

  // ──── WIN STREAK ────
  let winStreak = 0;
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].result === "win") winStreak++;
    else break;
  }
  if (winStreak >= 3) {
    insights.push({
      type: "success",
      icon: TrendingUp,
      color: "text-accent-green",
      bg: "bg-accent-green/8",
      borderColor: "border-accent-green/20",
      title: `🔥 ${winStreak} Wins in a Row`,
      message: `You're on a ${winStreak}-trade win streak. Stay disciplined — overconfidence is the most common cause of reverting streaks.`,
    });
  }

  // ──── BEST HOUR ────
  if (last30Days.length >= 5) {
    const hourMap = new Map<number, { pnl: number; count: number }>();
    for (const t of last30Days) {
      const h = new Date(t.entryDate).getHours();
      const prev = hourMap.get(h) ?? { pnl: 0, count: 0 };
      hourMap.set(h, { pnl: prev.pnl + t.netPnl, count: prev.count + 1 });
    }
    let bestHour = -1, bestPnl = -Infinity;
    hourMap.forEach((v, h) => { if (v.count >= 2 && v.pnl > bestPnl) { bestPnl = v.pnl; bestHour = h; } });
    if (bestHour >= 0) {
      const ampm = bestHour >= 12 ? "PM" : "AM";
      const disp = bestHour % 12 || 12;
      insights.push({
        type: "insight",
        icon: Clock,
        color: "text-accent-violet",
        bg: "bg-accent-violet/8",
        borderColor: "border-accent-violet/20",
        title: `Peak Edge: ${disp}:00 ${ampm}`,
        message: `Your best trading hour this month is ${disp}:00 ${ampm} with +$${bestPnl.toFixed(0)} total. Schedule your best setups here.`,
        actionLabel: "View Heatmap",
        actionHref: "/analytics",
      });
    }
  }

  // ──── FOMO PATTERN ────
  const fomoTrades = last30Days.filter(t => t.mistakeTags?.includes("FOMO") || t.mistakeTags?.includes("Chased entry"));
  if (fomoTrades.length >= 2) {
    const fomoPnl = fomoTrades.reduce((s, t) => s + t.netPnl, 0);
    insights.push({
      type: "warning",
      icon: AlertTriangle,
      color: "text-yellow-500",
      bg: "bg-yellow-500/8",
      borderColor: "border-yellow-500/20",
      title: `FOMO Costing You $${Math.abs(fomoPnl).toFixed(0)}`,
      message: `${fomoTrades.length} FOMO/chased entries this month, total loss: $${Math.abs(fomoPnl).toFixed(0)}. Wait for your exact setup criteria.`,
      actionLabel: "View Analytics",
      actionHref: "/analytics",
    });
  }

  // ──── EARLY EXIT PATTERN ────
  const earlyExitTrades = last30Days.filter(t => t.mistakeTags?.includes("Early exit"));
  if (earlyExitTrades.length >= 2 && earlyExitTrades.some(t => t.result === "win")) {
    const avgMfe = earlyExitTrades.filter(t => t.mfe).reduce((s, t) => s + (t.mfe || 0), 0) / (earlyExitTrades.filter(t => t.mfe).length || 1);
    const avgActual = earlyExitTrades.reduce((s, t) => s + t.netPnl, 0) / earlyExitTrades.length;
    const missed = avgMfe - avgActual;
    insights.push({
      type: "insight",
      icon: TrendingDown,
      color: "text-accent-violet",
      bg: "bg-accent-violet/8",
      borderColor: "border-accent-violet/20",
      title: `Leaving ~$${missed.toFixed(0)} on Table`,
      message: `You've early-exited ${earlyExitTrades.length} trades this month, averaging $${missed.toFixed(0)} in missed profit per trade based on MFE data.`,
      actionLabel: "MAE/MFE Chart",
      actionHref: "/analytics",
    });
  }

  // ──── WIN RATE WEEK ────
  if (last7Days.length >= 4) {
    const wr = (last7Days.filter(t => t.result === "win").length / last7Days.length) * 100;
    if (wr >= 65) {
      insights.push({
        type: "success",
        icon: Brain,
        color: "text-accent-green",
        bg: "bg-accent-green/8",
        borderColor: "border-accent-green/20",
        title: `Strong Week — ${wr.toFixed(0)}% Win Rate`,
        message: `Your 7-day win rate is ${wr.toFixed(0)}% across ${last7Days.length} trades. Note the conditions — this is edge working.`,
      });
    } else if (wr < 40) {
      insights.push({
        type: "warning",
        icon: AlertTriangle,
        color: "text-yellow-500",
        bg: "bg-yellow-500/8",
        borderColor: "border-yellow-500/20",
        title: `Tough Week — ${wr.toFixed(0)}% Win Rate`,
        message: `Only ${wr.toFixed(0)}% win rate over ${last7Days.length} trades this week. Review your setups — conditions may have shifted.`,
        actionLabel: "View Analytics",
        actionHref: "/analytics",
      });
    }
  }

  // Default fallback
  if (insights.length === 0) {
    insights.push({
      type: "insight",
      icon: Lightbulb,
      color: "text-accent-violet",
      bg: "bg-accent-violet/8",
      borderColor: "border-accent-violet/20",
      title: "AI Coach Monitoring",
      message: "Log more trades to unlock personalized behavioral insights. Patterns surface after 5+ trades.",
    });
  }

  return insights.slice(0, 4);
}

interface Props {
  trades: Trade[];
}

export function ProactiveAIWidget({ trades }: Props) {
  const insights = useMemo(() => generateInsights(trades), [trades]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [trades.length]);

  useEffect(() => {
    if (insights.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % insights.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [insights.length]);

  const current = insights[currentIndex];
  if (!current) return null;
  const Icon = current.icon;

  return (
    <GlassCard className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className={cn("absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-700", current.bg)} />

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-sm flex items-center gap-2 text-accent-violet">
          <Sparkles size={14} className="animate-pulse" />
          Live AI Nudges
        </h2>
        <div className="flex gap-1.5">
          {insights.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", i === currentIndex ? "bg-accent-violet scale-125" : "bg-border-subtle hover:bg-text-muted")}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className={cn("flex items-start gap-3 p-3 rounded-xl border", current.bg, current.borderColor)}
        >
          <div className={cn("mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border", current.bg, current.borderColor)}>
            <Icon size={16} className={current.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn("text-xs font-bold mb-0.5", current.color)}>{current.title}</div>
            <p className="text-xs text-text-secondary leading-relaxed">{current.message}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-3">
        {current.actionLabel && current.actionHref ? (
          <Link href={current.actionHref} className={cn("text-[10px] font-bold flex items-center gap-0.5 hover:underline", current.color)}>
            {current.actionLabel} <ChevronRight size={11} />
          </Link>
        ) : (
          <span />
        )}
        <Link href="/ai-coach" className="text-[10px] text-text-muted hover:text-accent-violet transition-colors font-semibold">
          Ask AI anything →
        </Link>
      </div>
    </GlassCard>
  );
}
