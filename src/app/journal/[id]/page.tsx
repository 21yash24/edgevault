"use client";
import { useTradeStore, useNotebookStore } from "@/stores";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCurrency, formatDate, formatDuration, formatDateTime, formatR } from "@/lib/utils";
import { analyzeTrade } from "@/lib/gemini";
import { motion } from "framer-motion";
import { use, useMemo, useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, ChevronLeft, Clock, Target, DollarSign, Activity, AlertTriangle, Brain, Sparkles, TrendingUp, TrendingDown, MessageSquare, CheckCircle, XCircle, Zap, Settings2, Share2 } from "lucide-react";
import Link from "next/link";
import { InteractiveChart } from "@/components/ui/interactive-chart";
import { SETUP_TAGS, MISTAKE_TAGS, MINDSET_TAGS, MistakeTag, Trade } from "@/lib/types";

const emotionLabels: Record<number, { label: string; emoji: string }> = {
  [-5]: { label: "Terrified", emoji: "😰" }, [-4]: { label: "Very Fearful", emoji: "😨" }, [-3]: { label: "Fearful", emoji: "😟" },
  [-2]: { label: "Anxious", emoji: "😕" }, [-1]: { label: "Uneasy", emoji: "😐" }, [0]: { label: "Neutral", emoji: "😶" },
  [1]: { label: "Confident", emoji: "🙂" }, [2]: { label: "Very Confident", emoji: "😊" }, [3]: { label: "Aggressive", emoji: "😤" },
  [4]: { label: "Overconfident", emoji: "😎" }, [5]: { label: "Euphoric", emoji: "🤩" },
};

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { trades, deleteTrade, updateTrade } = useTradeStore();
  const trade = useMemo(() => trades.find((t) => t.id === id), [trades, id]);
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof analyzeTrade>> | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced">("idle");

  const tradeDateStr = useMemo(() => trade?.entryDate?.split("T")[0] || "", [trade]);
  const { notes, saveNote } = useNotebookStore();
  const dailyNote = useMemo(() => {
    return notes[tradeDateStr] || {
      date: tradeDateStr,
      preMarketPlan: "",
      bias: "",
      sleepScore: 3,
      focusScore: 3,
      postMarketReview: "",
      intradayNotes: "",
      checklistComplete: false,
      sessionGrade: ""
    };
  }, [notes, tradeDateStr]);

  const triggerSync = () => {
    setSyncState("syncing");
    setTimeout(() => {
      setSyncState("synced");
      setTimeout(() => {
        setSyncState("idle");
      }, 1000);
    }, 600);
  };

  const handleUpdateTrade = (updates: Partial<Trade>) => {
    if (!trade) return;
    updateTrade(trade.id, updates);
    triggerSync();
  };

  const handleToggleTag = (field: "setupTags" | "mistakeTags" | "mindsetTags", tag: string) => {
    if (!trade) return;
    const currentTags = (trade[field] || []) as string[];
    const updatedTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    handleUpdateTrade({ [field]: updatedTags });
  };

  const handleUpdateNote = (fields: Partial<typeof dailyNote>) => {
    if (!tradeDateStr) return;
    saveNote(tradeDateStr, fields);
    triggerSync();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/shared/trade/${trade?.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const relatedTrades = useMemo(() => {
    if (!trade) return [];
    return trades.filter((t) => t.id !== trade.id && (t.symbol === trade.symbol || t.setupTags.some((s) => trade.setupTags.includes(s)))).slice(-5);
  }, [trade, trades]);

  const handleAnalyze = async () => {
    if (!trade) return;
    setLoadingAI(true);
    const result = await analyzeTrade(trade);
    setAnalysis(result);
    setLoadingAI(false);
  };

  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-text-secondary mb-4">Trade not found</p>
        <Link href="/journal" className="text-accent-green hover:underline">← Back to Journal</Link>
      </div>
    );
  }

  const emotionData = emotionLabels[trade.emotion] || { label: "Unknown", emoji: "❓" };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/journal" className="p-2 rounded-xl bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-[family-name:var(--font-syne)] font-black text-2xl tracking-tight">{trade.symbol}</h1>
              <span className={cn("inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider",
                trade.direction === "long" ? "bg-accent-green/10 text-accent-green border border-accent-green/20" : "bg-accent-coral/10 text-accent-coral border border-accent-coral/20")}>
                {trade.direction === "long" ? <ArrowUpRight size={10} className="stroke-[3]" /> : <ArrowDownRight size={10} className="stroke-[3]" />}
                {trade.direction}
              </span>
              <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider border",
                trade.result === "win" ? "bg-accent-green/10 text-accent-green border-accent-green/20" : trade.result === "loss" ? "bg-accent-coral/10 text-accent-coral border-accent-coral/20" : "bg-white/[0.02] border-white/[0.04] text-text-muted")}>
                {trade.result}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 font-semibold">{formatDateTime(trade.entryDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={handleShare}
              className={cn("p-2 rounded-xl border transition-all flex items-center gap-2", 
                copied ? "bg-accent-green/10 border-accent-green/20 text-accent-green font-bold" : "bg-bg-card border-border-subtle text-text-secondary hover:text-text-primary")}
              title="Share Trade">
              <Share2 size={18} />
              <span className="text-xs font-bold hidden sm:inline">{copied ? "Copied Link" : "Share"}</span>
            </button>
            <Link href={`/journal/${trade.id}/edit`} 
              className="p-2 rounded-xl bg-bg-card border border-border-subtle text-text-secondary hover:text-accent-violet transition-all"
              title="Detailed Edit">
              <Settings2 size={18} />
            </Link>
            <button onClick={() => { if(confirm("Are you sure you want to delete this trade?")) { deleteTrade(trade.id); router.push("/journal"); } }}
              className="p-2 rounded-xl bg-bg-card border border-border-subtle text-text-secondary hover:text-accent-coral transition-all"
              title="Delete Trade">
              <XCircle size={18} />
            </button>
          </div>

          <div className="w-[1px] h-8 bg-white/[0.05] hidden md:block" />

          <div className={cn("text-right font-[family-name:var(--font-space-mono)] ml-4",
            trade.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
            <div className="text-3xl font-black tracking-tight">{formatCurrency(trade.netPnl)}</div>
            <div className="text-xs font-bold opacity-80">{formatR(trade.rMultiple)}</div>
          </div>
        </div>
      </div>

      {/* Main Split Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (1/3 Width): Sleep, Focus, Mindset, and Mistakes Reviewer */}
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="border border-white/[0.04] p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
              <h3 className="font-[family-name:var(--font-syne)] font-black text-sm flex items-center gap-2">
                <Brain size={16} className="text-accent-violet" /> Trade Review Board
              </h3>
              
              {/* Sync Status Badge */}
              <div className="h-5 flex items-center">
                {syncState === "syncing" && (
                  <span className="text-[8px] text-accent-green font-black flex items-center gap-1 uppercase tracking-widest select-none animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-ping" />
                    Syncing
                  </span>
                )}
                {syncState === "synced" && (
                  <span className="text-[8px] text-accent-green font-black flex items-center gap-1 uppercase tracking-widest select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                    Saved
                  </span>
                )}
              </div>
            </div>

            {/* Daily Session Review */}
            <div className="space-y-4">
              <h4 className="text-[10px] text-text-muted uppercase font-black tracking-widest select-none border-b border-white/[0.02] pb-1">Daily Cognition Overview</h4>
              
              {/* Sleep Score Rating Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-text-muted uppercase font-black tracking-wider">
                  <span>Sleep Quality</span>
                  <span className="text-text-primary font-[family-name:var(--font-space-mono)]">{dailyNote.sleepScore} / 5</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleUpdateNote({ sleepScore: num })}
                      className={cn("w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-black transition-all duration-300",
                        num <= dailyNote.sleepScore 
                          ? "bg-accent-violet border-accent-violet text-bg-base shadow-[0_0_8px_rgba(123,97,255,0.3)]" 
                          : "bg-white/[0.01] border-white/[0.03] text-text-muted hover:border-white/10"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Score Rating Bar */}
              <div className="space-y-1 mt-3">
                <div className="flex justify-between text-[10px] text-text-muted uppercase font-black tracking-wider">
                  <span>Session Focus</span>
                  <span className="text-text-primary font-[family-name:var(--font-space-mono)]">{dailyNote.focusScore} / 5</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleUpdateNote({ focusScore: num })}
                      className={cn("w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-black transition-all duration-300",
                        num <= dailyNote.focusScore 
                          ? "bg-accent-violet border-accent-violet text-bg-base shadow-[0_0_8px_rgba(123,97,255,0.3)]" 
                          : "bg-white/[0.01] border-white/[0.03] text-text-muted hover:border-white/10"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade Buttons */}
              <div className="space-y-1.5 mt-3">
                <label className="text-[10px] text-text-muted uppercase font-black tracking-wider block">Session Performance Grade</label>
                <div className="flex gap-2">
                  {["A", "B", "C", "D", "F"].map((grade) => {
                    const active = dailyNote.sessionGrade === grade;
                    return (
                      <button
                        key={grade}
                        onClick={() => handleUpdateNote({ sessionGrade: grade as any })}
                        className={cn("w-8 h-8 rounded-xl border flex items-center justify-center font-black text-xs transition-all duration-300",
                          active 
                            ? "bg-accent-green border-accent-green text-bg-base shadow-[0_0_12px_rgba(0,255,178,0.3)]" 
                            : "bg-white/[0.01] border-white/[0.03] text-text-muted hover:border-white/10"
                        )}
                      >
                        {grade}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Trade Specific Psychology */}
            <div className="space-y-4 pt-4 border-t border-white/[0.05]">
              <h4 className="text-[10px] text-text-muted uppercase font-black tracking-widest select-none border-b border-white/[0.02] pb-1">Trade Psychology</h4>
              
              {/* Emotion Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-text-muted uppercase font-black tracking-wider">
                  <span>Execution Emotion</span>
                  <span className="text-accent-violet font-bold flex items-center gap-1">
                    {emotionData.emoji} {emotionData.label} ({trade.emotion >= 0 ? `+${trade.emotion}` : trade.emotion})
                  </span>
                </div>
                <input 
                  type="range" min="-5" max="5" 
                  value={trade.emotion} 
                  onChange={(e) => handleUpdateTrade({ emotion: parseInt(e.target.value) })}
                  className="w-full accent-accent-violet h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Mindset Toggles */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-text-muted uppercase font-black tracking-wider block">Mindset State</label>
                <div className="flex flex-wrap gap-1">
                  {MINDSET_TAGS.map((tag) => {
                    const active = trade.mindsetTags?.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag("mindsetTags", tag)}
                        className={cn("px-2 py-1 rounded-lg border text-[9px] font-black transition-all duration-300",
                          active 
                            ? "bg-accent-blue/10 border-accent-blue/20 text-accent-blue shadow-[0_0_10px_rgba(0,186,255,0.05)]" 
                            : "bg-white/[0.01] border-white/[0.03] text-text-muted hover:border-white/10"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tag Review Workspace */}
            <div className="space-y-4 pt-4 border-t border-white/[0.05]">
              <h4 className="text-[10px] text-text-muted uppercase font-black tracking-widest select-none border-b border-white/[0.02] pb-1">Tags Review Workspace</h4>
              
              {/* Setups */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-text-muted uppercase font-black tracking-wider block">Playbook Setups</label>
                <div className="flex flex-wrap gap-1">
                  {SETUP_TAGS.map((tag) => {
                    const active = trade.setupTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag("setupTags", tag)}
                        className={cn("px-2 py-1 rounded-lg border text-[9px] font-black transition-all duration-300",
                          active 
                            ? "bg-accent-violet/10 border-accent-violet/20 text-accent-violet shadow-[0_0_10px_rgba(123,97,255,0.05)]" 
                            : "bg-white/[0.01] border-white/[0.03] text-text-muted hover:border-white/10"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mistakes */}
              <div className="space-y-1.5 mt-3">
                <label className="text-[10px] text-text-muted uppercase font-black tracking-wider block">Capital Leaks & Mistakes</label>
                <div className="flex flex-wrap gap-1">
                  {MISTAKE_TAGS.map((tag) => {
                    const active = trade.mistakeTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag("mistakeTags", tag as any)}
                        className={cn("px-2 py-1 rounded-lg border text-[9px] font-black transition-all duration-300",
                          active 
                            ? "bg-accent-coral/10 border-accent-coral/20 text-accent-coral shadow-[0_0_10px_rgba(255,45,85,0.05)]" 
                            : "bg-white/[0.01] border-white/[0.03] text-text-muted hover:border-white/10"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Core Metrics HUD */}
          <GlassCard className="border border-white/[0.04] p-5 space-y-4">
            <h3 className="font-[family-name:var(--font-syne)] font-black text-sm flex items-center gap-2 select-none">
              <Activity size={16} className="text-accent-green" /> execution HUD Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl">
                <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider mb-1">Entry Price</div>
                <div className="font-[family-name:var(--font-space-mono)] font-bold text-text-primary">{trade.entryPrice ? trade.entryPrice.toLocaleString() : "—"}</div>
              </div>
              <div className="bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl">
                <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider mb-1">Exit Price</div>
                <div className="font-[family-name:var(--font-space-mono)] font-bold text-text-primary">{trade.exitPrice ? trade.exitPrice.toLocaleString() : "—"}</div>
              </div>
              <div className="bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl">
                <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider mb-1">Stop Loss</div>
                <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-coral">{trade.stopLoss && trade.stopLoss > 0 ? trade.stopLoss.toLocaleString() : "—"}</div>
              </div>
              <div className="bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl">
                <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider mb-1">Take Profit</div>
                <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green">{trade.takeProfit && trade.takeProfit > 0 ? trade.takeProfit.toLocaleString() : "—"}</div>
              </div>
              <div className="bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl">
                <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider mb-1">Playbook R:R</div>
                <div className="font-[family-name:var(--font-space-mono)] font-bold text-text-primary">1 : {(trade.rr || 0).toFixed(1)}</div>
              </div>
              <div className="bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl">
                <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider mb-1">Hold Duration</div>
                <div className="font-[family-name:var(--font-space-mono)] font-bold text-text-primary">{formatDuration(trade.durationMinutes)}</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column (2/3 Width): Interactive Chart replay & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interactive Trade Replay */}
          <GlassCard className="h-[430px] p-0 overflow-hidden relative group border-accent-violet/20">
            <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-bg-base/80 backdrop-blur-md rounded-lg text-xs font-bold text-text-primary border border-border-subtle flex items-center gap-2 select-none shadow-md">
              <Sparkles size={14} className="text-accent-violet" />
              Interactive Execution Replay
            </div>
            <InteractiveChart trade={trade} />
          </GlassCard>

          {/* Screenshot Gallery */}
          {trade.screenshotUrls && trade.screenshotUrls.length > 0 && (
            <div className="relative group">
              <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-2">
                {trade.screenshotUrls.map((url, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                    className="flex-shrink-0 w-full aspect-video rounded-2xl overflow-hidden border border-border-subtle group/img snap-center relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Chart Screenshot ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest border border-white/10 select-none">
                      Slide {i + 1} / {trade.screenshotUrls.length}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Plan vs Execution Review Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="border border-white/[0.04]">
              <h3 className="font-[family-name:var(--font-syne)] font-black text-sm mb-3 flex items-center gap-1.5 select-none">
                <MessageSquare size={14} className="text-accent-violet" /> Pre-Trade Setup Plan
              </h3>
              <p className="text-xs text-text-secondary bg-white/[0.01] border border-white/[0.03] rounded-xl p-3.5 leading-relaxed italic border-l-2 border-l-accent-violet">
                {trade.preTradeNotes ? `“${trade.preTradeNotes}”` : "No pre-trade notes recorded for this execution bias."}
              </p>
            </GlassCard>

            <GlassCard className="border border-white/[0.04]">
              <h3 className="font-[family-name:var(--font-syne)] font-black text-sm mb-3 flex items-center gap-1.5 select-none">
                <CheckCircle size={14} className="text-accent-green" /> Post-Trade Execution Review
              </h3>
              <p className="text-xs text-text-secondary bg-white/[0.01] border border-white/[0.03] rounded-xl p-3.5 leading-relaxed italic border-l-2 border-l-accent-green">
                {trade.postTradeReview ? `“${trade.postTradeReview}”` : "No post-trade review compiled for this trade bias."}
              </p>
            </GlassCard>
          </div>

          {/* AI Coach Analysis */}
          <GlassCard className={cn("border border-white/[0.04]", analysis ? "border-accent-violet/20" : "")}>
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.03] pb-3">
              <h3 className="font-[family-name:var(--font-syne)] font-black text-sm flex items-center gap-2">
                <Brain size={16} className="text-accent-violet animate-pulse" />
                AI Execution Diagnostics & Diagnostics
              </h3>
              {!analysis && (
                <button onClick={handleAnalyze} disabled={loadingAI}
                  className="flex items-center gap-1.5 bg-accent-violet/10 hover:bg-accent-violet/20 text-accent-violet px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 select-none border border-accent-violet/20 hover:shadow-[0_0_15px_rgba(123,97,255,0.25)]">
                  {loadingAI ? (
                    <><div className="w-3 h-3 border-2 border-accent-violet/30 border-t-accent-violet rounded-full animate-spin" /> Querying Diagnostics...</>
                  ) : (
                    <><Sparkles size={14} /> Run AI diagnostics</>
                  )}
                </button>
              )}
            </div>

            {!analysis && !loadingAI && (
              <div className="text-center py-8">
                <Brain size={40} className="mx-auto text-text-muted mb-3 opacity-30" />
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Awaiting Execution Query</p>
                <p className="text-[10px] text-text-muted mt-1">Initiate AI analysis to profile performance metrics, risk parameters, and psychological leaks.</p>
              </div>
            )}

            {loadingAI && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-bg-card rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}

            {analysis && (
              <motion.div className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Visual Discipline Score */}
                <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent-violet/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-border-subtle" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                        strokeDasharray={283} strokeDashoffset={283 - (283 * analysis.score) / 10}
                        className={cn("transition-all duration-1000", analysis.score >= 8 ? "text-accent-green" : analysis.score >= 5 ? "text-accent-violet" : "text-accent-coral")}
                        strokeLinecap="round" transform="rotate(-90 50 50)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black">{analysis.score}</span>
                      <span className="text-[7px] text-text-muted uppercase font-black leading-none">/10</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">Execution Discipline Grade</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">AI has graded this trade as <strong>{analysis.score >= 8 ? "High Discipline" : analysis.score >= 5 ? "Average Standards" : "Weak Adherence"}</strong> based on setup precision and rule parameters.</p>
                  </div>
                </div>

                {/* Strengths & Weaknesses side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl">
                    <div className="text-[10px] text-accent-green uppercase font-black tracking-wider mb-2 flex items-center gap-1"><CheckCircle size={12} /> Execution Edges</div>
                    <ul className="space-y-1.5 text-xs text-text-secondary">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 leading-relaxed"><span className="text-accent-green font-black">✓</span>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-xl">
                    <div className="text-[10px] text-accent-coral uppercase font-black tracking-wider mb-2 flex items-center gap-1"><XCircle size={12} /> Capital Leaks</div>
                    <ul className="space-y-1.5 text-xs text-text-secondary">
                      {analysis.weaknesses.map((w, i) => (
                        <li key={i} className="flex gap-2 leading-relaxed"><span className="text-accent-coral font-black">✗</span>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Pattern & Risk */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                    <div className="text-[10px] text-accent-violet uppercase font-black tracking-wider mb-1 flex items-center gap-1"><Zap size={12} /> Setup Mechanics</div>
                    <p className="text-xs text-text-secondary leading-relaxed">{analysis.pattern}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                    <div className="text-[10px] text-text-muted uppercase font-black tracking-wider mb-1 flex items-center gap-1"><AlertTriangle size={12} className="text-accent-coral" /> Risk Exposure</div>
                    <p className="text-xs text-text-secondary leading-relaxed">{analysis.riskAssessment}</p>
                  </div>
                </div>

                {/* Suggestion */}
                <div className="p-3.5 rounded-xl bg-accent-green/5 border border-accent-green/10">
                  <div className="text-[10px] text-accent-green uppercase font-black tracking-wider mb-1.5 flex items-center gap-1"><Sparkles size={12} /> Dynamic Advice suggestion</div>
                  <p className="text-xs text-text-secondary leading-relaxed">{analysis.suggestion}</p>
                </div>

                {/* Emotion Insight */}
                <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                  <div className="text-[10px] text-text-muted uppercase font-black tracking-wider mb-1">Emotion Dynamics</div>
                  <p className="text-xs text-text-secondary leading-relaxed">{analysis.emotionInsight}</p>
                </div>
              </motion.div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
