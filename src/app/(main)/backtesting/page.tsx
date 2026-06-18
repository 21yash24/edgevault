"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Play, FastForward, SkipForward, Pause, Square, BarChart2, MousePointer2, Focus, Crosshair, ArrowUp, ArrowDown, ChevronDown, CheckSquare, RefreshCw, Layers } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function BacktestingPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [balance, setBalance] = useState(10000);
  const [openPnL, setOpenPnL] = useState(0);
  const [position, setPosition] = useState<"long" | "short" | null>(null);

  const handleBuy = () => {
    setPosition("long");
    setOpenPnL(-12.50); // Commission/Spread simulation
  };

  const handleSell = () => {
    setPosition("short");
    setOpenPnL(-12.50);
  };

  const handleClose = () => {
    setBalance((prev) => prev + openPnL);
    setPosition(null);
    setOpenPnL(0);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] relative overflow-hidden -mx-4 sm:-mx-8 px-4 sm:px-8 -mt-6 pt-6">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none" />

      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-subtle rounded-xl shadow-sm">
            <span className="font-bold text-text-primary text-sm tracking-widest">NQ1!</span>
            <span className="text-text-muted">|</span>
            <div className="flex items-center gap-1 cursor-pointer hover:text-accent-violet transition-colors">
              <span className="text-xs font-black">5m</span>
              <ChevronDown size={12} />
            </div>
          </div>
          
          <div className="flex items-center bg-bg-card border border-border-subtle rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn("p-1.5 rounded-lg transition-all", isPlaying ? "bg-accent-coral/10 text-accent-coral" : "hover:bg-bg-secondary text-accent-green")}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
            <div className="w-[1px] h-4 bg-border-subtle mx-1" />
            <button className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-secondary transition-all">
              <FastForward size={16} />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-bg-secondary text-text-secondary transition-all">
              <SkipForward size={16} />
            </button>
            <div className="w-[1px] h-4 bg-border-subtle mx-1" />
            <div className="flex gap-1 px-2">
              {[1, 3, 5, 10].map((s) => (
                <button 
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={cn("text-[10px] font-black px-1.5 py-0.5 rounded transition-all", speed === s ? "bg-accent-violet/20 text-accent-violet" : "text-text-muted hover:text-text-primary")}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-subtle hover:border-accent-violet/50 hover:bg-bg-secondary/40 rounded-xl text-sm font-bold transition-all shadow-sm">
            <RefreshCw size={14} className="text-accent-violet" />
            Reset Session
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-accent-violet hover:bg-accent-violet/90 text-white rounded-xl text-sm font-black tracking-wide transition-all shadow-lg hover:shadow-accent-violet/25 hover:-translate-y-0.5">
            <CheckSquare size={16} />
            Save to Journal
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 relative z-10 min-h-0">
        {/* Main Chart Area */}
        <GlassCard className="flex-1 border-border-subtle flex flex-col overflow-hidden relative group">
          {/* Mock Chart Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen" 
               style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.05) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.05) 40px)` }} />
          
          <div className="flex-1 flex items-center justify-center relative">
            {/* Chart Placeholder Image */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg-card/50 pointer-events-none" />
            
            {/* Fake candles */}
            <svg className="w-full h-full opacity-60" preserveAspectRatio="none">
              <path d="M50 200 L50 150 M45 190 L55 190 L55 160 L45 160 Z" fill="#00FFB2" stroke="#00FFB2" strokeWidth="1" />
              <path d="M100 160 L100 100 M95 150 L105 150 L105 110 L95 110 Z" fill="#00FFB2" stroke="#00FFB2" strokeWidth="1" />
              <path d="M150 110 L150 50 M145 100 L155 100 L155 60 L145 60 Z" fill="#00FFB2" stroke="#00FFB2" strokeWidth="1" />
              <path d="M200 60 L200 130 M195 70 L205 70 L205 120 L195 120 Z" fill="#FF2D55" stroke="#FF2D55" strokeWidth="1" />
              <path d="M250 120 L250 180 M245 130 L255 130 L255 170 L245 170 Z" fill="#FF2D55" stroke="#FF2D55" strokeWidth="1" />
              {/* Dynamic Candle if playing */}
              {isPlaying && (
                <path d="M300 170 L300 120 M295 165 L305 165 L305 130 L295 130 Z" fill="#00FFB2" stroke="#00FFB2" strokeWidth="1" className="animate-pulse" />
              )}
            </svg>

            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg-base/40 backdrop-blur-[2px]">
                <button 
                  onClick={() => setIsPlaying(true)}
                  className="flex items-center gap-3 px-8 py-4 bg-accent-violet hover:bg-accent-violet/90 text-white rounded-2xl font-black tracking-widest uppercase transition-all shadow-[0_0_40px_rgba(123,97,255,0.3)] hover:scale-105"
                >
                  <Play size={24} fill="currentColor" /> Start Replay
                </button>
              </div>
            )}
            
            {/* Chart Tools Overlay */}
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              <button className="p-2 bg-bg-card/80 backdrop-blur border border-border-subtle rounded-lg text-text-muted hover:text-text-primary transition-colors"><MousePointer2 size={16} /></button>
              <button className="p-2 bg-bg-card/80 backdrop-blur border border-border-subtle rounded-lg text-text-muted hover:text-text-primary transition-colors"><Crosshair size={16} /></button>
              <button className="p-2 bg-bg-card/80 backdrop-blur border border-border-subtle rounded-lg text-text-muted hover:text-text-primary transition-colors"><BarChart2 size={16} /></button>
            </div>
          </div>
        </GlassCard>

        {/* Right Sidebar - Trading Panel */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
          
          {/* Account Overview */}
          <GlassCard className="border-border-subtle p-5">
            <h3 className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-4">Simulated Account</h3>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Sim Balance</div>
                <div className="font-[family-name:var(--font-space-mono)] font-black text-2xl tracking-tight text-text-primary">{formatCurrency(balance)}</div>
              </div>
              <div className="pt-4 border-t border-border-subtle/50 flex justify-between items-center">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Open P&L</span>
                <span className={cn("font-[family-name:var(--font-space-mono)] font-bold text-lg", position ? (openPnL >= 0 ? "text-accent-green" : "text-accent-coral") : "text-text-muted")}>
                  {position ? formatCurrency(openPnL) : "$0.00"}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Execution Panel */}
          <GlassCard className="border-border-subtle p-5 flex-1 flex flex-col">
            <h3 className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-4">Order Entry</h3>
            
            <div className="space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-2 bg-bg-secondary/30 p-1 rounded-lg">
                <button className="bg-bg-card text-text-primary text-xs font-bold py-1.5 rounded shadow-sm border border-border-subtle">Market</button>
                <button className="text-text-muted hover:text-text-primary text-xs font-bold py-1.5 rounded transition-colors">Limit</button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1 block">Quantity (Contracts)</label>
                  <div className="relative">
                    <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="number" defaultValue={1} className="w-full bg-bg-secondary/50 border border-border-subtle rounded-lg py-2 pl-9 pr-3 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/50" />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-text-muted uppercase font-bold flex items-center gap-1"><input type="checkbox" className="accent-accent-coral" /> Take Profit</label>
                    <input type="number" placeholder="Ticks" className="w-full bg-bg-secondary/50 border border-border-subtle rounded-lg py-1.5 px-2 text-xs font-[family-name:var(--font-space-mono)]" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] text-text-muted uppercase font-bold flex items-center gap-1"><input type="checkbox" className="accent-accent-green" /> Stop Loss</label>
                    <input type="number" placeholder="Ticks" className="w-full bg-bg-secondary/50 border border-border-subtle rounded-lg py-1.5 px-2 text-xs font-[family-name:var(--font-space-mono)]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              {!position ? (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleBuy} className="bg-accent-green/10 border border-accent-green/20 hover:bg-accent-green/20 text-accent-green font-black py-4 rounded-xl transition-all flex flex-col items-center justify-center gap-1">
                    <span className="text-sm uppercase tracking-wider">Buy Mkt</span>
                    <span className="text-[10px] font-bold opacity-70 font-[family-name:var(--font-space-mono)]">18,450.25</span>
                  </button>
                  <button onClick={handleSell} className="bg-accent-coral/10 border border-accent-coral/20 hover:bg-accent-coral/20 text-accent-coral font-black py-4 rounded-xl transition-all flex flex-col items-center justify-center gap-1">
                    <span className="text-sm uppercase tracking-wider">Sell Mkt</span>
                    <span className="text-[10px] font-bold opacity-70 font-[family-name:var(--font-space-mono)]">18,449.75</span>
                  </button>
                </div>
              ) : (
                <button onClick={handleClose} className="w-full bg-bg-secondary hover:bg-bg-secondary/80 border border-border-subtle text-text-primary font-black py-4 rounded-xl transition-all uppercase tracking-widest text-sm shadow-sm flex items-center justify-center gap-2">
                  <Square size={16} className={openPnL >= 0 ? "text-accent-green" : "text-accent-coral"} />
                  Close {position}
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
