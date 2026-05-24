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
import { TrendingUp, TrendingDown, Target, DollarSign, Clock, Activity, Zap, BarChart3, Award, AlertTriangle, Brain, Crosshair } from "lucide-react";
import { MaeMfeChart } from "@/components/ui/mae-mfe-chart";
import { AiCoach } from "@/components/ui/ai-coach";
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
      transition={{ delay }}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl">Analytics</h1>
          <p className="text-sm text-text-secondary mt-1">Performance insights from {metrics.totalTrades} trades</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-1 bg-bg-card p-1 rounded-lg border border-border-subtle">
            {["Overview", "AI Coach"].map((tab) => (
              <button key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-4 py-1.5 text-xs rounded-md transition-all font-semibold",
                  activeTab === tab ? "bg-accent-violet/20 text-accent-violet" : "text-text-muted hover:text-text-secondary"
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
                  timeRange === range ? "bg-accent-green/10 text-accent-green border border-accent-green/20" : "bg-bg-card text-text-muted border border-border-subtle hover:border-accent-violet/20 hover:text-text-secondary"
                )}>
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

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
        <GlassCard transition={{ delay: 0.3 }}>
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4">Equity Curve</h3>
          <div className="h-64">
            <EquityCurveChart trades={filteredTrades} />
          </div>
        </GlassCard>

        <GlassCard transition={{ delay: 0.35 }}>
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4">Daily P&L</h3>
          <div className="h-64">
            <DailyPnlChart trades={filteredTrades} />
          </div>
        </GlassCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard transition={{ delay: 0.4 }}>
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4">Win Rate by Session</h3>
          <div className="h-64">
            <WinRateChart trades={filteredTrades} />
          </div>
        </GlassCard>

        <GlassCard transition={{ delay: 0.45 }}>
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4">P&L by Symbol</h3>
          <div className="h-64">
            <PnlBySymbolChart trades={filteredTrades} />
          </div>
        </GlassCard>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard transition={{ delay: 0.5 }}>
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4">R-Multiple Distribution</h3>
          <div className="h-64">
            <RDistributionChart trades={filteredTrades} />
          </div>
        </GlassCard>

        <GlassCard transition={{ delay: 0.55 }}>
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4">Hourly Performance Heatmap</h3>
          <div className="h-64 flex flex-col justify-center">
            <HourlyHeatmap trades={filteredTrades} />
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-[9px] text-text-muted">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(255,45,85,0.5)" }} />Loss</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(75,80,100,0.2)" }} />No data</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "rgba(0,255,178,0.5)" }} />Profit</div>
          </div>
        </GlassCard>
      </div>

      {/* Row: Mindset Performance */}
      <GlassCard transition={{ delay: 0.58 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-accent-violet" />
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-base">Psychological Performance (P&L by Mindset)</h3>
          </div>
          <span className="text-xs text-text-muted">Impact of emotional state on profitability</span>
        </div>
        <div className="h-64">
          <MindsetPerformanceChart trades={filteredTrades} />
        </div>
      </GlassCard>

      {/* Charts Row 4: MAE / MFE */}
      <GlassCard transition={{ delay: 0.59 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crosshair size={18} className="text-accent-violet" />
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-base">Trade Execution (MAE / MFE)</h3>
          </div>
          <span className="text-xs text-text-muted">Analyze your stop-losses and take-profits</span>
        </div>
        <div className="h-64 mt-4">
          <MaeMfeChart trades={filteredTrades} />
        </div>
      </GlassCard>

      {/* Charts Row 5: Monte Carlo */}
      <GlassCard transition={{ delay: 0.6 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-base">Monte Carlo Simulation</h3>
          <span className="text-xs text-text-muted">50 simulations, 50 trades forward</span>
        </div>
        <div className="h-64">
          <MonteCarloChart trades={filteredTrades} />
        </div>
      </GlassCard>

      {/* Streaks & Records */}
      <GlassCard transition={{ delay: 0.65 }}>
        <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4">Records & Streaks</h3>
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
