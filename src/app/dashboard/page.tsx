"use client";
import { useTradeStore, usePropFirmStore } from "@/stores";
import { StatCard } from "@/components/ui/stat-card";
import { GlassCard } from "@/components/ui/glass-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { calculateMetrics, getEquityCurve, getDailyStats } from "@/lib/calculations";
import { formatCurrency, formatPercent, formatTimeAgo, cn, getHeatmapColor } from "@/lib/utils";
import { analyzeDailyPerformance, DailyReport } from "@/lib/gemini";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, differenceInDays, isToday } from "date-fns";
import { DollarSign, TrendingUp, Target, Wallet, ArrowUpRight, ArrowDownRight, Plus, Calendar, Trophy, Shield, Zap, Sparkles, Brain, Award, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TiltmeterWidget } from "@/components/ui/tiltmeter";
import { ProactiveAIWidget } from "@/components/ui/proactive-ai";
import { CalendarHeatmap } from "@/components/ui/calendar-heatmap";
import { useMemo, useEffect, useRef, useState } from "react";
import { subDays, subMonths, isAfter, startOfYear } from "date-fns";

function EquityCurveChart({ data }: { data: { time: string; value: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 20, right: 20, bottom: 30, left: 60 };

    const values = data.map((d) => d.value);
    const min = Math.min(...values) * 0.999;
    const max = Math.max(...values) * 1.001;

    const xScale = (i: number) => pad.left + (i / (data.length - 1)) * (w - pad.left - pad.right);
    const yScale = (v: number) => pad.top + (1 - (v - min) / (max - min)) * (h - pad.top - pad.bottom);

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = pad.top + (i / gridSteps) * (h - pad.top - pad.bottom);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      const val = max - (i / gridSteps) * (max - min);
      ctx.fillStyle = "rgba(139,143,163,0.6)";
      ctx.font = "11px 'Space Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`$${val.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, pad.left - 8, y + 4);
    }

    // Area gradient
    const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    gradient.addColorStop(0, "rgba(0,255,178,0.15)");
    gradient.addColorStop(1, "rgba(0,255,178,0)");

    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(values[0]));
    for (let i = 1; i < data.length; i++) {
      const x0 = xScale(i - 1), x1 = xScale(i);
      const y0 = yScale(values[i - 1]), y1 = yScale(values[i]);
      const cx = (x0 + x1) / 2;
      ctx.bezierCurveTo(cx, y0, cx, y1, x1, y1);
    }
    ctx.lineTo(xScale(data.length - 1), h - pad.bottom);
    ctx.lineTo(xScale(0), h - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(values[0]));
    for (let i = 1; i < data.length; i++) {
      const x0 = xScale(i - 1), x1 = xScale(i);
      const y0 = yScale(values[i - 1]), y1 = yScale(values[i]);
      const cx = (x0 + x1) / 2;
      ctx.bezierCurveTo(cx, y0, cx, y1, x1, y1);
    }
    ctx.strokeStyle = "#00FFB2";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glow on last point
    const lastX = xScale(data.length - 1);
    const lastY = yScale(values[values.length - 1]);
    const glow = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 16);
    glow.addColorStop(0, "rgba(0,255,178,0.5)");
    glow.addColorStop(1, "rgba(0,255,178,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(lastX - 16, lastY - 16, 32, 32);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#00FFB2";
    ctx.fill();

    // X-axis labels
    const labelIndices = [0, Math.floor(data.length / 3), Math.floor((data.length * 2) / 3), data.length - 1];
    ctx.fillStyle = "rgba(139,143,163,0.6)";
    ctx.font = "10px 'Space Mono', monospace";
    ctx.textAlign = "center";
    labelIndices.forEach((idx) => {
      if (data[idx]) {
        ctx.fillText(format(new Date(data[idx].time), "MMM d"), xScale(idx), h - 8);
      }
    });
  }, [data]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />;
}

