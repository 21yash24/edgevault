"use client";

import { useNotebookStore, useTradeStore } from "@/stores";
import { 
  BookOpen, Calendar, Brain, CheckSquare, Save, ArrowRight, 
  ArrowLeft, TrendingUp, Target, Info, Flame, Eye,
  CloudSun, Moon, Sun, Sunset
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { format, isToday } from "date-fns";

export default function NotebookPage() {
  const { notes, saveNote } = useNotebookStore();
  const { trades } = useTradeStore();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Form states
  const [preMarketPlan, setPreMarketPlan] = useState("");
  const [bias, setBias] = useState<any>("");
  const [sleepScore, setSleepScore] = useState<number>(3);
  const [focusScore, setFocusScore] = useState<number>(3);
  const [postMarketReview, setPostMarketReview] = useState("");
  const [intradayNotes, setIntradayNotes] = useState("");
  const [sessionGrade, setSessionGrade] = useState<any>("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const preTextareaRef = useRef<HTMLTextAreaElement>(null);
  const intraTextareaRef = useRef<HTMLTextAreaElement>(null);
  const postTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-resize textareas
  const handleResize = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  };

  useEffect(() => { handleResize(preTextareaRef); }, [preMarketPlan]);
  useEffect(() => { handleResize(intraTextareaRef); }, [intradayNotes]);
  useEffect(() => { handleResize(postTextareaRef); }, [postMarketReview]);

  // Save logic with debounce feel
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      saveNote(selectedDate, {
        preMarketPlan,
        bias,
        sleepScore,
        focusScore,
        postMarketReview,
        intradayNotes,
        sessionGrade
      });
      setIsSaving(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 400);
  };

  // Find trades logged on this specific day
  const dailyTrades = useMemo(() => {
    return trades.filter((t) => t.entryDate.startsWith(selectedDate));
  }, [trades, selectedDate]);

  const dailyPnL = useMemo(() => {
    return dailyTrades.reduce((sum, t) => sum + t.netPnl, 0);
  }, [dailyTrades]);

  const changeDate = (days: number) => {
    const parsed = new Date(selectedDate);
    parsed.setDate(parsed.getDate() + days);
    setSelectedDate(parsed.toISOString().split("T")[0]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-6 py-4 mb-24 animate-in fade-in duration-500">
      
      {/* Notion-style Header with Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border-subtle/50 pb-6">
        <div className="space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-violet/20 to-accent-blue/10 flex items-center justify-center border border-accent-violet/20 shadow-[0_0_30px_rgba(123,97,255,0.15)]">
            <BookOpen size={28} className="text-accent-violet" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-bold text-3xl md:text-4xl text-text-primary tracking-tight">
                {format(new Date(selectedDate), "EEEE, MMMM d")}
              </h1>
              {isToday(new Date(selectedDate)) && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-accent-green/15 text-accent-green border border-accent-green/20 uppercase tracking-widest mt-1">Today</span>
              )}
            </div>
            <p className="text-sm text-text-muted font-medium">Daily Trading Log & Reflections</p>
          </div>
        </div>

        {/* Date Selector controls */}
        <div className="flex items-center gap-2 bg-bg-card/50 p-1 rounded-xl border border-border-subtle/50 backdrop-blur-md">
          <button 
            onClick={() => changeDate(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40 transition-all active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 px-3 text-xs font-bold text-text-secondary select-none">
            <Calendar size={13} className="text-accent-violet opacity-70" />
            <span>{format(new Date(selectedDate), "MMM d, yyyy")}</span>
          </div>
          <button 
            onClick={() => changeDate(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-secondary/40 transition-all active:scale-95"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Notion-style Document Content */}
      <div className="space-y-16">

        {/* Section 1: Pre-Market Context */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-text-primary border-b border-border-subtle/30 pb-2">
            <CloudSun size={20} className="text-accent-violet" />
            <h2 className="text-xl font-bold tracking-tight">Morning Context</h2>
          </div>

          <div className="flex flex-wrap gap-6 items-center">
            {/* Directional Bias */}
            <div className="flex items-center gap-3 bg-bg-card/30 px-4 py-2.5 rounded-xl border border-border-subtle/50">
              <span className="text-xs font-bold text-text-muted">Bias:</span>
              <div className="flex gap-1.5">
                {[
                  { id: "bullish", label: "Bullish", color: "text-accent-green bg-accent-green/10 ring-accent-green/30" },
                  { id: "bearish", label: "Bearish", color: "text-accent-coral bg-accent-coral/10 ring-accent-coral/30" },
                  { id: "neutral", label: "Neutral", color: "text-accent-violet bg-accent-violet/10 ring-accent-violet/30" }
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBias(b.id as any)}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-bold transition-all",
                      bias === b.id ? `${b.color} ring-1 shadow-sm` : "text-text-muted hover:bg-bg-secondary/30"
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep Quality */}
            <div className="flex items-center gap-3 bg-bg-card/30 px-4 py-2.5 rounded-xl border border-border-subtle/50">
              <span className="text-xs font-bold text-text-muted flex items-center gap-1.5"><Moon size={14}/> Sleep:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} onClick={() => setSleepScore(num)}
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all",
                      sleepScore >= num ? "bg-accent-blue/15 text-accent-blue" : "text-text-muted hover:bg-bg-secondary/40"
                    )}>
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus State */}
            <div className="flex items-center gap-3 bg-bg-card/30 px-4 py-2.5 rounded-xl border border-border-subtle/50">
              <span className="text-xs font-bold text-text-muted flex items-center gap-1.5"><Brain size={14}/> Focus:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} onClick={() => setFocusScore(num)}
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all",
                      focusScore >= num ? "bg-accent-green/15 text-accent-green" : "text-text-muted hover:bg-bg-secondary/40"
                    )}>
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Gameplan */}
        <section className="space-y-4 group">
          <div className="flex items-center gap-3 text-text-primary border-b border-border-subtle/30 pb-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <Target size={20} className="text-accent-blue" />
            <h2 className="text-xl font-bold tracking-tight">Pre-Market Gameplan</h2>
          </div>
          <textarea
            ref={preTextareaRef}
            value={preMarketPlan}
            onChange={(e) => setPreMarketPlan(e.target.value)}
            placeholder="What is the roadmap for today? (e.g. IF price sweeps liquidity during NY open, THEN look for a 5m entry...)"
            className="w-full min-h-[100px] bg-transparent border-none p-0 text-sm md:text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-0 resize-none leading-relaxed"
          />
        </section>

        {/* Section 3: Intraday Notes */}
        <section className="space-y-4 group">
          <div className="flex items-center gap-3 text-text-primary border-b border-border-subtle/30 pb-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <Sun size={20} className="text-accent-coral" />
            <h2 className="text-xl font-bold tracking-tight">Intraday Observations</h2>
          </div>
          <textarea
            ref={intraTextareaRef}
            value={intradayNotes}
            onChange={(e) => setIntradayNotes(e.target.value)}
            placeholder="Record live thoughts, emotional state changes, or market dynamic shifts as they happen..."
            className="w-full min-h-[100px] bg-transparent border-none p-0 text-sm md:text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-0 resize-none leading-relaxed"
          />
        </section>

        {/* Section 4: Post-Market Review */}
        <section className="space-y-6 group">
          <div className="flex items-center gap-3 text-text-primary border-b border-border-subtle/30 pb-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <Sunset size={20} className="text-accent-green" />
            <h2 className="text-xl font-bold tracking-tight">Post-Session Review</h2>
          </div>
          
          <div className="flex items-center gap-4 bg-bg-card/30 px-5 py-3 rounded-xl border border-border-subtle/50 w-fit mb-4">
            <span className="text-xs font-bold text-text-muted">Execution Grade:</span>
            <div className="flex gap-2">
              {["A", "B", "C", "D", "F"].map((grade) => {
                const isActive = sessionGrade === grade;
                const style = grade === "A" || grade === "B"
                  ? "text-accent-green bg-accent-green/10 ring-accent-green/30"
                  : grade === "C"
                    ? "text-accent-violet bg-accent-violet/10 ring-accent-violet/30"
                    : "text-accent-coral bg-accent-coral/10 ring-accent-coral/30";
                return (
                  <button key={grade} onClick={() => setSessionGrade(grade as any)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-black transition-all",
                      isActive ? `${style} ring-1 shadow-sm scale-110` : "text-text-muted hover:bg-bg-secondary/40 bg-bg-card"
                    )}>
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>

          <textarea
            ref={postTextareaRef}
            value={postMarketReview}
            onChange={(e) => setPostMarketReview(e.target.value)}
            placeholder="Lessons learned today? Did you follow your parameters? Any adjustments for tomorrow?"
            className="w-full min-h-[150px] bg-transparent border-none p-0 text-sm md:text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-0 resize-none leading-relaxed"
          />
        </section>

        {/* Session Results Auto-Linked */}
        <section className="space-y-6 pt-8 border-t border-border-subtle/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-text-primary">
              <TrendingUp size={20} className="text-text-secondary" />
              <h2 className="text-xl font-bold tracking-tight">Session Executions</h2>
            </div>
            {dailyTrades.length > 0 && (
              <span className={cn(
                "text-lg font-black font-[family-name:var(--font-space-mono)]",
                dailyPnL >= 0 ? "text-accent-green" : "text-accent-coral"
              )}>
                {dailyPnL >= 0 ? "+" : ""}{formatCurrency(dailyPnL)}
              </span>
            )}
          </div>

          {dailyTrades.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dailyTrades.map((trade) => {
                const isWin = trade.netPnl >= 0;
                return (
                  <div key={trade.id} className="p-4 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-between group hover:border-accent-violet/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-[family-name:var(--font-space-mono)] font-bold text-sm uppercase",
                        trade.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral"
                      )}>
                        {trade.direction === "long" ? "L" : "S"}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-text-primary">{trade.symbol}</span>
                        <span className="text-[10px] text-text-muted block font-medium">{trade.setupTags[0] || "Custom Setup"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-sm font-black font-[family-name:var(--font-space-mono)] block",
                        isWin ? "text-accent-green" : "text-accent-coral"
                      )}>
                        {isWin ? "+" : ""}{formatCurrency(trade.netPnl)}
                      </span>
                      <span className="text-[10px] text-text-muted block font-bold mt-0.5">
                        {trade.rMultiple >= 0 ? "+" : ""}{trade.rMultiple.toFixed(2)}R
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-bg-card/20 rounded-2xl border border-dashed border-border-subtle/50">
              <Flame size={24} className="mx-auto opacity-20 mb-3" />
              <p className="text-sm font-semibold text-text-muted">No trades logged on this date</p>
            </div>
          )}
        </section>

      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-bold shadow-xl transition-all duration-300",
            saveStatus === "saved" 
              ? "bg-accent-green text-bg-base scale-105" 
              : "bg-text-primary text-bg-base hover:scale-105 hover:shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
          )}
        >
          {isSaving ? (
            <div className="w-4 h-4 rounded-full border-2 border-bg-base/30 border-t-bg-base animate-spin" />
          ) : saveStatus === "saved" ? (
            <CheckSquare size={18} />
          ) : (
            <Save size={18} />
          )}
          {saveStatus === "saved" ? "Saved Successfully" : "Save Journal"}
        </button>
      </div>

    </div>
  );
}
