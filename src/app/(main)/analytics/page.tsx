"use client";
import { useTradeStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { calculateMetrics, getDailyStats, getWinRateByField, getPnlBySymbol, getRMultipleDistribution, getHourlyHeatmap, getWinRateByMindset, getCrossAnalysis, getDurationVsPnl, getMonthlyBreakdown, getMistakesPnL } from "@/lib/calculations";
import { formatCurrency, formatDuration, cn, getHeatmapColor } from "@/lib/utils";
import { useMemo, useEffect, useRef, useState } from "react";
import { subDays, subMonths, isAfter, startOfYear } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid, PieChart, Pie,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, DollarSign, Clock, Activity, Zap, BarChart3, Award, AlertTriangle, Brain, Crosshair, Calendar, Download, Grid3X3, Timer, CheckCircle, Shield, Trophy, Lightbulb, Flame, TrendingUpIcon } from "lucide-react";
import { MaeMfeChart } from "@/components/ui/mae-mfe-chart";
import { AiCoach } from "@/components/ui/ai-coach";
import { DayHourHeatmap } from "@/components/ui/day-hour-heatmap";
import { WhatIfSimulator } from "@/components/ui/what-if-simulator";
import { useSettingsStore } from "@/stores";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-static px-3 py-2 rounded-lg text-xs">
      <p className="text-text-secondary mb-0.5">{label}</p>
      <p className="font-[family-name:var(--font-space-mono)] font-bold text-text-primary">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
};

function MetricCard({ label, value, format, icon: Icon, color = "text-text-primary", delay = 0 }: {
  label: string; value: number; format: (v: number) => string; icon: React.ElementType; color?: string; delay?: number;
}) {
  return (
    <motion.div
      className="glass p-4 flex items-center gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center bg-opacity-10", color.replace("text-", "bg-") + "/10")}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <div className="text-[10px] text-text-muted uppercase tracking-wider">{label}</div>
        <NumberTicker value={value} format={format} className={cn("text-lg font-bold", color)} />
      </div>
    </motion.div>
  );
}

type ViewMode = "$" | "R" | "%";

