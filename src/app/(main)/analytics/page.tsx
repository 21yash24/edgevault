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
import { TrendingUp, TrendingDown, Target, DollarSign, Clock, Activity, Zap, BarChart3, Award, AlertTriangle, Brain, Crosshair, Calendar, Download, Grid3X3, Timer } from "lucide-react";
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

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
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
      </div>


        {/* Charts Row 3: R-Distribution + Day×Hour Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        </div>

      {/* Row: Mindset Performance */}
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

      {/* TradeZella Capital Leaks & Days Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
      </div>

      {/* Charts Row 4: MAE / MFE */}
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

      {/* Day × Hour Heatmap */}
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

      {/* Monte Carlo */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base">Monte Carlo Simulation</h3>
          <span className="text-xs text-text-muted">50 simulations, 50 trades forward</span>
        </div>
        <div className="h-64">
          <MonteCarloChart trades={filteredTrades} />
        </div>
      </GlassCard>

      {/* Streaks & Records */}
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

      {/* ═══════════════════════════════════════════════════ */}
      {/*  NEW SECTIONS: Monthly P&L, Duration Scatter, Cross-Analysis */}
      {/* ═══════════════════════════════════════════════════ */}

      {/* Monthly P&L Summary Table */}
      <MonthlyPnlTable trades={filteredTrades} />

      {/* Trade Duration Scatter + Cross-Analysis Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DurationScatterChart trades={filteredTrades} />
        <CrossAnalysisHeatmap trades={filteredTrades} />
      </div>
      </>
      )}
    </div>
  );
}
