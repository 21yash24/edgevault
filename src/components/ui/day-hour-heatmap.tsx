"use client";
import React, { useMemo } from "react";
import { Trade } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

interface CellData {
  totalPnl: number;
  count: number;
}

export function DayHourHeatmap({ trades }: { trades: Trade[] }) {
  const grid = useMemo(() => {
    // Build a map: dayIndex (1=Mon..5=Fri) × hour → aggregate
    const map = new Map<string, CellData>();

    for (const t of trades) {
      const d = new Date(t.entryDate);
      const day = d.getDay(); // 0=Sun,1=Mon...5=Fri
      const hour = d.getHours();
      if (day < 1 || day > 5) continue; // skip weekends
      const key = `${day}-${hour}`;
      const prev = map.get(key) ?? { totalPnl: 0, count: 0 };
      map.set(key, { totalPnl: prev.totalPnl + t.netPnl, count: prev.count + 1 });
    }

    // Find max absolute value for color scaling
    let maxAbs = 0;
    for (const cell of map.values()) {
      maxAbs = Math.max(maxAbs, Math.abs(cell.totalPnl));
    }

    return { map, maxAbs };
  }, [trades]);

  const getCellColor = (dayIndex: number, hour: number) => {
    const dayNum = dayIndex + 1; // Mon=1...Fri=5
    const cell = grid.map.get(`${dayNum}-${hour}`);
    if (!cell || cell.count === 0) return "bg-bg-secondary/20 border-border-subtle/20";

    const ratio = Math.min(cell.totalPnl / (grid.maxAbs || 1), 1);
    const absRatio = Math.abs(ratio);

    if (ratio > 0) {
      if (absRatio > 0.7) return "bg-accent-green/60 border-accent-green/40";
      if (absRatio > 0.4) return "bg-accent-green/35 border-accent-green/25";
      return "bg-accent-green/15 border-accent-green/15";
    } else {
      if (absRatio > 0.7) return "bg-accent-coral/60 border-accent-coral/40";
      if (absRatio > 0.4) return "bg-accent-coral/35 border-accent-coral/25";
      return "bg-accent-coral/15 border-accent-coral/15";
    }
  };

  const getCellPnl = (dayIndex: number, hour: number) => {
    const cell = grid.map.get(`${dayIndex + 1}-${hour}`);
    if (!cell || cell.count === 0) return null;
    return { pnl: cell.totalPnl, count: cell.count };
  };

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-xs">
        Not enough data yet
      </div>
    );
  }

  return (
    <div className="w-full select-none overflow-x-auto">
      {/* Header row: hours */}
      <div className="flex items-center gap-0.5 mb-0.5">
        {/* Day label spacer */}
        <div className="w-10 flex-shrink-0" />
        {HOURS.map((h) => {
          const ampm = h >= 12 ? "PM" : "AM";
          const disp = h % 12 || 12;
          return (
            <div key={h} className="flex-1 text-center text-[9px] text-text-muted font-bold tracking-tight min-w-[30px]">
              {disp}{ampm}
            </div>
          );
        })}
      </div>

      {/* Grid rows: days */}
      {DAYS.map((day, di) => (
        <div key={day} className="flex items-center gap-0.5 mb-0.5">
          <div className="w-10 flex-shrink-0 text-[10px] text-text-muted font-bold text-right pr-2">{day}</div>
          {HOURS.map((hour) => {
            const data = getCellPnl(di, hour);
            return (
              <div
                key={hour}
                className={cn(
                  "flex-1 min-w-[30px] h-8 rounded border transition-all duration-300 hover:scale-110 hover:z-10 relative group cursor-default",
                  getCellColor(di, hour)
                )}
              >
                {/* Tooltip */}
                {data && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block pointer-events-none">
                    <div className="bg-bg-card border border-border-subtle rounded-lg px-2.5 py-1.5 text-[10px] whitespace-nowrap shadow-xl">
                      <div className="font-bold text-text-primary">{day} {hour % 12 || 12}{hour >= 12 ? "PM" : "AM"}</div>
                      <div className={cn("font-bold", data.pnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                        {data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(0)}
                      </div>
                      <div className="text-text-muted">{data.count} trade{data.count !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="w-2 h-2 bg-bg-card border-b border-r border-border-subtle rotate-45 mx-auto -mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          <div className="flex gap-0.5">
            {[0.15, 0.35, 0.60].map((o, i) => (
              <div key={i} className="w-3 h-3 rounded-sm border border-accent-coral/40" style={{ backgroundColor: `rgba(255,45,85,${o})` }} />
            ))}
          </div>
          Loss
        </div>
        <div className="w-6 h-px bg-border-subtle" />
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
          Profit
          <div className="flex gap-0.5">
            {[0.15, 0.35, 0.60].map((o, i) => (
              <div key={i} className="w-3 h-3 rounded-sm border border-accent-green/40" style={{ backgroundColor: `rgba(0,255,178,${o})` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
