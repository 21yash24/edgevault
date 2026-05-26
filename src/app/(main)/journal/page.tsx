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
import { ArrowUpRight, ArrowDownRight, List, CalendarDays, Plus, Download, Filter, ChevronLeft, ChevronRight, Flame, Trophy, Skull, Trash2, CheckSquare } from "lucide-react";
import Link from "next/link";

function TradeListView({ trades }: { trades: Trade[] }) {
  const router = useRouter();
  const { deleteTrades } = useTradeStore();
  const [sortField, setSortField] = useState<keyof Trade>("entryDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  const toggleSelect = (e: React.MouseEvent, tradeId: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => 
      prev.includes(tradeId) ? prev.filter(id => id !== tradeId) : [...prev, tradeId]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === sorted.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sorted.map(t => t.id));
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete the ${selectedIds.length} selected trades? This cannot be undone.`)) {
      await deleteTrades(selectedIds);
      setSelectedIds([]);
    }
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
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden mb-4"
          >
            <div className="flex items-center justify-between bg-accent-coral/10 border border-accent-coral/20 px-5 py-3.5 rounded-2xl shadow-[0_4px_30px_rgba(255,107,107,0.05)]">
              <div className="flex items-center gap-2.5">
                <CheckSquare size={16} className="text-accent-coral animate-pulse" />
                <span className="text-sm font-semibold text-text-primary">
                  {selectedIds.length} trade{selectedIds.length > 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors hover:bg-bg-secondary/40 dark:hover:bg-white/5"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 bg-accent-coral hover:bg-accent-coral/90 text-bg-base px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,107,107,0.2)] hover:shadow-[0_0_20px_rgba(255,107,107,0.4)]"
                >
                  <Trash2 size={13} />
                  Delete Selected
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border-subtle text-text-muted select-none">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={sorted.length > 0 && selectedIds.length === sorted.length}
                  onChange={toggleAll}
                  className="rounded border-border-subtle/85 dark:border-white/20 bg-bg-secondary text-accent-green focus:ring-accent-green focus:ring-offset-0 cursor-pointer h-4 w-4 accent-accent-green"
                />
              </th>
              {headers.map((h) => (
                <th
                  key={h.field}
                  onClick={() => handleSort(h.field)}
                  className={cn(
                    "text-left py-3 px-3 text-xs uppercase tracking-wider font-bold cursor-pointer hover:text-text-primary transition-colors select-none",
                    h.width
                  )}
                >
                  <div className="flex items-center gap-1">
                    {h.label}
                    {sortField === h.field && (
                      <span className="text-accent-violet text-[10px] font-black">{sortDir === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((trade, i) => {
              const isSelected = selectedIds.includes(trade.id);
              return (
                <motion.tr
                  key={trade.id}
                  onClick={() => router.push(`/journal/${trade.id}`)}
                  className={cn(
                    "border-b border-border-subtle/40 hover:bg-bg-secondary/20 dark:hover:bg-white/[0.015] transition-colors cursor-pointer group relative",
                    trade.result === "win" ? "row-win" : trade.result === "loss" ? "row-loss" : "",
                    isSelected ? "bg-accent-green/5 hover:bg-accent-green/10" : ""
                  )}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.2, i * 0.01) }}
                >
                  <td className="py-3 px-3 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {}}
                      onClick={(e) => toggleSelect(e, trade.id)}
                      className="rounded border-border-subtle/85 dark:border-white/20 bg-bg-secondary text-accent-green focus:ring-accent-green focus:ring-offset-0 cursor-pointer h-4 w-4 accent-accent-green"
                    />
                  </td>
                  <td className="py-3 px-3 font-[family-name:var(--font-space-mono)] text-[11px] text-text-secondary">
                    {format(new Date(trade.entryDate), "MMM dd HH:mm")}
                  </td>
                  <td className="py-3 px-3 font-[family-name:var(--font-space-mono)] font-bold text-text-primary relative">
                    {/* Direction vertical bar */}
                    <span className={cn("absolute left-0 top-2 bottom-2 w-1 rounded-full", trade.direction === "long" ? "bg-accent-green" : "bg-accent-coral")} />
                    <span className="pl-1.5">{trade.symbol}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider border",
                      trade.direction === "long" ? "bg-accent-green/10 text-accent-green border-accent-green/20" : "bg-accent-coral/10 text-accent-coral border-accent-coral/20"
                    )}>
                      {trade.direction === "long" ? <ArrowUpRight size={8} className="stroke-[3]" /> : <ArrowDownRight size={8} className="stroke-[3]" />}
                      {trade.direction}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-[family-name:var(--font-space-mono)] text-xs text-text-secondary">{trade.entryPrice ? trade.entryPrice.toLocaleString() : "—"}</td>
                  <td className="py-3 px-3 font-[family-name:var(--font-space-mono)] text-xs text-text-secondary">{trade.exitPrice ? trade.exitPrice.toLocaleString() : "—"}</td>
                  <td className={cn("py-3 px-3 font-[family-name:var(--font-space-mono)] font-black text-xs", trade.netPnl >= 0 ? "text-accent-green text-glow-green" : "text-accent-coral text-glow-coral")}>
                    {formatCurrency(trade.netPnl)}
                  </td>
                  <td className={cn("py-3 px-3 font-[family-name:var(--font-space-mono)] text-xs font-bold", (trade.rMultiple || 0) >= 0 ? "text-accent-green" : "text-accent-coral")}>
                    {(trade.rMultiple || 0) >= 0 ? "+" : ""}{(trade.rMultiple || 0).toFixed(2)}R
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {(trade.setupTags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-accent-violet/10 text-accent-violet border border-accent-violet/20 font-black">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs text-text-secondary font-bold">{trade.sessionTag}</td>
                  <td className="py-3 px-3 font-[family-name:var(--font-space-mono)] text-[11px] text-text-muted">{formatDuration(trade.durationMinutes)}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarHeatmapView({ trades }: { trades: Trade[] }) {
  const router = useRouter();
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

  // Group into weeks of 7 days
  const leadingEmptySlots = Array.from({ length: startDay });
  const allGridSlots = [
    ...leadingEmptySlots.map(() => null),
    ...days
  ];

  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    for (let i = 0; i < allGridSlots.length; i += 7) {
      const week = allGridSlots.slice(i, i + 7);
      while (week.length < 7) {
        week.push(null);
      }
      result.push(week);
    }
    return result;
  }, [allGridSlots]);

  const selectedTrades = selectedDay
    ? trades.filter((t) => t.entryDate.startsWith(selectedDay))
    : [];

  return (
    <div className="space-y-6">
      {/* Month Navigation Row */}
      <div className="flex items-center justify-between border-b border-border-subtle/50 pb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl bg-bg-secondary/20 dark:bg-white/[0.01] border border-border-subtle hover:border-accent-violet/30 hover:bg-bg-secondary/40 dark:hover:border-white/10 transition-colors text-text-secondary hover:text-text-primary">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h3 className="font-[family-name:var(--font-syne)] font-black text-xl tracking-tight select-none">{format(currentMonth, "MMMM yyyy")}</h3>
          <p className={cn("font-[family-name:var(--font-space-mono)] font-bold text-sm mt-0.5", monthPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
            Net Month P&L: {monthPnl >= 0 ? "+" : ""}{formatCurrency(monthPnl)}
          </p>
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl bg-bg-secondary/20 dark:bg-white/[0.01] border border-border-subtle hover:border-accent-violet/30 hover:bg-bg-secondary/40 dark:hover:border-white/10 transition-colors text-text-secondary hover:text-text-primary">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 8-Column Grid Headers */}
      <div className="grid grid-cols-8 gap-3 text-center text-[10px] text-text-muted uppercase font-black tracking-widest select-none border-b border-border-subtle/50 pb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
        <div className="text-accent-violet">Weekly Stats</div>
      </div>

      {/* 8-Column Grid Content Row by Row */}
      <div className="space-y-3">
        {weeks.map((week, weekIdx) => {
          // Calculate weekly statistics
          const weekTrades = trades.filter(t => {
            return week.some(day => {
              if (!day) return false;
              const dateStr = format(day, "yyyy-MM-dd");
              return t.entryDate.startsWith(dateStr);
            });
          });
          const weekPnl = weekTrades.reduce((s, t) => s + t.netPnl, 0);
          const weekWins = weekTrades.filter(t => t.result === "win").length;
          const weekWr = weekTrades.length > 0 ? (weekWins / weekTrades.length) * 100 : 0;

          return (
            <div key={weekIdx} className="grid grid-cols-8 gap-3 items-stretch">
              {week.map((day, dayIdx) => {
                if (!day) {
                  return <div key={`empty-${dayIdx}`} className="aspect-square bg-bg-secondary/10 dark:bg-white/[0.005] border border-transparent rounded-2xl opacity-10" />;
                }

                const dateStr = format(day, "yyyy-MM-dd");
                const stat = dailyStats.find((d) => d.date === dateStr);
                const isSelected = selectedDay === dateStr;

                // Day stats
                const dayTrades = trades.filter(t => t.entryDate.startsWith(dateStr));
                const winCount = dayTrades.filter(t => t.result === "win").length;
                const winRate = dayTrades.length > 0 ? (winCount / dayTrades.length) * 100 : 0;

                let cardStyle = "bg-bg-secondary/20 dark:bg-white/[0.01] border-border-subtle text-text-secondary hover:border-accent-violet/30 hover:bg-bg-secondary/40 dark:hover:border-white/10 dark:hover:bg-white/[0.03]";
                let shadowGlow = "";
                if (stat) {
                  if (stat.pnl >= 0) {
                    cardStyle = "bg-accent-green/5 border-accent-green/20 text-text-primary hover:bg-accent-green/10";
                    shadowGlow = "hover:shadow-[0_0_15px_rgba(0,255,178,0.1)]";
                  } else {
                    cardStyle = "bg-accent-coral/5 border-accent-coral/20 text-text-primary hover:bg-accent-coral/10";
                    shadowGlow = "hover:shadow-[0_0_15px_rgba(255,45,85,0.1)]";
                  }
                }

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    className={cn(
                      "aspect-square rounded-2xl flex flex-col justify-between p-3 border transition-all duration-300 relative",
                      cardStyle,
                      shadowGlow,
                      isSelected && "ring-2 ring-accent-green scale-[1.03] z-10"
                    )}
                  >
                    <span className="text-[10px] text-text-muted font-bold absolute top-2.5 left-2.5 select-none">{format(day, "d")}</span>
                    
                    {stat ? (
                      <div className="flex-1 flex flex-col justify-end w-full text-left pt-3">
                        <span className={cn("font-[family-name:var(--font-space-mono)] font-black text-xs sm:text-sm tracking-tight leading-none", stat.pnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                          {stat.pnl >= 0 ? "+" : ""}{formatCurrency(stat.pnl, false)}
                        </span>
                        
                        <span className="text-[8px] text-text-muted mt-1 font-semibold leading-none truncate select-none">
                          {dayTrades.length} Trd • {winRate.toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-end w-full">
                        <span className="text-[8px] text-text-muted/20 uppercase tracking-widest font-black leading-none select-none">Flat</span>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Weekly Stats Block (8th column) */}
              <div className={cn(
                "border rounded-2xl p-3 flex flex-col justify-between text-left transition-all duration-500 hover:scale-[1.02]",
                weekTrades.length > 0
                  ? (weekPnl >= 0 
                      ? "bg-accent-green/5 border-accent-green/20 shadow-[0_0_12px_rgba(0,255,178,0.03)]" 
                      : "bg-accent-coral/5 border-accent-coral/20 shadow-[0_0_12px_rgba(255,45,85,0.03)]"
                    )
                  : "bg-bg-secondary/20 dark:bg-white/[0.01] border-border-subtle"
              )}>
                <span className="text-[9px] text-text-muted uppercase font-black tracking-wider leading-none select-none">Week {weekIdx + 1}</span>
                {weekTrades.length > 0 ? (
                  <div className="mt-2">
                    <div className={cn("font-[family-name:var(--font-space-mono)] font-black text-xs sm:text-sm tracking-tight leading-none", weekPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                      {weekPnl >= 0 ? "+" : ""}{formatCurrency(weekPnl, false)}
                    </div>
                    <div className="text-[8px] text-text-muted mt-1 font-semibold leading-none truncate select-none">
                      {weekTrades.length} Trd • {weekWr.toFixed(0)}% WR
                    </div>
                  </div>
                ) : (
                  <span className="text-[8px] text-text-muted/30 uppercase font-black leading-none mt-2 select-none">No Trades</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Trades Drawer */}
      <AnimatePresence>
        {selectedDay && selectedTrades.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-5 border-t border-border-subtle/60 space-y-3"
          >
            <h4 className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-2 select-none">
              Trades executed on {formatDate(selectedDay)}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedTrades.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => router.push(`/journal/${t.id}`)}
                  className={cn("flex items-center justify-between p-3.5 rounded-xl border border-transparent cursor-pointer hover:bg-bg-secondary/30 dark:hover:bg-white/[0.02] transition-all", 
                    t.result === "win" ? "row-win" : "row-loss"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-space-mono)] font-black text-sm">{t.symbol}</span>
                    <span className={cn("text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider border", 
                      t.direction === "long" ? "bg-accent-green/10 text-accent-green border-accent-green/20" : "bg-accent-coral/10 text-accent-coral border-accent-coral/20"
                    )}>
                      {t.direction}
                    </span>
                    <span className="text-[10px] text-text-muted font-bold select-none">{t.sessionTag}</span>
                  </div>
                  <div className="text-right">
                    <span className={cn("font-[family-name:var(--font-space-mono)] font-black text-sm block leading-none", t.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                      {t.netPnl >= 0 ? "+" : ""}{formatCurrency(t.netPnl)}
                    </span>
                    <span className="text-[9px] text-text-muted font-[family-name:var(--font-space-mono)] font-bold mt-1 block leading-none">
                      {t.rMultiple >= 0 ? "+" : ""}{t.rMultiple.toFixed(2)}R
                    </span>
                  </div>
                </div>
              ))}
            </div>
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

  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div className="space-y-6 pb-12" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] font-black text-3xl bg-clip-text text-transparent bg-gradient-to-r from-accent-green via-accent-blue to-accent-violet pb-0.5 leading-none">Trade Journal</h1>
          <p className="text-xs text-text-secondary mt-1 font-semibold">{trades.length} trades recorded</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-bg-secondary/40 dark:bg-white/[0.01] border border-border-subtle rounded-xl p-1">
            <button
              onClick={() => setJournalView("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                journalView === "list" ? "bg-accent-green/10 text-accent-green shadow-sm" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setJournalView("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                journalView === "calendar" ? "bg-accent-green/10 text-accent-green shadow-sm" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <CalendarDays size={14} /> Calendar
            </button>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-bg-secondary/20 dark:bg-white/[0.01] border border-border-subtle hover:border-accent-violet/30 transition-all">
            <Filter size={14} /> Filters
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-bg-secondary/20 dark:bg-white/[0.01] border border-border-subtle hover:border-accent-violet/30 transition-all">
            <Download size={14} /> Export
          </button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/journal/new"
              className="flex items-center gap-1.5 bg-gradient-to-r from-accent-green to-accent-blue text-bg-base px-4 py-2 rounded-xl text-xs font-black hover:shadow-[0_0_20px_rgba(0,255,178,0.25)] transition-all border border-white/10"
            >
              <Plus size={14} className="stroke-[3]" /> New Trade
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Streak Badges */}
      <motion.div variants={itemVariants} className="flex gap-3">
        <div className="flex items-center gap-2 bg-bg-secondary/20 dark:bg-white/[0.01] border border-border-subtle px-3.5 py-2 rounded-xl select-none">
          <Flame size={14} className="text-accent-green drop-shadow-[0_0_8px_rgba(0,255,178,0.4)]" />
          <span className="text-[10px] text-text-muted uppercase font-black tracking-wider">Win Streak:</span>
          <span className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green text-sm text-glow-green">{metrics.curWin}</span>
        </div>
        <div className="flex items-center gap-2 bg-bg-secondary/20 dark:bg-white/[0.01] border border-border-subtle px-3.5 py-2 rounded-xl select-none">
          <Trophy size={14} className="text-accent-violet drop-shadow-[0_0_8px_rgba(123,97,255,0.4)]" />
          <span className="text-[10px] text-text-muted uppercase font-black tracking-wider">Max Streak:</span>
          <span className="font-[family-name:var(--font-space-mono)] font-bold text-accent-violet text-sm text-glow-violet">{metrics.maxWin}</span>
        </div>
        <div className="flex items-center gap-2 bg-bg-secondary/20 dark:bg-white/[0.01] border border-border-subtle px-3.5 py-2 rounded-xl select-none">
          <span className="text-[10px] text-text-muted uppercase font-black tracking-wider">Ratio wins/losses:</span>
          <span className="font-[family-name:var(--font-space-mono)] font-bold text-sm">
            <span className="text-accent-green">{metrics.wins} W</span>
            <span className="text-text-muted/40 font-normal"> / </span>
            <span className="text-accent-coral">{metrics.losses} L</span>
          </span>
        </div>
      </motion.div>

      {/* Content */}
      <GlassCard noPadding className="overflow-hidden border border-border-subtle p-5">
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
      </GlassCard>
    </motion.div>
  );
}
