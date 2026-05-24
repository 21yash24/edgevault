"use client";
import { useMemo, useState, useRef } from "react";
import { Trade } from "@/lib/types";
import { getDailyStats } from "@/lib/calculations";
import { formatCurrency, cn } from "@/lib/utils";
import { subDays, format, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export function CalendarHeatmap({ trades }: { trades: Trade[] }) {
  const [hoveredDay, setHoveredDay] = useState<{
    dateStr: string;
    pnl: number;
    left: number;
    top: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    const dailyStats = getDailyStats(trades);
    const pnlMap = new Map(dailyStats.map((d) => [d.date, d.pnl]));
    
    // Generate last 371 days to fill exactly 53 weeks (53 weeks * 7 days)
    const days = [];
    const today = startOfDay(new Date());
    for (let i = 370; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const pnl = pnlMap.get(dateStr) || 0;
      days.push({ date, dateStr, pnl });
    }
    return days;
  }, [trades]);

  const maxLoss = Math.abs(Math.min(...data.map(d => d.pnl), -1));
  const maxWin = Math.max(...data.map(d => d.pnl), 1);

  const getColor = (pnl: number) => {
    if (pnl === 0) return "bg-white/[0.03] border border-white/[0.04]";
    if (pnl > 0) {
      const intensity = Math.min(pnl / maxWin, 1);
      if (intensity > 0.75) return "bg-[#00FFB2] shadow-[0_0_10px_rgba(0,255,178,0.4)] border border-[#00FFB2]/20";
      if (intensity > 0.5) return "bg-[#00CC8E] border border-[#00CC8E]/20";
      if (intensity > 0.25) return "bg-[#00996A] border border-[#00996A]/20";
      return "bg-[#006647] border border-[#006647]/20";
    } else {
      const intensity = Math.min(Math.abs(pnl) / maxLoss, 1);
      if (intensity > 0.75) return "bg-[#FF2D55] shadow-[0_0_10px_rgba(255,45,85,0.4)] border border-[#FF2D55]/20";
      if (intensity > 0.5) return "bg-[#CC2444] border border-[#CC2444]/20";
      if (intensity > 0.25) return "bg-[#991B33] border border-[#991B33]/20";
      return "bg-[#661222] border border-[#661222]/20";
    }
  };

  // Group into 53 columns of 7 days
  const weeks = useMemo(() => {
    const cols = [];
    for (let i = 0; i < 53; i++) {
      cols.push(data.slice(i * 7, (i + 1) * 7));
    }
    return cols;
  }, [data]);

  // Compute month label offsets
  const monthLabels = useMemo(() => {
    const labels: { text: string; colIdx: number }[] = [];
    let lastMonth = "";
    weeks.forEach((week, colIdx) => {
      const firstDayOfWeek = week[0];
      if (firstDayOfWeek) {
        const monthName = format(firstDayOfWeek.date, "MMM");
        if (monthName !== lastMonth) {
          labels.push({ text: monthName, colIdx });
          lastMonth = monthName;
        }
      }
    });
    return labels;
  }, [weeks]);

  const handleMouseMove = (e: React.MouseEvent, day: typeof data[0]) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHoveredDay({
      dateStr: day.dateStr,
      pnl: day.pnl,
      left: e.clientX - rect.left,
      top: e.clientY - rect.top - 50,
    });
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      <div className="overflow-x-auto no-scrollbar pb-2">
        <div className="min-w-[800px] flex flex-col relative pl-8 pt-6 select-none">
          
          {/* Month Labels */}
          <div className="absolute top-0 left-8 right-0 flex text-[10px] text-text-muted font-medium h-5">
            {monthLabels.map((lbl, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${lbl.colIdx * 14}px` }}
              >
                {lbl.text}
              </span>
            ))}
          </div>

          {/* Row Labels (Days of Week) */}
          <div className="absolute left-0 top-6 bottom-0 w-6 flex flex-col justify-between text-[9px] text-text-muted font-bold py-1 select-none">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          {/* Heatmap Grid */}
          <div className="flex gap-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day) => (
                  <motion.div
                    key={day.dateStr}
                    className={cn(
                      "w-2.5 h-2.5 rounded-[2px] cursor-pointer transition-all",
                      getColor(day.pnl)
                    )}
                    onMouseEnter={(e) => handleMouseMove(e, day)}
                    onMouseMove={(e) => handleMouseMove(e, day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    whileHover={{ scale: 1.3, zIndex: 10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-[9px] text-text-muted select-none">
            <span>Loss</span>
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#661222]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#991B33]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#CC2444]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#FF2D55]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-white/[0.03] border border-white/[0.04]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#006647]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#00996A]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#00CC8E]" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#00FFB2]" />
            </div>
            <span>Profit</span>
          </div>

        </div>
      </div>

      {/* Floating Animated Tooltip */}
      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="absolute z-50 pointer-events-none p-2.5 rounded-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md bg-bg-card/95 text-xs flex flex-col gap-0.5"
            style={{
              left: hoveredDay.left + 15,
              top: hoveredDay.top,
            }}
          >
            <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              {format(new Date(hoveredDay.dateStr), "EEE, MMM d, yyyy")}
            </div>
            <div
              className={cn(
                "font-[family-name:var(--font-space-mono)] font-bold text-sm",
                hoveredDay.pnl > 0 ? "text-accent-green" : hoveredDay.pnl < 0 ? "text-accent-coral" : "text-text-secondary"
              )}
            >
              {hoveredDay.pnl === 0 ? "No Trades" : formatCurrency(hoveredDay.pnl)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
