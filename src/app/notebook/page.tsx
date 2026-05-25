"use client";

import { useNotebookStore, useTradeStore, useSettingsStore, DailyNote } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  BookOpen, Calendar, Shield, Sparkles, Award, 
  Smile, Moon, Brain, CheckSquare, Save, ArrowRight, 
  ArrowLeft, Plus, DollarSign, TrendingUp, TrendingDown, Target, Info, Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { format, subDays, addDays, isToday, parseISO } from "date-fns";

export default function NotebookPage() {
  const { notes, saveNote } = useNotebookStore();
  const { trades } = useTradeStore();
  const { settings } = useSettingsStore();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [preMarketPlan, setPreMarketPlan] = useState("");
  const [bias, setBias] = useState<DailyNote["bias"]>("");
  const [sleepScore, setSleepScore] = useState<number>(3);
  const [focusScore, setFocusScore] = useState<number>(3);
  const [postMarketReview, setPostMarketReview] = useState("");
  const [intradayNotes, setIntradayNotes] = useState("");
  const [sessionGrade, setSessionGrade] = useState<DailyNote["sessionGrade"]>("");
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  // Load note data when date changes
  const activeNote = useMemo(() => {
    return notes[selectedDate] || {
      date: selectedDate,
      preMarketPlan: "",
      bias: "",
      sleepScore: 3,
      focusScore: 3,
      postMarketReview: "",
      intradayNotes: "",
      checklistComplete: false,
      sessionGrade: ""
    };
  }, [notes, selectedDate]);

  useEffect(() => {
    setPreMarketPlan(activeNote.preMarketPlan);
    setBias(activeNote.bias);
    setSleepScore(activeNote.sleepScore);
    setFocusScore(activeNote.focusScore);
    setPostMarketReview(activeNote.postMarketReview);
    setIntradayNotes(activeNote.intradayNotes);
    setSessionGrade(activeNote.sessionGrade);
  }, [activeNote]);

  const handleSave = () => {
    saveNote(selectedDate, {
      preMarketPlan,
      bias,
      sleepScore,
      focusScore,
      postMarketReview,
      intradayNotes,
      sessionGrade
    });
    
    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 2000);
  };

  // Find trades logged on this specific day
  const dailyTrades = useMemo(() => {
    return trades.filter((t) => t.entryDate.startsWith(selectedDate));
  }, [trades, selectedDate]);

  const dailyPnL = useMemo(() => {
    return dailyTrades.reduce((sum, t) => sum + t.netPnl, 0);
  }, [dailyTrades]);

  const dailyWins = useMemo(() => {
    return dailyTrades.filter(t => t.result === "win").length;
  }, [dailyTrades]);

  const changeDate = (days: number) => {
    const parsed = new Date(selectedDate);
    parsed.setDate(parsed.getDate() + days);
    setSelectedDate(parsed.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-card/20 p-4 rounded-2xl border border-border-subtle/50">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center border border-accent-violet/20">
            <BookOpen size={20} className="text-accent-violet animate-pulse" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-syne)] font-bold text-xl text-text-primary flex items-center gap-2">
              Trader's Notebook
            </h1>
            <p className="text-xs text-text-muted">Document macro plans, psychological baselines, and post-session reviews</p>
          </div>
        </div>

        {/* Date Selector controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => changeDate(-1)}
            className="w-9 h-9 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-border-subtle flex items-center justify-center text-text-secondary transition-all active:scale-95"
            title="Previous Day"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-2 px-4 py-1.5 bg-bg-card border border-border-subtle rounded-xl text-xs font-semibold text-text-primary">
            <Calendar size={14} className="text-accent-violet" />
            <span>{format(new Date(selectedDate), "EEEE, MMMM d, yyyy")}</span>
            {isToday(new Date(selectedDate)) && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent-green/15 text-accent-green border border-accent-green/20 uppercase tracking-widest ml-1">Today</span>
            )}
          </div>

          <button 
            onClick={() => changeDate(1)}
            className="w-9 h-9 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-border-subtle flex items-center justify-center text-text-secondary transition-all active:scale-95"
            title="Next Day"
          >
            <ArrowRight size={16} />
          </button>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2/3 Column: Pre-Market & Post-Market Panels */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Pre-Market Prep Dashboard */}
          <GlassCard className="p-6 border-border-subtle space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent-violet/[0.02] rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-border-subtle/30 pb-3">
              <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm text-text-primary flex items-center gap-2">
                <Brain size={16} className="text-accent-violet" /> Phase 1: Pre-Market Preparation
              </h3>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Before Session Open</span>
            </div>

            {/* Sub-grid for Bias & Mentals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Daily Bias Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-text-muted uppercase block">Directional Market Bias</label>
                <div className="flex gap-2">
                  {[
                    { id: "bullish", label: "Bullish 📈", color: "border-accent-green/20 text-accent-green bg-accent-green/5" },
                    { id: "bearish", label: "Bearish 📉", color: "border-accent-coral/20 text-accent-coral bg-accent-coral/5" },
                    { id: "neutral", label: "Neutral ↔️", color: "border-accent-violet/20 text-accent-violet bg-accent-violet/5" }
                  ].map((b) => {
                    const isActive = bias === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBias(b.id as any)}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all active:scale-95",
                          isActive
                            ? b.color + " ring-1 ring-offset-0"
                            : "bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary hover:bg-white/[0.03]"
                        )}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mental & Physical Status Sliders */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Sleep Score */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-1">
                    <Moon size={11} /> Sleep Quality: {sleepScore}/5
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSleepScore(num)}
                        className={cn(
                          "w-7 h-7 rounded-lg text-xs font-bold border transition-all active:scale-90",
                          sleepScore >= num
                            ? "bg-accent-violet/10 text-accent-violet border-accent-violet/30"
                            : "bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus Score */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-1">
                    <Smile size={11} /> Focus State: {focusScore}/5
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFocusScore(num)}
                        className={cn(
                          "w-7 h-7 rounded-lg text-xs font-bold border transition-all active:scale-90",
                          focusScore >= num
                            ? "bg-accent-green/10 text-accent-green border-accent-green/30"
                            : "bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Pre-market levels & Execution Scenarios */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase block">
                Session Roadmap & \"If-Then\" Scenarios
              </label>
              <textarea
                value={preMarketPlan}
                onChange={(e) => setPreMarketPlan(e.target.value)}
                rows={4}
                placeholder="IF price sweeps HTF liquidity during London open and displaces, THEN look for a 15m entry... Focus levels: NQ 18,240 / ES 5,210..."
                className="w-full bg-white/[0.02] border border-border-subtle rounded-xl p-4 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/60 transition-all resize-none leading-relaxed"
              />
            </div>

          </GlassCard>

          {/* Intraday & Post-Market Review Panel */}
          <GlassCard className="p-6 border-border-subtle space-y-6 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-green/[0.02] rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-border-subtle/30 pb-3">
              <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm text-text-primary flex items-center gap-2">
                <Award size={16} className="text-accent-green" /> Phase 2: Post-Market Review
              </h3>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">After Session Close</span>
            </div>

            {/* Session Grade & Intraday notes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Session Grade */}
              <div className="space-y-3 md:col-span-1">
                <label className="text-xs font-bold text-text-muted uppercase block">Session Execution Grade</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {["A", "B", "C", "D", "F"].map((grade) => {
                    const isActive = sessionGrade === grade;
                    const style = grade === "A" || grade === "B"
                      ? "border-accent-green/20 text-accent-green bg-accent-green/5"
                      : grade === "C"
                        ? "border-accent-violet/20 text-accent-violet bg-accent-violet/5"
                        : "border-accent-coral/20 text-accent-coral bg-accent-coral/5";

                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setSessionGrade(grade as any)}
                        className={cn(
                          "py-2 rounded-lg text-xs font-bold border transition-all active:scale-95 text-center",
                          isActive
                            ? style + " ring-1 ring-offset-0 scale-105"
                            : "bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary hover:bg-white/[0.03]"
                        )}
                      >
                        {grade}
                      </button>
                    );
                  })}
                </div>
                <div className="bg-white/[0.02] border border-border-subtle p-2.5 rounded-lg text-[9px] text-text-muted leading-relaxed">
                  **Grade Guide**:<br/>
                  *A:* Perfect checklist compliance.<br/>
                  *B:* Minor leak but rule-compliant.<br/>
                  *C:* FOMO/emotional friction present.<br/>
                  *D/F:* Violated absolute risk limits.
                </div>
              </div>

              {/* Intraday Context */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-text-muted uppercase block">Intraday Activity Notes</label>
                <textarea
                  value={intradayNotes}
                  onChange={(e) => setIntradayNotes(e.target.value)}
                  rows={4}
                  placeholder="Intraday notes: unexpected news volatility, macro trend displacements, internal psychology observations..."
                  className="w-full bg-white/[0.02] border border-border-subtle rounded-xl p-3.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/60 transition-all resize-none leading-relaxed"
                />
              </div>

            </div>

            {/* Post session reflections */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase block">
                Lessons Learned & Performance Review
              </label>
              <textarea
                value={postMarketReview}
                onChange={(e) => setPostMarketReview(e.target.value)}
                rows={4}
                placeholder="Lessons: Cut winners too early again. SMT confirmed on ES, but entered too late. Focus adjustments for tomorrow..."
                className="w-full bg-white/[0.02] border border-border-subtle rounded-xl p-4 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-green/60 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-border-subtle/30 pt-4">
              <span className="text-[10px] text-text-muted flex items-center gap-1.5">
                <Info size={12} /> Notes are locally stored and compiled for AI Coaching
              </span>
              
              <div className="flex items-center gap-2">
                <AnimatePresence>
                  {isSavedNotify && (
                    <motion.span 
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-semibold text-accent-green"
                    >
                      ✓ Saved to Notebook
                    </motion.span>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-accent-violet to-accent-blue text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-[0_0_15px_rgba(123,97,255,0.4)] transition-all active:scale-95"
                >
                  <Save size={13} /> Save Notebook Entry
                </button>
              </div>
            </div>

          </GlassCard>

        </div>

        {/* Right 1/3 Column: Pre-Flight Checklist lock & Trades linking */}
        <div className="xl:col-span-1 space-y-6">
          
          <div className="flex items-center justify-between px-1">
            <span className="font-[family-name:var(--font-syne)] font-bold text-xs uppercase tracking-wider text-text-muted">Daily Stats & Logs</span>
            <CheckSquare size={14} className="text-text-muted" />
          </div>

          {/* Daily metrics block */}
          <GlassCard className="p-5 border-border-subtle/70 space-y-4">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Trading Results</h4>
            
            {dailyTrades.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.01] border border-border-subtle p-2.5 rounded-xl text-center">
                  <span className="text-[9px] text-text-muted uppercase">Daily P&L</span>
                  <span className={cn(
                    "text-xs font-bold block mt-1 font-[family-name:var(--font-space-mono)]",
                    dailyPnL >= 0 ? "text-accent-green" : "text-accent-coral"
                  )}>
                    {dailyPnL >= 0 ? "+" : ""}{formatCurrency(dailyPnL)}
                  </span>
                </div>
                <div className="bg-white/[0.01] border border-border-subtle p-2.5 rounded-xl text-center">
                  <span className="text-[9px] text-text-muted uppercase">Trades</span>
                  <span className="text-xs font-bold block mt-1 font-[family-name:var(--font-space-mono)] text-text-primary">
                    {dailyTrades.length}
                  </span>
                </div>
                <div className="bg-white/[0.01] border border-border-subtle p-2.5 rounded-xl text-center">
                  <span className="text-[9px] text-text-muted uppercase">Win Rate</span>
                  <span className="text-xs font-bold block mt-1 font-[family-name:var(--font-space-mono)] text-accent-green">
                    {((dailyWins / dailyTrades.length) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-text-muted border border-dashed border-border-subtle/60 rounded-xl">
                <p className="text-xs italic">No trades logged on this date.</p>
              </div>
            )}
          </GlassCard>

          {/* Connected Daily Trades logs list */}
          <GlassCard className="p-5 border-border-subtle/70 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle/30 pb-2">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Session Trade Logs</h4>
              <span className="text-[10px] text-text-muted font-bold font-[family-name:var(--font-space-mono)]">{dailyTrades.length} trades</span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {dailyTrades.map((trade) => {
                const isWin = trade.netPnl >= 0;
                return (
                  <div 
                    key={trade.id}
                    className="p-3 rounded-xl bg-white/[0.01] border border-border-subtle flex items-center justify-between gap-3 group hover:border-accent-violet/20 transition-all cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-[family-name:var(--font-space-mono)] font-bold text-xs text-text-primary">{trade.symbol}</span>
                        <span className={cn(
                          "text-[8px] font-bold px-1 py-0.2 rounded border uppercase tracking-wider",
                          trade.direction === "long" 
                            ? "bg-accent-green/10 text-accent-green border-accent-green/20" 
                            : "bg-accent-coral/10 text-accent-coral border-accent-coral/20"
                        )}>
                          {trade.direction}
                        </span>
                      </div>
                      <span className="text-[9px] text-text-muted block mt-1 font-medium">{trade.setupTags[0] || "Custom Setup"}</span>
                    </div>

                    <div className="text-right">
                      <span className={cn(
                        "text-xs font-bold font-[family-name:var(--font-space-mono)]",
                        isWin ? "text-accent-green" : "text-accent-coral"
                      )}>
                        {isWin ? "+" : ""}{formatCurrency(trade.netPnl)}
                      </span>
                      <span className="text-[9px] text-text-muted block mt-0.5 font-[family-name:var(--font-space-mono)]">
                        {trade.rMultiple >= 0 ? "+" : ""}{trade.rMultiple.toFixed(2)}R
                      </span>
                    </div>
                  </div>
                );
              })}

              {dailyTrades.length === 0 && (
                <div className="text-center py-10 text-text-muted">
                  <Flame size={20} className="mx-auto opacity-20 mb-2" />
                  <p className="text-xs font-semibold">Zero logs compiled for this date</p>
                  <p className="text-[10px] mt-0.5">Use Log Trade above to record session results.</p>
                </div>
              )}
            </div>

          </GlassCard>

        </div>

      </div>

    </div>
  );
}
