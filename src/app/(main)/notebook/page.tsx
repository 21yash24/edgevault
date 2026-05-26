"use client";

import { useNotebookStore, useTradeStore, useSettingsStore, DailyNote } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  BookOpen, Calendar, Shield, Sparkles, Award, 
  Smile, Moon, Brain, CheckSquare, Save, ArrowRight, 
  ArrowLeft, Plus, DollarSign, TrendingUp, TrendingDown, Target, Info, Flame, Eye
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

  const [activeTab, setActiveTab] = useState<"pre" | "post" | "results">("pre");

  // Form states
  const [preMarketPlan, setPreMarketPlan] = useState("");
  const [bias, setBias] = useState<DailyNote["bias"]>("");
  const [sleepScore, setSleepScore] = useState<number>(3);
  const [focusScore, setFocusScore] = useState<number>(3);
  const [postMarketReview, setPostMarketReview] = useState("");
  const [intradayNotes, setIntradayNotes] = useState("");
  const [sessionGrade, setSessionGrade] = useState<DailyNote["sessionGrade"]>("");

  // Notification states
  const [isPreSavedNotify, setIsPreSavedNotify] = useState(false);
  const [isPostSavedNotify, setIsPostSavedNotify] = useState(false);

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

  // Singular Pre-Market Save Logic
  const handleSavePre = () => {
    saveNote(selectedDate, {
      preMarketPlan,
      bias,
      sleepScore,
      focusScore
    });
    setIsPreSavedNotify(true);
    setTimeout(() => setIsPreSavedNotify(false), 2200);
  };

  // Singular Post-Market Save Logic
  const handleSavePost = () => {
    saveNote(selectedDate, {
      postMarketReview,
      intradayNotes,
      sessionGrade
    });
    setIsPostSavedNotify(true);
    setTimeout(() => setIsPostSavedNotify(false), 2200);
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
    <div className="space-y-8 max-w-5xl mx-auto px-1 sm:px-4 py-2">
      
      {/* Header with Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-bg-card/10 dark:bg-white/[0.01] p-6 rounded-2xl border border-border-subtle/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent-violet/10 flex items-center justify-center border border-accent-violet/20 shadow-inner">
            <BookOpen size={22} className="text-accent-violet animate-pulse" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl text-text-primary">
              Trader's Notebook
            </h1>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">Document macro setups, mental prep, and detailed post-session reflections</p>
          </div>
        </div>

        {/* Date Selector controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => changeDate(-1)}
            className="w-10 h-10 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent-violet/30 transition-all active:scale-95 shadow-sm"
            title="Previous Day"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-2.5 px-4 py-2 bg-bg-card border border-border-subtle rounded-xl text-xs font-bold text-text-primary shadow-sm min-w-[210px] justify-center select-none">
            <Calendar size={14} className="text-accent-violet" />
            <span>{format(new Date(selectedDate), "EEEE, MMM d, yyyy")}</span>
            {isToday(new Date(selectedDate)) && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded bg-accent-green/15 text-accent-green border border-accent-green/20 uppercase tracking-widest ml-1">Today</span>
            )}
          </div>

          <button 
            onClick={() => changeDate(1)}
            className="w-10 h-10 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-accent-violet/30 transition-all active:scale-95 shadow-sm"
            title="Next Day"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Calming Mindfulness Focus Bar */}
      <div className="text-center py-1 select-none">
        <span className="text-xs text-text-muted/80 tracking-wide italic font-medium flex items-center justify-center gap-2">
          <Eye size={12} className="text-accent-violet/60" />
          &ldquo;Serenity yields clarity. Breathe, map your plan calmly, and honor your parameters.&rdquo;
        </span>
      </div>

      {/* Premium Segmented Tab Selector */}
      <div className="flex bg-bg-card/25 dark:bg-white/[0.01] p-1.5 rounded-2xl border border-border-subtle/50 w-full max-w-xl mx-auto select-none shadow-sm backdrop-blur-md">
        {[
          { id: "pre", label: "Pre-Market Preparation", icon: Brain, dotColor: "bg-accent-violet" },
          { id: "post", label: "Post-Market Reflections", icon: Award, dotColor: "bg-accent-green" },
          { id: "results", label: "Session Results", icon: Target, dotColor: "bg-accent-blue" }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 relative",
                isActive 
                  ? "bg-bg-card border border-border-subtle shadow text-text-primary scale-[1.01]" 
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40 dark:hover:bg-white/[0.02]"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={14} className={cn("transition-colors", isActive ? "text-accent-violet" : "text-text-muted")} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </div>
              {tab.id === "results" && dailyTrades.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-accent-blue/15 text-accent-blue border border-accent-blue/20 font-black">
                  {dailyTrades.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Workspace with Smooth AnimatePresence */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full"
          >
            
            {/* 1. PRE-MARKET TAB */}
            {activeTab === "pre" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {/* Left Side: Parameters */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <GlassCard className="p-6 border-border-subtle/80 flex flex-col justify-between h-full bg-bg-card/10 backdrop-blur-md">
                    <div className="space-y-6">
                      <div className="border-b border-border-subtle/50 pb-3 flex items-center gap-2">
                        <Brain size={16} className="text-accent-violet" />
                        <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm text-text-primary">Psychological Readiness</h3>
                      </div>

                      {/* Directional Bias */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Directional Bias</label>
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
                                  "flex-1 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95",
                                  isActive
                                    ? b.color + " ring-1 ring-offset-0 scale-[1.02] shadow-sm"
                                    : "bg-bg-secondary/20 dark:bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary hover:bg-bg-secondary/40"
                                )}
                              >
                                {b.label.split(" ")[0]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sleep Quality */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-wider flex items-center justify-between">
                          <span>Sleep Quality</span>
                          <span className="text-accent-violet font-black">{sleepScore} / 5</span>
                        </label>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setSleepScore(num)}
                              className={cn(
                                "flex-1 h-8 rounded-lg text-xs font-bold border transition-all active:scale-90",
                                sleepScore >= num
                                  ? "bg-accent-violet/10 text-accent-violet border-accent-violet/30 font-black shadow-inner"
                                  : "bg-bg-secondary/20 dark:bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary hover:border-accent-violet/20"
                              )}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Focus State */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-wider flex items-center justify-between">
                          <span>Focus State</span>
                          <span className="text-accent-green font-black">{focusScore} / 5</span>
                        </label>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setFocusScore(num)}
                              className={cn(
                                "flex-1 h-8 rounded-lg text-xs font-bold border transition-all active:scale-90",
                                focusScore >= num
                                  ? "bg-accent-green/10 text-accent-green border-accent-green/30 font-black shadow-inner"
                                  : "bg-bg-secondary/20 dark:bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary hover:border-accent-green/20"
                              )}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border-subtle/50 text-[10px] text-text-muted leading-relaxed select-none">
                      🔒 Pre-market metrics document sleep, focus scores, and direction bias singularly before session start.
                    </div>
                  </GlassCard>
                </div>

                {/* Right Side: Plans */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <GlassCard className="p-6 border-border-subtle/80 flex flex-col justify-between h-full bg-bg-card/10 backdrop-blur-md">
                    <div className="space-y-4">
                      <div className="border-b border-border-subtle/50 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckSquare size={16} className="text-accent-violet" />
                          <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm text-text-primary">Roadmap & \"If-Then\" Scenarios</h3>
                        </div>
                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider bg-bg-secondary/40 px-2 py-0.5 rounded border border-border-subtle/60 select-none">Phase 1 Plan</span>
                      </div>

                      <textarea
                        value={preMarketPlan}
                        onChange={(e) => setPreMarketPlan(e.target.value)}
                        rows={8}
                        placeholder="Define your roadmap scenarios here... (e.g. IF price sweeps HTF liquidity during New York open and displaces, THEN look for a 15m entry... Focus levels: NQ 18,240 / ES 5,210)"
                        className="w-full bg-bg-secondary/10 dark:bg-white/[0.01] border border-border-subtle rounded-xl p-4 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent-violet/40 focus:shadow-[0_0_20px_rgba(123,97,255,0.06)] transition-all resize-none leading-relaxed font-medium"
                      />
                    </div>

                    {/* Clean Action Bar */}
                    <div className="flex items-center justify-between border-t border-border-subtle/40 pt-4 mt-4">
                      <span className="text-[10px] text-text-muted flex items-center gap-1.5 select-none">
                        <Info size={12} className="text-accent-violet/60" /> Draft plans are auto-cached and stored locally.
                      </span>
                      
                      <div className="flex items-center gap-3">
                        <AnimatePresence>
                          {isPreSavedNotify && (
                            <motion.span 
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-xs font-bold text-accent-green"
                            >
                              ✓ Pre-Market Plan Saved
                            </motion.span>
                          )}
                        </AnimatePresence>

                        <button
                          type="button"
                          onClick={handleSavePre}
                          className="flex items-center gap-2 bg-gradient-to-r from-accent-violet to-accent-blue text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-[0_0_15px_rgba(123,97,255,0.3)] transition-all active:scale-95 border border-white/10"
                        >
                          <Save size={13} /> Save Pre-Market Plan
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}

            {/* 2. POST-MARKET TAB */}
            {activeTab === "post" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {/* Left Side: Parameters */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <GlassCard className="p-6 border-border-subtle/80 flex flex-col justify-between h-full bg-bg-card/10 backdrop-blur-md">
                    <div className="space-y-6">
                      <div className="border-b border-border-subtle/50 pb-3 flex items-center gap-2">
                        <Award size={16} className="text-accent-green" />
                        <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm text-text-primary">Execution Evaluation</h3>
                      </div>

                      {/* Session Execution Grade */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Session Grade</label>
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
                                  "py-2 rounded-lg text-xs font-black border transition-all duration-200 active:scale-95 text-center",
                                  isActive
                                    ? style + " ring-1 ring-offset-0 scale-105 shadow-sm"
                                    : "bg-bg-secondary/20 dark:bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary hover:bg-bg-secondary/40"
                                )}
                              >
                                {grade}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-bg-secondary/10 dark:bg-white/[0.01] border border-border-subtle/60 p-3.5 rounded-xl text-[10px] text-text-muted leading-relaxed space-y-2 select-none">
                        <div className="font-bold text-text-secondary">Execution Grading Guide:</div>
                        <div>*A:* Flawless checklist & rule compliance.</div>
                        <div>*B:* Minor emotional leak but rule compliant.</div>
                        <div>*C:* Noticeable FOMO or plan deviation.</div>
                        <div>*D/F:* Breached stop-loss limits or over-traded.</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border-subtle/50 text-[10px] text-text-muted leading-relaxed select-none">
                      🔒 Post-market grading and reviews are saved singularly to isolate post-session statistics.
                    </div>
                  </GlassCard>
                </div>

                {/* Right Side: Reflections */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <GlassCard className="p-6 border-border-subtle/80 flex flex-col justify-between h-full bg-bg-card/10 backdrop-blur-md">
                    <div className="space-y-6">
                      <div className="border-b border-border-subtle/50 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Plus size={16} className="text-accent-green" />
                          <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm text-text-primary">Post-Session Reflections</h3>
                        </div>
                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider bg-bg-secondary/40 px-2 py-0.5 rounded border border-border-subtle/60 select-none">Phase 2 Review</span>
                      </div>

                      {/* Intraday Context */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Intraday Activity Notes</label>
                        <textarea
                          value={intradayNotes}
                          onChange={(e) => setIntradayNotes(e.target.value)}
                          rows={3}
                          placeholder="Note down market dynamics, unexpected news releases, or psychological triggers..."
                          className="w-full bg-bg-secondary/10 dark:bg-white/[0.01] border border-border-subtle rounded-xl p-3.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent-green/40 focus:shadow-[0_0_20px_rgba(0,255,178,0.04)] transition-all resize-none leading-relaxed font-medium"
                        />
                      </div>

                      {/* Lessons reflections */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-wider block">Lessons Learned & reflections</label>
                        <textarea
                          value={postMarketReview}
                          onChange={(e) => setPostMarketReview(e.target.value)}
                          rows={4}
                          placeholder="Document core lessons... (e.g. Cut winners too early again. SMT confirmed on ES, but entered too late. Focus adjustments for tomorrow...)"
                          className="w-full bg-bg-secondary/10 dark:bg-white/[0.01] border border-border-subtle rounded-xl p-3.5 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent-green/40 focus:shadow-[0_0_20px_rgba(0,255,178,0.04)] transition-all resize-none leading-relaxed font-medium"
                        />
                      </div>
                    </div>

                    {/* Clean Action Bar */}
                    <div className="flex items-center justify-between border-t border-border-subtle/40 pt-4 mt-6">
                      <span className="text-[10px] text-text-muted flex items-center gap-1.5 select-none">
                        <Info size={12} className="text-accent-green/60" /> Reflections compile directly for AI-Coach diagnostics.
                      </span>
                      
                      <div className="flex items-center gap-3">
                        <AnimatePresence>
                          {isPostSavedNotify && (
                            <motion.span 
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-xs font-bold text-accent-green"
                            >
                              ✓ Post-Session Reflections Saved
                            </motion.span>
                          )}
                        </AnimatePresence>

                        <button
                          type="button"
                          onClick={handleSavePost}
                          className="flex items-center gap-2 bg-gradient-to-r from-accent-green to-accent-blue text-bg-base px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-[0_0_15px_rgba(0,255,178,0.3)] transition-all active:scale-95 border border-white/10"
                        >
                          <Save size={13} /> Save Post-Market Reflections
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}

            {/* 3. SESSION RESULTS TAB */}
            {activeTab === "results" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {/* Left Side: Daily Metrics */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <GlassCard className="p-6 border-border-subtle/80 flex flex-col justify-between h-full bg-bg-card/10 backdrop-blur-md">
                    <div className="space-y-6">
                      <div className="border-b border-border-subtle/50 pb-3 flex items-center gap-2 select-none">
                        <TrendingUp size={16} className="text-accent-blue" />
                        <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm text-text-primary">Trading Metrics</h3>
                      </div>

                      {dailyTrades.length > 0 ? (
                        <div className="flex flex-col gap-4">
                          <div className="bg-bg-secondary/10 dark:bg-white/[0.01] border border-border-subtle p-3 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Daily P&L</span>
                            <span className={cn(
                              "text-sm font-black font-[family-name:var(--font-space-mono)]",
                              dailyPnL >= 0 ? "text-accent-green text-glow-green" : "text-accent-coral text-glow-coral"
                            )}>
                              {dailyPnL >= 0 ? "+" : ""}{formatCurrency(dailyPnL)}
                            </span>
                          </div>

                          <div className="bg-bg-secondary/10 dark:bg-white/[0.01] border border-border-subtle p-3 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Trades Executed</span>
                            <span className="text-sm font-black font-[family-name:var(--font-space-mono)] text-text-primary">
                              {dailyTrades.length}
                            </span>
                          </div>

                          <div className="bg-bg-secondary/10 dark:bg-white/[0.01] border border-border-subtle p-3 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Win Rate</span>
                            <span className="text-sm font-black font-[family-name:var(--font-space-mono)] text-accent-green">
                              {((dailyWins / dailyTrades.length) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-text-muted border border-dashed border-border-subtle/50 rounded-xl bg-bg-secondary/5">
                          <Flame size={24} className="mx-auto opacity-20 mb-2 animate-bounce" />
                          <p className="text-xs font-semibold">No active executions logged</p>
                          <p className="text-[9px] mt-0.5 px-3">Session results will automatically display once trades are logged or imported on this date.</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border-subtle/50 text-[10px] text-text-muted leading-relaxed select-none">
                      ℹ️ Trades automatically link based on entry time matching active calendar day selection.
                    </div>
                  </GlassCard>
                </div>

                {/* Right Side: Trades List */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <GlassCard className="p-6 border-border-subtle/80 flex flex-col justify-between h-full bg-bg-card/10 backdrop-blur-md">
                    <div className="space-y-4">
                      <div className="border-b border-border-subtle/50 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckSquare size={16} className="text-accent-blue" />
                          <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm text-text-primary">Session Execution Logs</h3>
                        </div>
                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider bg-bg-secondary/40 px-2 py-0.5 rounded border border-border-subtle/60 select-none">
                          {dailyTrades.length} Trades Listed
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1 no-scrollbar">
                        {dailyTrades.map((trade) => {
                          const isWin = trade.netPnl >= 0;
                          return (
                            <div 
                              key={trade.id}
                              className="p-3.5 rounded-xl bg-bg-secondary/10 dark:bg-white/[0.01] border border-border-subtle flex items-center justify-between gap-4 group hover:border-accent-violet/30 transition-all duration-200 cursor-pointer shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center font-[family-name:var(--font-space-mono)] font-bold text-xs uppercase shadow-inner",
                                  trade.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral"
                                )}>
                                  {trade.direction === "long" ? "L" : "S"}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-[family-name:var(--font-space-mono)] font-black text-xs text-text-primary">{trade.symbol}</span>
                                    <span className="text-[8px] text-text-muted font-bold bg-bg-card px-1.5 py-0.2 rounded border border-border-subtle uppercase">{trade.sessionTag}</span>
                                  </div>
                                  <span className="text-[9px] text-text-muted block mt-1 font-semibold">{trade.setupTags[0] || "Custom Setup"}</span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className={cn(
                                  "text-xs font-black font-[family-name:var(--font-space-mono)] block",
                                  isWin ? "text-accent-green text-glow-green" : "text-accent-coral text-glow-coral"
                                )}>
                                  {isWin ? "+" : ""}{formatCurrency(trade.netPnl)}
                                </span>
                                <span className="text-[9px] text-text-muted block mt-0.5 font-[family-name:var(--font-space-mono)] font-bold">
                                  {trade.rMultiple >= 0 ? "+" : ""}{trade.rMultiple.toFixed(2)}R
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {dailyTrades.length === 0 && (
                          <div className="text-center py-12 text-text-muted">
                            <Flame size={28} className="mx-auto opacity-10 mb-2" />
                            <p className="text-xs font-bold">Zero execution logs compiled for this date</p>
                            <p className="text-[10px] mt-0.5">Use Log Trade at the top to record results.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border-subtle/40 pt-4 mt-6 flex items-center justify-between text-[10px] text-text-muted select-none">
                      <span>⚡ Session summary syncs dynamically with MT5 / Tradovate integrations.</span>
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
