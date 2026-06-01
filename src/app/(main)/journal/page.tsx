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
import { ArrowUpRight, ArrowDownRight, List, CalendarDays, Plus, Download, Filter, ChevronLeft, ChevronRight, Flame, Trophy, Skull, Trash2, CheckSquare, Search, X, TrendingUp, TrendingDown, Clock, Target, BarChart2, Zap } from "lucide-react";
import Link from "next/link";

function TradeCard({ trade, index, isSelected, onSelect }: { trade: Trade; index: number; isSelected: boolean; onSelect: (e: React.MouseEvent) => void }) {
  const router = useRouter();
  const isWin = trade.result === "win";
  const isLong = trade.direction === "long";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(0.25, index * 0.03), type: "spring", stiffness: 300, damping: 28 }}
      onClick={() => router.push(`/journal/${trade.id}`)}
      className={cn(
        "group relative flex items-stretch gap-0 rounded-2xl border cursor-pointer overflow-hidden transition-all duration-300",
        "hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:-translate-y-0.5",
        isSelected
          ? "border-accent-green/40 shadow-[0_0_20px_rgba(0,255,178,0.08)]"
          : isWin
          ? "border-border-subtle hover:border-accent-green/30 bg-bg-card"
          : "border-border-subtle hover:border-accent-coral/30 bg-bg-card"
      )}
    >
      {/* Left Accent Bar */}
      <div className={cn(
        "w-1 flex-shrink-0 transition-all duration-300",
        isWin ? "bg-accent-green/60 group-hover:bg-accent-green" : "bg-accent-coral/60 group-hover:bg-accent-coral"
      )} />

      {/* Checkbox */}
      <div
        className="flex items-center px-3 flex-shrink-0"
        onClick={onSelect}
      >
        <div className={cn(
          "w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all",
          isSelected ? "bg-accent-green border-accent-green" : "border-border-subtle/60 group-hover:border-text-muted"
        )}>
          {isSelected && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4L3 6L7 2" stroke="#0B0F19" strokeWidth="2" strokeLinecap="round"/></svg>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 py-3 pr-4 flex items-center gap-4">
        {/* Symbol + Direction */}
        <div className="flex-shrink-0 w-28">
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-space-mono)] font-black text-base text-text-primary tracking-tight">{trade.symbol}</span>
            <span className={cn(
              "inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider",
              isLong ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral"
            )}>
              {isLong ? <ArrowUpRight size={8} className="stroke-[3]" /> : <ArrowDownRight size={8} className="stroke-[3]" />}
              {trade.direction}
            </span>
          </div>
          <div className="text-[10px] text-text-muted font-semibold mt-0.5">
            {format(new Date(trade.entryDate), "MMM dd, HH:mm")}
          </div>
        </div>

        {/* P&L — hero number */}
        <div className="flex-shrink-0 w-28 text-right">
          <div className={cn(
            "font-[family-name:var(--font-space-mono)] font-black text-xl tracking-tight leading-none",
            isWin ? "text-accent-green" : "text-accent-coral"
          )}>
            {trade.netPnl >= 0 ? "+" : ""}{formatCurrency(trade.netPnl)}
          </div>
          <div className={cn(
            "text-[10px] font-bold mt-0.5",
            isWin ? "text-accent-green/70" : "text-accent-coral/70"
          )}>
            {(trade.rMultiple || 0) >= 0 ? "+" : ""}{(trade.rMultiple || 0).toFixed(2)}R
          </div>
        </div>

        {/* Setup Tags */}
        <div className="flex-1 min-w-0 hidden md:flex flex-wrap gap-1">
          {(trade.setupTags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="text-[9px] px-2 py-0.5 rounded-lg bg-accent-violet/10 text-accent-violet border border-accent-violet/15 font-black whitespace-nowrap">{tag}</span>
          ))}
          {(trade.setupTags || []).length === 0 && (
            <span className="text-[9px] text-text-muted/40 uppercase tracking-wider font-bold">No Setup Tags</span>
          )}
        </div>

        {/* Session + Duration */}
        <div className="flex-shrink-0 hidden lg:flex flex-col items-end gap-1">
          <span className="text-[10px] text-text-secondary font-bold">{trade.sessionTag}</span>
          <span className="flex items-center gap-1 text-[10px] text-text-muted">
            <Clock size={9} /> {formatDuration(trade.durationMinutes)}
          </span>
        </div>

        {/* Result Badge */}
        <div className="flex-shrink-0">
          <span className={cn(
            "inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border",
            isWin
              ? "bg-accent-green/10 text-accent-green border-accent-green/20 shadow-[0_0_8px_rgba(0,255,178,0.1)]"
              : "bg-accent-coral/10 text-accent-coral border-accent-coral/20 shadow-[0_0_8px_rgba(255,45,85,0.1)]"
          )}>
            {isWin ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {trade.result}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function TradeListView({ trades }: { trades: Trade[] }) {
  const { deleteTrades } = useTradeStore();
  const [sortField, setSortField] = useState<keyof Trade>("entryDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterDir, setFilterDir] = useState<"all" | "long" | "short">("all");
  const [filterResult, setFilterResult] = useState<"all" | "win" | "loss">("all");

  const filtered = useMemo(() => {
    let list = [...trades];
    if (search) list = list.filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()) || (t.setupTags || []).some(s => s.toLowerCase().includes(search.toLowerCase())));
    if (filterDir !== "all") list = list.filter(t => t.direction === filterDir);
    if (filterResult !== "all") list = list.filter(t => t.result === filterResult);
    return list.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (typeof aVal === "number" && typeof bVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      return 0;
    });
  }, [trades, search, filterDir, filterResult, sortField, sortDir]);

  const toggleSelect = (e: React.MouseEvent, tradeId: string) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(tradeId) ? prev.filter(id => id !== tradeId) : [...prev, tradeId]);
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.length} selected trades? This cannot be undone.`)) {
      await deleteTrades(selectedIds);
      setSelectedIds([]);
    }
  };

  const summaryStats = useMemo(() => {
    const wins = filtered.filter(t => t.result === "win").length;
    const total = filtered.length;
    const totalPnl = filtered.reduce((s, t) => s + t.netPnl, 0);
    const avgR = filtered.length > 0 ? filtered.reduce((s, t) => s + (t.rMultiple || 0), 0) / filtered.length : 0;
    return { wins, total, winRate: total > 0 ? (wins / total) * 100 : 0, totalPnl, avgR };
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by symbol, setup tag..."
            className="w-full bg-bg-secondary/20 dark:bg-white/[0.02] border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "long", "short"] as const).map(v => (
            <button key={v} onClick={() => setFilterDir(v)}
              className={cn("px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                filterDir === v ? "bg-accent-violet/10 border-accent-violet/30 text-accent-violet" : "bg-bg-secondary/20 dark:bg-white/[0.01] border-border-subtle text-text-muted hover:text-text-primary")}>
              {v === "all" ? "All" : v === "long" ? "↑ Long" : "↓ Short"}
            </button>
          ))}
          <div className="w-[1px] bg-border-subtle" />
          {(["all", "win", "loss"] as const).map(v => (
            <button key={v} onClick={() => setFilterResult(v)}
              className={cn("px-3 py-2 rounded-xl text-xs font-bold border transition-all",
                filterResult === v ? (v === "win" ? "bg-accent-green/10 border-accent-green/30 text-accent-green" : v === "loss" ? "bg-accent-coral/10 border-accent-coral/30 text-accent-coral" : "bg-accent-violet/10 border-accent-violet/30 text-accent-violet") : "bg-bg-secondary/20 dark:bg-white/[0.01] border-border-subtle text-text-muted hover:text-text-primary")}>
              {v === "all" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats Strip */}
      {filtered.length > 0 && (
        <div className="flex gap-4 px-1 text-xs">
          <span className="text-text-muted">{filtered.length} trades</span>
          <span className={cn("font-bold font-[family-name:var(--font-space-mono)]", summaryStats.totalPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
            {summaryStats.totalPnl >= 0 ? "+" : ""}{formatCurrency(summaryStats.totalPnl)} net
          </span>
          <span className="text-text-muted">WR: <span className={cn("font-bold", summaryStats.winRate >= 50 ? "text-accent-green" : "text-accent-coral")}>{summaryStats.winRate.toFixed(0)}%</span></span>
          <span className="text-text-muted">Avg R: <span className={cn("font-bold font-[family-name:var(--font-space-mono)]", summaryStats.avgR >= 0 ? "text-accent-green" : "text-accent-coral")}>{summaryStats.avgR >= 0 ? "+" : ""}{summaryStats.avgR.toFixed(2)}R</span></span>
        </div>
      )}

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex items-center justify-between bg-accent-coral/10 border border-accent-coral/20 px-5 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <CheckSquare size={15} className="text-accent-coral" />
                <span className="text-sm font-semibold">{selectedIds.length} selected</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors">Clear</button>
                <button onClick={handleBulkDelete} className="flex items-center gap-1.5 bg-accent-coral text-bg-base px-4 py-2 rounded-xl text-xs font-bold transition-all">
                  <Trash2 size={13} /> Delete Selected
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade Cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <BarChart2 size={40} className="text-text-muted/20 mb-4" />
            <p className="text-sm font-bold text-text-muted">{search || filterDir !== "all" || filterResult !== "all" ? "No trades match your filters" : "No trades recorded yet"}</p>
            <p className="text-xs text-text-muted/60 mt-1">
              {search || filterDir !== "all" || filterResult !== "all" ? "Try adjusting your search or filters" : 'Hit "New Trade" to log your first execution'}
            </p>
          </div>
        ) : (
          filtered.map((trade, i) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              index={i}
              isSelected={selectedIds.includes(trade.id)}
              onSelect={(e) => toggleSelect(e, trade.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CalendarHeatmapView({ trades }: { trades: Trade[] }) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  const dailyStats = useMemo(() => getDailyStats(trades), [trades]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const monthPnl = dailyStats
    .filter(d => d.date >= format(monthStart, "yyyy-MM-dd") && d.date <= format(monthEnd, "yyyy-MM-dd"))
    .reduce((s, d) => s + d.pnl, 0);

  const leadingEmptySlots = Array.from({ length: startDay });
  const allGridSlots = [...leadingEmptySlots.map(() => null), ...days];
  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    for (let i = 0; i < allGridSlots.length; i += 7) {
      const week = allGridSlots.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      result.push(week);
    }
    return result;
  }, [allGridSlots]);

  const selectedTrades = selectedDay ? trades.filter(t => t.entryDate?.startsWith(selectedDay)) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border-subtle/50 pb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-xl bg-bg-secondary/20 dark:bg-white/[0.01] border border-border-subtle hover:border-accent-violet/30 transition-colors text-text-secondary hover:text-text-primary">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h3 className="font-[family-name:var(--font-inter)] font-black text-xl tracking-tight select-none">{format(currentMonth, "MMMM yyyy")}</h3>
          <p className={cn("font-[family-name:var(--font-space-mono)] font-bold text-sm mt-0.5", monthPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
            Net Month P&L: {monthPnl >= 0 ? "+" : ""}{formatCurrency(monthPnl)}
          </p>
        </div>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-xl bg-bg-secondary/20 dark:bg-white/[0.01] border border-border-subtle hover:border-accent-violet/30 transition-colors text-text-secondary hover:text-text-primary">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-8 gap-3 text-center text-[10px] text-text-muted uppercase font-black tracking-widest select-none border-b border-border-subtle/50 pb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
        <div className="text-accent-violet">Weekly Stats</div>
      </div>

      <div className="space-y-3">
        {weeks.map((week, weekIdx) => {
          const weekTrades = trades.filter(t => week.some(day => { if (!day) return false; return t.entryDate?.startsWith(format(day, "yyyy-MM-dd")); }));
          const weekPnl = weekTrades.reduce((s, t) => s + t.netPnl, 0);
          const weekWins = weekTrades.filter(t => t.result === "win").length;
          const weekWr = weekTrades.length > 0 ? (weekWins / weekTrades.length) * 100 : 0;

          return (
            <div key={weekIdx} className="grid grid-cols-8 gap-3 items-stretch">
              {week.map((day, dayIdx) => {
                if (!day) return <div key={`empty-${dayIdx}`} className="aspect-square bg-bg-secondary/10 dark:bg-white/[0.005] border border-transparent rounded-2xl opacity-10" />;
                const dateStr = format(day, "yyyy-MM-dd");
                const stat = dailyStats.find(d => d.date === dateStr);
                const isSelected = selectedDay === dateStr;
                const dayTrades = trades.filter(t => t.entryDate?.startsWith(dateStr));
                const winCount = dayTrades.filter(t => t.result === "win").length;
                const winRate = dayTrades.length > 0 ? (winCount / dayTrades.length) * 100 : 0;

                let cardStyle = "bg-bg-secondary/20 dark:bg-white/[0.01] border-border-subtle text-text-secondary hover:border-accent-violet/30 hover:bg-bg-secondary/40 dark:hover:border-white/10 dark:hover:bg-white/[0.03]";
                let shadowGlow = "";
                if (stat) {
                  if (stat.pnl >= 0) { cardStyle = "bg-accent-green/5 border-accent-green/20 text-text-primary hover:bg-accent-green/10"; shadowGlow = "hover:shadow-[0_0_15px_rgba(0,255,178,0.1)]"; }
                  else { cardStyle = "bg-accent-coral/5 border-accent-coral/20 text-text-primary hover:bg-accent-coral/10"; shadowGlow = "hover:shadow-[0_0_15px_rgba(255,45,85,0.1)]"; }
                }

                return (
                  <button key={dateStr} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    className={cn("aspect-square rounded-2xl flex flex-col justify-between p-3 border transition-all duration-300 relative", cardStyle, shadowGlow, isSelected && "ring-2 ring-accent-green scale-[1.03] z-10")}>
                    <span className="text-[10px] text-text-muted font-bold absolute top-2.5 left-2.5 select-none">{format(day, "d")}</span>
                    {stat ? (
                      <div className="flex-1 flex flex-col justify-end w-full text-left pt-3">
                        <span className={cn("font-[family-name:var(--font-space-mono)] font-black text-xs sm:text-sm tracking-tight leading-none", stat.pnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                          {stat.pnl >= 0 ? "+" : ""}{formatCurrency(stat.pnl, false)}
                        </span>
                        <span className="text-[8px] text-text-muted mt-1 font-semibold leading-none truncate select-none">{dayTrades.length} Trd • {winRate.toFixed(0)}%</span>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-end w-full"><span className="text-[8px] text-text-muted/20 uppercase tracking-widest font-black leading-none select-none">Flat</span></div>
                    )}
                  </button>
                );
              })}

              <div className={cn("border rounded-2xl p-3 flex flex-col justify-between text-left transition-all duration-500 hover:scale-[1.02]",
                weekTrades.length > 0 ? (weekPnl >= 0 ? "bg-accent-green/5 border-accent-green/20" : "bg-accent-coral/5 border-accent-coral/20") : "bg-bg-secondary/20 dark:bg-white/[0.01] border-border-subtle")}>
                <span className="text-[9px] text-text-muted uppercase font-black tracking-wider leading-none select-none">Week {weekIdx + 1}</span>
                {weekTrades.length > 0 ? (
                  <div className="mt-2">
                    <div className={cn("font-[family-name:var(--font-space-mono)] font-black text-xs sm:text-sm tracking-tight leading-none", weekPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                      {weekPnl >= 0 ? "+" : ""}{formatCurrency(weekPnl, false)}
                    </div>
                    <div className="text-[8px] text-text-muted mt-1 font-semibold leading-none truncate select-none">{weekTrades.length} Trd • {weekWr.toFixed(0)}% WR</div>
                  </div>
                ) : (
                  <span className="text-[8px] text-text-muted/30 uppercase font-black leading-none mt-2 select-none">No Trades</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedDay && selectedTrades.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 pt-5 border-t border-border-subtle/60 space-y-3">
            <h4 className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-2 select-none">Trades on {formatDate(selectedDay)}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedTrades.map(t => (
                <div key={t.id} onClick={() => router.push(`/journal/${t.id}`)}
                  className={cn("flex items-center justify-between p-3.5 rounded-xl border border-transparent cursor-pointer hover:bg-bg-secondary/30 dark:hover:bg-white/[0.02] transition-all", t.result === "win" ? "row-win" : "row-loss")}>
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-space-mono)] font-black text-sm">{t.symbol}</span>
                    <span className={cn("text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider border", t.direction === "long" ? "bg-accent-green/10 text-accent-green border-accent-green/20" : "bg-accent-coral/10 text-accent-coral border-accent-coral/20")}>{t.direction}</span>
                    <span className="text-[10px] text-text-muted font-bold select-none">{t.sessionTag}</span>
                  </div>
                  <div className="text-right">
                    <span className={cn("font-[family-name:var(--font-space-mono)] font-black text-sm block leading-none", t.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>{t.netPnl >= 0 ? "+" : ""}{formatCurrency(t.netPnl)}</span>
                    <span className="text-[9px] text-text-muted font-[family-name:var(--font-space-mono)] font-bold mt-1 block leading-none">{t.rMultiple >= 0 ? "+" : ""}{t.rMultiple.toFixed(2)}R</span>
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
    const wins = trades.filter(t => t.result === "win").length;
    const losses = trades.filter(t => t.result === "loss").length;
    const totalPnl = trades.reduce((s, t) => s + t.netPnl, 0);
    let curWin = 0, maxWin = 0, tempWin = 0;
    for (const t of trades) {
      if (t.result === "win") { tempWin++; maxWin = Math.max(maxWin, tempWin); }
      else tempWin = 0;
    }
    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].result === "win") curWin++;
      else break;
    }
    const bestTrade = trades.reduce((best, t) => t.netPnl > (best?.netPnl ?? -Infinity) ? t : best, null as Trade | null);
    return { wins, losses, curWin, maxWin, totalPnl, winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0, bestTrade };
  }, [trades]);

  const containerVariants: any = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <motion.div className="space-y-6 pb-12" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header Controls */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-bg-secondary/40 dark:bg-white/[0.01] border border-border-subtle rounded-xl p-1">
            <button onClick={() => setJournalView("list")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                journalView === "list" ? "bg-accent-green/10 text-accent-green shadow-sm" : "text-text-muted hover:text-text-secondary")}>
              <List size={14} /> List
            </button>
            <button onClick={() => setJournalView("calendar")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                journalView === "calendar" ? "bg-accent-green/10 text-accent-green shadow-sm" : "text-text-muted hover:text-text-secondary")}>
              <CalendarDays size={14} /> Calendar
            </button>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
            <Link href="/journal/new"
              className="flex items-center gap-1.5 bg-gradient-to-r from-accent-green to-accent-blue text-bg-base px-4 py-2 rounded-xl text-xs font-black hover:shadow-[0_0_20px_rgba(0,255,178,0.25)] transition-all border border-white/10">
              <Plus size={14} className="stroke-[3]" /> New Trade
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* KPI Strip */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {[
          { label: "Win Rate", value: `${metrics.winRate.toFixed(1)}%`, color: metrics.winRate >= 50 ? "text-accent-green" : "text-accent-coral", icon: Target },
          { label: "Net P&L", value: formatCurrency(metrics.totalPnl), color: metrics.totalPnl >= 0 ? "text-accent-green" : "text-accent-coral", icon: TrendingUp },
          { label: "Win Streak", value: `${metrics.curWin}`, color: "text-accent-violet", icon: Flame },
          { label: "Best Streak", value: `${metrics.maxWin} W`, color: "text-accent-violet", icon: Trophy },
          { label: "W / L", value: `${metrics.wins}W / ${metrics.losses}L`, color: "text-text-primary", icon: BarChart2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-bg-card/60 border border-border-subtle rounded-2xl p-3.5 flex items-center gap-3 hover:border-accent-violet/20 transition-colors group">
            <div className="w-8 h-8 rounded-xl bg-bg-secondary/40 dark:bg-white/[0.02] flex items-center justify-center border border-border-subtle flex-shrink-0">
              <Icon size={15} className={color} />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] text-text-muted uppercase font-black tracking-wider">{label}</div>
              <div className={cn("font-[family-name:var(--font-space-mono)] font-black text-sm truncate", color)}>{value}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants}>
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
    </motion.div>
  );
}