function DailyReportCard({ trades }: { trades: ReturnType<typeof useTradeStore.getState>["trades"] }) {
  const [report, setReport] = useState<DailyReport | null>(null);
  const todayTrades = useMemo(() => trades.filter(t => isToday(new Date(t.entryDate))), [trades]);

  useEffect(() => {
    if (todayTrades.length > 0) {
      analyzeDailyPerformance(todayTrades).then(setReport);
    }
  }, [todayTrades]);

  if (todayTrades.length === 0) return (
    <GlassCard className="flex flex-col items-center justify-center py-10 text-center">
      <Sparkles size={32} className="text-text-muted mb-3 opacity-20" />
      <p className="text-sm text-text-muted">Log your first trade of the day<br/>to unlock your AI Report Card.</p>
    </GlassCard>
  );

  if (!report) return (
    <GlassCard className="animate-pulse h-[200px] flex items-center justify-center">
      <div className="text-xs text-text-muted uppercase tracking-widest">Analyzing Session...</div>
    </GlassCard>
  );

  const gradeColors = {
    A: "text-accent-green bg-accent-green/10 border-accent-green/20",
    B: "text-accent-violet bg-accent-violet/10 border-accent-violet/20",
    C: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    D: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    F: "text-accent-coral bg-accent-coral/10 border-accent-coral/20",
  };

  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-violet/10 rounded-full blur-3xl" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent-violet" />
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Daily Report Card</h2>
        </div>
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xl shadow-lg", gradeColors[report.disciplineGrade])}>
          {report.disciplineGrade}
        </div>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-4 italic">
        &ldquo;{report.summary}&rdquo;
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-static p-2.5 rounded-xl">
          <div className="text-[10px] text-text-muted uppercase mb-1">Top Mindset</div>
          <div className="text-xs font-bold flex items-center gap-1.5 truncate">
            <Brain size={12} className="text-accent-violet flex-shrink-0" /> {report.topMindset}
          </div>
        </div>
        <div className="glass-static p-2.5 rounded-xl">
          <div className="text-[10px] text-text-muted uppercase mb-1">Main Friction</div>
          <div className="text-xs font-bold flex items-center gap-1.5 truncate">
            {report.mainMistake ? (
              <> <AlertCircle size={12} className="text-accent-coral flex-shrink-0" /> {report.mainMistake} </>
            ) : (
              <> <Award size={12} className="text-accent-green flex-shrink-0" /> Flawless </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border-subtle rounded-xl p-3">
        <div className="text-[10px] text-accent-green uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
          <Zap size={10} /> AI Advice
        </div>
        <p className="text-xs text-text-primary leading-relaxed">
          {report.advice}
        </p>
      </div>
    </GlassCard>
  );
}

function WinLossVisualizer({ trades }: { trades: any[] }) {
  const wins = useMemo(() => trades.filter(t => t.result === "win").length, [trades]);
  const losses = useMemo(() => trades.filter(t => t.result === "loss").length, [trades]);
  const total = wins + losses || 1;
  const winRate = (wins / total) * 100;

  // Streak calculations
  const streaks = useMemo(() => {
    let currentStreak = 0;
    let currentType: "win" | "loss" | null = null;
    let maxWinStreak = 0;
    let maxLossStreak = 0;

    trades.forEach((t) => {
      if (t.result === "win") {
        if (currentType === "win") {
          currentStreak++;
        } else {
          currentType = "win";
          currentStreak = 1;
        }
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else if (t.result === "loss") {
        if (currentType === "loss") {
          currentStreak++;
        } else {
          currentType = "loss";
          currentStreak = 1;
        }
        maxLossStreak = Math.max(maxLossStreak, currentStreak);
      }
    });

    let activeStreak = 0;
    let activeType: "win" | "loss" | null = null;
    if (trades.length > 0) {
      const lastResult = trades[trades.length - 1].result;
      if (lastResult === "win" || lastResult === "loss") {
        activeType = lastResult;
        for (let i = trades.length - 1; i >= 0; i--) {
          if (trades[i].result === lastResult) {
            activeStreak++;
          } else {
            break;
          }
        }
      }
    }

    return { activeStreak, activeType, maxWinStreak, maxLossStreak };
  }, [trades]);

  const size = 90;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (winRate / 100) * circumference;

  return (
    <GlassCard className="relative overflow-hidden">
      <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm mb-4 flex items-center gap-2">
        <Trophy size={14} className="text-accent-green" /> Win / Loss Tracker
      </h3>
      
      <div className="flex items-center gap-4">
        {/* Radial Progress Ring */}
        <div className="relative flex-shrink-0 animate-fade-in" style={{ width: size, height: size }}>
          <svg className="w-full h-full transform -rotate-90">
            {/* Background (Losses / base) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-accent-coral/20"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Foreground (Wins) */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-accent-green transition-all duration-1000 ease-out"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              fill="transparent"
              strokeLinecap="round"
            />
          </svg>
          {/* Centered Percentage */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-[family-name:var(--font-space-mono)] font-bold text-base text-accent-green">
              {winRate.toFixed(0)}%
            </span>
            <span className="text-[8px] text-text-muted uppercase">Wins</span>
          </div>
        </div>

        {/* Counts & Streaks */}
        <div className="flex-1 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent-green/5 border border-accent-green/10 rounded-lg p-1 text-center">
              <div className="text-[8px] text-text-muted uppercase">Wins</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green text-sm">{wins}</div>
            </div>
            <div className="bg-accent-coral/5 border border-accent-coral/10 rounded-lg p-1 text-center">
              <div className="text-[8px] text-text-muted uppercase">Losses</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-coral text-sm">{losses}</div>
            </div>
          </div>

          {/* Active Streak */}
          {streaks.activeStreak > 0 && (
            <div className={cn(
              "flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
              streaks.activeType === "win" 
                ? "bg-accent-green/10 text-accent-green border border-accent-green/20" 
                : "bg-accent-coral/10 text-accent-coral border border-accent-coral/20"
            )}>
              {streaks.activeType === "win" ? "🔥" : "❄️"} {streaks.activeStreak} {streaks.activeType === "win" ? "Win" : "Loss"} Streak
            </div>
          )}
        </div>
      </div>

      {/* Streak Records */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border-subtle text-center text-xs">
        <div>
          <div className="text-[8px] text-text-muted uppercase">Max Win Streak</div>
          <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green text-xs mt-0.5">{streaks.maxWinStreak}</div>
        </div>
        <div>
          <div className="text-[8px] text-text-muted uppercase">Max Loss Streak</div>
          <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-coral text-xs mt-0.5">{streaks.maxLossStreak}</div>
        </div>
      </div>
    </GlassCard>
  );
}


export default function DashboardPage() {
  const { trades } = useTradeStore();
  const { challenges } = usePropFirmStore();
  const [timeRange, setTimeRange] = useState("1M");
  
  const filteredTrades = useMemo(() => {
    if (timeRange === "ALL") return trades;
    const now = new Date();
    let cutoff = now;
    if (timeRange === "1W") cutoff = subDays(now, 7);
    if (timeRange === "1M") cutoff = subMonths(now, 1);
    if (timeRange === "3M") cutoff = subMonths(now, 3);
    
    return trades.filter((t) => isAfter(new Date(t.entryDate), cutoff));
  }, [trades, timeRange]);

  const metrics = useMemo(() => calculateMetrics(filteredTrades), [filteredTrades]);
  const equityData = useMemo(() => getEquityCurve(filteredTrades), [filteredTrades]);
  const recentTrades = useMemo(() => [...trades].reverse().slice(0, 5), [trades]);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayTrades = useMemo(() => trades.filter((t) => t.entryDate.startsWith(todayStr)), [trades, todayStr]);
  const todayPnl = todayTrades.reduce((s, t) => s + t.netPnl, 0);
  const activeChallenges = challenges.filter((c) => c.status === "active");
  const currentBalance = trades.length > 0 ? trades[trades.length - 1].accountEquityAfter : 50000;

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-3xl bg-clip-text text-transparent bg-gradient-to-r from-accent-green via-accent-blue to-accent-violet pb-1">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/journal/new"
            className="flex items-center gap-2 bg-gradient-to-r from-accent-green to-accent-blue text-bg-base px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-[0_0_30px_rgba(0,255,178,0.4)] transition-all duration-300 border border-white/20"
          >
            <Plus size={16} />
            Log Trade
          </Link>
        </motion.div>
      </motion.div>

      {/* GitHub-Style Calendar Heatmap */}
      <motion.div variants={itemVariants}>
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-accent-violet" />
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Consistency Calendar</h2>
            </div>
          </div>
          <CalendarHeatmap trades={trades} />
        </GlassCard>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's P&L"
          value={todayPnl}
          format={(v) => formatCurrency(v)}
          icon={DollarSign}
          trend={todayPnl >= 0 ? "up" : "down"}
          subtitle={`${todayTrades.length} trades today`}
          delay={0}
        />
        <StatCard
          title="Win Rate"
          value={metrics.winRate}
          format={(v) => `${v.toFixed(1)}%`}
          icon={Target}
          trend={metrics.winRate >= 50 ? "up" : "down"}
          subtitle={`${metrics.totalTrades} total trades`}
          delay={0.05}
        />
        <StatCard
          title="Profit Factor"
          value={metrics.profitFactor}
          format={(v) => v.toFixed(2)}
          icon={TrendingUp}
          trend={metrics.profitFactor >= 1.5 ? "up" : metrics.profitFactor >= 1 ? "neutral" : "down"}
          subtitle={`${metrics.maxWinStreak} max win streak`}
          delay={0.1}
        />
        <StatCard
          title="Account Balance"
          value={currentBalance}
          format={(v) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          icon={Wallet}
          trend="up"
          subtitle={formatCurrency(metrics.totalNetPnl) + " all time"}
          delay={0.15}
        />
      </motion.div>

      {/* Main Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Equity Curve */}
        <GlassCard className="lg:col-span-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-violet/5 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Equity Curve</h2>
            <div className="flex gap-1">
              {["1W", "1M", "3M", "ALL"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-lg transition-colors border",
                    timeRange === range
                      ? "bg-accent-green/10 text-accent-green border-accent-green/20"
                      : "bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-card-hover border-transparent hover:border-border-subtle"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <EquityCurveChart data={equityData} />
          </div>
        </GlassCard>

        {/* Sidebar Widgets Stack */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          <WinLossVisualizer trades={trades} />
          <ProactiveAIWidget />
          <TiltmeterWidget recentLosses={3} avgHoldTimeDeviation={1.5} volumeSpike={false} />
        </div>

        {/* Daily Report Card */}
        <div className="lg:col-span-4">
          <DailyReportCard trades={trades} />
        </div>
      </motion.div>

      {/* Bottom Row: Recent Trades + Prop Firm */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Trades */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Recent Trades</h2>
            <Link href="/journal" className="text-xs text-accent-violet hover:text-accent-green transition-colors">
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {recentTrades.map((trade, i) => (
              <Link key={trade.id} href={`/journal/${trade.id}`}>
                <motion.div
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-bg-card-hover cursor-pointer",
                    trade.result === "win" ? "row-win" : trade.result === "loss" ? "row-loss" : ""
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                      trade.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral"
                    )}>
                      {trade.direction === "long" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-space-mono)] font-bold text-sm">{trade.symbol}</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-medium uppercase",
                          trade.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral"
                        )}>
                          {trade.direction}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">{formatTimeAgo(trade.exitDate)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "font-[family-name:var(--font-space-mono)] font-bold text-sm",
                      trade.netPnl >= 0 ? "text-accent-green" : "text-accent-coral"
                    )}>
                      {formatCurrency(trade.netPnl)}
                    </div>
                    <div className="text-xs text-text-muted font-[family-name:var(--font-space-mono)]">
                      {(trade.rMultiple || 0) >= 0 ? "+" : ""}{(trade.rMultiple || 0).toFixed(2)}R
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </GlassCard>

        {/* Prop Firm Challenges Widget */}
        <GlassCard className="relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent-blue/5 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">
              <Trophy size={16} className="inline mr-2 text-accent-violet" />
              Challenges
            </h2>
            <Link href="/prop-tracker" className="text-xs text-accent-violet hover:text-accent-green transition-colors">
              View All →
            </Link>
          </div>
          {activeChallenges.length > 0 ? (
            <div className="space-y-3">
              {activeChallenges.slice(0, 3).map((c) => {
                const profitPct = (c.currentPnl / c.accountSize) * 100;
                const drawdownPct = ((c.highWaterMark - c.currentBalance) / c.accountSize) * 100;
                const drawdownProgress = (drawdownPct / c.rules.maxDrawdown) * 100;
                const daysUsed = differenceInDays(new Date(), new Date(c.startDate));
                const daysLeft = c.rules.maxDuration > 0 ? c.rules.maxDuration - daysUsed : null;
                return (
                  <Link key={c.id} href="/prop-tracker" className="block p-3 rounded-xl bg-bg-card border border-border-subtle hover:border-accent-violet/20 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-syne)] font-bold text-sm">{c.firmName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green uppercase">{c.phase}</span>
                      </div>
                      <span className={cn("font-[family-name:var(--font-space-mono)] font-bold text-sm", profitPct >= 0 ? "text-accent-green" : "text-accent-coral")}>
                        {profitPct >= 0 ? "+" : ""}{profitPct.toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* Profit Progress */}
                    <div className="flex justify-between text-[8px] text-text-muted mb-1 uppercase tracking-tighter">
                      <span>Target ({c.rules.profitTarget}%)</span>
                      <span>{profitPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-bg-base rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-accent-green rounded-full transition-all" style={{ width: `${Math.max(0, Math.min((profitPct / c.rules.profitTarget) * 100, 100))}%` }} />
                    </div>

                    {/* Drawdown Gauge */}
                    <div className="flex justify-between text-[8px] text-text-muted mb-1 uppercase tracking-tighter">
                      <span>Drawdown Safety</span>
                      <span className={cn(drawdownProgress > 70 ? "text-accent-coral" : "")}>{drawdownPct.toFixed(1)}% / {c.rules.maxDrawdown}%</span>
                    </div>
                    <div className="h-1 bg-bg-base rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-accent-coral rounded-full transition-all opacity-40" style={{ width: `${Math.min(drawdownProgress, 100)}%` }} />
                    </div>

                    <div className="flex justify-between text-[9px] text-text-muted mt-1">
                      <span className="flex items-center gap-1 opacity-60"><Clock size={10} /> {daysUsed}d active</span>
                      {daysLeft !== null && <span className={cn(daysLeft <= 5 && "text-accent-coral")}>{daysLeft}d left</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Trophy size={28} className="mx-auto text-text-muted mb-2 opacity-40" />
              <p className="text-xs text-text-muted">No active challenges</p>
              <Link href="/prop-tracker" className="text-xs text-accent-green hover:underline mt-1 inline-block">Start one →</Link>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border-subtle">
            <div className="text-center">
              <div className="text-[9px] text-text-muted uppercase">Active</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green">{activeChallenges.length}</div>
            </div>
            <div className="text-center">
              <div className="text-[9px] text-text-muted uppercase">Total</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold">{challenges.length}</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
