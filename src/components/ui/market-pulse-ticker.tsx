"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores";

// Fallback / Initial simulated market data
const FALLBACK_MARKET_DATA = [
  { symbol: "NQ (Nasdaq)", price: "18,450.25", change: "+1.24%", type: "up" },
  { symbol: "ES (S&P 500)", price: "5,234.50", change: "+0.85%", type: "up" },
  { symbol: "GC (Gold)", price: "2,345.10", change: "-0.42%", type: "down" },
  { symbol: "CL (Crude)", price: "82.40", change: "-1.15%", type: "down" },
  { symbol: "BTC", price: "68,420.00", change: "+4.20%", type: "up" },
];

const FALLBACK_NEWS = [
  { text: "Upcoming: Core CPI Data", time: "in 15m", urgent: true },
  { text: "Fed Chair Powell Speaks", time: "in 2h", urgent: false },
];

export function MarketPulseTicker() {
  const { settings } = useSettingsStore();
  const [marketData, setMarketData] = useState(FALLBACK_MARKET_DATA);
  const [newsEvents, setNewsEvents] = useState(FALLBACK_NEWS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchLivePulse() {
      if (!settings.api.geminiKey) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch("/api/market-pulse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ geminiKey: settings.api.geminiKey })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.marketData && data.newsEvents) {
            setMarketData(data.marketData);
            setNewsEvents(data.newsEvents);
          }
        }
      } catch (err) {
        console.error("Failed to fetch live pulse:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchLivePulse();

    // Refresh every 5 minutes
    const interval = setInterval(fetchLivePulse, 5 * 60 * 1000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [settings.api.geminiKey]);

  // Combine all items into a single ticker stream
  const tickerItems = [
    ...marketData.map((item, i) => (
      <div key={`mkt-${i}`} className="flex items-center gap-2 mx-6 whitespace-nowrap">
        <span className="text-[10px] uppercase font-black tracking-widest text-text-primary">{item.symbol}</span>
        <span className="text-[10px] font-[family-name:var(--font-space-mono)] text-text-muted">{item.price}</span>
        <span className={cn(
          "flex items-center gap-0.5 text-[10px] font-[family-name:var(--font-space-mono)] font-bold px-1.5 py-0.5 rounded",
          item.type === "up" ? "text-accent-green bg-accent-green/10" : "text-accent-coral bg-accent-coral/10"
        )}>
          {item.type === "up" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {item.change}
        </span>
      </div>
    )),
    ...newsEvents.map((news, i) => (
      <div key={`news-${i}`} className="flex items-center gap-2 mx-6 whitespace-nowrap">
        {news.urgent ? (
          <div className="flex items-center gap-1 text-accent-violet">
            <Zap size={10} className="animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{news.text}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-text-secondary">
            <Clock size={10} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{news.text}</span>
          </div>
        )}
        <span className="text-[9px] font-[family-name:var(--font-space-mono)] text-text-muted border border-border-subtle px-1.5 rounded bg-bg-secondary/30">{news.time}</span>
      </div>
    ))
  ];

  return (
    <div className="w-full h-8 bg-bg-card border-b border-border-subtle flex items-center overflow-hidden relative z-50">
      {/* Left Gradient Fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-bg-card to-transparent z-10 pointer-events-none" />
      
      {/* Loading Indicator */}
      {loading && settings.api.geminiKey && (
        <div className="absolute left-4 flex items-center gap-2 z-20">
          <div className="w-3 h-3 rounded-full border-2 border-accent-violet border-t-transparent animate-spin" />
          <span className="text-[9px] uppercase font-bold text-accent-violet tracking-widest">AI Syncing...</span>
        </div>
      )}

      {/* Moving Ticker */}
      <motion.div
        className={cn("flex items-center flex-nowrap", loading && settings.api.geminiKey ? "opacity-30" : "opacity-100")}
        animate={{ x: [0, -1000] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
      >
        {/* Render twice for infinite loop effect */}
        <div className="flex items-center">{tickerItems}</div>
        <div className="flex items-center">{tickerItems}</div>
        <div className="flex items-center">{tickerItems}</div>
      </motion.div>

      {/* Right Gradient Fade */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-bg-card to-transparent z-10 pointer-events-none" />
    </div>
  );
}
