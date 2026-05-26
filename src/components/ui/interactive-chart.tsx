"use client";
import React, { useEffect, useRef, useMemo, useState, memo } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries, createSeriesMarkers } from "lightweight-charts";
import { Trade } from "@/lib/types";
import { useTheme } from "next-themes";


// Lightweight-charts powered real-data chart
function RealDataChart({ candles, entryCandleTime, exitCandleTime, intervalMs, trade }: {
  candles: any[];
  entryCandleTime: number;
  exitCandleTime: number;
  intervalMs: number;
  trade: Trade;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  const [isReplaying, setIsReplaying] = useState(true);
  const [replayIndex, setReplayIndex] = useState(() => {
    const idx = candles.findIndex((c) => c.time >= entryCandleTime);
    // Start replay slightly before the entry point for context
    return Math.max(0, idx - 10);
  });

  const seriesRef = useRef<any>(null);

  // 1. Initialize chart and base data
  useEffect(() => {
    if (candles.length === 0 || !chartContainerRef.current) return;
    const isDark = resolvedTheme !== "light";

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: isDark ? "#8B8FA3" : "#555770" },
      grid: { vertLines: { color: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)" }, horzLines: { color: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" },
      timeScale: { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", timeVisible: true, secondsVisible: intervalMs < 60000 },
      autoSize: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00FFB2", downColor: "#FF2D55", borderVisible: false, wickUpColor: "#00FFB2", wickDownColor: "#FF2D55",
    });
    seriesRef.current = candlestickSeries;

    // Load initial context (before entry)
    const initialData = candles.slice(0, replayIndex + 1);
    candlestickSeries.setData(initialData);

    if (trade.stopLoss) candlestickSeries.createPriceLine({ price: trade.stopLoss, color: "rgba(255,45,85,0.6)", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "SL" });
    if (trade.takeProfit) candlestickSeries.createPriceLine({ price: trade.takeProfit, color: "rgba(0,255,178,0.6)", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "TP" });

    chart.timeScale().fitContent();

    return () => { chart.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, intervalMs, trade, resolvedTheme]);

  // 2. Handle Replay Animation
  useEffect(() => {
    if (!isReplaying || !seriesRef.current || replayIndex >= candles.length - 1) {
      if (replayIndex >= candles.length - 1) setIsReplaying(false);
      return;
    }

    const timer = setInterval(() => {
      setReplayIndex(prev => {
        const next = prev + 1;
        if (next >= candles.length) {
          clearInterval(timer);
          return prev;
        }

        const currentCandle = candles[next];
        seriesRef.current.update(currentCandle);

        // Update markers if entry/exit has been reached
        const markers: any[] = [];
        if (trade.entryPrice && currentCandle.time >= entryCandleTime) {
          markers.push({ time: entryCandleTime, position: trade.direction === "long" ? "belowBar" : "aboveBar", color: trade.direction === "long" ? "#00FFB2" : "#FF2D55", shape: trade.direction === "long" ? "arrowUp" : "arrowDown", text: `ENTRY ${trade.entryPrice.toLocaleString()}` });
        }
        if (trade.exitPrice && currentCandle.time >= exitCandleTime) {
          markers.push({ time: exitCandleTime, position: trade.direction === "long" ? "aboveBar" : "belowBar", color: trade.netPnl >= 0 ? "#00FFB2" : "#FF2D55", shape: trade.direction === "long" ? "arrowDown" : "arrowUp", text: `EXIT ${trade.exitPrice.toLocaleString()}` });
        }
        
        if (markers.length > 0) {
          markers.sort((a, b) => a.time - b.time);
          createSeriesMarkers(seriesRef.current, markers);
        }

        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isReplaying, replayIndex, candles, entryCandleTime, exitCandleTime, trade]);

  const isFinished = replayIndex >= candles.length - 1;

  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full" ref={chartContainerRef} />
      
      {/* Replay Controls Overlay */}
      <div className="absolute bottom-6 right-6 z-10 flex gap-2">
        <button 
          onClick={() => setIsReplaying(!isReplaying)}
          className="bg-bg-card/90 backdrop-blur-md border border-border-subtle text-text-primary px-4 py-2 rounded-xl text-xs font-bold hover:border-accent-green hover:shadow-[0_0_15px_rgba(0,255,178,0.2)] transition-all flex items-center gap-2"
        >
          {isFinished ? "Replay Finished" : isReplaying ? (
            <><div className="w-2 h-2 rounded-sm bg-accent-coral" /> Pause</>
          ) : (
            <><div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-accent-green border-b-[4px] border-b-transparent" /> Play</>
          )}
        </button>
        {isFinished && (
          <button 
            onClick={() => {
              const idx = candles.findIndex((c) => c.time >= entryCandleTime);
              setReplayIndex(Math.max(0, idx - 10));
              setIsReplaying(true);
            }}
            className="bg-bg-card/90 backdrop-blur-md border border-border-subtle text-text-primary px-4 py-2 rounded-xl text-xs font-bold hover:border-accent-blue hover:shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all"
          >
            Restart
          </button>
        )}
      </div>
    </div>
  );
}

export function InteractiveChart({ trade }: { trade: Trade }) {
  const [chartState, setChartState] = useState<{
    candles: any[];
    entryCandleTime: number;
    exitCandleTime: number;
    intervalMs: number;
    isReal: boolean;
    isLoading: boolean;
    useTradingView: boolean;
  }>({
    candles: [],
    entryCandleTime: 0,
    exitCandleTime: 0,
    intervalMs: 60000,
    isReal: false,
    isLoading: true,
    useTradingView: false,
  });

  useEffect(() => {
    let active = true;
    setChartState(s => ({ ...s, isLoading: true, useTradingView: false }));

    async function loadData() {
      try {
        const queryParams = new URLSearchParams({
          symbol: trade.symbol,
          entryDate: trade.entryDate,
          exitDate: trade.exitDate,
        });
        const res = await fetch(`/api/market-data?${queryParams.toString()}`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.candles || data.candles.length === 0) throw new Error("Empty candles");

        const realCandles = data.candles;
        const entryTimeSec = Math.floor(new Date(trade.entryDate).getTime() / 1000);
        const exitTimeSec = Math.floor(new Date(trade.exitDate).getTime() / 1000);

        let entryIdx = 0, exitIdx = 0;
        let minEntryDiff = Infinity, minExitDiff = Infinity;
        for (let i = 0; i < realCandles.length; i++) {
          const cTime = realCandles[i].time;
          const ed = Math.abs(cTime - entryTimeSec), xd = Math.abs(cTime - exitTimeSec);
          if (ed < minEntryDiff) { minEntryDiff = ed; entryIdx = i; }
          if (xd < minExitDiff) { minExitDiff = xd; exitIdx = i; }
        }
        if (exitIdx <= entryIdx) exitIdx = Math.min(entryIdx + 1, realCandles.length - 1);

        let intervalMs = 60000;
        if (data.interval === "1m") intervalMs = 60 * 1000;
        else if (data.interval === "2m") intervalMs = 2 * 60 * 1000;
        else if (data.interval === "5m") intervalMs = 5 * 60 * 1000;
        else if (data.interval === "15m") intervalMs = 15 * 60 * 1000;
        else if (data.interval === "30m") intervalMs = 30 * 60 * 1000;
        else if (data.interval === "60m") intervalMs = 60 * 60 * 1000;
        else if (data.interval === "1d") intervalMs = 24 * 60 * 60 * 1000;

        if (active) {
          setChartState({
            candles: realCandles,
            entryCandleTime: realCandles[entryIdx].time,
            exitCandleTime: realCandles[exitIdx].time,
            intervalMs,
            isReal: true,
            isLoading: false,
            useTradingView: false,
          });
        }
      } catch (err) {
        console.warn(`Could not fetch real data for ${trade.symbol}, generating simulated replay:`, err);
        
        const entryTimeSec = Math.floor(new Date(trade.entryDate).getTime() / 1000);
        const exitTimeSec = trade.exitDate ? Math.floor(new Date(trade.exitDate).getTime() / 1000) : entryTimeSec + 3600;
        
        const entryPrice = trade.entryPrice || 100;
        const exitPrice = trade.exitPrice || entryPrice;
        
        // Generate about 60 candles total for smooth playback
        // 10 pre, 40 exec, 10 post
        const execDuration = Math.max(60, exitTimeSec - entryTimeSec);
        const intervalSec = Math.max(1, Math.floor(execDuration / 40));
        
        const generatedCandles = [];
        let currentPrice = entryPrice - (entryPrice * 0.002 * (trade.direction === 'long' ? 1 : -1));
        
        // Let's use a single running time counter to guarantee strict monotonic time
        let currentTimeSec = entryTimeSec - (10 * intervalSec);
        
        // 10 pre-entry context candles
        for (let i = 0; i < 10; i++) {
          const open = currentPrice;
          const close = open + (Math.random() - 0.5) * (entryPrice * 0.001);
          const high = Math.max(open, close) + Math.random() * (entryPrice * 0.0005);
          const low = Math.min(open, close) - Math.random() * (entryPrice * 0.0005);
          generatedCandles.push({ time: currentTimeSec, open, high, low, close });
          currentPrice = close;
          currentTimeSec += intervalSec;
        }
        
        // Ensure execution starts EXACTLY at entry time
        currentTimeSec = entryTimeSec;
        
        // Execution path candles
        const execCandles = 40;
        const priceStep = (exitPrice - entryPrice) / execCandles;
        for (let i = 0; i <= execCandles; i++) {
          const open = currentPrice;
          let close = open + priceStep + (Math.random() - 0.5) * (entryPrice * 0.001);
          if (i === 0) close = entryPrice; // Force exact entry
          if (i === execCandles) close = exitPrice; // Force exact exit
          const high = Math.max(open, close) + Math.random() * (entryPrice * 0.0005);
          const low = Math.min(open, close) - Math.random() * (entryPrice * 0.0005);
          generatedCandles.push({ time: currentTimeSec, open, high, low, close });
          currentPrice = close;
          currentTimeSec += intervalSec;
        }
        
        // Ensure post-exit starts strictly after exit time
        currentTimeSec = Math.max(currentTimeSec, exitTimeSec + intervalSec);
        
        // 10 post-exit context candles
        for (let i = 1; i <= 10; i++) {
          const open = currentPrice;
          const close = open + (Math.random() - 0.5) * (entryPrice * 0.001);
          const high = Math.max(open, close) + Math.random() * (entryPrice * 0.0005);
          const low = Math.min(open, close) - Math.random() * (entryPrice * 0.0005);
          generatedCandles.push({ time: currentTimeSec, open, high, low, close });
          currentPrice = close;
          currentTimeSec += intervalSec;
        }

        if (active) {
          setChartState({
            candles: generatedCandles,
            entryCandleTime: entryTimeSec,
            exitCandleTime: currentTimeSec - (10 * intervalSec), // the exact exit time
            intervalMs: intervalSec * 1000,
            isReal: false,
            isLoading: false,
            useTradingView: false,
          });
        }
      }
    }

    loadData();
    return () => { active = false; };
  }, [trade]);

  const { candles, entryCandleTime, exitCandleTime, intervalMs, isReal, isLoading, useTradingView } = chartState;

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-accent-green border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Fetching real market data for {trade.symbol}...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group">
      <RealDataChart
        candles={candles}
        entryCandleTime={entryCandleTime}
        exitCandleTime={exitCandleTime}
        intervalMs={intervalMs}
        trade={trade}
      />
      {isReal ? (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Real Market Data
        </div>
      ) : (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-md bg-accent-violet/10 border border-accent-violet/25 text-accent-violet shadow-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-violet animate-pulse" />
          Simulated Execution Replay
        </div>
      )}
    </div>
  );
}
