"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  Trophy, Users2, Sparkles, TrendingUp, Award, Flame, 
  Share2, ArrowUpRight, ArrowDownRight, Target, Clock, MessageSquare, Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface LeaderboardTrader {
  rank: number;
  name: string;
  avatarColor: string;
  profitFactor: number;
  winRate: number;
  gainPercent: number;
  totalTrades: number;
  propChallengeStatus: "Funded" | "Evaluation" | "Mastered";
  streak: number; // positive = win streak
}

const mockTraders: LeaderboardTrader[] = [
  { rank: 1, name: "CryptoViper", avatarColor: "bg-accent-violet", profitFactor: 3.42, winRate: 72.5, gainPercent: 142.4, totalTrades: 120, propChallengeStatus: "Mastered", streak: 8 },
  { rank: 2, name: "MacroBull", avatarColor: "bg-accent-green", profitFactor: 2.91, winRate: 68.2, gainPercent: 94.8, totalTrades: 85, propChallengeStatus: "Funded", streak: 4 },
  { rank: 3, name: "DeltaScalper", avatarColor: "bg-accent-blue", profitFactor: 2.75, winRate: 64.9, gainPercent: 78.5, totalTrades: 144, propChallengeStatus: "Funded", streak: -1 },
  { rank: 4, name: "ApexTrader", avatarColor: "bg-yellow-500", profitFactor: 2.31, winRate: 59.4, gainPercent: 62.1, totalTrades: 92, propChallengeStatus: "Evaluation", streak: 2 },
  { rank: 5, name: "FlowState", avatarColor: "bg-accent-coral", profitFactor: 2.18, winRate: 58.1, gainPercent: 55.4, totalTrades: 70, propChallengeStatus: "Funded", streak: 5 },
  { rank: 6, name: "AlphaSeeker", avatarColor: "bg-pink-500", profitFactor: 1.95, winRate: 55.2, gainPercent: 41.2, totalTrades: 110, propChallengeStatus: "Evaluation", streak: -3 },
  { rank: 7, name: "LiquidSweeep", avatarColor: "bg-indigo-500", profitFactor: 1.84, winRate: 54.8, gainPercent: 38.9, totalTrades: 62, propChallengeStatus: "Funded", streak: 1 },
  { rank: 8, name: "TrendRunner", avatarColor: "bg-teal-500", profitFactor: 1.71, winRate: 53.0, gainPercent: 29.5, totalTrades: 98, propChallengeStatus: "Evaluation", streak: -2 }
];

interface CommunitySetup {
  id: string;
  name: string;
  creator: string;
  winRate: number;
  avgRR: string;
  tradersUsing: number;
  votes: number;
}

const mockSetups: CommunitySetup[] = [
  { id: "cs-1", name: "ICT Silver Bullet AM Session", creator: "CryptoViper", winRate: 69.4, avgRR: "1:2.5", tradersUsing: 428, votes: 184 },
  { id: "cs-2", name: "FVG & SMT Divergence Reversal", creator: "MacroBull", winRate: 65.8, avgRR: "1:3.0", tradersUsing: 312, votes: 142 },
  { id: "cs-3", name: "Opening Range Breakout (ORB)", creator: "DeltaScalper", winRate: 58.2, avgRR: "1:2.0", tradersUsing: 519, votes: 98 },
  { id: "cs-4", name: "High Timeframe Liquidity Sweep", creator: "ApexTrader", winRate: 62.5, avgRR: "1:4.0", tradersUsing: 254, votes: 125 }
];

interface SharedTrade {
  id: string;
  username: string;
  symbol: string;
  direction: "long" | "short";
  setup: string;
  netPnl: number;
  rMultiple: number;
  likes: number;
  comments: number;
  timeAgo: string;
}

