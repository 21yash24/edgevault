"use client";

import { useMemo, useState } from "react";
import { Trade } from "@/lib/types";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart 
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Download, 
  Sparkles, Award, ShieldAlert, Percent, Activity, Calendar
} from "lucide-react";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { format } from "date-fns";

export function PerformanceReport({ trades }: { trades: Trade[] }) {
  const [reportTimeframe, setReportTimeframe] = useState<"7d" | "30d" | "all">("all");

  const reportData = useMemo(() => {
    if (trades.length === 0) return null;

    // Filter trades based on timeframe
    let filteredTrades = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    const now = new Date();

    if (reportTimeframe === "7d") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filteredTrades = filteredTrades.filter(t => new Date(t.entryDate) >= sevenDaysAgo);
    } else if (reportTimeframe === "30d") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      filteredTrades = filteredTrades.filter(t => new Date(t.entryDate) >= thirtyDaysAgo);
    }

    if (filteredTrades.length === 0) return null;

    // Recalculate metrics
    const totalTrades = filteredTrades.length;
    const winningTrades = filteredTrades.filter(t => t.result === "win");
    const losingTrades = filteredTrades.filter(t => t.result === "loss");
    
    const winRate = (winningTrades.length / totalTrades) * 100;
    
    const totalPnl = filteredTrades.reduce((sum, t) => sum + t.netPnl, 0);
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.netPnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.netPnl, 0));
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

    const bestTrade = Math.max(...filteredTrades.map(t => t.netPnl));
    const worstTrade = Math.min(...filteredTrades.map(t => t.netPnl));

    const totalRMultiple = filteredTrades.reduce((sum, t) => sum + (t.rMultiple || 0), 0);
    const avgRMultiple = totalRMultiple / totalTrades;

    // Build equity curve data starting at $50,000 baseline
    let currentEquity = 50000;
    const equityCurve = filteredTrades.map((t, idx) => {
      currentEquity += t.netPnl;
      return {
        tradeIndex: idx + 1,
        date: format(new Date(t.entryDate), "MM/dd"),
        equity: parseFloat(currentEquity.toFixed(2)),
        pnl: t.netPnl,
        symbol: t.symbol
      };
    });

    // Add baseline node
    const chartData = [
      { tradeIndex: 0, date: "Start", equity: 50000, pnl: 0, symbol: "" },
      ...equityCurve
    ];

    return {
      totalTrades,
      winRate,
      totalPnl,
      profitFactor,
      bestTrade,
      worstTrade,
      avgRMultiple,
      chartData,
      filteredTrades
    };
  }, [trades, reportTimeframe]);

  const handleExportCSV = () => {
    if (!reportData) return;

    // Construct CSV content
    const headers = ["Trade #", "Date", "Symbol", "Direction", "P&L ($)", "R-Multiple", "Setup Tags", "Mistake Tags"];
    const rows = reportData.filteredTrades.map((t, idx) => [
      idx + 1,
      t.entryDate,
      t.symbol,
      t.direction,
      t.netPnl,
      t.rMultiple,
      `"${t.setupTags.join(",")}"`,
      `"${t.mistakeTags.join(",")}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EdgeVault_Performance_Report_${reportTimeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!reportData) {
    return (
      <GlassCard className="p-8 text-center text-text-muted">
        <Activity size={32} className="mx-auto opacity-20 mb-2" />
        <p className="text-sm font-semibold">Insufficient performance data</p>
        <p className="text-xs mt-1">Please log trades in this timeframe to generate report metrics.</p>
      </GlassCard>
    );
  }

  const isProfitable = reportData.totalPnl >= 0;

  return (
    <GlassCard className="p-6 border-border-subtle bg-bg-card/25 space-y-6 relative overflow-hidden">
      
      {/* Visual top glowing bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent-violet via-accent-green to-accent-blue" />

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-base text-text-primary flex items-center gap-2">
            Performance Metrics & Equity Curve <Sparkles size={16} className="text-accent-green" />
          </h3>
          <p className="text-xs text-text-muted mt-0.5">Statistical equity modeling and playbook diagnostic diagnostics</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex bg-white/[0.02] border border-border-subtle rounded-xl p-1">
            {[
              { id: "7d", label: "7D" },
              { id: "30d", label: "30D" },
              { id: "all", label: "All" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setReportTimeframe(t.id as any)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                  reportTimeframe === t.id
                    ? "bg-accent-green/10 text-accent-green"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-gradient-to-r from-accent-violet to-accent-blue text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md hover:shadow-[0_0_15px_rgba(123,97,255,0.4)] transition-all active:scale-95"
          >
            <Download size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Analytics Micro Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Net PnL */}
        <GlassCard className="p-3 border-border-subtle/50">
          <span className="text-[9px] text-text-muted uppercase font-bold block">Net Performance</span>
          <span className={cn(
            "text-base font-bold font-[family-name:var(--font-space-mono)] mt-1 flex items-center gap-0.5",
            isProfitable ? "text-accent-green" : "text-accent-coral"
          )}>
            {isProfitable ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isProfitable ? "+" : ""}{formatCurrency(reportData.totalPnl)}
          </span>
        </GlassCard>

        {/* Win Rate */}
        <GlassCard className="p-3 border-border-subtle/50">
          <span className="text-[9px] text-text-muted uppercase font-bold block">Arena Win Rate</span>
          <span className="text-base font-bold text-text-primary font-[family-name:var(--font-space-mono)] mt-1 flex items-center gap-1">
            <Percent size={14} className="text-accent-green" />
            {reportData.winRate.toFixed(1)}%
          </span>
        </GlassCard>

        {/* Profit Factor */}
        <GlassCard className="p-3 border-border-subtle/50">
          <span className="text-[9px] text-text-muted uppercase font-bold block">Profit Factor</span>
          <span className="text-base font-bold text-text-secondary font-[family-name:var(--font-space-mono)] mt-1 flex items-center gap-1">
            <Award size={14} className="text-accent-violet" />
            {reportData.profitFactor.toFixed(2)}
          </span>
        </GlassCard>

        {/* Avg R-Multiple */}
        <GlassCard className="p-3 border-border-subtle/50">
          <span className="text-[9px] text-text-muted uppercase font-bold block">Avg Expectancy</span>
          <span className="text-base font-bold text-text-primary font-[family-name:var(--font-space-mono)] mt-1 flex items-center gap-1">
            <Activity size={14} className="text-accent-blue" />
            +{reportData.avgRMultiple.toFixed(2)}R
          </span>
        </GlassCard>

      </div>

      {/* Recharts Chart */}
      <div className="h-[280px] w-full bg-white/[0.01] border border-border-subtle/40 p-4 rounded-xl relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={reportData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isProfitable ? "#00FFB2" : "#FF2D55"} stopOpacity={0.12}/>
                <stop offset="95%" stopColor={isProfitable ? "#00FFB2" : "#FF2D55"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.2)" 
              tick={{ fontSize: 9, fontFamily: "Space Mono" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.2)"
              tick={{ fontSize: 9, fontFamily: "Space Mono" }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  if (data.tradeIndex === 0) return null;
                  const tradePnL = data.pnl;
                  return (
                    <div className="bg-bg-card border border-border-subtle p-3 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="text-[10px] text-text-muted">Trade #{data.tradeIndex} ({data.date})</p>
                      <p className="font-bold text-text-primary">Equity: {formatCurrency(data.equity)}</p>
                      <p className={cn("font-bold flex items-center gap-0.5", tradePnL >= 0 ? "text-accent-green" : "text-accent-coral")}>
                        PnL: {tradePnL >= 0 ? "+" : ""}{formatCurrency(tradePnL)} ({data.symbol})
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="equity" 
              stroke={isProfitable ? "#00FFB2" : "#FF2D55"} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#equityGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Best vs Worst trades footer */}
      <div className="grid grid-cols-2 gap-4 border-t border-border-subtle/30 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center border border-accent-green/20 flex-shrink-0">
            <TrendingUp size={14} className="text-accent-green" />
          </div>
          <div>
            <span className="text-[8px] text-text-muted uppercase font-bold block">Best Execution Session</span>
            <span className="text-xs font-bold text-text-primary font-[family-name:var(--font-space-mono)]">
              +{formatCurrency(reportData.bestTrade)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-coral/10 flex items-center justify-center border border-accent-coral/20 flex-shrink-0">
            <TrendingDown size={14} className="text-accent-coral" />
          </div>
          <div>
            <span className="text-[8px] text-text-muted uppercase font-bold block">Worst Drawdown Hit</span>
            <span className="text-xs font-bold text-text-primary font-[family-name:var(--font-space-mono)]">
              {formatCurrency(reportData.worstTrade)}
            </span>
          </div>
        </div>
      </div>

    </GlassCard>
  );
}
