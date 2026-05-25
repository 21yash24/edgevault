"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Calendar } from "lucide-react";
import EconomicCalendarWidget from "@/components/tradingview/economic-calendar-widget";

export function EconomicCalendar() {
  return (
    <GlassCard className="h-full flex flex-col p-0 overflow-hidden relative">
      <div className="p-5 border-b border-border-subtle/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-blue/10 text-accent-blue">
            <Calendar size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary tracking-tight">Economic Calendar</h2>
            <p className="text-xs text-text-muted mt-0.5">Real-time market events & news</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full relative min-h-[400px]">
        <EconomicCalendarWidget />
      </div>
    </GlassCard>
  );
}
