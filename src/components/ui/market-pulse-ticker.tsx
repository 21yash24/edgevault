"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Simulated market data for the ticker
const MARKET_DATA = [
  { symbol: "NQ (Nasdaq)", price: "18,450.25", change: "+1.24%", type: "up" },
  { symbol: "ES (S&P 500)", price: "5,234.50", change: "+0.85%", type: "up" },
  { symbol: "GC (Gold)", price: "2,345.10", change: "-0.42%", type: "down" },
  { symbol: "CL (Crude)", price: "82.40", change: "-1.15%", type: "down" },
  { symbol: "BTC", price: "68,420.00", change: "+4.20%", type: "up" },
];

const NEWS_EVENTS = [
  { text: "Upcoming: Core CPI Data", time: "in 15m", urgent: true },
  { text: "Fed Chair Powell Speaks", time: "in 2h", urgent: false },
  { text: "High Volatility Expected: NFP Tomorrow", time: "1 day", urgent: false },
];

export function MarketPulseTicker() {
  // Combine all items into a single ticker stream
  const tickerItems = [
    ...MARKET_DATA.map((item, i) => (
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
    ...NEWS_EVENTS.map((news, i) => (
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
      
      {/* Moving Ticker */}
      <motion.div
        className="flex items-center flex-nowrap"
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
