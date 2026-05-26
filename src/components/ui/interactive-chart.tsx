"use client";
import React, { useEffect, useRef, useMemo, useState, memo } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries, createSeriesMarkers } from "lightweight-charts";
import { Trade } from "@/lib/types";
import { useTheme } from "next-themes";

// TradingView mini chart widget as fallback when real data isn't available
function TradingViewFallback({ symbol, trade }: { symbol: string; trade: Trade }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // Map common symbols to TradingView format
    const tvSymbol = (s: string) => {
      const upper = s.toUpperCase();
      if (upper === "NQ" || upper.startsWith("NQ")) return "CME_MINI:NQ1!";
      if (upper === "ES" || upper.startsWith("ES")) return "CME_MINI:ES1!";
      if (upper === "YM" || upper.startsWith("YM")) return "CBOT_MINI:YM1!";
      if (upper === "MNQ" || upper.startsWith("MNQ")) return "CME_MINI:MNQ1!";
      if (upper === "MES" || upper.startsWith("MES")) return "CME_MINI:MES1!";
      if (upper === "RTY" || upper.startsWith("RTY")) return "CME_MINI:RTY1!";
      if (upper === "CL" || upper.startsWith("CL")) return "NYMEX:CL1!";
      if (upper === "GC" || upper.startsWith("GC")) return "COMEX:GC1!";
      if (upper === "BTCUSD" || upper === "BTC") return "BINANCE:BTCUSDT";
      if (upper === "ETHUSD" || upper === "ETH") return "BINANCE:ETHUSDT";
      if (upper === "EURUSD") return "FX:EURUSD";
      if (upper === "GBPUSD") return "FX:GBPUSD";
      return `NASDAQ:${upper}`;
    };

    const theme = resolvedTheme === "light" ? "light" : "dark";
    const entryDate = trade.entryDate ? new Date(trade.entryDate) : null;

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol(symbol),
      interval: "5",
      timezone: "Etc/UTC",
      theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_legend: false,
      hide_top_toolbar: false,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: true,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);
  }, [symbol, resolvedTheme, trade]);

  return (
    <div className="w-full h-full relative flex flex-col">
      <div ref={containerRef} className="tradingview-widget-container w-full flex-1" style={{ height: "calc(100% - 40px)" }}>
        <div className="tradingview-widget-container__widget w-full h-full" />
      </div>
      <div className="h-10 flex items-center px-4 gap-2 bg-bg-base/50 border-t border-border-subtle/50 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-accent-violet animate-pulse" />
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">TradingView Live Chart</span>
        {trade.entryPrice && (
          <span className="ml-auto text-[10px] font-[family-name:var(--font-space-mono)] text-text-muted">
            Entry: {trade.entryPrice.toLocaleString()} → Exit: {trade.exitPrice?.toLocaleString() ?? "—"}
          </span>
        )}
      </div>
    </div>
  );
}

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
        console.warn(`Could not fetch real data for ${trade.symbol}, using TradingView widget fallback:`, err);
        // Instead of ugly simulated candles, use a TradingView widget!
        if (active) {
          setChartState({
            candles: [],
            entryCandleTime: 0,
            exitCandleTime: 0,
            intervalMs: 60000,
            isReal: false,
            isLoading: false,
            useTradingView: true,
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

  if (useTradingView) {
    return <TradingViewFallback symbol={trade.symbol} trade={trade} />;
  }

  return (
    <div className="w-full h-full relative">
      <RealDataChart
        candles={candles}
        entryCandleTime={entryCandleTime}
        exitCandleTime={exitCandleTime}
        intervalMs={intervalMs}
        trade={trade}
      />
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Real Market Data
      </div>
    </div>
  );
}
