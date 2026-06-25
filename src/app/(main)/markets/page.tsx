"use client";
import React from 'react';
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Globe, TrendingUp, Newspaper, BarChart2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useTradeStore } from "@/stores";
import { formatCurrency } from "@/lib/utils";

import EconomicCalendarWidget from "@/components/tradingview/economic-calendar-widget";
import MarketNewsWidget from "@/components/tradingview/market-news-widget";
import MarketOverviewWidget from "@/components/tradingview/market-overview-widget";
import ScreenerWidget from "@/components/tradingview/screener-widget";

export default function MarketsHubPage() {
  const { resolvedTheme } = useTheme();
  const trades = useTradeStore((s) => s.trades);

  const topSymbols = React.useMemo(() => {
    const map: Record<string, { count: number; wins: number; pnl: number }> = {};
    trades.forEach((t) => {
      const sym = t.symbol || "UNKNOWN";
      if (!map[sym]) map[sym] = { count: 0, wins: 0, pnl: 0 };
      map[sym].count++;
      map[sym].pnl += t.netPnl;
      if (t.result === "win") map[sym].wins++;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1].count - a[1].count).slice(0, 4);
    if (sorted.length > 0) return sorted.map(([s, d]) => ({ symbol: s, ...d }));
    return [
      { symbol: "NQ", count: 0, wins: 0, pnl: 0 },
      { symbol: "ES", count: 0, wins: 0, pnl: 0 },
      { symbol: "BTCUSD", count: 0, wins: 0, pnl: 0 },
      { symbol: "XAUUSD", count: 0, wins: 0, pnl: 0 },
    ];
  }, [trades]);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar relative min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
                <Globe className="text-accent-blue" size={20} />
              </div>
              <h1 className="text-3xl font-bold text-text-primary tracking-tight font-[family-name:var(--font-inter)]">
                Markets Hub
              </h1>
            </div>
            <p className="text-text-secondary text-sm max-w-xl">
              Real-time global market data, economic events, and financial news to power your trading edge.
            </p>
          </div>
        </div>

        {/* My Markets: Top Traded Symbols */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-accent-green" /> My Markets (Top Traded)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topSymbols.map((item) => (
              <GlassCard key={item.symbol} className="p-4 border-border-subtle flex flex-col justify-between hover:border-accent-blue/40 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-base text-text-primary">{item.symbol}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-bg-secondary text-text-muted">
                    {item.count > 0 ? `${item.count} Trades` : "Watchlist"}
                  </span>
                </div>
                {item.count > 0 ? (
                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <span className="text-[10px] text-text-muted block">Win Rate</span>
                      <span className="text-sm font-bold text-text-primary">{Math.round((item.wins / item.count) * 100)}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted block">Net P&L</span>
                      <span className={`text-sm font-mono font-bold ${item.pnl >= 0 ? "text-accent-green" : "text-accent-coral"}`}>
                        {formatCurrency(item.pnl)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-text-muted mt-2">Log trades to see stats</div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Top Section: Overview & News */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 flex flex-col h-[500px] p-0 overflow-hidden">
            <div className="p-4 border-b border-border-subtle/50 flex items-center gap-2">
              <TrendingUp size={18} className="text-accent-green" />
              <h2 className="font-semibold text-text-primary">Global Market Overview</h2>
            </div>
            <div className="flex-1 w-full relative">
              <MarketOverviewWidget key={resolvedTheme} />
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col h-[500px] p-0 overflow-hidden">
            <div className="p-4 border-b border-border-subtle/50 flex items-center gap-2">
              <Newspaper size={18} className="text-accent-purple" />
              <h2 className="font-semibold text-text-primary">Top Market News</h2>
            </div>
            <div className="flex-1 w-full relative">
              <MarketNewsWidget key={resolvedTheme} />
            </div>
          </GlassCard>
        </div>

        {/* Middle Section: Technical Screener */}
        <div className="grid grid-cols-1 gap-6">
          <GlassCard className="flex flex-col h-[600px] p-0 overflow-hidden">
            <div className="p-4 border-b border-border-subtle/50 flex items-center gap-2">
              <BarChart2 size={18} className="text-accent-orange" />
              <h2 className="font-semibold text-text-primary">Market Screener</h2>
            </div>
            <div className="flex-1 w-full relative">
              <ScreenerWidget key={resolvedTheme} />
            </div>
          </GlassCard>
        </div>

        {/* Bottom Section: Economic Calendar */}
        <div className="grid grid-cols-1 gap-6">
          <GlassCard className="flex flex-col h-[600px] p-0 overflow-hidden">
            <div className="p-4 border-b border-border-subtle/50 flex items-center gap-2">
              <Globe size={18} className="text-accent-blue" />
              <h2 className="font-semibold text-text-primary">Global Economic Calendar</h2>
            </div>
            <div className="flex-1 w-full relative">
              <EconomicCalendarWidget key={resolvedTheme} />
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
