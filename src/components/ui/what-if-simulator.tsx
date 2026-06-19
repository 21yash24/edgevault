import { useMemo, useState } from "react";
import { Trade } from "@/lib/types";
import { calculateMetrics, getEquityCurve } from "@/lib/calculations";
import { GlassCard } from "./glass-card";
import { formatCurrency, cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AlertTriangle, Calendar, Clock, Crosshair, ArrowRight, RefreshCw, Layers } from "lucide-react";
import { motion } from "framer-motion";

interface WhatIfSimulatorProps {
  trades: Trade[];
}

export function WhatIfSimulator({ trades }: WhatIfSimulatorProps) {
  // Available filters based on existing trades
  const availableMistakes = useMemo(() => Array.from(new Set(trades.flatMap(t => t.mistakeTags || []))), [trades]);
  const availableSessions = useMemo(() => Array.from(new Set(trades.map(t => t.sessionTag).filter(Boolean))), [trades]);
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // State for toggled out items
  const [excludedMistakes, setExcludedMistakes] = useState<Set<string>>(new Set());
  const [excludedSessions, setExcludedSessions] = useState<Set<string>>(new Set());
  const [excludedDays, setExcludedDays] = useState<Set<number>>(new Set());

  // Simulation logic
  const simulatedTrades = useMemo(() => {
    return trades.filter(t => {
      // 1. Check if day is excluded
      const day = new Date(t.entryDate).getDay();
      if (excludedDays.has(day)) return false;

      // 2. Check if session is excluded
      if (t.sessionTag && excludedSessions.has(t.sessionTag)) return false;

      // 3. Check if mistake is excluded
      if (t.mistakeTags?.some(m => excludedMistakes.has(m))) return false;

      return true;
    });
  }, [trades, excludedMistakes, excludedSessions, excludedDays]);

  // Metrics
  const originalMetrics = useMemo(() => calculateMetrics(trades), [trades]);
  const simulatedMetrics = useMemo(() => calculateMetrics(simulatedTrades), [simulatedTrades]);

  // Equity Curves
  const chartData = useMemo(() => {
    // We need to merge them by index or time. Simplest is by trade step since it's a simulation.
    // If we use time, we need a unified timeline. Let's build a unified timeline by date.
    const unifiedMap = new Map<string, { date: string; orig: number; sim: number }>();
    
    let origEq = 50000;
    let simEq = 50000;
    
    trades.forEach(t => {
      const d = t.entryDate.split("T")[0];
      origEq += t.netPnl;
      // Is this trade in simulated?
      if (simulatedTrades.includes(t)) {
        simEq += t.netPnl;
      }
      unifiedMap.set(d, { date: d, orig: origEq, sim: simEq });
    });
    
    return Array.from(unifiedMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [trades, simulatedTrades]);

  const toggleSet = (set: Set<any>, setter: any, val: any) => {
    const newSet = new Set(set);
    if (newSet.has(val)) newSet.delete(val);
    else newSet.add(val);
    setter(newSet);
  };

  const reset = () => {
    setExcludedMistakes(new Set());
    setExcludedSessions(new Set());
    setExcludedDays(new Set());
  };

  if (trades.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
        <Layers size={32} className="text-text-muted mb-4 opacity-20" />
        <p className="text-text-primary font-semibold text-sm">No Data for Simulation</p>
        <p className="text-xs text-text-muted mt-1">Log some trades to see what-if scenarios.</p>
      </GlassCard>
    );
  }

  const pnlDiff = simulatedMetrics.totalNetPnl - originalMetrics.totalNetPnl;
  const wrDiff = simulatedMetrics.winRate - originalMetrics.winRate;
  const pfDiff = simulatedMetrics.profitFactor - originalMetrics.profitFactor;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Control Panel */}
      <div className="space-y-4">
        <GlassCard className="p-4 border-border-subtle hover:border-accent-violet/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-[family-name:var(--font-inter)] font-bold text-sm flex items-center gap-2">
              <AlertTriangle size={14} className="text-accent-coral" /> Exclude Mistakes
            </h3>
          </div>
          {availableMistakes.length === 0 ? (
            <div className="text-xs text-text-muted italic">No mistakes logged yet.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableMistakes.map(m => (
                <button
                  key={m}
                  onClick={() => toggleSet(excludedMistakes, setExcludedMistakes, m)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border",
                    excludedMistakes.has(m)
                      ? "bg-accent-coral/10 text-accent-coral border-accent-coral/30"
                      : "bg-bg-secondary border-border-subtle text-text-secondary hover:text-text-primary"
                  )}
                >
                  {excludedMistakes.has(m) ? "❌ Excluded" : "✅ Included"} : {m}
                </button>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4 border-border-subtle hover:border-accent-violet/30 transition-all">
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-sm flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-accent-violet" /> Exclude Days of Week
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5].map(d => ( // Mon-Fri
              <button
                key={d}
                onClick={() => toggleSet(excludedDays, setExcludedDays, d)}
                className={cn(
                  "px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border flex justify-between items-center",
                  excludedDays.has(d)
                    ? "bg-accent-coral/10 text-accent-coral border-accent-coral/30"
                    : "bg-bg-secondary border-border-subtle text-text-secondary hover:text-text-primary"
                )}
              >
                <span>{daysOfWeek[d]}</span>
                {excludedDays.has(d) ? "❌" : "✅"}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4 border-border-subtle hover:border-accent-violet/30 transition-all">
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-sm flex items-center gap-2 mb-4">
            <Clock size={14} className="text-accent-violet" /> Exclude Sessions
          </h3>
          {availableSessions.length === 0 ? (
            <div className="text-xs text-text-muted italic">No sessions logged.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableSessions.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSet(excludedSessions, setExcludedSessions, s)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border",
                    excludedSessions.has(s)
                      ? "bg-accent-coral/10 text-accent-coral border-accent-coral/30"
                      : "bg-bg-secondary border-border-subtle text-text-secondary hover:text-text-primary"
                  )}
                >
                  {excludedSessions.has(s) ? "❌" : "✅"} {s}
                </button>
              ))}
            </div>
          )}
        </GlassCard>
        
        <button
          onClick={reset}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-bg-secondary border border-border-subtle text-xs font-bold text-text-muted hover:text-text-primary transition-all"
        >
          <RefreshCw size={14} /> Reset Simulation
        </button>
      </div>

      {/* Results Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard className="p-4 text-center">
            <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-2">Net P&L</div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-text-secondary line-through text-sm font-[family-name:var(--font-space-mono)]">
                {formatCurrency(originalMetrics.totalNetPnl)}
              </span>
              <ArrowRight size={14} className="text-text-muted" />
              <span className={cn("text-xl font-bold font-[family-name:var(--font-space-mono)]", simulatedMetrics.totalNetPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                {formatCurrency(simulatedMetrics.totalNetPnl)}
              </span>
            </div>
            {pnlDiff !== 0 && (
              <div className={cn("text-[10px] font-bold mt-2", pnlDiff > 0 ? "text-accent-green" : "text-accent-coral")}>
                {pnlDiff > 0 ? "+" : ""}{formatCurrency(pnlDiff)} Difference
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-4 text-center">
            <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-2">Win Rate</div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-text-secondary line-through text-sm font-[family-name:var(--font-space-mono)]">
                {originalMetrics.winRate.toFixed(1)}%
              </span>
              <ArrowRight size={14} className="text-text-muted" />
              <span className={cn("text-xl font-bold font-[family-name:var(--font-space-mono)]", simulatedMetrics.winRate >= 50 ? "text-accent-green" : "text-accent-coral")}>
                {simulatedMetrics.winRate.toFixed(1)}%
              </span>
            </div>
            {wrDiff !== 0 && (
              <div className={cn("text-[10px] font-bold mt-2", wrDiff > 0 ? "text-accent-green" : "text-accent-coral")}>
                {wrDiff > 0 ? "+" : ""}{wrDiff.toFixed(1)}% Difference
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-4 text-center">
            <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-2">Profit Factor</div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-text-secondary line-through text-sm font-[family-name:var(--font-space-mono)]">
                {originalMetrics.profitFactor.toFixed(2)}
              </span>
              <ArrowRight size={14} className="text-text-muted" />
              <span className={cn("text-xl font-bold font-[family-name:var(--font-space-mono)] text-accent-violet")}>
                {simulatedMetrics.profitFactor.toFixed(2)}
              </span>
            </div>
            {pfDiff !== 0 && (
              <div className={cn("text-[10px] font-bold mt-2", pfDiff > 0 ? "text-accent-green" : "text-accent-coral")}>
                {pfDiff > 0 ? "+" : ""}{pfDiff.toFixed(2)} Difference
              </div>
            )}
          </GlassCard>
        </div>

        <GlassCard className="h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Equity Curve Comparison</h3>
            <div className="flex gap-4 text-[10px] uppercase font-bold tracking-wider">
              <div className="flex items-center gap-1.5 text-text-secondary"><div className="w-3 h-0.5 bg-text-secondary" /> Original</div>
              <div className="flex items-center gap-1.5 text-accent-violet"><div className="w-3 h-0.5 bg-accent-violet" /> Simulated</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B61FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7B61FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" hide />
              <YAxis
                domain={["dataMin - 500", "dataMax + 500"]}
                tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                axisLine={false} tickLine={false} width={55}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="glass-static px-3 py-2 rounded-lg text-xs">
                      <p className="text-text-secondary mb-1">{label}</p>
                      <p className="text-text-secondary flex justify-between gap-4">
                        Orig: <span className="font-[family-name:var(--font-space-mono)] font-bold">{formatCurrency(payload[0].value as number)}</span>
                      </p>
                      <p className="text-accent-violet flex justify-between gap-4">
                        Sim: <span className="font-[family-name:var(--font-space-mono)] font-bold">{formatCurrency(payload[1].value as number)}</span>
                      </p>
                    </div>
                  );
                }}
              />
              <Area type="step" dataKey="orig" stroke="#8B8FA3" strokeWidth={1} strokeDasharray="4 4" fill="none" />
              <Area type="step" dataKey="sim" stroke="#7B61FF" strokeWidth={2} fill="url(#simGrad)" animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
