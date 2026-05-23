"use client";
import { useTradeStore } from "@/stores";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCurrency, formatDate, formatDuration, formatDateTime, formatR } from "@/lib/utils";
import { analyzeTrade } from "@/lib/gemini";
import { motion } from "framer-motion";
import { use, useMemo, useState, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, ChevronLeft, Clock, Target, DollarSign, Activity, AlertTriangle, Brain, Sparkles, TrendingUp, TrendingDown, MessageSquare, CheckCircle, XCircle, Zap, Settings2 } from "lucide-react";
import Link from "next/link";

const emotionLabels: Record<number, { label: string; emoji: string }> = {
  [-5]: { label: "Terrified", emoji: "😰" }, [-4]: { label: "Very Fearful", emoji: "😨" }, [-3]: { label: "Fearful", emoji: "😟" },
  [-2]: { label: "Anxious", emoji: "😕" }, [-1]: { label: "Uneasy", emoji: "😐" }, [0]: { label: "Neutral", emoji: "😶" },
  [1]: { label: "Confident", emoji: "🙂" }, [2]: { label: "Very Confident", emoji: "😊" }, [3]: { label: "Aggressive", emoji: "😤" },
  [4]: { label: "Overconfident", emoji: "😎" }, [5]: { label: "Euphoric", emoji: "🤩" },
};

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { trades, deleteTrade } = useTradeStore();
  const trade = useMemo(() => trades.find((t) => t.id === id), [trades, id]);
  const [analysis, setAnalysis] = useState<Awaited<ReturnType<typeof analyzeTrade>> | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/journal" className="p-2 rounded-xl bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary transition-colors">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl">{trade.symbol}</h1>
            <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium uppercase",
              trade.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral")}>
              {trade.direction === "long" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trade.direction}
            </span>
            <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium",
              trade.result === "win" ? "bg-accent-green/10 text-accent-green" : trade.result === "loss" ? "bg-accent-coral/10 text-accent-coral" : "bg-text-muted/10 text-text-muted")}>
              {trade.result.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-0.5">{formatDateTime(trade.entryDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/journal/${trade.id}/edit`} 
            className="p-2 rounded-xl bg-bg-card border border-border-subtle text-text-secondary hover:text-accent-violet transition-all"
            title="Edit Trade">
            <Settings2 size={18} />
          </Link>
          <button onClick={() => { if(confirm("Are you sure you want to delete this trade?")) { deleteTrade(trade.id); router.push("/journal"); } }}
            className="p-2 rounded-xl bg-bg-card border border-border-subtle text-text-secondary hover:text-accent-coral transition-all"
            title="Delete Trade">
            <XCircle size={18} />
          </button>
        </div>
        <div className={cn("text-right font-[family-name:var(--font-space-mono)] ml-4",
          trade.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
          <div className="text-3xl font-bold">{formatCurrency(trade.netPnl)}</div>
          <div className="text-sm">{formatR(trade.rMultiple)}</div>
        </div>
      </div>

      {/* Screenshot Gallery */}
      {/* Screenshot Gallery / Carousel */}
      {trade.screenshotUrls && trade.screenshotUrls.length > 0 && (
        <div className="relative group">
          <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-2">
            {trade.screenshotUrls.map((url, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                className="flex-shrink-0 w-full md:w-[80%] aspect-video rounded-2xl overflow-hidden border border-border-subtle group/img snap-center relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Chart Screenshot ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" />
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                  Slide {i + 1} / {trade.screenshotUrls.length}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Entry Price", value: trade.entryPrice ? trade.entryPrice.toLocaleString() : "N/A", icon: TrendingUp },
          { label: "Exit Price", value: trade.exitPrice ? trade.exitPrice.toLocaleString() : "N/A", icon: TrendingDown },
          { label: "Stop Loss", value: trade.stopLoss && trade.stopLoss > 0 ? trade.stopLoss.toLocaleString() : "—", icon: AlertTriangle },
          { label: "Take Profit", value: trade.takeProfit && trade.takeProfit > 0 ? trade.takeProfit.toLocaleString() : "—", icon: Target },
          { label: "R:R Ratio", value: `1:${(trade.rr || 0).toFixed(1)}`, icon: Activity },
          { label: "Duration", value: formatDuration(trade.durationMinutes), icon: Clock },
          { label: "Position Size", value: trade.positionSize ? trade.positionSize.toString() : "N/A", icon: Target },
        ].map((m, i) => (
          <motion.div key={i} className="glass p-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <m.icon size={14} className="text-accent-violet mb-1.5" />
            <div className="text-[10px] text-text-muted uppercase tracking-wider">{m.label}</div>
            <div className="font-[family-name:var(--font-space-mono)] font-bold text-sm mt-0.5">{m.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Metadata */}
          <GlassCard>
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-3">Trade Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Session</span><span className="text-accent-violet">{trade.sessionTag}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Market Condition</span><span>{trade.marketCondition}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Position Size</span><span className="font-[family-name:var(--font-space-mono)]">{trade.positionSize || "N/A"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Commission</span><span className="font-[family-name:var(--font-space-mono)] text-accent-coral">${(trade.commission || 0).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Playbook</span><span className="text-accent-violet">{trade.playbook || "—"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-text-secondary">Emotion</span><span>{emotionData.emoji} {emotionData.label} ({trade.emotion})</span></div>
            </div>

            {/* Setup Tags */}
            {trade.setupTags?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border-subtle">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Setups</div>
                <div className="flex flex-wrap gap-1.5">
                  {trade.setupTags?.map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded-lg bg-accent-violet/10 text-accent-violet">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Mistakes */}
            {trade.mistakeTags?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border-subtle">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Mistakes</div>
                <div className="flex flex-wrap gap-1.5">
                  {trade.mistakeTags?.map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded-lg bg-accent-coral/10 text-accent-coral">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Mindset & Psychology */}
          <GlassCard>
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-3">
              <Brain size={16} className="inline mr-2 text-accent-violet" />
              Mindset & Psychology
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {(trade.mindsetTags || []).map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-xl bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
                    {tag}
                  </span>
                ))}
              </div>
              
              {trade.mindsetNotes && (
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Self-Talk / Mindset Notes</div>
                  <p className="text-sm text-text-secondary bg-bg-card rounded-lg p-3 border border-border-subtle italic">
                    &ldquo;{trade.mindsetNotes}&rdquo;
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-subtle">
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Emotion</div>
                  <div className="text-sm font-medium">{emotionData.emoji} {emotionData.label}</div>
                </div>
                <div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Discipline</div>
                  <div className="text-sm font-medium">{(trade.mistakeTags || []).length === 0 ? "Perfect Execution" : `${trade.mistakeTags?.length || 0} Mistake(s)`}</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Plan vs Execution */}
          <GlassCard>
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-3">
              <MessageSquare size={16} className="inline mr-2 text-accent-violet" />
              Trade Review
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Pre-Trade Plan</div>
                <p className="text-sm text-text-secondary bg-bg-card rounded-lg p-3 border border-border-subtle">
                  {trade.preTradeNotes || "No pre-trade notes recorded."}
                </p>
              </div>
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Post-Trade Review</div>
                <p className="text-sm text-text-secondary bg-bg-card rounded-lg p-3 border border-border-subtle">
                  {trade.postTradeReview || "No post-trade review recorded."}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column - AI Analysis */}
        <div className="space-y-4">
          <GlassCard className={analysis ? "border-accent-violet/20" : ""}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-syne)] font-bold text-base">
                <Brain size={16} className="inline mr-2 text-accent-violet" />
                AI Analysis
              </h3>
              {!analysis && (
                <button onClick={handleAnalyze} disabled={loadingAI}
                  className="flex items-center gap-1.5 bg-accent-violet/10 hover:bg-accent-violet/20 text-accent-violet px-4 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40">
                  {loadingAI ? (
                    <><div className="w-3 h-3 border-2 border-accent-violet/30 border-t-accent-violet rounded-full animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles size={14} /> Analyze with AI</>
                  )}
                </button>
              )}
            </div>

            {!analysis && !loadingAI && (
              <div className="text-center py-8">
                <Brain size={40} className="mx-auto text-text-muted mb-3 opacity-40" />
                <p className="text-sm text-text-muted">Click &ldquo;Analyze with AI&rdquo; to get insights</p>
                <p className="text-xs text-text-muted mt-1">Powered by Google Gemini</p>
              </div>
            )}

            {loadingAI && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-bg-card rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}

            {analysis && (
              <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Visual Discipline Score */}
                <div className="flex items-center gap-6 p-4 rounded-2xl bg-bg-card border border-border-subtle overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent-violet/5 rounded-full blur-2xl" />
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-border-subtle" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                        strokeDasharray={283} strokeDashoffset={283 - (283 * analysis.score) / 10}
                        className={cn("transition-all duration-1000", analysis.score >= 8 ? "text-accent-green" : analysis.score >= 5 ? "text-accent-violet" : "text-accent-coral")}
                        strokeLinecap="round" transform="rotate(-90 50 50)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black">{analysis.score}</span>
                      <span className="text-[8px] text-text-muted uppercase">/10</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1">Execution Quality</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">AI has graded this trade as <strong>{analysis.score >= 8 ? "High Discipline" : analysis.score >= 5 ? "Average" : "Low Discipline"}</strong> based on your playbook adherence.</p>
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <div className="text-xs text-accent-green uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle size={12} /> Strengths</div>
                  <ul className="space-y-1.5">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-text-secondary flex gap-2"><span className="text-accent-green mt-0.5">✓</span>{s}</li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <div className="text-xs text-accent-coral uppercase tracking-wider mb-2 flex items-center gap-1"><XCircle size={12} /> Areas to Improve</div>
                  <ul className="space-y-1.5">
                    {analysis.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-text-secondary flex gap-2"><span className="text-accent-coral mt-0.5">✗</span>{w}</li>
                    ))}
                  </ul>
                </div>

                {/* Pattern */}
                <div className="p-3 rounded-xl bg-bg-card border border-border-subtle">
                  <div className="text-xs text-accent-violet uppercase tracking-wider mb-1 flex items-center gap-1"><Zap size={12} /> Pattern Detected</div>
                  <p className="text-sm text-text-secondary">{analysis.pattern}</p>
                </div>

                {/* Risk Assessment */}
                <div className="p-3 rounded-xl bg-bg-card border border-border-subtle">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Risk Assessment</div>
                  <p className="text-sm">{analysis.riskAssessment}</p>
                </div>

                {/* Suggestion */}
                <div className="p-3 rounded-xl bg-accent-green/5 border border-accent-green/10">
                  <div className="text-xs text-accent-green uppercase tracking-wider mb-1 flex items-center gap-1"><Sparkles size={12} /> Suggestion</div>
                  <p className="text-sm text-text-secondary">{analysis.suggestion}</p>
                </div>

                {/* Emotion */}
                <div className="p-3 rounded-xl bg-bg-card border border-border-subtle">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Emotion Insight</div>
                  <p className="text-sm text-text-secondary">{analysis.emotionInsight}</p>
                </div>
              </motion.div>
            )}
          </GlassCard>

          {/* Related Trades */}
          {relatedTrades.length > 0 && (
            <GlassCard>
              <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-3">Related Trades</h3>
              <div className="space-y-2">
                {relatedTrades.map((t) => (
                  <Link key={t.id} href={`/journal/${t.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-bg-card-hover transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-[family-name:var(--font-space-mono)] font-bold text-sm">{t.symbol}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded uppercase",
                        t.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral")}>
                        {t.direction}
                      </span>
                      <span className="text-xs text-text-muted">{formatDate(t.entryDate)}</span>
                    </div>
                    <span className={cn("font-[family-name:var(--font-space-mono)] font-bold text-sm",
                      t.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                      {formatCurrency(t.netPnl)}
                    </span>
                  </Link>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
