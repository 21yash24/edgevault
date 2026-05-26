"use client";
import React from 'react';
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Globe, TrendingUp, Newspaper, BarChart2 } from "lucide-react";
import { useTheme } from "next-themes";

import EconomicCalendarWidget from "@/components/tradingview/economic-calendar-widget";
import MarketNewsWidget from "@/components/tradingview/market-news-widget";
import MarketOverviewWidget from "@/components/tradingview/market-overview-widget";
import ScreenerWidget from "@/components/tradingview/screener-widget";

export default function MarketsHubPage() {
  const { resolvedTheme } = useTheme();

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