function EquityCurveChart({ trades, viewMode = "$" }: { trades: ReturnType<typeof useTradeStore.getState>["trades"]; viewMode?: ViewMode }) {
  const data = useMemo(() => {
    const start = trades.length > 0 ? trades[0].accountEquityAfter - trades[0].netPnl : 50000;
    if (viewMode === "$") {
      const points = [{ name: "Start", value: start }];
      trades.forEach((t, i) => {
        points.push({ name: `T${i + 1}`, value: t.accountEquityAfter });
      });
      return points;
    } else if (viewMode === "R") {
      let cumR = 0;
      const points = [{ name: "Start", value: 0 }];
      trades.forEach((t, i) => {
        cumR += t.rMultiple || 0;
        points.push({ name: `T${i + 1}`, value: parseFloat(cumR.toFixed(2)) });
      });
      return points;
    } else {
      let cumPct = 0;
      const points = [{ name: "Start", value: 0 }];
      trades.forEach((t, i) => {
        cumPct += start > 0 ? (t.netPnl / start) * 100 : 0;
        points.push({ name: `T${i + 1}`, value: parseFloat(cumPct.toFixed(2)) });
      });
      return points;
    }
  }, [trades, viewMode]);

  const formatYAxis = (v: number) => {
    if (viewMode === "$") return `$${(v / 1000).toFixed(1)}k`;
    if (viewMode === "R") return `${v.toFixed(1)}R`;
    return `${v.toFixed(1)}%`;
  };

  const formatTooltipVal = (v: number) => {
    if (viewMode === "$") return formatCurrency(v);
    if (viewMode === "R") return `${v.toFixed(2)}R`;
    return `${v.toFixed(2)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FFB2" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#00FFB2" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis dataKey="name" hide />
        <YAxis
          domain={viewMode === "$" ? ["dataMin - 500", "dataMax + 500"] : ["dataMin - 1", "dataMax + 1"]}
          tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
          tickFormatter={formatYAxis}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="glass-static px-3 py-2 rounded-lg text-xs">
                <p className="text-text-secondary mb-0.5">{label}</p>
                <p className="font-[family-name:var(--font-space-mono)] font-bold text-text-primary">
                  {formatTooltipVal(payload[0].value as number)}
                </p>
              </div>
            );
          }}
        />
        <Area type="monotone" dataKey="value" stroke="#00FFB2" strokeWidth={2} fill="url(#eqGrad)" animationDuration={1500} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DailyPnlChart({ trades, viewMode = "$" }: { trades: ReturnType<typeof useTradeStore.getState>["trades"]; viewMode?: ViewMode }) {
  const data = useMemo(() => {
    const daily = getDailyStats(trades);
    if (viewMode === "$") return daily;
    if (viewMode === "R") {
      // Group R-multiples by day
      const rMap = new Map<string, number>();
      trades.forEach(t => {
        try {
          const d = new Date(t.entryDate).toISOString().split("T")[0];
          rMap.set(d, (rMap.get(d) || 0) + (t.rMultiple || 0));
        } catch { /* skip */ }
      });
      return daily.map(d => ({ ...d, pnl: parseFloat((rMap.get(d.date) || 0).toFixed(2)) }));
    }
    // % mode: daily P&L as percentage of starting equity
    const startEquity = trades.length > 0 ? trades[0].accountEquityAfter - trades[0].netPnl : 50000;
    return daily.map(d => ({ ...d, pnl: startEquity > 0 ? parseFloat(((d.pnl / startEquity) * 100).toFixed(2)) : 0 }));
  }, [trades, viewMode]);

  const formatYAxis = (v: number) => {
    if (viewMode === "$") return `$${v}`;
    if (viewMode === "R") return `${v.toFixed(1)}R`;
    return `${v.toFixed(1)}%`;
  };

  const formatTooltipVal = (v: number) => {
    if (viewMode === "$") return formatCurrency(v);
    if (viewMode === "R") return `${v.toFixed(2)}R`;
    return `${v.toFixed(2)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#8B8FA3", fontSize: 9, fontFamily: "Space Mono" }}
          tickFormatter={(v: string) => v.slice(5)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
          tickFormatter={formatYAxis}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="glass-static px-3 py-2 rounded-lg text-xs">
                <p className="text-text-secondary mb-0.5">{label}</p>
                <p className="font-[family-name:var(--font-space-mono)] font-bold text-text-primary">
                  {formatTooltipVal(payload[0].value as number)}
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]} animationDuration={1200}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? "#00FFB2" : "#FF2D55"} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function WinRateChart({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const data = useMemo(() => getWinRateByField(trades, "sessionTag"), [trades]);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]}
          tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
          tickFormatter={(v: number) => `${v}%`}
          axisLine={false} tickLine={false}
        />
        <YAxis dataKey="name" type="category"
          tick={{ fill: "#8B8FA3", fontSize: 10 }}
          axisLine={false} tickLine={false} width={80}
        />
        <Tooltip formatter={(v) => [`${v}%`, "Win Rate"]}
          contentStyle={{ background: "rgba(17,20,32,0.9)", border: "1px solid rgba(0,255,178,0.12)", borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="winRate" radius={[0, 4, 4, 0]} animationDuration={1200}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.winRate >= 50 ? "#00FFB2" : "#FF2D55"} fillOpacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function PnlBySymbolChart({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const data = useMemo(() => getPnlBySymbol(trades).slice(0, 10), [trades]);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
        <XAxis type="number"
          tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
          tickFormatter={(v: number) => `$${v}`}
          axisLine={false} tickLine={false}
        />
        <YAxis dataKey="symbol" type="category"
          tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
          axisLine={false} tickLine={false} width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="pnl" radius={[0, 4, 4, 0]} animationDuration={1200}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? "#00FFB2" : "#FF2D55"} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RDistributionChart({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const data = useMemo(() => getRMultipleDistribution(trades), [trades]);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis dataKey="range"
          tick={{ fill: "#8B8FA3", fontSize: 8 }}
          axisLine={false} tickLine={false}
          interval={0} angle={-30} textAnchor="end" height={50}
        />
        <YAxis tick={{ fill: "#8B8FA3", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "rgba(17,20,32,0.9)", border: "1px solid rgba(123,97,255,0.2)", borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={1200}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.range.includes("-") ? "#FF2D55" : "#7B61FF"} fillOpacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function MindsetPerformanceChart({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const data = useMemo(() => getWinRateByMindset(trades), [trades]);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="name" 
          tick={{ fill: "#8B8FA3", fontSize: 10 }}
          axisLine={false} tickLine={false}
          interval={0}
        />
        <YAxis 
          tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
          tickFormatter={(v: number) => `$${v}`}
          axisLine={false} tickLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]} animationDuration={1500}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? "#00FFB2" : "#FF2D55"} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}


function HourlyHeatmap({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const data = useMemo(() => getHourlyHeatmap(trades), [trades]);
  const maxPnl = Math.max(...data.map((d) => Math.abs(d.avgPnl)), 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="min-w-[600px]">
        <div className="flex gap-0.5 mb-1 pl-10">
          {hours.filter((_, i) => i % 3 === 0).map((h) => (
            <div key={h} className="text-[8px] text-text-muted" style={{ width: `${100 / 8}%` }}>
              {h.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {days.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px] text-text-muted w-8 text-right">{day}</span>
            <div className="flex gap-0.5 flex-1">
              {hours.map((hour) => {
                const cell = data.find((d) => d.day === dayIdx + 1 && d.hour === hour);
                const bg = cell && cell.count > 0 ? getHeatmapColor(cell.avgPnl, maxPnl) : "rgba(75,80,100,0.08)";
                return (
                  <div
                    key={hour}
                    className="flex-1 aspect-[2/1] rounded-[2px] cursor-pointer hover:ring-1 hover:ring-white/20 transition-all"
                    style={{ backgroundColor: bg }}
                    title={cell && cell.count > 0 ? `${day} ${hour}:00 — Avg: ${formatCurrency(cell.avgPnl)} (${cell.count} trades)` : `${day} ${hour}:00 — No trades`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonteCarloChart({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const data = useMemo(() => {
    // Generate 100 random equity curves based on past trades
    if (trades.length < 5) return [];
    
    const simulations = 50;
    const tradesCount = 50;
    const results: any[] = [];
    const pnls = trades.map(t => t.netPnl);
    
    for (let step = 0; step <= tradesCount; step++) {
      results.push({ step });
    }
    
    for (let sim = 0; sim < simulations; sim++) {
      let equity = 50000;
      results[0][`sim${sim}`] = equity;
      for (let step = 1; step <= tradesCount; step++) {
        // Randomly sample from past trades with replacement
        const randomPnl = pnls[Math.floor(Math.random() * pnls.length)];
        equity += randomPnl;
        results[step][`sim${sim}`] = equity;
      }
    }
    return results;
  }, [trades]);

  if (trades.length < 5) {
    return <div className="h-full flex items-center justify-center text-sm text-text-muted">Not enough data for simulation. Minimum 5 trades required.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis dataKey="step" hide />
        <YAxis
          domain={["dataMin - 1000", "dataMax + 1000"]}
          tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
          axisLine={false} tickLine={false} width={55}
        />
        {Array.from({ length: 50 }).map((_, i) => (
          <Area
            key={`sim${i}`}
            type="monotone"
            dataKey={`sim${i}`}
            stroke="rgba(123,97,255,0.15)"
            fill="none"
            isAnimationActive={true}
            animationDuration={2000}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MistakeCostChart({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const data = useMemo(() => {
    const map = new Map<string, { count: number; pnl: number }>();
    trades.forEach(t => {
      t.mistakeTags?.forEach(tag => {
        const existing = map.get(tag) ?? { count: 0, pnl: 0 };
        existing.count++;
        existing.pnl += t.netPnl;
        map.set(tag, existing);
      });
    });
    return Array.from(map.entries())
      .map(([name, { count, pnl }]) => ({ name, count, pnl: parseFloat(pnl.toFixed(2)) }))
      .sort((a, b) => a.pnl - b.pnl); // Most expensive mistakes first
  }, [trades]);

  if (data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-sm text-text-muted py-10">
        <Target className="text-accent-green mb-2 opacity-30" size={24} />
        <p className="font-semibold text-xs">No execution mistakes logged!</p>
        <p className="text-[10px] mt-0.5">Your portfolio has absolute rule compliance.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#8B8FA3", fontSize: 9, fontFamily: "Space Mono" }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" tick={{ fill: "#8B8FA3", fontSize: 9 }} axisLine={false} tickLine={false} width={100} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="pnl" radius={[0, 4, 4, 0]} animationDuration={1200}>
          {data.map((entry, i) => (
            <Cell key={i} fill="#FF2D55" fillOpacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DayOfWeekPerformanceChart({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const data = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const map: Record<string, { pnl: number; count: number }> = {};
    
    // Initialize trading days
    for (let i = 1; i <= 5; i++) {
      map[days[i]] = { pnl: 0, count: 0 };
    }

    trades.forEach(t => {
      const dayName = days[new Date(t.entryDate).getDay()];
      if (map[dayName]) {
        map[dayName].pnl += t.netPnl;
        map[dayName].count++;
      }
    });

    return Object.entries(map).map(([name, { pnl, count }]) => ({
      name,
      pnl: parseFloat(pnl.toFixed(2)),
      count
    }));
  }, [trades]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis dataKey="name" tick={{ fill: "#8B8FA3", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }} tickFormatter={(v: number) => `$${v}`} axisLine={false} tickLine={false} width={55} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]} animationDuration={1200}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? "#00FFB2" : "#FF2D55"} fillOpacity={0.7} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Monthly P&L Summary Table                                */
/* ═══════════════════════════════════════════════════════════ */
function MonthlyPnlTable({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const monthlyData = useMemo(() => getMonthlyBreakdown(trades), [trades]);

  const totals = useMemo(() => {
    if (monthlyData.length === 0) return null;
    const netPnl = monthlyData.reduce((s, m) => s + m.netPnl, 0);
    const totalTrades = monthlyData.reduce((s, m) => s + m.trades, 0);
    const totalWins = monthlyData.reduce((s, m) => s + Math.round((m.winRate / 100) * m.trades), 0);
    const bestDay = Math.max(...monthlyData.map(m => m.bestDay));
    const worstDay = Math.min(...monthlyData.map(m => m.worstDay));
    const grossWins = monthlyData.reduce((s, m) => {
      const wins = trades.filter(t => {
        try { return t.entryDate.startsWith(m.month) && t.result === "win"; } catch { return false; }
      });
      return s + wins.reduce((ss, t) => ss + t.netPnl, 0);
    }, 0);
    const grossLosses = Math.abs(monthlyData.reduce((s, m) => {
      const losses = trades.filter(t => {
        try { return t.entryDate.startsWith(m.month) && t.result === "loss"; } catch { return false; }
      });
      return s + losses.reduce((ss, t) => ss + t.netPnl, 0);
    }, 0));
    return {
      netPnl,
      winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
      trades: totalTrades,
      bestDay,
      worstDay,
      profitFactor: grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0,
    };
  }, [monthlyData, trades]);

  const bestMonth = useMemo(() => monthlyData.length > 0 ? monthlyData.reduce((b, m) => m.netPnl > b.netPnl ? m : b, monthlyData[0]) : null, [monthlyData]);
  const worstMonth = useMemo(() => monthlyData.length > 0 ? monthlyData.reduce((w, m) => m.netPnl < w.netPnl ? m : w, monthlyData[0]) : null, [monthlyData]);

  if (monthlyData.length === 0) {
    return (
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-accent-violet" />
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Monthly P&L Summary</h3>
        </div>
        <div className="h-32 flex items-center justify-center text-sm text-text-muted">No monthly data available yet.</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-accent-violet" />
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Monthly P&L Summary</h3>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted px-2 py-1 rounded-lg bg-bg-secondary/40 border border-border-subtle">
          {monthlyData.length} months
        </span>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left py-2.5 px-3 text-[10px] uppercase tracking-widest font-black text-text-muted">Month</th>
              <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-widest font-black text-text-muted">Net P&L</th>
              <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-widest font-black text-text-muted">Win Rate</th>
              <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-widest font-black text-text-muted">Trades</th>
              <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-widest font-black text-text-muted">Best Day</th>
              <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-widest font-black text-text-muted">Worst Day</th>
              <th className="text-right py-2.5 px-3 text-[10px] uppercase tracking-widest font-black text-text-muted">PF</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((row) => {
              const isBest = bestMonth && row.month === bestMonth.month && monthlyData.length > 1;
              const isWorst = worstMonth && row.month === worstMonth.month && monthlyData.length > 1;
              return (
                <tr
                  key={row.month}
                  className={cn(
                    "border-b border-border-subtle/50 hover:bg-white/[0.02] transition-colors",
                    isBest && "bg-accent-green/[0.03]",
                    isWorst && "bg-accent-coral/[0.03]"
                  )}
                >
                  <td className="py-2.5 px-3 font-[family-name:var(--font-space-mono)] font-semibold text-text-primary">
                    <div className="flex items-center gap-2">
                      {row.month}
                      {isBest && <span className="text-[8px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green font-black uppercase tracking-wider">Best</span>}
                      {isWorst && <span className="text-[8px] px-1.5 py-0.5 rounded bg-accent-coral/10 text-accent-coral font-black uppercase tracking-wider">Worst</span>}
                    </div>
                  </td>
                  <td className={cn(
                    "py-2.5 px-3 text-right font-[family-name:var(--font-space-mono)] font-bold",
                    row.netPnl >= 0 ? "text-accent-green" : "text-accent-coral"
                  )}>
                    {row.netPnl >= 0 ? "+" : ""}{formatCurrency(row.netPnl)}
                  </td>
                  <td className={cn(
                    "py-2.5 px-3 text-right font-[family-name:var(--font-space-mono)]",
                    row.winRate >= 50 ? "text-accent-green" : "text-accent-coral"
                  )}>
                    {row.winRate.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-[family-name:var(--font-space-mono)] text-text-secondary">{row.trades}</td>
                  <td className="py-2.5 px-3 text-right font-[family-name:var(--font-space-mono)] text-accent-green">
                    +{formatCurrency(row.bestDay)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-[family-name:var(--font-space-mono)] text-accent-coral">
                    {formatCurrency(row.worstDay)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-[family-name:var(--font-space-mono)] text-text-secondary">
                    {row.profitFactor === Infinity ? "∞" : row.profitFactor.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="border-t-2 border-accent-violet/20 bg-accent-violet/[0.03]">
                <td className="py-3 px-3 font-bold text-text-primary uppercase tracking-wider text-[10px]">Total</td>
                <td className={cn(
                  "py-3 px-3 text-right font-[family-name:var(--font-space-mono)] font-black text-sm",
                  totals.netPnl >= 0 ? "text-accent-green" : "text-accent-coral"
                )}>
                  {totals.netPnl >= 0 ? "+" : ""}{formatCurrency(totals.netPnl)}
                </td>
                <td className="py-3 px-3 text-right font-[family-name:var(--font-space-mono)] font-bold text-text-primary">{totals.winRate.toFixed(1)}%</td>
                <td className="py-3 px-3 text-right font-[family-name:var(--font-space-mono)] font-bold text-text-primary">{totals.trades}</td>
                <td className="py-3 px-3 text-right font-[family-name:var(--font-space-mono)] text-accent-green font-bold">+{formatCurrency(totals.bestDay)}</td>
                <td className="py-3 px-3 text-right font-[family-name:var(--font-space-mono)] text-accent-coral font-bold">{formatCurrency(totals.worstDay)}</td>
                <td className="py-3 px-3 text-right font-[family-name:var(--font-space-mono)] font-bold text-text-primary">
                  {totals.profitFactor === Infinity ? "∞" : totals.profitFactor.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Trade Duration Scatter Plot                              */
/* ═══════════════════════════════════════════════════════════ */
function DurationScatterChart({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const data = useMemo(() => getDurationVsPnl(trades), [trades]);
  const wins = useMemo(() => data.filter(d => d.result === "win"), [data]);
  const losses = useMemo(() => data.filter(d => d.result === "loss"), [data]);

  if (data.length === 0) {
    return (
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Timer size={18} className="text-accent-blue" />
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Hold Time vs Outcome</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-sm text-text-muted">No duration data available yet.</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-accent-blue" />
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Hold Time vs Outcome</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-green" />
            <span className="text-[10px] text-text-muted">Wins ({wins.length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-coral" />
            <span className="text-[10px] text-text-muted">Losses ({losses.length})</span>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis
              type="number"
              dataKey="duration"
              name="Duration"
              unit="m"
              tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
              tickFormatter={(v: number) => v >= 60 ? `${(v / 60).toFixed(0)}h` : `${v}m`}
              axisLine={false}
              tickLine={false}
              label={{ value: "Duration", position: "insideBottom", offset: -5, style: { fill: "#8B8FA3", fontSize: 9 } }}
            />
            <YAxis
              type="number"
              dataKey="pnl"
              name="P&L"
              tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
              tickFormatter={(v: number) => `$${v}`}
              axisLine={false}
              tickLine={false}
              width={55}
              label={{ value: "P&L", angle: -90, position: "insideLeft", style: { fill: "#8B8FA3", fontSize: 9 } }}
            />
            <ZAxis range={[30, 120]} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="glass-static px-3 py-2 rounded-lg text-xs space-y-0.5">
                    <p className="font-bold text-text-primary font-[family-name:var(--font-space-mono)]">{d.symbol}</p>
                    <p className="text-text-secondary">Duration: <span className="text-text-primary font-[family-name:var(--font-space-mono)]">{d.duration >= 60 ? `${(d.duration / 60).toFixed(1)}h` : `${d.duration}m`}</span></p>
                    <p className="text-text-secondary">P&L: <span className={cn("font-bold font-[family-name:var(--font-space-mono)]", d.pnl >= 0 ? "text-accent-green" : "text-accent-coral")}>{formatCurrency(d.pnl)}</span></p>
                  </div>
                );
              }}
            />
            <Scatter name="Wins" data={wins} fill="#00FFB2" fillOpacity={0.7} />
            <Scatter name="Losses" data={losses} fill="#FF2D55" fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Cross-Analysis Heatmap (Strategy × Symbol)               */
/* ═══════════════════════════════════════════════════════════ */
function CrossAnalysisHeatmap({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const crossData = useMemo(() => getCrossAnalysis(trades, "playbook", "symbol"), [trades]);

  const { rows, cols, grid } = useMemo(() => {
    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    crossData.forEach(d => {
      rowSet.add(d.label1);
      colSet.add(d.label2);
    });
    const rows = Array.from(rowSet).sort();
    const cols = Array.from(colSet).sort();

    const grid = new Map<string, { winRate: number; count: number; pnl: number }>();
    crossData.forEach(d => {
      grid.set(`${d.label1}|||${d.label2}`, { winRate: d.winRate, count: d.count, pnl: d.pnl });
    });
    return { rows, cols, grid };
  }, [crossData]);

  const getCellBg = (winRate: number) => {
    if (winRate >= 70) return "bg-accent-green/25 border-accent-green/30";
    if (winRate >= 60) return "bg-accent-green/15 border-accent-green/20";
    if (winRate >= 40) return "bg-white/[0.04] border-border-subtle";
    if (winRate >= 30) return "bg-accent-coral/15 border-accent-coral/20";
    return "bg-accent-coral/25 border-accent-coral/30";
  };

  const getCellTextColor = (winRate: number) => {
    if (winRate >= 60) return "text-accent-green";
    if (winRate >= 40) return "text-text-secondary";
    return "text-accent-coral";
  };

  if (rows.length === 0 || cols.length === 0) {
    return (
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 size={18} className="text-accent-violet" />
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Strategy × Symbol Performance Matrix</h3>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-sm text-text-muted">
          <Grid3X3 className="mb-2 opacity-30" size={24} />
          <p className="font-semibold text-xs">Not enough cross-data yet</p>
          <p className="text-[10px] mt-0.5">Tag trades with playbooks and symbols to see the matrix.</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Grid3X3 size={18} className="text-accent-violet" />
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Strategy × Symbol Performance Matrix</h3>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-text-muted">
          <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-accent-green/25" /> &gt;60%</div>
          <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-white/[0.04]" /> 40-60%</div>
          <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-accent-coral/25" /> &lt;40%</div>
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-2 px-2 text-[9px] uppercase tracking-widest font-black text-text-muted sticky left-0 bg-bg-card z-10">Strategy</th>
              {cols.map(col => (
                <th key={col} className="text-center py-2 px-2 text-[9px] uppercase tracking-widest font-black text-text-muted whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row} className="border-t border-border-subtle/30">
                <td className="py-1.5 px-2 font-semibold text-text-primary whitespace-nowrap text-[10px] sticky left-0 bg-bg-card z-10">{row}</td>
                {cols.map(col => {
                  const cell = grid.get(`${row}|||${col}`);
                  if (!cell || cell.count === 0) {
                    return (
                      <td key={col} className="py-1.5 px-1">
                        <div className="w-full h-12 rounded-lg bg-white/[0.01] border border-border-subtle/30 flex items-center justify-center">
                          <span className="text-[9px] text-text-muted/40">—</span>
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td key={col} className="py-1.5 px-1">
                      <div className={cn(
                        "w-full h-12 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 cursor-default",
                        getCellBg(cell.winRate)
                      )}
                        title={`${row} × ${col}: ${cell.winRate.toFixed(0)}% WR, ${cell.count} trades, ${formatCurrency(cell.pnl)} P&L`}
                      >
                        <span className={cn("font-[family-name:var(--font-space-mono)] font-bold text-[11px]", getCellTextColor(cell.winRate))}>
                          {cell.winRate.toFixed(0)}%
                        </span>
                        <span className="text-[8px] text-text-muted">{cell.count} trades</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Psychology Intelligence Component                        */
/* ═══════════════════════════════════════════════════════════ */

function usePsychologyData(trades: ReturnType<typeof useTradeStore.getState>["trades"]) {
  return useMemo(() => {
    if (trades.length === 0) {
      return { revengeCount: 0, revengeTotal: 0, overtradingDays: 0, overtradingTotal: 0, fomoCount: 0, fomoTotal: 0, slMovedCount: 0, slMovedTotal: 0, afterHoursTotal: 0, psychScore: 100 };
    }

    // Sort trades chronologically
    const sorted = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    // 1. Revenge Trading — trades taken within 30min after a losing trade
    let revengeCount = 0;
    let revengeTotal = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].result === "loss") {
        const lossTime = new Date(sorted[i].entryDate).getTime();
        const tradesAfter = sorted.slice(i + 1).filter(t => {
          const tTime = new Date(t.entryDate).getTime();
          return tTime - lossTime <= 30 * 60 * 1000 && tTime > lossTime;
        });
        if (tradesAfter.length >= 2) {
          revengeCount++;
          revengeTotal += tradesAfter.reduce((s, t) => s + (t.netPnl < 0 ? t.netPnl : 0), 0);
        }
      }
    }

    // 2. Overtrading Days — days with 2x+ the average daily trades
    const dayMap = new Map<string, { pnl: number; count: number }>();
    sorted.forEach(t => {
      try {
        const d = new Date(t.entryDate).toISOString().split("T")[0];
        const existing = dayMap.get(d) ?? { pnl: 0, count: 0 };
        existing.pnl += t.netPnl;
        existing.count++;
        dayMap.set(d, existing);
      } catch { /* skip */ }
    });
    const dayValues = Array.from(dayMap.values());
    const avgTradesPerDay = dayValues.length > 0 ? dayValues.reduce((s, d) => s + d.count, 0) / dayValues.length : 0;
    const overtradingDays = dayValues.filter(d => d.count >= avgTradesPerDay * 2).length;
    const overtradingTotal = dayValues.filter(d => d.count >= avgTradesPerDay * 2).reduce((s, d) => s + (d.pnl < 0 ? d.pnl : 0), 0);

    // 3. FOMO Entries — emotion >= 3 AND loss
    const fomoTrades = sorted.filter(t => (t.emotion ?? 0) >= 3 && t.result === "loss");
    const fomoCount = fomoTrades.length;
    const fomoTotal = fomoTrades.reduce((s, t) => s + t.netPnl, 0);

    // 4. SL Moving / Rule Breaking
    const slMovedTrades = sorted.filter(t => t.mistakeTags?.some(tag => tag === "Moved SL" || tag === "Broke rules"));
    const slMovedCount = slMovedTrades.length;
    const slMovedTotal = slMovedTrades.reduce((s, t) => s + (t.netPnl < 0 ? t.netPnl : 0), 0);

    // 5. After-hours Overtrading — NY PM session with negative P&L
    const afterHoursTrades = sorted.filter(t => t.sessionTag === "NY PM" && t.netPnl < 0);
    const afterHoursTotal = afterHoursTrades.reduce((s, t) => s + t.netPnl, 0);

    // 6. Psychology Score
    const rawScore = 100 - (revengeCount * 8) - (overtradingDays * 5) - (fomoCount * 6) - (slMovedCount * 7);
    const psychScore = Math.max(0, Math.min(100, rawScore));

    return { revengeCount, revengeTotal, overtradingDays, overtradingTotal, fomoCount, fomoTotal, slMovedCount, slMovedTotal, afterHoursTotal, psychScore };
  }, [trades]);
}

function ScoreRing({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? "#00FFB2" : score >= 60 ? "#F59E0B" : "#FF2D55";
  const textColor = score >= 80 ? "text-accent-green" : score >= 60 ? "text-amber-400" : "text-accent-coral";
  const glowColor = score >= 80 ? "rgba(0,255,178,0.4)" : score >= 60 ? "rgba(245,158,11,0.4)" : "rgba(255,45,85,0.4)";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={radius} fill="none"
          stroke={color} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})`, transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-[family-name:var(--font-space-mono)] font-black text-2xl leading-none", textColor)}>{score}</span>
        <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function PatternRow({
  label, sublabel, count, pnl, hasIssue, delay
}: {
  label: string; sublabel: string; count: number | null; pnl: number | null; hasIssue: boolean; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
        hasIssue
          ? "bg-accent-coral/[0.04] border-accent-coral/15 hover:bg-accent-coral/[0.07]"
          : "bg-accent-green/[0.03] border-accent-green/12 hover:bg-accent-green/[0.06]"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
          hasIssue ? "bg-accent-coral/10" : "bg-accent-green/10"
        )}>
          {hasIssue
            ? <AlertTriangle size={14} className="text-accent-coral stroke-[2.5]" />
            : <CheckCircle size={14} className="text-accent-green stroke-[2.5]" />}
        </div>
        <div>
          <div className="text-sm font-bold text-text-primary">{label}</div>
          <div className="text-[10px] text-text-muted">{sublabel}</div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-right">
        {count !== null && (
          <div>
            <div className={cn(
              "font-[family-name:var(--font-space-mono)] font-bold text-sm",
              hasIssue ? "text-accent-coral" : "text-text-muted"
            )}>
              {count === 0 ? "None" : count}
            </div>
            {count > 0 && <div className="text-[9px] text-text-muted font-bold">{count === 1 ? "incident" : "incidents"}</div>}
          </div>
        )}
        {pnl !== null && pnl < 0 && (
          <div className="min-w-[72px]">
            <div className="font-[family-name:var(--font-space-mono)] font-black text-sm text-accent-coral">
              {formatCurrency(pnl)}
            </div>
            <div className="text-[9px] text-text-muted font-bold">impact</div>
          </div>
        )}
        {(!pnl || pnl === 0) && !hasIssue && (
          <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider px-2 py-1 rounded-lg bg-accent-green/10 border border-accent-green/15">Healthy</span>
        )}
      </div>
    </motion.div>
  );
}

function PsychologyIntelligence({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const [timeWindow, setTimeWindow] = useState<"week" | "all">("all");

  const filteredTrades = useMemo(() => {
    if (timeWindow === "all") return trades;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return trades.filter(t => {
      try { return new Date(t.entryDate) >= cutoff; } catch { return false; }
    });
  }, [trades, timeWindow]);

  const { revengeCount, revengeTotal, overtradingDays, overtradingTotal, fomoCount, fomoTotal, slMovedCount, slMovedTotal, afterHoursTotal, psychScore } = usePsychologyData(filteredTrades);

  const scoreLabel = psychScore >= 80 ? "Elite Discipline" : psychScore >= 60 ? "Needs Work" : "Danger Zone";
  const scoreDesc = psychScore >= 80
    ? "Your psychological discipline is strong. Keep consistent."
    : psychScore >= 60
    ? "Some behavioral patterns detected. Review flagged areas."
    : "Critical psychological risks detected. Take a trading break.";

  const totalIssues = (revengeCount > 0 ? 1 : 0) + (overtradingDays > 0 ? 1 : 0) + (fomoCount > 0 ? 1 : 0) + (slMovedCount > 0 ? 1 : 0) + (afterHoursTotal < 0 ? 1 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl border bg-[var(--bg-card)] border-[var(--border-subtle)] overflow-hidden"
    >
      {/* Header */}
      <div className="relative px-6 pt-5 pb-4 border-b border-[var(--border-subtle)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-violet/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-32 bg-accent-violet/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center">
              <Brain size={20} className="text-accent-violet" />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-inter)] font-black text-base text-text-primary">Psychology Intelligence</h3>
              <p className="text-[11px] text-text-muted mt-0.5">Behavioral pattern analysis from your trade history</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Window Toggle */}
            <div className="flex gap-1 bg-bg-secondary/50 p-1 rounded-lg border border-border-subtle">
              {(["week", "all"] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setTimeWindow(w)}
                  className={cn(
                    "px-3 py-1 text-[11px] rounded-md transition-all font-bold",
                    timeWindow === w
                      ? "bg-accent-violet/15 text-accent-violet border border-accent-violet/25"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  {w === "week" ? "This Week" : "All Time"}
                </button>
              ))}
            </div>
            {/* Issue count badge */}
            {totalIssues > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-coral/10 border border-accent-coral/20">
                <AlertTriangle size={11} className="text-accent-coral" />
                <span className="text-[11px] font-black text-accent-coral">{totalIssues} pattern{totalIssues > 1 ? "s" : ""} flagged</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Score Panel */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3 lg:w-48 lg:border-r lg:border-border-subtle lg:pr-6">
            <ScoreRing score={psychScore} />
            <div className="text-center">
              <div className={cn(
                "font-[family-name:var(--font-inter)] font-black text-sm",
                psychScore >= 80 ? "text-accent-green" : psychScore >= 60 ? "text-amber-400" : "text-accent-coral"
              )}>{scoreLabel}</div>
              <div className="text-[10px] text-text-muted mt-1 leading-relaxed max-w-[140px] mx-auto">{scoreDesc}</div>
            </div>
            {/* Score Breakdown */}
            <div className="w-full space-y-1.5 mt-1">
              <div className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">Score Breakdown</div>
              {[
                { label: "Revenge", deduction: revengeCount * 8 },
                { label: "Overtrade", deduction: overtradingDays * 5 },
                { label: "FOMO", deduction: fomoCount * 6 },
                { label: "SL Moved", deduction: slMovedCount * 7 },
              ].map(({ label, deduction }) => (
                <div key={label} className="flex items-center justify-between text-[10px]">
                  <span className="text-text-muted">{label}</span>
                  <span className={cn(
                    "font-[family-name:var(--font-space-mono)] font-bold",
                    deduction > 0 ? "text-accent-coral" : "text-accent-green"
                  )}>
                    {deduction > 0 ? `-${deduction}` : "0"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pattern Rows */}
          <div className="flex-1 space-y-2.5">
            <PatternRow
              label="Revenge Trading"
              sublabel="Trades taken within 30 min of a losing trade (2+ in sequence)"
              count={revengeCount}
              pnl={revengeTotal}
              hasIssue={revengeCount > 0}
              delay={0.1}
            />
            <PatternRow
              label="Overtrading Days"
              sublabel={`Days with 2× the daily average trade count`}
              count={overtradingDays}
              pnl={overtradingTotal}
              hasIssue={overtradingDays > 0}
              delay={0.15}
            />
            <PatternRow
              label="FOMO Entries"
              sublabel="Trades entered in overconfident/euphoric state (emotion ≥ 3) that lost"
              count={fomoCount}
              pnl={fomoTotal}
              hasIssue={fomoCount > 0}
              delay={0.2}
            />
            <PatternRow
              label="SL Violations"
              sublabel="Trades tagged with 'Moved SL' or 'Broke rules'"
              count={slMovedCount}
              pnl={slMovedTotal}
              hasIssue={slMovedCount > 0}
              delay={0.25}
            />
            <PatternRow
              label="After-hours Overtrading"
              sublabel="NY PM session trades with net negative P&L"
              count={null}
              pnl={afterHoursTotal}
              hasIssue={afterHoursTotal < 0}
              delay={0.3}
            />
          </div>
        </div>

        {/* Footer insight */}
        {filteredTrades.length === 0 && (
          <div className="mt-6 text-center text-sm text-text-muted">
            <Shield size={24} className="mx-auto mb-2 opacity-30" />
            <p>No trades in this period to analyze.</p>
          </div>
        )}
        {filteredTrades.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border-subtle flex items-center justify-between">
            <div className="text-[10px] text-text-muted">
              Analyzed <span className="text-text-secondary font-bold">{filteredTrades.length} trades</span> · Score penalizes dangerous patterns cumulatively
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent-green" />
              <span className="text-[9px] text-text-muted">Clean</span>
              <div className="w-2 h-2 rounded-full bg-amber-400 ml-2" />
              <span className="text-[9px] text-text-muted">Warning</span>
              <div className="w-2 h-2 rounded-full bg-accent-coral ml-2" />
              <span className="text-[9px] text-text-muted">Critical</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CapitalLeaksView({ trades, viewMode }: { trades: ReturnType<typeof useTradeStore.getState>["trades"]; viewMode: ViewMode }) {
  const data = useMemo(() => getMistakesPnL(trades), [trades]);

  const totalLost = data.reduce((s, d) => s + (d.pnl < 0 ? d.pnl : 0), 0);

  if (data.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center justify-center h-96">
        <AlertTriangle size={32} className="text-text-muted mb-4 opacity-50" />
        <h3 className="font-[family-name:var(--font-inter)] font-black text-xl mb-2 text-text-primary">No Capital Leaks Recorded</h3>
        <p className="text-sm text-text-secondary text-center max-w-sm">
          You haven't tagged any trades with Mistakes yet. Tag your losing trades with "FOMO", "Overleveraged", etc. to see where you are leaking capital.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leak Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="col-span-1 md:col-span-1 bg-accent-coral/[0.03] border-accent-coral/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-coral/10 text-accent-coral flex items-center justify-center border border-accent-coral/20">
              <AlertTriangle size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[10px] text-accent-coral uppercase font-black tracking-widest">Total Capital Leaked</div>
              <div className="font-[family-name:var(--font-space-mono)] font-black text-2xl text-accent-coral mt-0.5">
                {formatCurrency(totalLost)}
              </div>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-2">
            This is the total gross loss attributed directly to unforced errors and psychological mistakes.
          </p>
        </GlassCard>

        {/* Top 3 Mistakes */}
        <GlassCard className="col-span-1 md:col-span-2">
          <h3 className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-4">Biggest Offenders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.slice(0, 3).map((m, i) => (
              <div key={m.name} className="bg-bg-secondary/30 border border-border-subtle rounded-xl p-3 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wide truncate max-w-[120px]">{m.name}</span>
                  <span className="text-[10px] font-bold text-text-muted px-2 py-0.5 rounded-lg bg-bg-card border border-border-subtle">#{i + 1}</span>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-space-mono)] font-black text-accent-coral text-lg leading-none">{formatCurrency(m.pnl)}</div>
                  <div className="text-[9px] text-text-muted mt-1 font-bold">{m.count} trades affected</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Chart */}
      <GlassCard>
        <h3 className="font-[family-name:var(--font-inter)] font-bold text-base mb-4 flex items-center gap-2">
          <TrendingDown size={18} className="text-accent-coral" /> Mistake Impact Distribution
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
              <XAxis type="number"
                tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
                tickFormatter={(v: number) => `$${v}`}
                axisLine={false} tickLine={false}
              />
              <YAxis dataKey="name" type="category"
                tick={{ fill: "#8B8FA3", fontSize: 10, fontWeight: "bold" }}
                axisLine={false} tickLine={false} width={120}
              />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="glass-static px-3 py-2 rounded-lg text-xs border border-accent-coral/20">
                    <p className="text-text-secondary mb-0.5">{label}</p>
                    <p className="font-[family-name:var(--font-space-mono)] font-black text-accent-coral text-base">
                      {formatCurrency(payload[0].value as number)}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">{payload[0].payload.count} trades</p>
                  </div>
                );
              }} />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]} animationDuration={1200}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? "#00FFB2" : "#FF2D55"} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Time-of-Day Profitability Heatmap                        */
/* ═══════════════════════════════════════════════════════════ */
function TimeOfDayHeatmap({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6..20
  const DAYS = [
    { idx: 1, label: "Mon" },
    { idx: 2, label: "Tue" },
    { idx: 3, label: "Wed" },
    { idx: 4, label: "Thu" },
    { idx: 5, label: "Fri" },
  ];

  const grid = useMemo(() => {
    const g: Record<string, { total: number; count: number; wins: number }> = {};
    trades.forEach(trade => {
      if (!trade.entryDate) return;
      try {
        const date = new Date(trade.entryDate);
        const hour = date.getHours();
        const day = date.getDay();
        if (day === 0 || day === 6) return;
        if (hour < 6 || hour > 20) return;
        const key = `${day}-${hour}`;
        if (!g[key]) g[key] = { total: 0, count: 0, wins: 0 };
        g[key].total += trade.netPnl;
        g[key].count++;
        if (trade.result === "win") g[key].wins++;
      } catch { /* skip */ }
    });
    return g;
  }, [trades]);

  const allAvgs = Object.values(grid)
    .filter(c => c.count > 0)
    .map(c => c.total / c.count);
  const maxAbs = allAvgs.length > 0 ? Math.max(...allAvgs.map(Math.abs), 1) : 1;

  const getCellColor = (avg: number) => {
    const intensity = Math.min(Math.abs(avg) / maxAbs, 1);
    if (avg > 0) {
      const a = 0.08 + intensity * 0.55;
      return `rgba(0,255,178,${a.toFixed(2)})`;
    } else if (avg < 0) {
      const a = 0.08 + intensity * 0.55;
      return `rgba(255,45,85,${a.toFixed(2)})`;
    }
    return "rgba(255,255,255,0.04)";
  };

  const formatHour = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const disp = h % 12 || 12;
    return `${disp}${ampm}`;
  };

  if (trades.length === 0) {
    return (
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-accent-violet" />
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Peak Performance Hours</h3>
        </div>
        <div className="h-48 flex items-center justify-center text-sm text-text-muted">No trade data yet.</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center">
            <Clock size={16} className="text-accent-violet" />
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Peak Performance Hours</h3>
            <p className="text-[10px] text-text-muted">Avg P&L per hour block, weekdays only</p>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-10 h-3 rounded-sm" style={{ background: "linear-gradient(90deg,rgba(255,45,85,0.6),rgba(255,255,255,0.06),rgba(0,255,178,0.6))" }} />
          </div>
          <span>Losing → Neutral → Profitable</span>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        {/* Hour axis */}
        <div className="flex mb-1 ml-10">
          {HOURS.map(h => (
            <div key={h} className="flex-1 text-center text-[8px] text-text-muted font-[family-name:var(--font-space-mono)]">
              {formatHour(h)}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {DAYS.map(({ idx, label }) => (
          <div key={label} className="flex items-center gap-0 mb-0.5">
            <span className="text-[10px] text-text-muted w-10 flex-shrink-0 text-right pr-2 font-semibold">{label}</span>
            {HOURS.map(hour => {
              const cell = grid[`${idx}-${hour}`];
              const avg = cell && cell.count > 0 ? cell.total / cell.count : 0;
              const winRate = cell && cell.count > 0 ? (cell.wins / cell.count) * 100 : 0;
              const bg = cell && cell.count > 0 ? getCellColor(avg) : "rgba(255,255,255,0.03)";
              const tooltip = cell && cell.count > 0
                ? `${label} ${formatHour(hour)}\nAvg P&L: ${avg >= 0 ? "+" : ""}$${avg.toFixed(0)}\nWin Rate: ${winRate.toFixed(0)}%\nTrades: ${cell.count}`
                : `${label} ${formatHour(hour)} — No data`;
              return (
                <div
                  key={hour}
                  className="flex-1 mx-[1px] rounded-[3px] cursor-pointer hover:ring-1 hover:ring-white/25 hover:scale-110 transition-all duration-150"
                  style={{ backgroundColor: bg, height: 28 }}
                  title={tooltip}
                />
              );
            })}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Symbol Leaderboard                                       */
/* ═══════════════════════════════════════════════════════════ */
function SymbolLeaderboard({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const symbolStats = useMemo(() => {
    const map: Record<string, { pnl: number; wins: number; losses: number; count: number }> = {};
    trades.forEach(t => {
      if (!map[t.symbol]) map[t.symbol] = { pnl: 0, wins: 0, losses: 0, count: 0 };
      map[t.symbol].pnl += t.netPnl;
      map[t.symbol].count++;
      if (t.result === "win") map[t.symbol].wins++;
      else map[t.symbol].losses++;
    });
    return Object.entries(map)
      .map(([symbol, stats]) => ({
        symbol,
        ...stats,
        winRate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 8);
  }, [trades]);

  const rankStyle = (i: number) => {
    if (i === 0) return { color: "#FFD700", label: "#1", glow: "rgba(255,215,0,0.2)" };
    if (i === 1) return { color: "#C0C0C0", label: "#2", glow: "rgba(192,192,192,0.15)" };
    if (i === 2) return { color: "#CD7F32", label: "#3", glow: "rgba(205,127,50,0.15)" };
    return { color: "#8B8FA3", label: `#${i + 1}`, glow: "transparent" };
  };

  if (symbolStats.length === 0) {
    return (
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-accent-violet" />
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Symbol Leaderboard</h3>
        </div>
        <div className="h-48 flex items-center justify-center text-sm text-text-muted">No trade data yet.</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center">
            <Trophy size={16} className="text-accent-violet" />
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Symbol Leaderboard</h3>
            <p className="text-[10px] text-text-muted">Top 8 symbols by net P&L</p>
          </div>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted px-2 py-1 rounded-lg bg-bg-secondary/40 border border-border-subtle">
          {symbolStats.length} symbols
        </span>
      </div>

      <div className="space-y-2">
        {symbolStats.map((item, i) => {
          const rs = rankStyle(i);
          return (
            <motion.div
              key={item.symbol}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border-subtle/60 bg-white/[0.015] hover:bg-white/[0.03] transition-all group"
              style={{ boxShadow: i < 3 ? `0 0 12px ${rs.glow}` : undefined }}
            >
              {/* Rank */}
              <span
                className="font-[family-name:var(--font-space-mono)] font-black text-sm w-6 text-center flex-shrink-0"
                style={{ color: rs.color }}
              >
                {rs.label}
              </span>

              {/* Symbol */}
              <div className="flex-shrink-0 w-16">
                <span className="font-[family-name:var(--font-space-mono)] font-bold text-sm text-text-primary">
                  {item.symbol}
                </span>
                <div className="text-[9px] text-text-muted">{item.count} trades</div>
              </div>

              {/* Win rate bar */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-[9px] text-text-muted mb-1">
                  <span>Win Rate</span>
                  <span className="font-bold" style={{ color: item.winRate >= 50 ? "#00FFB2" : "#FF2D55" }}>
                    {item.winRate.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.winRate >= 50 ? "#00FFB2" : "#FF2D55" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.winRate}%` }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* P&L */}
              <div className="text-right flex-shrink-0 w-20">
                <div
                  className="font-[family-name:var(--font-space-mono)] font-black text-sm"
                  style={{ color: item.pnl >= 0 ? "#00FFB2" : "#FF2D55" }}
                >
                  {item.pnl >= 0 ? "+" : ""}{formatCurrency(item.pnl)}
                </div>
                <div className="text-[9px] text-text-muted">
                  {item.wins}W / {item.losses}L
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Smart Insights Panel                                     */
/* ═══════════════════════════════════════════════════════════ */
function SmartInsightsPanel({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const insights = useMemo(() => {
    const result: { icon: string; text: string; type: "good" | "bad" | "neutral" }[] = [];

    if (trades.length === 0) return result;

    // 1. Best session by avg P&L
    const sessionMap: Record<string, { total: number; count: number }> = {};
    trades.forEach(t => {
      const s = t.sessionTag || "Unknown";
      if (!sessionMap[s]) sessionMap[s] = { total: 0, count: 0 };
      sessionMap[s].total += t.netPnl;
      sessionMap[s].count++;
    });
    const sessions = Object.entries(sessionMap)
      .map(([name, { total, count }]) => ({ name, avg: count > 0 ? total / count : 0, count }))
      .filter(s => s.count >= 2)
      .sort((a, b) => b.avg - a.avg);
    if (sessions.length > 0 && sessions[0].avg > 0) {
      result.push({
        icon: "🌅",
        text: `Your best session is ${sessions[0].name} with avg ${sessions[0].avg >= 0 ? "+" : ""}$${sessions[0].avg.toFixed(0)} P&L per trade`,
        type: "good",
      });
    }

    // 2. Worst day of week by win rate
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayMap: Record<number, { wins: number; count: number }> = {};
    trades.forEach(t => {
      try {
        const day = new Date(t.entryDate).getDay();
        if (day === 0 || day === 6) return;
        if (!dayMap[day]) dayMap[day] = { wins: 0, count: 0 };
        dayMap[day].count++;
        if (t.result === "win") dayMap[day].wins++;
      } catch { /* skip */ }
    });
    const dayStats = Object.entries(dayMap)
      .map(([d, { wins, count }]) => ({ day: parseInt(d), name: dayNames[parseInt(d)], winRate: count > 0 ? (wins / count) * 100 : 0, count }))
      .filter(d => d.count >= 2);
    if (dayStats.length > 0) {
      const worstDay = dayStats.sort((a, b) => a.winRate - b.winRate)[0];
      if (worstDay.winRate < 45) {
        result.push({
          icon: "📅",
          text: `You lose most on ${worstDay.name}s (${worstDay.winRate.toFixed(0)}% win rate, ${worstDay.count} trades) — consider reducing size`,
          type: "bad",
        });
      }
    }

    // 3. Current win streak
    const sorted = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    let streak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].result === "win") streak++;
      else break;
    }
    if (streak >= 3) {
      result.push({
        icon: "🔥",
        text: `You're on a ${streak}-trade winning streak! Stay disciplined and don't over-leverage`,
        type: "good",
      });
    }

    // 4. Revenge trading signal (last 30 days)
    const recent = sorted.filter(t => {
      try { return Date.now() - new Date(t.entryDate).getTime() < 30 * 86400000; } catch { return false; }
    });
    let revengeCount = 0;
    for (let i = 0; i < recent.length - 1; i++) {
      if (recent[i].result === "loss") {
        const lossTime = new Date(recent[i].entryDate).getTime();
        const nextTime = new Date(recent[i + 1]?.entryDate || 0).getTime();
        if (nextTime - lossTime <= 20 * 60 * 1000 && nextTime > lossTime) revengeCount++;
      }
    }
    if (revengeCount >= 2) {
      result.push({
        icon: "⚠️",
        text: `Detected ${revengeCount} potential revenge trades in the last 30 days — wait at least 20 minutes after a loss`,
        type: "bad",
      });
    }

    // 5. Best performing symbol insight
    const symbolMap: Record<string, { pnl: number; count: number }> = {};
    trades.forEach(t => {
      if (!symbolMap[t.symbol]) symbolMap[t.symbol] = { pnl: 0, count: 0 };
      symbolMap[t.symbol].pnl += t.netPnl;
      symbolMap[t.symbol].count++;
    });
    const symbolList = Object.entries(symbolMap)
      .map(([sym, { pnl, count }]) => ({ sym, pnl, count }))
      .filter(s => s.count >= 3)
      .sort((a, b) => b.pnl - a.pnl);
    if (symbolList.length > 0 && symbolList[0].pnl > 0) {
      result.push({
        icon: "🎯",
        text: `${symbolList[0].sym} is your most profitable symbol with $${symbolList[0].pnl.toFixed(0)} net P&L across ${symbolList[0].count} trades`,
        type: "good",
      });
    }

    // 6. Profitability trend (last 10 vs previous 10)
    if (sorted.length >= 20) {
      const last10 = sorted.slice(-10).reduce((s, t) => s + t.netPnl, 0);
      const prev10 = sorted.slice(-20, -10).reduce((s, t) => s + t.netPnl, 0);
      if (last10 > 0 && last10 > prev10) {
        result.push({
          icon: "📈",
          text: `You're trending upward — last 10 trades earned $${last10.toFixed(0)}, vs $${prev10.toFixed(0)} in the 10 before`,
          type: "good",
        });
      } else if (last10 < 0 && last10 < prev10) {
        result.push({
          icon: "📉",
          text: `Your last 10 trades lost $${Math.abs(last10).toFixed(0)} vs $${Math.abs(prev10).toFixed(0)} previously — review your setups`,
          type: "bad",
        });
      }
    }

    return result.slice(0, 5);
  }, [trades]);

  const borderColor = (type: "good" | "bad" | "neutral") => {
    if (type === "good") return "border-l-accent-green bg-accent-green/[0.03]";
    if (type === "bad") return "border-l-accent-coral bg-accent-coral/[0.03]";
    return "border-l-accent-violet bg-accent-violet/[0.03]";
  };

  const tagColor = (type: "good" | "bad" | "neutral") => {
    if (type === "good") return "text-accent-green bg-accent-green/10 border-accent-green/20";
    if (type === "bad") return "text-accent-coral bg-accent-coral/10 border-accent-coral/20";
    return "text-accent-violet bg-accent-violet/10 border-accent-violet/20";
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center">
            <Lightbulb size={16} className="text-accent-violet" />
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Smart Insights</h3>
            <p className="text-[10px] text-text-muted">Auto-generated from your trading patterns</p>
          </div>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-accent-violet px-2 py-1 rounded-lg bg-accent-violet/10 border border-accent-violet/20">
          {insights.length} insight{insights.length !== 1 ? "s" : ""}
        </span>
      </div>

      {insights.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-sm text-text-muted">
          <Lightbulb size={28} className="mb-3 opacity-25" />
          <p className="font-semibold text-xs">Not enough data yet</p>
          <p className="text-[10px] mt-0.5">Log more trades to receive personalized insights</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35, ease: "easeOut" }}
              className={cn(
                "flex items-start gap-3 px-4 py-3 rounded-xl border border-l-4 transition-all hover:brightness-110",
                borderColor(insight.type)
              )}
            >
              <span className="text-base flex-shrink-0 mt-0.5">{insight.icon}</span>
              <p className="text-sm text-text-primary leading-relaxed flex-1">{insight.text}</p>
              <span className={cn(
                "flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border self-start mt-0.5",
                tagColor(insight.type)
              )}>
                {insight.type === "good" ? "Edge" : insight.type === "bad" ? "Risk" : "Note"}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export default function AnalyticsPage() {
  const { trades } = useTradeStore();
  const { settings } = useSettingsStore();
  const [timeRange, setTimeRange] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"Overview" | "Capital Leaks" | "What-If" | "AI Coach">("Overview");
  const [viewMode, setViewMode] = useState<ViewMode>("$");
  
  const filteredTrades = useMemo(() => {
    if (timeRange === "ALL") return trades;
    const now = new Date();
    let cutoff = now;
    if (timeRange === "1W") cutoff = subDays(now, 7);
    if (timeRange === "1M") cutoff = subMonths(now, 1);
    if (timeRange === "3M") cutoff = subMonths(now, 3);
    if (timeRange === "6M") cutoff = subMonths(now, 6);
    if (timeRange === "YTD") cutoff = startOfYear(now);
    
    return trades.filter((t) => isAfter(new Date(t.entryDate), cutoff));
  }, [trades, timeRange]);

  const metrics = useMemo(() => calculateMetrics(filteredTrades), [filteredTrades]);

  const hourlyStats = useMemo(() => {
    const map = new Map<number, { pnl: number; count: number }>();
    
    // Initialize hours
    for (let i = 0; i < 24; i++) {
      map.set(i, { pnl: 0, count: 0 });
    }

    filteredTrades.forEach(t => {
      const d = new Date(t.entryDate);
      const hour = d.getHours();
      const existing = map.get(hour) || { pnl: 0, count: 0 };
      existing.pnl += t.netPnl;
      existing.count++;
      map.set(hour, existing);
    });

    const list = Array.from(map.entries()).map(([hour, data]) => ({
      hour,
      pnl: parseFloat(data.pnl.toFixed(2)),
      count: data.count
    }));

    const sorted = [...list].sort((a, b) => b.pnl - a.pnl);
    const best = sorted[0]?.pnl > 0 ? sorted[0] : null;
    const worst = sorted[sorted.length - 1]?.pnl < 0 ? sorted[sorted.length - 1] : null;

    return { best, worst };
  }, [filteredTrades]);

  const formatHourLabel = (hour: number) => {
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    let sessionName = "Overnight Session";
    if (hour >= 8 && hour < 12) sessionName = "NY AM Session";
    else if (hour >= 12 && hour < 17) sessionName = "NY PM Session";
    else if (hour >= 2 && hour < 8) sessionName = "London Session";
    else if (hour >= 17 && hour < 22) sessionName = "Asian Session";
    
    return `${sessionName} (${displayHour}:00 ${ampm})`;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-end">
        <div className="flex gap-4 items-center">
          <div className="flex gap-1 bg-bg-card p-1 rounded-lg border border-border-subtle">
            {["Overview", "Capital Leaks", "What-If", "AI Coach"].map((tab) => (
              <button key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-4 py-1.5 text-xs rounded-md transition-all font-semibold",
                  activeTab === tab ? "bg-accent-violet/15 text-accent-violet border border-accent-violet/25 shadow-[0_0_10px_rgba(143,0,255,0.1)]" : "text-text-muted hover:text-text-secondary"
                )}>
                {tab}
              </button>
            ))}
          </div>
          <div className="w-[1px] h-6 bg-border-subtle" />
          <div className="flex gap-1 bg-bg-card p-1 rounded-lg border border-border-subtle">
            {(["$", "R", "%"] as ViewMode[]).map((mode) => (
              <button key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md transition-all font-bold font-[family-name:var(--font-space-mono)]",
                  viewMode === mode ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/25 shadow-[0_0_8px_rgba(0,186,255,0.1)]" : "text-text-muted hover:text-text-secondary"
                )}>
                {mode}
              </button>
            ))}
          </div>
          <div className="w-[1px] h-6 bg-border-subtle" />
          <div className="flex gap-1">
            {["1W", "1M", "3M", "6M", "YTD", "ALL"].map((range) => (
              <button key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg transition-all",
                  timeRange === range ? "bg-accent-green/10 text-accent-green border border-accent-green/25 shadow-[0_0_10px_rgba(0,255,178,0.08)]" : "bg-bg-card text-text-muted border border-border-subtle hover:border-accent-violet/20 hover:text-text-secondary"
                )}>
                {range}
              </button>
            ))}
          </div>
          <div className="w-[1px] h-6 bg-border-subtle" />
          {/* PDF Export */}
          <button
            onClick={() => {
              const el = document.getElementById("analytics-print-area");
              if (el) {
                const w = window.open("", "_blank");
                if (w) {
                  w.document.write(`<html><head><title>EdgeVault Analytics Report</title><style>body{font-family:Inter,sans-serif;padding:24px;background:#fff;color:#0d1117;}</style></head><body>${el.innerHTML}</body></html>`);
                  w.document.close();
                  w.print();
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-border-subtle bg-bg-card text-text-muted hover:text-accent-violet hover:border-accent-violet/25 transition-all"
          >
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>

      {/* Session Edges & Capital Leaks Badges */}
      {filteredTrades.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2 select-none">
          {hourlyStats.best && (
            <div className="relative overflow-hidden bg-white/[0.01] border border-accent-green/20 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(0,255,178,0.05)] hover:shadow-[0_0_25px_rgba(0,255,178,0.1)] transition-all duration-500">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-green/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-green/10 text-accent-green flex items-center justify-center border border-accent-green/20">
                  <Award size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-[10px] text-accent-green uppercase font-black tracking-widest">Peak Trading Edge Hour</div>
                  <div className="font-[family-name:var(--font-inter)] font-black text-sm text-text-primary mt-0.5">
                    {formatHourLabel(hourlyStats.best.hour)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green text-base">
                  +{formatCurrency(hourlyStats.best.pnl)}
                </div>
                <div className="text-[9px] text-text-muted mt-0.5 font-bold">
                  {hourlyStats.best.count} trades executed
                </div>
              </div>
            </div>
          )}

          {hourlyStats.worst && (
            <div className="relative overflow-hidden bg-white/[0.01] border border-accent-coral/20 rounded-2xl p-4 flex items-center justify-between shadow-[0_0_20px_rgba(255,45,85,0.05)] hover:shadow-[0_0_25px_rgba(255,45,85,0.1)] transition-all duration-500">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-coral/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-coral/10 text-accent-coral flex items-center justify-center border border-accent-coral/20">
                  <AlertTriangle size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-[10px] text-accent-coral uppercase font-black tracking-widest">Severe Capital Leak Hour</div>
                  <div className="font-[family-name:var(--font-inter)] font-black text-sm text-text-primary mt-0.5">
                    {formatHourLabel(hourlyStats.worst.hour)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-coral text-base">
                  {formatCurrency(hourlyStats.worst.pnl)}
                </div>
                <div className="text-[9px] text-text-muted mt-0.5 font-bold">
                  {hourlyStats.worst.count} trades executed
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "AI Coach" ? (
        <AiCoach trades={filteredTrades} geminiKey={settings.api.geminiKey} />
      ) : activeTab === "What-If" ? (
        <WhatIfSimulator trades={filteredTrades} />
      ) : activeTab === "Capital Leaks" ? (
        <CapitalLeaksView trades={filteredTrades} viewMode={viewMode} />
      ) : (
        <>
          {/* Metrics Grid */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.4 }}
          >
        <MetricCard label="Net P&L" value={metrics.totalNetPnl} format={(v) => formatCurrency(v)} icon={DollarSign} color={metrics.totalNetPnl >= 0 ? "text-accent-green" : "text-accent-coral"} delay={0} />
        <MetricCard label="Win Rate" value={metrics.winRate} format={(v) => `${v.toFixed(1)}%`} icon={Target} color={metrics.winRate >= 50 ? "text-accent-green" : "text-accent-coral"} delay={0.03} />
        <MetricCard label="Profit Factor" value={metrics.profitFactor} format={(v) => v.toFixed(2)} icon={TrendingUp} color="text-accent-violet" delay={0.06} />
        <MetricCard label="Avg Win" value={metrics.avgWin} format={(v) => formatCurrency(v, false)} icon={TrendingUp} color="text-accent-green" delay={0.09} />
        <MetricCard label="Avg Loss" value={metrics.avgLoss} format={(v) => `$${v.toFixed(2)}`} icon={TrendingDown} color="text-accent-coral" delay={0.12} />
        <MetricCard label="Max Drawdown" value={metrics.maxDrawdown} format={(v) => `${v.toFixed(2)}%`} icon={AlertTriangle} color="text-accent-coral" delay={0.15} />
        <MetricCard label="Sharpe Ratio" value={metrics.sharpeRatio} format={(v) => v.toFixed(2)} icon={Activity} color="text-accent-violet" delay={0.18} />
        <MetricCard label="Expectancy" value={metrics.expectancy} format={(v) => formatCurrency(v)} icon={Zap} color={metrics.expectancy >= 0 ? "text-accent-green" : "text-accent-coral"} delay={0.21} />
        <MetricCard label="Avg Hold Time" value={metrics.avgHoldTime} format={(v) => formatDuration(Math.round(v))} icon={Clock} color="text-text-primary" delay={0.24} />
        <MetricCard label="Total Commissions" value={metrics.totalCommissions} format={(v) => `$${v.toFixed(2)}`} icon={BarChart3} color="text-accent-coral" delay={0.27} />
      </motion.div>

      {/* Charts Row 1 */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <GlassCard>
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base mb-4">Equity Curve</h3>
          <div className="h-64">
            <EquityCurveChart trades={filteredTrades} viewMode={viewMode} />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base mb-4">Daily P&L</h3>
          <div className="h-64">
            <DailyPnlChart trades={filteredTrades} viewMode={viewMode} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <GlassCard>
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base mb-4">Win Rate by Session</h3>
          <div className="h-64">
            <WinRateChart trades={filteredTrades} />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base mb-4">P&L by Symbol</h3>
          <div className="h-64">
            <PnlBySymbolChart trades={filteredTrades} />
          </div>
        </GlassCard>
      </motion.div>


        {/* Charts Row 3: R-Distribution + Day×Hour Heatmap */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <GlassCard>
            <h3 className="font-[family-name:var(--font-inter)] font-bold text-base mb-4">R-Multiple Distribution</h3>
            <div className="h-64">
              <RDistributionChart trades={filteredTrades} />
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Performance Heatmap</h3>
              <span className="text-[10px] text-text-muted">Day × Hour • Total P&L per cell</span>
            </div>
            <DayHourHeatmap trades={filteredTrades} />
          </GlassCard>
        </motion.div>

      {/* Row: Mindset Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-accent-violet" />
              <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Psychological Performance (P&L by Mindset)</h3>
            </div>
            <span className="text-xs text-text-muted">Impact of emotional state on profitability</span>
          </div>
          <div className="h-64">
            <MindsetPerformanceChart trades={filteredTrades} />
          </div>
        </GlassCard>
      </motion.div>

      {/* TradeZella Capital Leaks & Days Performance Row */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-accent-coral" />
              <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Cost of Mistakes (Capital Leaks)</h3>
            </div>
            <span className="text-xs text-text-muted">Cumulative loss per mistake tag</span>
          </div>
          <div className="h-64">
            <MistakeCostChart trades={filteredTrades} />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-accent-violet" />
              <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Performance by Day of Week</h3>
            </div>
            <span className="text-xs text-text-muted">Cumulative P&L by trading day</span>
          </div>
          <div className="h-64">
            <DayOfWeekPerformanceChart trades={filteredTrades} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Charts Row 4: MAE / MFE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crosshair size={18} className="text-accent-violet" />
              <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Trade Execution (MAE / MFE)</h3>
            </div>
            <span className="text-xs text-text-muted">Analyze your stop-losses and take-profits</span>
          </div>
          <div className="h-64 mt-4">
            <MaeMfeChart trades={filteredTrades} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Day × Hour Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Day × Hour Performance Heatmap</h3>
              <p className="text-xs text-text-muted mt-0.5">Best and worst time windows across your trading week</p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted px-2 py-1 rounded-lg bg-bg-secondary/40 border border-border-subtle">30d data</span>
          </div>
          <DayHourHeatmap trades={filteredTrades} />
        </GlassCard>
      </motion.div>

      {/* Monte Carlo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.4 }}
      >
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Monte Carlo Simulation</h3>
            <span className="text-xs text-text-muted">50 simulations, 50 trades forward</span>
          </div>
          <div className="h-64">
            <MonteCarloChart trades={filteredTrades} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Streaks & Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <GlassCard>
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base mb-4">Records & Streaks</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <Award size={20} className="mx-auto text-accent-green mb-2" />
              <div className="text-xs text-text-muted mb-0.5">Max Win Streak</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-xl text-accent-green">{metrics.maxWinStreak}</div>
            </div>
            <div className="text-center">
              <AlertTriangle size={20} className="mx-auto text-accent-coral mb-2" />
              <div className="text-xs text-text-muted mb-0.5">Max Loss Streak</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-xl text-accent-coral">{metrics.maxLossStreak}</div>
            </div>
            <div className="text-center">
              <TrendingUp size={20} className="mx-auto text-accent-green mb-2" />
              <div className="text-xs text-text-muted mb-0.5">Best Day</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-lg text-accent-green">{formatCurrency(metrics.bestDay.pnl)}</div>
            </div>
            <div className="text-center">
              <TrendingDown size={20} className="mx-auto text-accent-coral mb-2" />
              <div className="text-xs text-text-muted mb-0.5">Worst Day</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-lg text-accent-coral">{formatCurrency(metrics.worstDay.pnl)}</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  NEW SECTIONS: Monthly P&L, Duration Scatter, Cross-Analysis  */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* Monthly P&L Summary Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.4 }}
      >
        <MonthlyPnlTable trades={filteredTrades} />
      </motion.div>

      {/* Trade Duration Scatter + Cross-Analysis Heatmap */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4 }}
      >
        <DurationScatterChart trades={filteredTrades} />
        <CrossAnalysisHeatmap trades={filteredTrades} />
      </motion.div>

      {/* Psychology Intelligence */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95, duration: 0.4 }}
      >
        <PsychologyIntelligence trades={filteredTrades} />
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  NEW: Time-of-Day Heatmap + Symbol Leaderboard (side by side) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.4 }}
      >
        <TimeOfDayHeatmap trades={filteredTrades} />
        <SymbolLeaderboard trades={filteredTrades} />
      </motion.div>

      {/* Smart Insights Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 0.4 }}
      >
        <SmartInsightsPanel trades={filteredTrades} />
      </motion.div>
      </>
      )}
    </div>
  );
}