const mockSharedTrades: SharedTrade[] = [
  { id: "st-1", username: "CryptoViper", symbol: "NQ", direction: "long", setup: "IFVG Re-entry", netPnl: 1420, rMultiple: 3.2, likes: 24, comments: 8, timeAgo: "14m ago" },
  { id: "st-2", username: "MacroBull", symbol: "ES", direction: "short", setup: "SMT Divergence", netPnl: 850, rMultiple: 2.1, likes: 18, comments: 4, timeAgo: "1h ago" },
  { id: "st-3", username: "FlowState", symbol: "EURUSD", direction: "long", setup: "London Liquidity Sweep", netPnl: 410, rMultiple: 2.5, likes: 12, comments: 2, timeAgo: "3h ago" },
  { id: "st-4", username: "DeltaScalper", symbol: "BTCUSD", direction: "long", setup: "Trend Continuation", netPnl: 3120, rMultiple: 4.8, likes: 45, comments: 14, timeAgo: "5h ago" }
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "setups" | "shared">("leaderboard");
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<"weekly" | "monthly" | "all-time">("monthly");
  const [likedTrades, setLikedTrades] = useState<string[]>([]);
  const [votedSetups, setVotedSetups] = useState<string[]>([]);

  const handleLikeTrade = (id: string) => {
    setLikedTrades(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleVoteSetup = (id: string) => {
    setVotedSetups(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border-subtle/50 bg-gradient-to-r from-bg-card via-accent-violet/5 to-accent-green/5 p-6 md:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-violet/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-accent-green/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold text-accent-green bg-accent-green/10 border border-accent-green/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Trader Arena
            </span>
            <h1 className="font-[family-name:var(--font-syne)] font-bold text-3xl text-text-primary mt-2 flex items-center gap-2">
              Community Hub <Trophy size={28} className="text-yellow-500 animate-bounce" />
            </h1>
            <p className="text-sm text-text-muted mt-2 max-w-xl">
              Compete on global leaderboards, share your winning playbooks, and analyze high-performance trade setups alongside elite funded traders.
            </p>
          </div>

          {/* User Rank Quick Stats */}
          <div className="flex gap-4">
            <GlassCard className="p-4 border-accent-green/20 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] text-text-muted uppercase font-bold">Your Arena Rank</span>
              <span className="text-xl font-bold text-accent-green mt-1 font-[family-name:var(--font-space-mono)]">#42</span>
              <span className="text-[9px] text-text-muted mt-0.5">Top 5.2% of Traders</span>
            </GlassCard>
            <GlassCard className="p-4 border-accent-violet/20 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] text-text-muted uppercase font-bold">Arena Points</span>
              <span className="text-xl font-bold text-accent-violet mt-1 font-[family-name:var(--font-space-mono)]">1,850 XP</span>
              <span className="text-[9px] text-text-muted mt-0.5">Next rank: 2,000 XP</span>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border-subtle/50 gap-6">
        {[
          { id: "leaderboard", label: "Global Leaderboard", icon: Trophy },
          { id: "setups", label: "Top Setups & Playbooks", icon: Target },
          { id: "shared", label: "Live Shared Trades", icon: Share2 }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 relative transition-all active:scale-98",
                isActive 
                  ? "border-accent-green text-accent-green" 
                  : "border-transparent text-text-muted hover:text-text-secondary"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
              {isActive && (
                <motion.div 
                  layoutId="activeArenaTab"
                  className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-accent-green"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Feed */}
      <div>
        <AnimatePresence mode="wait">
          
          {/* Tab 1: Leaderboard */}
          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Leaderboard Controls */}
              <div className="flex flex-wrap justify-between items-center gap-4 bg-bg-card/20 p-3 rounded-xl border border-border-subtle/40">
                <span className="text-xs text-text-muted font-medium">Rankings updated every 15 minutes</span>
                <div className="flex gap-1.5">
                  {[
                    { id: "weekly", label: "Weekly" },
                    { id: "monthly", label: "Monthly" },
                    { id: "all-time", label: "All-Time" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setLeaderboardTimeframe(t.id as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        leaderboardTimeframe === t.id
                          ? "bg-accent-green/10 text-accent-green border-accent-green/30"
                          : "bg-white/[0.01] text-text-muted border-border-subtle hover:text-text-primary hover:bg-white/[0.03]"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leaderboard Table Cards */}
              <div className="space-y-3">
                {mockTraders.map((trader) => {
                  const isTop3 = trader.rank <= 3;
                  const medalColor = trader.rank === 1 
                    ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.15)]" 
                    : trader.rank === 2 
                      ? "text-slate-300 bg-slate-300/10 border-slate-300/20" 
                      : "text-amber-600 bg-amber-600/10 border-amber-600/20";

                  return (
                    <GlassCard 
                      key={trader.rank}
                      className={cn(
                        "p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 border-border-subtle/70",
                        isTop3 ? "hover:border-accent-green/30" : "hover:border-border-subtle"
                      )}
                    >
                      {/* Left Block: Medal, Rank & Name */}
                      <div className="flex items-center gap-4 min-w-0">
                        {isTop3 ? (
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-sm", medalColor)}>
                            <Award size={18} />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-border-subtle flex items-center justify-center font-[family-name:var(--font-space-mono)] font-bold text-xs text-text-muted">
                            #{trader.rank}
                          </div>
                        )}

                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-bold text-white", trader.avatarColor)}>
                          {trader.name[0]}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-text-primary">{trader.name}</span>
                            <span className={cn(
                              "text-[8px] font-bold px-1.5 py-0.5 rounded border",
                              trader.propChallengeStatus === "Mastered" 
                                ? "bg-accent-violet/10 text-accent-violet border-accent-violet/20"
                                : trader.propChallengeStatus === "Funded"
                                  ? "bg-accent-green/10 text-accent-green border-accent-green/20"
                                  : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            )}>
                              {trader.propChallengeStatus}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-text-muted">{trader.totalTrades} trades logged</span>
                            {trader.streak > 0 ? (
                              <span className="text-[9px] text-accent-green flex items-center gap-0.5 font-semibold">
                                <Flame size={10} className="fill-accent-green" /> {trader.streak} Win Streak
                              </span>
                            ) : (
                              <span className="text-[9px] text-text-muted">No active streak</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Stats metrics */}
                      <div className="grid grid-cols-3 gap-6 md:gap-10 text-right min-w-[280px]">
                        {/* Win Rate */}
                        <div className="flex flex-col">
                          <span className="text-[9px] text-text-muted uppercase">Win Rate</span>
                          <span className="text-sm font-bold text-text-primary font-[family-name:var(--font-space-mono)]">
                            {trader.winRate}%
                          </span>
                        </div>

                        {/* Profit Factor */}
                        <div className="flex flex-col">
                          <span className="text-[9px] text-text-muted uppercase">Profit Factor</span>
                          <span className="text-sm font-bold text-text-secondary font-[family-name:var(--font-space-mono)]">
                            {trader.profitFactor.toFixed(2)}
                          </span>
                        </div>

                        {/* Gain */}
                        <div className="flex flex-col">
                          <span className="text-[9px] text-text-muted uppercase">Gain %</span>
                          <span className="text-sm font-bold text-accent-green font-[family-name:var(--font-space-mono)] flex items-center justify-end">
                            <ArrowUpRight size={14} /> +{trader.gainPercent}%
                          </span>
                        </div>
                      </div>

                    </GlassCard>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Tab 2: Top Setups */}
          {activeTab === "setups" && (
            <motion.div
              key="setups"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {mockSetups.map((setup) => {
                const hasVoted = votedSetups.includes(setup.id);
                return (
                  <GlassCard key={setup.id} className="p-5 flex flex-col justify-between border-border-subtle/70 hover:shadow-[0_0_20px_rgba(143,0,255,0.04)] transition-all">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-[9px] font-bold text-accent-violet bg-accent-violet/10 border border-accent-violet/20 px-2 py-0.5 rounded uppercase tracking-wider">
                          Community Edge
                        </span>
                        <span className="text-xs text-text-muted">Created by **@{setup.creator}**</span>
                      </div>
                      
                      <h3 className="font-[family-name:var(--font-syne)] font-bold text-base text-text-primary mt-3">
                        {setup.name}
                      </h3>

                      <div className="grid grid-cols-2 gap-4 mt-5 bg-white/[0.02] border border-border-subtle/50 p-3 rounded-xl">
                        <div>
                          <p className="text-[9px] text-text-muted uppercase font-bold">Community Win Rate</p>
                          <p className="text-base font-bold text-accent-green font-[family-name:var(--font-space-mono)] mt-0.5">
                            {setup.winRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-text-muted uppercase font-bold">Avg Risk:Reward</p>
                          <p className="text-base font-bold text-text-secondary font-[family-name:var(--font-space-mono)] mt-0.5">
                            {setup.avgRR}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-5 pt-4 border-t border-border-subtle/30">
                      <span className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                        <Users2 size={12} /> {setup.tradersUsing} traders logged this setup
                      </span>

                      <button
                        onClick={() => handleVoteSetup(setup.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95",
                          hasVoted
                            ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
                            : "bg-white/[0.02] text-text-muted border border-border-subtle hover:text-text-primary hover:bg-white/[0.04]"
                        )}
                      >
                        <Heart size={12} className={cn(hasVoted && "fill-accent-green")} />
                        {hasVoted ? setup.votes + 1 : setup.votes} Upvotes
                      </button>
                    </div>

                  </GlassCard>
                );
              })}
            </motion.div>
          )}

          {/* Tab 3: Shared Trades */}
          {activeTab === "shared" && (
            <motion.div
              key="shared"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {mockSharedTrades.map((trade) => {
                const hasLiked = likedTrades.includes(trade.id);
                const isWin = trade.netPnl >= 0;

                return (
                  <GlassCard key={trade.id} className="p-5 border-border-subtle/70 hover:shadow-[0_0_15px_rgba(255,255,255,0.02)] transition-all">
                    
                    {/* Share Trade Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-accent-violet/20 flex items-center justify-center font-bold text-xs text-accent-violet">
                          {trade.username[0]}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-text-primary">@{trade.username}</span>
                          <span className="text-[10px] text-text-muted ml-2">{trade.timeAgo}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                          trade.direction === "long" 
                            ? "bg-accent-green/10 text-accent-green border-accent-green/20" 
                            : "bg-accent-coral/10 text-accent-coral border-accent-coral/20"
                        )}>
                          {trade.direction}
                        </span>
                        <span className="text-xs font-bold text-text-primary font-[family-name:var(--font-space-mono)] bg-white/[0.05] border border-border-subtle/50 px-2 py-0.5 rounded-lg">
                          {trade.symbol}
                        </span>
                      </div>
                    </div>

                    {/* Shared Trade Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-white/[0.01] border border-border-subtle/40 p-4 rounded-xl">
                      <div>
                        <span className="text-[9px] text-text-muted uppercase font-bold block">Execution Setup</span>
                        <span className="text-sm font-semibold text-text-primary mt-0.5 block">{trade.setup}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-text-muted uppercase font-bold block">Captured R-Multiple</span>
                        <span className="text-sm font-bold text-accent-green font-[family-name:var(--font-space-mono)] mt-0.5 block flex items-center">
                          <ArrowUpRight size={14} /> +{trade.rMultiple.toFixed(1)}R
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-text-muted uppercase font-bold block">Trade Result (PnL)</span>
                        <span className={cn(
                          "text-sm font-bold font-[family-name:var(--font-space-mono)] mt-0.5 block flex items-center",
                          isWin ? "text-accent-green" : "text-accent-coral"
                        )}>
                          {isWin ? "+" : ""}${trade.netPnl.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Footer interactions */}
                    <div className="flex justify-between items-center mt-5 pt-3.5 border-t border-border-subtle/30">
                      
                      <Link 
                        href={`/shared/trade/${trade.id}`}
                        className="text-xs font-semibold text-accent-violet hover:underline flex items-center gap-1"
                      >
                        View Interactive Chart & Log →
                      </Link>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLikeTrade(trade.id)}
                          className={cn(
                            "flex items-center gap-1 text-xs font-medium transition-all",
                            hasLiked ? "text-accent-green" : "text-text-muted hover:text-text-primary"
                          )}
                        >
                          <Heart size={14} className={cn(hasLiked && "fill-accent-green text-accent-green")} />
                          {hasLiked ? trade.likes + 1 : trade.likes}
                        </button>

                        <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors">
                          <MessageSquare size={14} />
                          {trade.comments}
                        </button>
                      </div>

                    </div>

                  </GlassCard>
                );
              })}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
