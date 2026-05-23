"use client";
import { useTradeStore, useUIStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCurrency, formatDate, formatDuration, getHeatmapColor } from "@/lib/utils";
import { getDailyStats } from "@/lib/calculations";
import { Trade } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, subMonths, addMonths } from "date-fns";
import { ArrowUpRight, ArrowDownRight, List, CalendarDays, Plus, Download, Filter, ChevronLeft, ChevronRight, Flame, Trophy, Skull } from "lucide-react";
import Link from "next/link";

function TradeListView({ trades }: { trades: Trade[] }) {
  const router = useRouter();
  const [sortField, setSortField] = useState<keyof Trade>("entryDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...trades].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (typeof aVal === "number" && typeof bVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      return 0;
    });
  }, [trades, sortField, sortDir]);

  const handleSort = (field: keyof Trade) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const headers: { label: string; field: keyof Trade; width: string }[] = [
    { label: "Date", field: "entryDate", width: "w-28" },
    { label: "Symbol", field: "symbol", width: "w-20" },
    { label: "Side", field: "direction", width: "w-16" },
    { label: "Entry", field: "entryPrice", width: "w-24" },
    { label: "Exit", field: "exitPrice", width: "w-24" },
    { label: "P&L", field: "netPnl", width: "w-24" },
    { label: "R", field: "rMultiple", width: "w-16" },
    { label: "Setup", field: "setupTags" as keyof Trade, width: "w-32" },
    { label: "Session", field: "sessionTag", width: "w-24" },
    { label: "Duration", field: "durationMinutes", width: "w-20" },
  ];

  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            {headers.map((h) => (
              <th
                key={h.field}
                onClick={() => handleSort(h.field)}
                className={cn(
                  "text-left py-3 px-3 text-xs uppercase tracking-wider text-text-muted font-medium cursor-pointer hover:text-text-primary transition-colors",
                  h.width
                )}
              >
                {h.label}
                {sortField === h.field && (
                  <span className="ml-1 text-accent-violet">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((trade, i) => (
            <motion.tr
              key={trade.id}
              onClick={() => router.push(`/journal/${trade.id}`)}
              className={cn(
                "border-b border-border-subtle/50 hover:bg-bg-card-hover transition-colors cursor-pointer group",
                trade.result === "win" ? "row-win" : trade.result === "loss" ? "row-loss" : ""
              )}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <td className="py-3 px-3 font-[family-name:var(--font-space-mono)] text-xs text-text-secondary">
                {format(new Date(trade.entryDate), "MMM dd HH:mm")}
              </td>
              <td className="py-3 px-3 font-[family-name:var(--font-space-mono)] font-bold">{trade.symbol}</td>
              <td className="py-3 px-3">
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium uppercase",
                  trade.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral"
                )}>
                  {trade.direction === "long" ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {trade.direction}
                </span>
              </td>
              <td className="py-3 px-3 font-[family-name:var(--font-space-mono)] text-xs">{trade.entryPrice ? trade.entryPrice.toLocaleString() : "N/A"}</td>
              <td className="py-3 px-3 font-[family-name:var(--font-space-mono)] text-xs">{trade.exitPrice ? trade.exitPrice.toLocaleString() : "N/A"}</td>
              <td className={cn("py-3 px-3 font-[family-name:var(--font-space-mono)] font-bold text-xs", trade.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                {formatCurrency(trade.netPnl)}
              </td>
              <td className={cn("py-3 px-3 font-[family-name:var(--font-space-mono)] text-xs", (trade.rMultiple || 0) >= 0 ? "text-accent-green" : "text-accent-coral")}>
                {(trade.rMultiple || 0) >= 0 ? "+" : ""}{(trade.rMultiple || 0).toFixed(2)}R
              </td>
              <td className="py-3 px-3">
                <div className="flex flex-wrap gap-1">
                  {(trade.setupTags || []).slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-violet/10 text-accent-violet">{tag}</span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-3 text-xs text-text-secondary">{trade.sessionTag}</td>
              <td className="py-3 px-3 font-[family-name:var(--font-space-mono)] text-xs text-text-muted">{formatDuration(trade.durationMinutes)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CalendarHeatmapView({ trades }: { trades: Trade[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 3, 1)); // April 2025
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const dailyStats = useMemo(() => getDailyStats(trades), [trades]);
  const maxPnl = Math.max(...dailyStats.map((d) => Math.abs(d.pnl)), 1);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const monthPnl = dailyStats
    .filter((d) => d.date >= format(monthStart, "yyyy-MM-dd") && d.date <= format(monthEnd, "yyyy-MM-dd"))
    .reduce((s, d) => s + d.pnl, 0);

  const selectedTrades = selectedDay
    ? trades.filter((t) => t.entryDate.startsWith(selectedDay))
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-bg-card transition-colors text-text-secondary hover:text-text-primary">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg">{format(currentMonth, "MMMM yyyy")}</h3>
          <p className={cn("font-[family-name:var(--font-space-mono)] text-sm mt-0.5", monthPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
            {formatCurrency(monthPnl)}
          </p>
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-bg-card transition-colors text-text-secondary hover:text-text-primary">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-xs text-text-muted text-center font-medium">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const stat = dailyStats.find((d) => d.date === dateStr);
          const bg = stat ? getHeatmapColor(stat.pnl, maxPnl) : "rgba(75,80,100,0.1)";
          const isSelected = selectedDay === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all hover:scale-105",
                isSelected && "ring-2 ring-accent-green scale-105"
              )}
              style={{ backgroundColor: bg }}
            >
              <span className="text-text-secondary text-[10px]">{format(day, "d")}</span>
              {stat && (
                <span className={cn("font-[family-name:var(--font-space-mono)] text-[9px] font-bold", stat.pnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                  {stat.pnl >= 0 ? "+" : ""}{stat.pnl > 999 ? `${(stat.pnl / 1000).toFixed(1)}k` : stat.pnl < -999 ? `${(stat.pnl / 1000).toFixed(1)}k` : stat.pnl.toFixed(0)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day trades */}
      <AnimatePresence>
        {selectedDay && selectedTrades.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border-subtle space-y-2"
          >
            <h4 className="text-xs text-text-muted uppercase tracking-wider mb-2">
              Trades on {formatDate(selectedDay)}
            </h4>
            {selectedTrades.map((t) => (
              <div key={t.id} className={cn("flex items-center justify-between p-2.5 rounded-lg", t.result === "win" ? "row-win" : "row-loss")}>
                <div className="flex items-center gap-2">
                  <span className="font-[family-name:var(--font-space-mono)] font-bold text-sm">{t.symbol}</span>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded uppercase", t.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral")}>
                    {t.direction}
                  </span>
                </div>
                <span className={cn("font-[family-name:var(--font-space-mono)] font-bold text-sm", t.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                  {formatCurrency(t.netPnl)}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function JournalPage() {
  const { trades } = useTradeStore();
  const { journalView, setJournalView } = useUIStore();
  const metrics = useMemo(() => {
    const wins = trades.filter((t) => t.result === "win").length;
    const losses = trades.filter((t) => t.result === "loss").length;
    let curWin = 0, maxWin = 0, tempWin = 0;
    for (const t of trades) {
      if (t.result === "win") { tempWin++; maxWin = Math.max(maxWin, tempWin); }
      else tempWin = 0;
    }
    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].result === "win") curWin++;
      else break;
    }
    return { wins, losses, curWin, maxWin };
  }, [trades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl">Trade Journal</h1>
          <p className="text-sm text-text-secondary mt-1">{trades.length} trades logged</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-bg-card rounded-xl p-1 border border-border-subtle">
            <button
              onClick={() => setJournalView("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                journalView === "list" ? "bg-accent-green/10 text-accent-green" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setJournalView("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                journalView === "calendar" ? "bg-accent-green/10 text-accent-green" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <CalendarDays size={14} /> Calendar
            </button>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary bg-bg-card border border-border-subtle hover:border-accent-violet/30 transition-all">
            <Filter size={14} /> Filters
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-text-secondary hover:text-text-primary bg-bg-card border border-border-subtle hover:border-accent-violet/30 transition-all">
            <Download size={14} /> Export
          </button>
          <Link
            href="/journal/new"
            className="flex items-center gap-1.5 bg-accent-green text-bg-base px-4 py-2 rounded-xl text-xs font-semibold hover:shadow-[0_0_20px_rgba(0,255,178,0.2)] transition-all"
          >
            <Plus size={14} /> New Trade
          </Link>
        </div>
      </div>

      {/* Streak Badges */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 glass-static px-3 py-2 rounded-xl">
          <Flame size={14} className="text-accent-green" />
          <span className="text-xs text-text-secondary">Win Streak:</span>
          <span className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green text-sm">{metrics.curWin}</span>
        </div>
        <div className="flex items-center gap-2 glass-static px-3 py-2 rounded-xl">
          <Trophy size={14} className="text-accent-violet" />
          <span className="text-xs text-text-secondary">Max:</span>
          <span className="font-[family-name:var(--font-space-mono)] font-bold text-accent-violet text-sm">{metrics.maxWin}</span>
        </div>
        <div className="flex items-center gap-2 glass-static px-3 py-2 rounded-xl">
          <span className="text-xs text-text-secondary">W/L:</span>
          <span className="font-[family-name:var(--font-space-mono)] font-bold text-sm">
            <span className="text-accent-green">{metrics.wins}</span>
            <span className="text-text-muted">/</span>
            <span className="text-accent-coral">{metrics.losses}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <GlassCard noPadding className="overflow-hidden">
        <div className="p-5">
          <AnimatePresence mode="wait">
            {journalView === "list" ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TradeListView trades={trades} />
              </motion.div>
            ) : (
              <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CalendarHeatmapView trades={trades} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </div>
  );
}
