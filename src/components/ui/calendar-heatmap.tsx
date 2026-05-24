"use client";
import { useMemo } from "react";
import { Trade } from "@/lib/types";
import { getDailyStats } from "@/lib/calculations";
import { formatCurrency, cn } from "@/lib/utils";
import { subDays, format, startOfDay } from "date-fns";
import { motion } from "framer-motion";

export function CalendarHeatmap({ trades }: { trades: Trade[] }) {
  const data = useMemo(() => {
    const dailyStats = getDailyStats(trades);
    const pnlMap = new Map(dailyStats.map((d) => [d.date, d.pnl]));
    
    // Generate last 364 days (52 weeks * 7 days)
    const days = [];
    const today = startOfDay(new Date());
    for (let i = 363; i >= 0; i--) {
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
    if (pnl === 0) return "bg-bg-secondary border border-border-subtle";
    if (pnl > 0) {
      const intensity = Math.min(pnl / maxWin, 1);
      if (intensity > 0.75) return "bg-[#00FFB2]";
      if (intensity > 0.5) return "bg-[#00CC8E]";
      if (intensity > 0.25) return "bg-[#00996A]";
      return "bg-[#006647]";
    } else {
      const intensity = Math.min(Math.abs(pnl) / maxLoss, 1);
      if (intensity > 0.75) return "bg-[#FF2D55]";
      if (intensity > 0.5) return "bg-[#CC2444]";
      if (intensity > 0.25) return "bg-[#991B33]";
      return "bg-[#661222]";
    }
  };

  // Group into 52 columns of 7 days
  const weeks = [];
  for (let i = 0; i < 52; i++) {
    weeks.push(data.slice(i * 7, (i + 1) * 7));
  }

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <div className="min-w-[750px] pb-2">
        <div className="flex gap-1">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day, dIdx) => (
                <motion.div
                  key={day.dateStr}
                  className={cn("w-3 h-3 rounded-[2px] cursor-pointer hover:ring-1 hover:ring-white/40 transition-all", getColor(day.pnl))}
                  title={`${day.dateStr} — P&L: ${formatCurrency(day.pnl)}`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-text-muted">
          <span>Loss</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-[2px] bg-[#FF2D55]" />
            <div className="w-3 h-3 rounded-[2px] bg-[#991B33]" />
            <div className="w-3 h-3 rounded-[2px] bg-bg-secondary border border-border-subtle" />
            <div className="w-3 h-3 rounded-[2px] bg-[#00996A]" />
            <div className="w-3 h-3 rounded-[2px] bg-[#00FFB2]" />
          </div>
          <span>Profit</span>
        </div>
      </div>
    </div>
  );
}
