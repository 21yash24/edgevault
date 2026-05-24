"use client";
import { useTradeStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatDateTime, formatR } from "@/lib/utils";
import { InteractiveChart } from "@/components/ui/interactive-chart";
import { motion } from "framer-motion";
import { use, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, Target, Activity, Clock, Award, Shield } from "lucide-react";
import Link from "next/link";

export default function PublicTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  // Note: In a production app with SSR, this would fetch from a public /trades/{id} endpoint.
  // For the demo, we pull from the local store.
  const { trades } = useTradeStore();
  const trade = useMemo(() => trades.find((t) => t.id === id), [trades, id]);

  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-accent-coral/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="text-accent-coral" size={32} />
        </div>
        <h2 className="text-xl font-bold font-[family-name:var(--font-syne)] text-text-primary">Trade Private or Not Found</h2>
        <p className="text-text-secondary mt-2 max-w-md text-center text-sm">
          This trade may have been deleted, or the owner has not made it public.
        </p>
        <Link href="/" className="mt-6 px-4 py-2 bg-bg-card border border-border-subtle rounded-xl hover:bg-bg-card-hover transition-colors text-sm">
          Return to EdgeVault
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-violet/20 flex items-center justify-center">
            <Award size={16} className="text-accent-violet" />
          </div>
          <span className="font-bold font-[family-name:var(--font-syne)] text-xl text-text-primary">EdgeVault Shared Trade</span>
        </div>
        <Link href="/" className="text-xs text-text-muted hover:text-accent-violet transition-colors">
          Build your own journal →
        </Link>
      </div>

      <GlassCard className="p-6 md:p-8 relative overflow-hidden">
        {/* Glow effect */}
        <div className={cn(
          "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] pointer-events-none",
          trade.netPnl >= 0 ? "bg-accent-green/20" : "bg-accent-coral/20"
        )} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-[family-name:var(--font-syne)] font-bold text-3xl">{trade.symbol}</h1>
              <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium uppercase",
                trade.direction === "long" ? "bg-accent-green/10 text-accent-green border border-accent-green/20" : "bg-accent-coral/10 text-accent-coral border border-accent-coral/20")}>
                {trade.direction === "long" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {trade.direction}
              </span>
            </div>
            <p className="text-text-secondary flex items-center gap-2 text-sm">
              <Clock size={14} /> {formatDateTime(trade.entryDate)}
            </p>
          </div>

          <div className="text-left md:text-right">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Return</div>
            <div className={cn("font-[family-name:var(--font-space-mono)] font-bold text-4xl",
              trade.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
              {formatR(trade.rMultiple)}
            </div>
          </div>
        </div>

        {/* Tags */}
        {trade.setupTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {trade.setupTags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-1 bg-bg-card border border-border-subtle rounded text-text-secondary">
                {tag}
              </span>
            ))}
            {trade.playbook && (
              <span className="text-[10px] px-2 py-1 bg-accent-violet/10 border border-accent-violet/20 rounded text-accent-violet font-medium">
                {trade.playbook}
              </span>
            )}
          </div>
        )}
      </GlassCard>

      {/* Chart */}
      <GlassCard className="h-[400px] p-0 overflow-hidden relative border-accent-violet/20">
        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-bg-base/80 backdrop-blur-md rounded-lg text-xs font-bold text-text-primary border border-border-subtle">
          Execution Chart
        </div>
        <InteractiveChart trade={trade} />
      </GlassCard>

      {/* Notes */}
      {(trade.preTradeNotes || trade.postTradeReview) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trade.preTradeNotes && (
            <GlassCard>
              <h3 className="text-xs text-text-muted uppercase tracking-wider mb-3">Pre-Trade Thesis</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{trade.preTradeNotes}</p>
            </GlassCard>
          )}
          {trade.postTradeReview && (
            <GlassCard>
              <h3 className="text-xs text-text-muted uppercase tracking-wider mb-3">Post-Trade Review</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{trade.postTradeReview}</p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
