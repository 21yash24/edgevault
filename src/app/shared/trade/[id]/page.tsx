"use client";
import { useTradeStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatDateTime, formatR, formatCurrency } from "@/lib/utils";
import { InteractiveChart } from "@/components/ui/interactive-chart";
import { motion, AnimatePresence } from "framer-motion";
import { use, useMemo, useState } from "react";
import { 
  ArrowUpRight, ArrowDownRight, Target, Activity, Clock, 
  Award, Shield, Share2, MessageSquare, Copy, Check, Download
} from "lucide-react";
import Link from "next/link";

export default function PublicTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  // Note: In a production app with SSR, this would fetch from a public /trades/{id} endpoint.
  // For the demo, we pull from the local store.
  const { trades } = useTradeStore();
  const trade = useMemo(() => trades.find((t) => t.id === id), [trades, id]);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    if (!trade) return;
    const text = `Check out my execution on ${trade.symbol} (${trade.direction === "long" ? "LONG" : "SHORT"}) using ${trade.playbook || "EdgeVault"}! PnL: ${trade.netPnl >= 0 ? "+" : ""}${trade.netPnl}. Captured ${trade.rMultiple.toFixed(2)}R!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank");
  };

  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-accent-coral/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="text-accent-coral" size={32} />
        </div>
        <h2 className="text-xl font-bold font-[family-name:var(--font-inter)] text-text-primary">Trade Private or Not Found</h2>
        <p className="text-text-secondary mt-2 max-w-md text-center text-sm">
          This trade may have been deleted, or the owner has not made it public.
        </p>
        <Link href="/" className="mt-6 px-4 py-2 bg-bg-card border border-border-subtle rounded-xl hover:bg-bg-card-hover transition-colors text-sm">
          Return to EdgeVault
        </Link>
      </div>
    );
  }

  const isWin = trade.netPnl >= 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-10 px-4">
      
      {/* Back navbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-violet/20 flex items-center justify-center">
            <Award size={16} className="text-accent-violet" />
          </div>
          <span className="font-bold font-[family-name:var(--font-inter)] text-xl text-text-primary flex items-center gap-1.5">
            EdgeVault Share Cockpit <Share2 size={16} className="text-accent-green" />
          </span>
        </div>
        <Link href="/" className="text-xs text-accent-green hover:underline font-bold">
          Build your own journal →
        </Link>
      </div>

      {/* Main Trade Details */}
      <GlassCard className="p-6 md:p-8 relative overflow-hidden border-border-subtle">
        
        {/* Glow effect based on trade success */}
        <div className={cn(
          "absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-all duration-500",
          isWin ? "bg-accent-green/10" : "bg-accent-coral/10"
        )} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="font-[family-name:var(--font-inter)] font-bold text-3xl text-text-primary">{trade.symbol}</h1>
              <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold uppercase border",
                trade.direction === "long" 
                  ? "bg-accent-green/10 text-accent-green border-accent-green/20" 
                  : "bg-accent-coral/10 text-accent-coral border-accent-coral/20"
              )}>
                {trade.direction === "long" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {trade.direction}
              </span>
              
              {trade.playbook && (
                <span className="text-[10px] px-2.5 py-1 bg-accent-violet/10 border border-accent-violet/20 rounded-full text-accent-violet font-bold uppercase tracking-wider">
                  {trade.playbook}
                </span>
              )}
            </div>
            
            <p className="text-text-secondary flex items-center gap-2 text-xs font-semibold">
              <Clock size={14} className="text-text-muted" /> {formatDateTime(trade.entryDate)}
            </p>
          </div>

          {/* Capital statistics */}
          <div className="grid grid-cols-2 gap-6 md:text-right">
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">R-Multiple</div>
              <div className={cn("font-[family-name:var(--font-space-mono)] font-bold text-3xl",
                isWin ? "text-accent-green" : "text-accent-coral")}>
                {formatR(trade.rMultiple)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Net Returns</div>
              <div className={cn("font-[family-name:var(--font-space-mono)] font-bold text-3xl",
                isWin ? "text-accent-green" : "text-accent-coral")}>
                {isWin ? "+" : ""}{formatCurrency(trade.netPnl)}
              </div>
            </div>
          </div>
        </div>

        {/* Setup tags */}
        {trade.setupTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-6 border-t border-border-subtle/30 pt-4">
            {trade.setupTags.map(tag => (
              <span key={tag} className="text-[9px] font-semibold px-2 py-0.5 bg-white/[0.03] border border-border-subtle/60 rounded text-text-secondary">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Social Sharing block */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border-subtle/30">
          <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted mr-1">Share Execution:</span>
          
          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-border-subtle hover:bg-white/[0.05] hover:text-text-primary text-[10px] text-text-secondary font-bold transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check size={12} className="text-accent-green" /> Copied Link
              </>
            ) : (
              <>
                <Copy size={12} /> Copy Link
              </>
            )}
          </button>

          {/* Share on X */}
          <button
            onClick={handleShareTwitter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1da1f2]/10 border border-[#1da1f2]/20 hover:bg-[#1da1f2]/20 hover:text-white text-[10px] text-[#1da1f2] font-bold transition-all active:scale-95"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> Share to X
          </button>

          {/* Share Telegram */}
          <button
            onClick={() => {
              if (!trade) return;
              const text = `Shared Trade Execution on ${trade.symbol}! PnL: ${trade.netPnl >= 0 ? "+" : ""}${trade.netPnl}. Captured ${trade.rMultiple.toFixed(2)}R!`;
              const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
              window.open(url, "_blank");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20 hover:bg-[#0088cc]/20 hover:text-white text-[10px] text-[#0088cc] font-bold transition-all active:scale-95"
          >
            <MessageSquare size={12} /> Telegram
          </button>
        </div>

      </GlassCard>

      {/* Chart */}
      <GlassCard className="h-[400px] p-0 overflow-hidden relative border-border-subtle hover:border-accent-violet/20 transition-all duration-300">
        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-bg-base/80 backdrop-blur-md rounded-lg text-xs font-bold text-text-primary border border-border-subtle">
          Execution Chart
        </div>
        <InteractiveChart trade={trade} />
      </GlassCard>

      {/* Notes & Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pre-trade thesis */}
        <GlassCard className="md:col-span-1 border-border-subtle p-4 space-y-2">
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Pre-Trade Thesis</span>
          {trade.preTradeNotes ? (
            <p className="text-xs text-text-secondary leading-relaxed">{trade.preTradeNotes}</p>
          ) : (
            <p className="text-xs text-text-muted italic">No pre-trade notes logged.</p>
          )}
        </GlassCard>

        {/* Post-trade review */}
        <GlassCard className="md:col-span-1 border-border-subtle p-4 space-y-2">
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Post-Trade Review</span>
          {trade.postTradeReview ? (
            <p className="text-xs text-text-secondary leading-relaxed">{trade.postTradeReview}</p>
          ) : (
            <p className="text-xs text-text-muted italic">No post-trade notes logged.</p>
          )}
        </GlassCard>

        {/* Internal psychology details */}
        <GlassCard className="md:col-span-1 border-border-subtle p-4 space-y-3">
          <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider block">Coaching Diagnostics</span>
          <div className="space-y-2">
            
            {/* Emotion */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">Emotional Intensity</span>
              <span className="font-bold text-text-primary">{Math.abs(trade.emotion)}/5</span>
            </div>

            {/* Mindset tags */}
            {trade.mindsetTags && trade.mindsetTags.length > 0 && (
              <div>
                <span className="text-[9px] text-text-muted block mb-1">State tags</span>
                <div className="flex flex-wrap gap-1">
                  {trade.mindsetTags.map(tag => (
                    <span key={tag} className="text-[8px] font-semibold bg-accent-violet/10 text-accent-violet border border-accent-violet/20 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mistakes */}
            {trade.mistakeTags && trade.mistakeTags.length > 0 && (
              <div>
                <span className="text-[9px] text-text-muted block mb-1">Compliance Errors</span>
                <div className="flex flex-wrap gap-1">
                  {trade.mistakeTags.map(tag => (
                    <span key={tag} className="text-[8px] font-bold bg-accent-coral/10 text-accent-coral border border-accent-coral/20 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </GlassCard>

      </div>

    </div>
  );
}
