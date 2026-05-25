"use client";

import { useState, useMemo, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  Calendar, AlertOctagon, TrendingUp, Search, Info, 
  Bell, BellOff, ArrowUpRight, ArrowDownRight, Clock, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CalendarEvent {
  id: string;
  time: string;
  currency: string;
  event: string;
  impact: "high" | "medium" | "low";
  forecast: string;
  previous: string;
  actual?: string;
  status: "upcoming" | "released";
}

const mockEvents: CalendarEvent[] = [
  {
    id: "news-1",
    time: "08:30 AM",
    currency: "USD",
    event: "Core CPI (MoM) (Apr)",
    impact: "high",
    forecast: "0.3%",
    previous: "0.4%",
    actual: "0.3%",
    status: "released"
  },
  {
    id: "news-2",
    time: "08:30 AM",
    currency: "USD",
    event: "CPI (YoY) (Apr)",
    impact: "high",
    forecast: "3.4%",
    previous: "3.5%",
    actual: "3.4%",
    status: "released"
  },
  {
    id: "news-3",
    time: "10:30 AM",
    currency: "USD",
    event: "Crude Oil Inventories",
    impact: "medium",
    forecast: "-1.4M",
    previous: "-1.2M",
    actual: "-2.5M",
    status: "released"
  },
  {
    id: "news-4",
    time: "02:00 PM",
    currency: "USD",
    event: "FOMC Meeting Minutes",
    impact: "high",
    forecast: "--",
    previous: "--",
    status: "upcoming"
  },
  {
    id: "news-5",
    time: "08:30 AM",
    currency: "USD",
    event: "Initial Jobless Claims",
    impact: "medium",
    forecast: "220K",
    previous: "222K",
    status: "upcoming"
  },
  {
    id: "news-6",
    time: "09:45 AM",
    currency: "USD",
    event: "Flash Manufacturing PMI",
    impact: "medium",
    forecast: "50.5",
    previous: "50.0",
    status: "upcoming"
  },
  {
    id: "news-7",
    time: "10:00 AM",
    currency: "USD",
    event: "New Home Sales (MoM) (Apr)",
    impact: "low",
    forecast: "1.2%",
    previous: "-4.7%",
    status: "upcoming"
  },
  {
    id: "news-8",
    time: "08:30 AM",
    currency: "USD",
    event: "Core PCE Price Index (MoM) (Apr)",
    impact: "high",
    forecast: "0.2%",
    previous: "0.3%",
    status: "upcoming"
  },
  {
    id: "news-9",
    time: "08:30 AM",
    currency: "USD",
    event: "GDP (QoQ) (Q1) - Prelim",
    impact: "high",
    forecast: "1.6%",
    previous: "3.4%",
    status: "upcoming"
  }
];

export function EconomicCalendar() {
  const [filterImpact, setFilterImpact] = useState<"all" | "high" | "medium" | "low">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeNotifications, setActiveNotifications] = useState<string[]>([]);
  
  // Real-time dynamic events state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [nextEventCountdown, setNextEventCountdown] = useState("00:45");
  const [nextEventName, setNextEventName] = useState("FOMC Interest Rate Decision");
  const [volatilityAlert, setVolatilityAlert] = useState<string | null>(null);

  // Initialize dynamic times on component mount
  useEffect(() => {
    const baseDate = new Date();
    const formattedDate = (daysOffset: number) => {
      const d = new Date();
      d.setDate(baseDate.getDate() + daysOffset);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    setEvents([
      {
        id: "news-1",
        time: "08:30 AM",
        currency: "USD",
        event: "Core CPI (MoM) (" + formattedDate(0) + ")",
        impact: "high",
        forecast: "0.3%",
        previous: "0.4%",
        actual: "0.3%",
        status: "released"
      },
      {
        id: "news-2",
        time: "08:30 AM",
        currency: "USD",
        event: "CPI (YoY) (" + formattedDate(0) + ")",
        impact: "high",
        forecast: "3.4%",
        previous: "3.5%",
        actual: "3.4%",
        status: "released"
      },
      {
        id: "news-3",
        time: "10:30 AM",
        currency: "USD",
        event: "Crude Oil Inventories (" + formattedDate(0) + ")",
        impact: "medium",
        forecast: "-1.4M",
        previous: "-1.2M",
        actual: "-2.5M",
        status: "released"
      },
      {
        id: "news-4",
        time: "02:00 PM", // FOMC scheduled shortly
        currency: "USD",
        event: "FOMC Interest Rate Decision",
        impact: "high",
        forecast: "5.50%",
        previous: "5.50%",
        status: "upcoming"
      },
      {
        id: "news-5",
        time: "02:30 PM",
        currency: "USD",
        event: "Initial Jobless Claims (" + formattedDate(1) + ")",
        impact: "medium",
        forecast: "220K",
        previous: "222K",
        status: "upcoming"
      },
      {
        id: "news-6",
        time: "03:45 PM",
        currency: "USD",
        event: "Flash Manufacturing PMI (" + formattedDate(1) + ")",
        impact: "medium",
        forecast: "50.5",
        previous: "50.0",
        status: "upcoming"
      },
      {
        id: "news-7",
        time: "10:00 AM",
        currency: "USD",
        event: "New Home Sales (MoM) (" + formattedDate(2) + ")",
        impact: "low",
        forecast: "1.2%",
        previous: "-4.7%",
        status: "upcoming"
      },
      {
        id: "news-8",
        time: "08:30 AM",
        currency: "USD",
        event: "Core PCE Price Index (" + formattedDate(3) + ")",
        impact: "high",
        forecast: "0.2%",
        previous: "0.3%",
        status: "upcoming"
      }
    ]);
  }, []);

  // Countdown & Volatility Alert Live Simulation Loop
  useEffect(() => {
    if (events.length === 0) return;

    let secondsRemaining = 45; // FOMC releases in 45s from mount

    const interval = setInterval(() => {
      if (secondsRemaining > 0) {
        secondsRemaining--;
        const mins = Math.floor(secondsRemaining / 60);
        const secs = secondsRemaining % 60;
        setNextEventCountdown(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
        
        // Dynamically update time display of FOMC in the events list
        setEvents(prev => prev.map(e => {
          if (e.id === "news-4" && e.status === "upcoming") {
            return { ...e, time: `Live in ${secs}s` };
          }
          return e;
        }));
      } else {
        // Countdown hit 0! Release FOMC news dynamically
        setEvents(prev => prev.map(e => {
          if (e.id === "news-4" && e.status === "upcoming") {
            return {
              ...e,
              time: "02:00 PM",
              status: "released",
              actual: "5.50%"
            };
          }
          return e;
        }));

        setVolatilityAlert("🚨 Volatility Alert: FOMC Interest Rate Decision released! Actual: 5.50% (Forecast: 5.50%). Safe trading parameters active.");
        setNextEventCountdown("03:00");
        setNextEventName("Initial Jobless Claims");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [events.length === 0]);

  const toggleNotification = (id: string) => {
    setActiveNotifications(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.event.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.currency.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesImpact = filterImpact === "all" || e.impact === filterImpact;
      return matchesSearch && matchesImpact;
    });
  }, [filterImpact, searchTerm, events]);

  return (
    <GlassCard className="flex flex-col h-full overflow-hidden border-border-subtle bg-bg-card/30 relative">
      
      {/* Glow Effect */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-accent-violet/5 rounded-full blur-3xl pointer-events-none" />

      {/* Calendar Header with Countdown */}
      <div className="p-5 border-b border-border-subtle/50 bg-bg-card/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center border border-accent-green/20">
            <Calendar size={20} className="text-accent-green" />
          </div>
          <div>
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-base text-text-primary flex items-center gap-2">
              Economic Calendar
            </h3>
            <p className="text-xs text-text-muted">Real-time macro catalysts & risk alerts</p>
          </div>
        </div>

        {/* Countdown Banner */}
        <div className="flex items-center gap-3 bg-accent-coral/10 border border-accent-coral/20 px-3.5 py-1.5 rounded-xl">
          <ShieldAlert size={16} className="text-accent-coral animate-pulse" />
          <div>
            <p className="text-[9px] text-text-muted uppercase font-bold tracking-wider">Next Volatility Catalyst</p>
            <p className="text-xs font-semibold text-accent-coral flex items-center gap-1.5 font-[family-name:var(--font-space-mono)]">
              {nextEventName} in <span className="underline">{nextEventCountdown}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Volatility Alert Message Banner */}
      <AnimatePresence>
        {volatilityAlert && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mt-4 p-3 bg-accent-coral/15 border border-accent-coral/30 rounded-xl text-[11px] font-bold text-accent-coral flex items-center justify-between gap-3 shadow-sm select-none">
              <span>{volatilityAlert}</span>
              <button 
                onClick={() => setVolatilityAlert(null)}
                className="text-[10px] hover:underline uppercase tracking-wider bg-accent-coral/20 hover:bg-accent-coral/30 border border-accent-coral/30 px-2 py-0.5 rounded-md transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-border-subtle/30 flex flex-wrap items-center gap-3 bg-bg-card/5">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events (CPI, FOMC, GDP...)"
            className="w-full bg-white/[0.02] border border-border-subtle hover:border-border-subtle/80 focus:border-accent-green/60 rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-green/30 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: "All Events" },
            { id: "high", label: "High", className: "text-accent-coral bg-accent-coral/10 border-accent-coral/20 hover:bg-accent-coral/15" },
            { id: "medium", label: "Medium", className: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/15" },
            { id: "low", label: "Low", className: "text-accent-green bg-accent-green/10 border-accent-green/20 hover:bg-accent-green/15" }
          ].map((pill) => {
            const isActive = filterImpact === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setFilterImpact(pill.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95",
                  isActive
                    ? pill.id === "all"
                      ? "bg-accent-green/10 text-accent-green border-accent-green/30"
                      : pill.className + " ring-1 ring-offset-0"
                    : "bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary hover:bg-white/[0.03]"
                )}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <AnimatePresence initial={false}>
          {filteredEvents.map((event) => {
            const isSubscribed = activeNotifications.includes(event.id);
            const isHigh = event.impact === "high";
            const isMed = event.impact === "medium";

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={cn(
                  "p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 group relative",
                  isHigh 
                    ? "bg-accent-coral/[0.01] hover:bg-accent-coral/[0.03] border-accent-coral/10 hover:border-accent-coral/25" 
                    : "bg-white/[0.01] hover:bg-white/[0.03] border-border-subtle hover:border-border-subtle/80"
                )}
              >
                {/* Visual Left Accent for News Catalysts */}
                {isHigh && (
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-accent-coral rounded-r" />
                )}

                {/* Left Side: Time, Currency & Event Name */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex flex-col items-center flex-shrink-0 text-center">
                    <span className="text-[10px] font-semibold text-text-muted font-[family-name:var(--font-space-mono)]">{event.time}</span>
                    <span className="text-[9px] font-bold text-text-primary bg-white/[0.05] border border-border-subtle/50 px-1.5 py-0.5 rounded-md mt-1">
                      {event.currency}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{event.event}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {/* Impact Badge */}
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                        isHigh 
                          ? "bg-accent-coral/10 text-accent-coral border-accent-coral/20" 
                          : isMed 
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" 
                            : "bg-accent-green/10 text-accent-green border-accent-green/20"
                      )}>
                        {event.impact} Impact
                      </span>

                      {/* Status indicator */}
                      <span className={cn(
                        "text-[9px] flex items-center gap-1",
                        event.status === "released" ? "text-text-muted" : "text-accent-green font-medium"
                      )}>
                        <Clock size={10} />
                        {event.status === "released" ? "Released" : "Upcoming"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Data Values (Actual / Forecast / Previous) */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="grid grid-cols-3 gap-3 text-right">
                    
                    {/* Actual */}
                    <div className="flex flex-col">
                      <span className="text-[8px] text-text-muted uppercase">Actual</span>
                      {event.actual ? (
                        <span className={cn(
                          "text-xs font-bold font-[family-name:var(--font-space-mono)] flex items-center gap-0.5 justify-end",
                          event.actual === event.forecast 
                            ? "text-text-primary" 
                            : parseFloat(event.actual) >= parseFloat(event.forecast || "0") 
                              ? "text-accent-green" 
                              : "text-accent-coral"
                        )}>
                          {parseFloat(event.actual) > parseFloat(event.forecast || "0") ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {event.actual}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted font-[family-name:var(--font-space-mono)] font-bold">--</span>
                      )}
                    </div>

                    {/* Forecast */}
                    <div className="flex flex-col">
                      <span className="text-[8px] text-text-muted uppercase">Forecast</span>
                      <span className="text-xs font-semibold text-text-secondary font-[family-name:var(--font-space-mono)]">
                        {event.forecast}
                      </span>
                    </div>

                    {/* Previous */}
                    <div className="flex flex-col">
                      <span className="text-[8px] text-text-muted uppercase">Prev</span>
                      <span className="text-xs font-semibold text-text-muted font-[family-name:var(--font-space-mono)]">
                        {event.previous}
                      </span>
                    </div>
                  </div>

                  {/* Notification Bell toggle */}
                  <button
                    onClick={() => toggleNotification(event.id)}
                    className={cn(
                      "w-8 h-8 rounded-lg border flex items-center justify-center transition-all active:scale-95",
                      isSubscribed
                        ? "bg-accent-green/10 text-accent-green border-accent-green/20"
                        : "bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary hover:bg-white/[0.04]"
                    )}
                    title={isSubscribed ? "Alert active" : "Enable alert"}
                  >
                    {isSubscribed ? <Bell size={12} className="fill-accent-green" /> : <BellOff size={12} />}
                  </button>

                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <AlertOctagon size={28} className="mx-auto opacity-20 mb-2" />
            <p className="text-xs font-semibold">No macroeconomic catalysts found</p>
            <p className="text-[10px] mt-0.5">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </div>

    </GlassCard>
  );
}
