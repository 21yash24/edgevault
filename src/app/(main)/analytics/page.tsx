"use client";
import { useTradeStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { calculateMetrics, getDailyStats, getWinRateByField, getPnlBySymbol, getRMultipleDistribution, getHourlyHeatmap, getWinRateByMindset } from "@/lib/calculations";
import { formatCurrency, formatDuration, cn, getHeatmapColor } from "@/lib/utils";
import { useMemo, useEffect, useRef, useState } from "react";
import { subDays, subMonths, isAfter, startOfYear } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid, PieChart, Pie,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, DollarSign, Clock, Activity, Zap, BarChart3, Award, AlertTriangle, Brain, Crosshair, Calendar, Download } from "lucide-react";
import { MaeMfeChart } from "@/components/ui/mae-mfe-chart";
import { AiCoach } from "@/components/ui/ai-coach";
import { DayHourHeatmap } from "@/components/ui/day-hour-heatmap";
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

function EquityCurveChart({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const data = useMemo(() => {
    const start = trades.length > 0 ? trades[0].accountEquityAfter - trades[0].netPnl : 50000;
    const points = [{ name: "Start", value: start }];
    trades.forEach((t, i) => {
      points.push({ name: `T${i + 1}`, value: t.accountEquityAfter });
    });
    return points;
  }, [trades]);

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
          domain={["dataMin - 500", "dataMax + 500"]}
          tick={{ fill: "#8B8FA3", fontSize: 10, fontFamily: "Space Mono" }}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="value" stroke="#00FFB2" strokeWidth={2} fill="url(#eqGrad)" animationDuration={1500} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function DailyPnlChart({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const data = useMemo(() => getDailyStats(trades), [trades]);

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
          tickFormatter={(v: number) => `$${v}`}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
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

export default function AnalyticsPage() {
  const { trades } = useTradeStore();
  const { settings } = useSettingsStore();
  const [timeRange, setTimeRange] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"Overview" | "AI Coach">("Overview");
  
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
            {["Overview", "AI Coach"].map((tab) => (
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
            <EquityCurveChart trades={filteredTrades} />
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-base mb-4">Daily P&L</h3>
          <div className="h-64">
            <DailyPnlChart trades={filteredTrades} />
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
      </>
      )}
    </div>
  );
}
