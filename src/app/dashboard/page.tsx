"use client";
import { useTradeStore, usePropFirmStore, useRiskStore, useSettingsStore } from "@/stores";
import { StatCard } from "@/components/ui/stat-card";
import { GlassCard } from "@/components/ui/glass-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { calculateMetrics, getEquityCurve, getDailyStats, getComputedChallenge } from "@/lib/calculations";
import { formatCurrency, formatPercent, formatTimeAgo, cn } from "@/lib/utils";
import { analyzeDailyPerformance, DailyReport } from "@/lib/gemini";
import { format, differenceInDays, isToday, isAfter, subDays, subMonths } from "date-fns";
import { 
  DollarSign, TrendingUp, Target, Wallet, ArrowUpRight, ArrowDownRight, 
  Plus, Calendar, Trophy, Shield, Zap, Sparkles, Brain, Award, 
  AlertCircle, Clock, Check 
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TiltmeterWidget } from "@/components/ui/tiltmeter";
import { ProactiveAIWidget } from "@/components/ui/proactive-ai";
import { CalendarHeatmap } from "@/components/ui/calendar-heatmap";
import { useMemo, useEffect, useRef, useState } from "react";

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
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = pad.top + (i / gridSteps) * (h - pad.top - pad.bottom);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      const val = max - (i / gridSteps) * (max - min);
      ctx.fillStyle = "rgba(139,143,163,0.5)";
      ctx.font = "10px 'Space Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`$${val.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, pad.left - 8, y + 4);
    }

    // Area gradient
    const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    gradient.addColorStop(0, "rgba(0,255,178,0.12)");
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
    glow.addColorStop(0, "rgba(0,255,178,0.4)");
    glow.addColorStop(1, "rgba(0,255,178,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(lastX - 16, lastY - 16, 32, 32);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#00FFB2";
    ctx.fill();

    // X-axis labels
    const labelIndices = [0, Math.floor(data.length / 3), Math.floor((data.length * 2) / 3), data.length - 1];
    ctx.fillStyle = "rgba(139,143,163,0.5)";
    ctx.font = "9px 'Space Mono', monospace";
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
    <GlassCard className="flex flex-col items-center justify-center py-10 text-center relative overflow-hidden group min-h-[220px]">
      <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-accent-violet/5 rounded-full blur-3xl pointer-events-none" />
      <Sparkles size={32} className="text-text-muted mb-3 opacity-25 group-hover:scale-110 transition-transform duration-500" />
      <p className="text-sm font-semibold text-text-primary">Awaiting Today's Execution</p>
      <p className="text-xs text-text-muted mt-1 leading-relaxed">Log your first trade of the day to unlock your dynamic,<br/>AI-generated discipline and performance analysis report.</p>
    </GlassCard>
  );

  if (!report) return (
    <GlassCard className="h-[220px] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-8 h-8 border-2 border-accent-violet border-t-transparent rounded-full animate-spin mb-3" />
      <div className="text-xs text-text-muted uppercase tracking-widest font-bold">AI Diagnostics Engine Processing...</div>
    </GlassCard>
  );

  const gradeColors = {
    A: "text-accent-green bg-accent-green/10 border-accent-green/20 shadow-[0_0_15px_rgba(0,255,178,0.2)]",
    B: "text-accent-violet bg-accent-violet/10 border-accent-violet/20 shadow-[0_0_15px_rgba(123,97,255,0.2)]",
    C: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    D: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    F: "text-accent-coral bg-accent-coral/10 border-accent-coral/20 shadow-[0_0_15px_rgba(255,45,85,0.2)]",
  };

  return (
    <GlassCard className="relative overflow-hidden group flex flex-col justify-between min-h-[220px]">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent-violet/5 rounded-full blur-3xl" />
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent-violet" />
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Daily Focus Report Card</h2>
          </div>
          <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center font-black text-xl shadow-lg", gradeColors[report.disciplineGrade])}>
            {report.disciplineGrade}
          </div>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed mb-4 italic pl-3 border-l border-accent-violet/30">
          &ldquo;{report.summary}&rdquo;
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/[0.01] border border-white/[0.04] p-2.5 rounded-xl">
            <div className="text-[9px] text-text-muted uppercase font-bold tracking-wider mb-1">Top Mindset</div>
            <div className="text-xs font-bold flex items-center gap-1.5 truncate">
              <Brain size={12} className="text-accent-violet flex-shrink-0" /> {report.topMindset}
            </div>
          </div>
          <div className="bg-white/[0.01] border border-white/[0.04] p-2.5 rounded-xl">
            <div className="text-[9px] text-text-muted uppercase font-bold tracking-wider mb-1">Main Leak</div>
            <div className="text-xs font-bold flex items-center gap-1.5 truncate">
              {report.mainMistake ? (
                <> <AlertCircle size={12} className="text-accent-coral flex-shrink-0" /> {report.mainMistake} </>
              ) : (
                <> <Award size={12} className="text-accent-green flex-shrink-0" /> Flawless execution </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
        <div className="text-[9px] text-accent-green uppercase font-black tracking-widest mb-1 flex items-center gap-1">
          <Zap size={10} /> Actionable AI Advice
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

  const size = 120;
  const strokeWidthOuter = 10;
  const radiusOuter = (size - strokeWidthOuter) / 2;
  const circOuter = radiusOuter * 2 * Math.PI;
  const strokeDashoffsetOuter = circOuter - (winRate / 100) * circOuter;

  const pf = useMemo(() => {
    const grossWins = trades.filter(t => t.result === "win").reduce((s, t) => s + t.netPnl, 0);
    const grossLosses = Math.abs(trades.filter(t => t.result === "loss").reduce((s, t) => s + t.netPnl, 0));
    return grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 9.9 : 0;
  }, [trades]);

  const pfPct = Math.min((pf / 3.0) * 100, 100);
  const strokeWidthInner = 5;
  const radiusInner = radiusOuter - strokeWidthOuter - 4;
  const circInner = radiusInner * 2 * Math.PI;
  const strokeDashoffsetInner = circInner - (pfPct / 100) * circInner;

  return (
    <GlassCard className="relative overflow-hidden group flex flex-col justify-between min-h-[295px]">
      <div className={cn(
        "absolute -bottom-16 -right-16 w-36 h-36 rounded-full blur-[60px] opacity-15 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none",
        winRate >= 50 ? "bg-accent-green" : "bg-accent-coral"
      )} />

      <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm mb-4 flex items-center gap-2">
        <Trophy size={14} className="text-accent-green" /> Win / Loss Analytics
      </h3>
      
      <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 flex-1">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg className="w-full h-full transform -rotate-90">
            <defs>
              <linearGradient id="winGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FFB2" />
                <stop offset="100%" stopColor="#00CC8E" />
              </linearGradient>
              <linearGradient id="pfGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7B61FF" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <circle cx={size / 2} cy={size / 2} r={radiusOuter} className="stroke-white/[0.02]" strokeWidth={strokeWidthOuter} fill="transparent" />
            <circle
              cx={size / 2} cy={size / 2} r={radiusOuter}
              stroke="url(#winGlow)" strokeWidth={strokeWidthOuter}
              strokeDasharray={circOuter} strokeDashoffset={strokeDashoffsetOuter}
              fill="transparent" strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: winRate >= 50 ? "url(#glow)" : "none" }}
            />

            <circle cx={size / 2} cy={size / 2} r={radiusInner} className="stroke-white/[0.01]" strokeWidth={strokeWidthInner} fill="transparent" />
            <circle
              cx={size / 2} cy={size / 2} r={radiusInner}
              stroke="url(#pfGlow)" strokeWidth={strokeWidthInner}
              strokeDasharray={circInner} strokeDashoffset={strokeDashoffsetInner}
              fill="transparent" strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: pf >= 1.5 ? "url(#glow)" : "none" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-[family-name:var(--font-syne)] font-black text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#00FFB2] to-accent-blue leading-none">
              {winRate.toFixed(0)}%
            </span>
            <span className="text-[7px] text-text-muted uppercase font-bold tracking-widest mt-1">Win Rate</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-2 text-center hover:bg-white/[0.03] transition-colors">
              <div className="text-[8px] text-text-muted uppercase font-semibold">Wins</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green text-sm mt-0.5">{wins}</div>
            </div>
            <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-2 text-center hover:bg-white/[0.03] transition-colors">
              <div className="text-[8px] text-text-muted uppercase font-semibold">Losses</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-coral text-sm mt-0.5">{losses}</div>
            </div>
          </div>

          <div className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-2 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
            <div>
              <div className="text-[8px] text-text-muted uppercase font-semibold">Profit Factor</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-violet text-xs mt-0.5">{pf.toFixed(2)}</div>
            </div>
            <span className={cn(
              "text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider",
              pf >= 1.5 ? "bg-accent-green/10 text-accent-green" : pf >= 1.0 ? "bg-accent-violet/10 text-accent-violet" : "bg-accent-coral/10 text-accent-coral"
            )}>
              {pf >= 1.5 ? "Excellent" : pf >= 1.0 ? "Healthy" : "Needs Work"}
            </span>
          </div>

          {streaks.activeStreak > 0 && (
            <div className={cn(
              "flex items-center justify-center gap-1 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider border shadow-sm",
              streaks.activeType === "win" 
                ? "bg-accent-green/10 text-accent-green border-accent-green/20" 
                : "bg-accent-coral/10 text-accent-coral border-accent-coral/20"
            )}>
              {streaks.activeType === "win" ? "🔥 HOT STREAK" : "❄️ DRAWDOWN"} • {streaks.activeStreak} TRADES
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/[0.05] text-center text-[10px] relative z-10">
        <div>
          <div className="text-[8px] text-text-muted uppercase font-semibold">Max Win Streak</div>
          <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green text-xs mt-0.5">{streaks.maxWinStreak} wins</div>
        </div>
        <div>
          <div className="text-[8px] text-text-muted uppercase font-semibold">Max Loss Streak</div>
          <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-coral text-xs mt-0.5">{streaks.maxLossStreak} losses</div>
        </div>
      </div>
    </GlassCard>
  );
}

function PreFlightChecklist() {
  const { settings } = useSettingsStore();
  const { checkedItems, setCheckedItems, resetIfNewDay } = useRiskStore();
  const checklist = settings?.trading?.checklist || [
    "HTF Bias Confirmed",
    "Liquidity Sweep Detected",
    "SMT Divergence Present",
    "displacement & IFVG Formed",
    "Risk Managed (1% Max)"
  ];

  useEffect(() => {
    resetIfNewDay();
  }, [resetIfNewDay]);

  const toggleItem = (item: string) => {
    if (checkedItems.includes(item)) {
      setCheckedItems(checkedItems.filter((i) => i !== item));
    } else {
      setCheckedItems([...checkedItems, item]);
    }
  };

  const pct = checklist.length > 0 ? (checkedItems.length / checklist.length) * 100 : 100;

  return (
    <GlassCard className="relative overflow-hidden group flex flex-col justify-between min-h-[295px]">
      <div className={cn(
        "absolute -bottom-16 -right-16 w-36 h-36 rounded-full blur-[60px] opacity-15 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none",
        pct === 100 ? "bg-accent-green" : "bg-accent-violet"
      )} />

      <div>
        <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield size={14} className="text-accent-violet" /> Pre-Flight Checklist
          </span>
          <span className="font-[family-name:var(--font-space-mono)] text-[9px] text-text-muted">
            {checkedItems.length}/{checklist.length} Complete
          </span>
        </h3>

        <div className="space-y-1.5 max-h-[175px] overflow-y-auto no-scrollbar relative z-10">
          {checklist.map((item, idx) => {
            const isChecked = checkedItems.includes(item);
            return (
              <motion.div
                key={idx}
                onClick={() => toggleItem(item)}
                whileHover={{ x: 2 }}
                className={cn(
                  "flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all",
                  isChecked
                    ? "bg-accent-green/5 border-accent-green/20 text-text-primary"
                    : "bg-white/[0.01] border-white/[0.03] text-text-secondary hover:border-white/10"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-md flex items-center justify-center border transition-all",
                  isChecked
                    ? "bg-accent-green border-accent-green text-bg-base"
                    : "border-white/20"
                )}>
                  {isChecked && <Check size={10} className="stroke-[3]" />}
                </div>
                <span className={cn("text-xs font-semibold select-none transition-all leading-none", isChecked && "line-through opacity-50")}>
                  {item}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 pt-3 border-t border-white/[0.05] mt-3">
        <div className="flex justify-between text-[8px] text-text-muted mb-1.5 uppercase font-bold tracking-wider select-none">
          <span>Disciplined Mindset</span>
          <span className={cn("font-bold font-[family-name:var(--font-space-mono)]", pct === 100 ? "text-accent-green" : "text-accent-violet")}>
            {pct.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.03]">
          <motion.div
            className={cn("h-full rounded-full", pct === 100 ? "bg-accent-green" : "bg-accent-violet")}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          />
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

  const computedChallenges = useMemo(() => {
    return challenges.map(c => {
      const comp = getComputedChallenge(c, trades);
      return {
        ...c,
        ...comp
      };
    });
  }, [challenges, trades]);

  const activeChallenges = useMemo(() => {
    return computedChallenges.filter((c) => c.status === "active");
  }, [computedChallenges]);

  const currentBalance = trades.length > 0 ? trades[trades.length - 1].accountEquityAfter : 50000;

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 26 } }
  };

  return (
    <motion.div className="space-y-6 pb-12" variants={containerVariants} initial="hidden" animate="visible">
      
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] font-black text-3xl bg-clip-text text-transparent bg-gradient-to-r from-accent-green via-accent-blue to-accent-violet pb-0.5 leading-none">
            Dashboard
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-semibold">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}>
          <Link
            href="/journal/new"
            className="flex items-center gap-2 bg-gradient-to-r from-accent-green to-accent-blue text-bg-base px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-[0_0_25px_rgba(0,255,178,0.3)] transition-all duration-300 border border-white/10"
          >
            <Plus size={16} className="stroke-[3]" />
            Log Trade
          </Link>
        </motion.div>
      </motion.div>

      {/* Row 1: HUD Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          delay={0.03}
        />
        <StatCard
          title="Profit Factor"
          value={metrics.profitFactor}
          format={(v) => v.toFixed(2)}
          icon={TrendingUp}
          trend={metrics.profitFactor >= 1.5 ? "up" : metrics.profitFactor >= 1 ? "neutral" : "down"}
          subtitle={`${metrics.maxWinStreak} max win streak`}
          delay={0.06}
        />
        <StatCard
          title="Account Balance"
          value={currentBalance}
          format={(v) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
          icon={Wallet}
          trend="up"
          subtitle={formatCurrency(metrics.totalNetPnl) + " all time"}
          delay={0.09}
        />
      </motion.div>

      {/* Row 2: Tactical HUD (Win/Loss, Pre-Flight, AI diagnostics) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WinLossVisualizer trades={trades} />
        <PreFlightChecklist />
        <div className="flex flex-col gap-6">
          <ProactiveAIWidget />
          <TiltmeterWidget recentLosses={3} avgHoldTimeDeviation={1.5} volumeSpike={false} />
        </div>
      </motion.div>

      {/* Row 3: Performance Curve & Challenges */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve (2 columns) */}
        <GlassCard className="lg:col-span-2 relative overflow-hidden flex flex-col justify-between min-h-[340px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-violet/5 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base flex items-center gap-2">
              <TrendingUp size={16} className="text-accent-green" /> Equity Curve
            </h2>
            <div className="flex gap-1 bg-white/[0.02] border border-white/[0.04] p-0.5 rounded-lg">
              {["1W", "1M", "3M", "ALL"].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors",
                    timeRange === range
                      ? "bg-accent-green/10 text-accent-green"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/[0.02]"
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 relative z-10 w-full flex-1">
            <EquityCurveChart data={equityData} />
          </div>
        </GlassCard>

        {/* Prop Firm Challenges (1 column) */}
        <GlassCard className="relative overflow-hidden flex flex-col justify-between min-h-[340px]">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent-blue/5 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">
              <Trophy size={16} className="inline mr-2 text-accent-violet" /> Challenges
            </h2>
            <Link href="/prop-tracker" className="text-xs text-accent-violet hover:text-accent-green transition-colors">
              View All →
            </Link>
          </div>
          {activeChallenges.length > 0 ? (
            <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-1 max-h-[220px]">
              {activeChallenges.slice(0, 3).map((c) => {
                const profitPct = (c.currentPnl / c.accountSize) * 100;
                const drawdownPct = ((c.highWaterMark - c.currentBalance) / c.accountSize) * 100;
                const drawdownProgress = (drawdownPct / c.rules.maxDrawdown) * 100;
                const daysUsed = differenceInDays(new Date(), new Date(c.startDate));
                const daysLeft = c.rules.maxDuration > 0 ? c.rules.maxDuration - daysUsed : null;
                return (
                  <Link key={c.id} href="/prop-tracker" className="block p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] hover:border-accent-violet/20 hover:bg-white/[0.03] transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-syne)] font-bold text-sm leading-none">{c.firmName}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green uppercase font-black tracking-wider leading-none">{c.phase}</span>
                      </div>
                      <span className={cn("font-[family-name:var(--font-space-mono)] font-bold text-xs", profitPct >= 0 ? "text-accent-green" : "text-accent-coral")}>
                        {profitPct >= 0 ? "+" : ""}{profitPct.toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* Profit Progress */}
                    <div className="flex justify-between text-[8px] text-text-muted mb-1 uppercase tracking-wider font-bold">
                      <span>Target ({c.rules.profitTarget}%)</span>
                      <span>{profitPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1 bg-white/[0.02] rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-accent-green rounded-full transition-all" style={{ width: `${Math.max(0, Math.min((profitPct / c.rules.profitTarget) * 100, 100))}%` }} />
                    </div>

                    {/* Drawdown Gauge */}
                    <div className="flex justify-between text-[8px] text-text-muted mb-1 uppercase tracking-wider font-bold">
                      <span>Drawdown Safety</span>
                      <span className={cn(drawdownProgress > 70 ? "text-accent-coral" : "")}>{drawdownPct.toFixed(1)}% / {c.rules.maxDrawdown}%</span>
                    </div>
                    <div className="h-1 bg-white/[0.02] rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-accent-coral rounded-full transition-all opacity-40" style={{ width: `${Math.min(drawdownProgress, 100)}%` }} />
                    </div>

                    <div className="flex justify-between text-[8px] text-text-muted mt-1 select-none font-bold">
                      <span className="flex items-center gap-1 opacity-60"><Clock size={10} /> {daysUsed}d active</span>
                      {daysLeft !== null && <span className={cn(daysLeft <= 5 && "text-accent-coral")}>{daysLeft}d left</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
              <Trophy size={28} className="text-text-muted mb-2 opacity-25" />
              <p className="text-xs text-text-muted">No active challenges</p>
              <Link href="/prop-tracker" className="text-xs text-accent-green hover:underline mt-1 inline-block font-semibold">Start one now →</Link>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/[0.05] relative z-10 text-center">
            <div>
              <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider">Active</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green text-sm mt-0.5">{activeChallenges.length}</div>
            </div>
            <div>
              <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider">Total</div>
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-sm mt-0.5">{challenges.length}</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Row 4: Consistency graph (GitHub Heatmap Calendar Spanned Full Width) */}
      <motion.div variants={itemVariants}>
        <GlassCard className="relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-accent-violet" />
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Consistency Calendar</h2>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded bg-accent-violet/10 text-accent-violet uppercase font-black tracking-widest select-none">
              Last 371 Days Tracker
            </span>
          </div>
          <div className="flex items-center justify-center py-2">
            <CalendarHeatmap trades={trades} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Row 5: Logs & AI Feedback */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trades (2 columns) */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base flex items-center gap-2">
              <Zap size={16} className="text-accent-green" /> Recent Execution Logs
            </h2>
            <Link href="/journal" className="text-xs text-accent-violet hover:text-accent-green transition-colors font-semibold">
              View All →
            </Link>
          </div>
          <div className="space-y-2 max-h-[210px] overflow-y-auto no-scrollbar">
            {recentTrades.map((trade, i) => (
              <Link key={trade.id} href={`/journal/${trade.id}`}>
                <motion.div
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/[0.02] border border-transparent cursor-pointer",
                    trade.result === "win" ? "row-win" : trade.result === "loss" ? "row-loss" : ""
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
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
                        <span className="font-[family-name:var(--font-space-mono)] font-bold text-sm leading-none">{trade.symbol}</span>
                        <span className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider leading-none",
                          trade.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral"
                        )}>
                          {trade.direction}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-muted mt-1 select-none font-bold">{formatTimeAgo(trade.exitDate)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "font-[family-name:var(--font-space-mono)] font-bold text-sm",
                      trade.netPnl >= 0 ? "text-accent-green" : "text-accent-coral"
                    )}>
                      {formatCurrency(trade.netPnl)}
                    </div>
                    <div className="text-[10px] text-text-muted font-[family-name:var(--font-space-mono)] font-bold mt-0.5">
                      {(trade.rMultiple || 0) >= 0 ? "+" : ""}{(trade.rMultiple || 0).toFixed(2)}R
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </GlassCard>

        {/* Daily Report Card (1 column) */}
        <div className="lg:col-span-1">
          <DailyReportCard trades={trades} />
        </div>
      </motion.div>

    </motion.div>
  );
}
