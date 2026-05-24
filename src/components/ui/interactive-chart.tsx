"use client";
import React, { useEffect, useRef, useMemo, useState } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries, createSeriesMarkers } from "lightweight-charts";
import { Trade } from "@/lib/types";

// Helper to generate realistic-looking candles dynamically scaled based on trade duration
function generateTradeCandles(trade: Trade) {
  const entryTime = isNaN(new Date(trade.entryDate).getTime()) ? Date.now() : new Date(trade.entryDate).getTime();
  const exitTime = isNaN(new Date(trade.exitDate).getTime()) ? (entryTime + 60000) : new Date(trade.exitDate).getTime();
  const duration = Math.max(exitTime - entryTime, 1000); // minimum 1s duration

  // Select dynamic interval and padding based on trade duration
  let intervalMs = 60 * 1000;      // default: 1 minute
  let paddingMs = 30 * 60 * 1000;  // default: 30 minutes

  if (duration < 5 * 60 * 1000) {
    // Under 5 minutes: use 5-second candles, 5 minutes padding
    intervalMs = 5 * 1000;
    paddingMs = 5 * 60 * 1000;
  } else if (duration < 20 * 60 * 1000) {
    // Under 20 minutes: use 15-second candles, 15 minutes padding
    intervalMs = 15 * 1000;
    paddingMs = 15 * 60 * 1000;
  } else if (duration < 2 * 60 * 60 * 1000) {
    // Under 2 hours: use 1-minute candles, 30 minutes padding
    intervalMs = 60 * 1000;
    paddingMs = 30 * 60 * 1000;
  } else if (duration < 12 * 60 * 60 * 1000) {
    // Under 12 hours: use 5-minute candles, 2 hours padding
    intervalMs = 5 * 60 * 1000;
    paddingMs = 2 * 60 * 60 * 1000;
  } else if (duration < 48 * 60 * 60 * 1000) {
    // Under 2 days: use 15-minute candles, 6 hours padding
    intervalMs = 15 * 60 * 1000;
    paddingMs = 6 * 60 * 60 * 1000;
  } else {
    // 2 days or more: use 1-hour candles, 24 hours padding
    intervalMs = 60 * 60 * 1000;
    paddingMs = 24 * 60 * 60 * 1000;
  }

  // startTime must be aligned with intervalMs
  const startTime = entryTime - paddingMs;
  const endTime = exitTime + paddingMs;

  const candles: any[] = [];
  let currentPrice = trade.entryPrice ? trade.entryPrice * 0.998 : 100;
  
  // Scale volatility based on candle interval (square root of time rule)
  const timeFactor = Math.sqrt(intervalMs / (60 * 1000));
  const candleVolatility = (trade.entryPrice ? trade.entryPrice * 0.0005 : 0.5) * timeFactor;
  const totalSteps = (exitTime - entryTime) / intervalMs;

  for (let t = startTime; t <= endTime; t += intervalMs) {
    const isEntry = Math.abs(t - entryTime) < intervalMs / 2;
    const isExit = Math.abs(t - exitTime) < intervalMs / 2;

    // Force the price to hit entry and exit precisely at the right time
    if (isEntry && trade.entryPrice) {
      currentPrice = trade.entryPrice;
    } else if (isExit && trade.exitPrice) {
      currentPrice = trade.exitPrice;
    } else {
      // Random walk with a slight drift towards exit if we are in the trade
      const drift = (t >= entryTime && t <= exitTime)
        ? ((trade.exitPrice || currentPrice) - (trade.entryPrice || currentPrice)) / (totalSteps || 1)
        : 0;
      currentPrice += drift + (Math.random() - 0.5) * candleVolatility;
    }

    const open = currentPrice;
    const close = currentPrice + (Math.random() - 0.5) * candleVolatility;
    const high = Math.max(open, close) + Math.random() * candleVolatility * 0.4;
    const low = Math.min(open, close) - Math.random() * candleVolatility * 0.4;

    candles.push({
      time: Math.floor(t / 1000), // UNIX timestamp in seconds
      open,
      high,
      low,
      close
    });

    currentPrice = close;
  }

  // Snap markers to exact candle timestamps so they display properly
  const entryCandleIndex = Math.round((entryTime - startTime) / intervalMs);
  let exitCandleIndex = Math.round((exitTime - startTime) / intervalMs);

  // Guarantee exit is at least 1 candle after entry
  if (exitCandleIndex <= entryCandleIndex) {
    exitCandleIndex = entryCandleIndex + 1;
  }

  // Keep within boundaries of the candles array
  const finalEntryIndex = Math.max(0, Math.min(entryCandleIndex, candles.length - 1));
  const finalExitIndex = Math.max(0, Math.min(exitCandleIndex, candles.length - 1));

  const entryCandleTime = candles[finalEntryIndex].time;
  const exitCandleTime = candles[finalExitIndex].time;

  return {
    candles,
    entryCandleTime,
    exitCandleTime,
    intervalMs
  };
}

export function InteractiveChart({ trade }: { trade: Trade }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [chartState, setChartState] = useState<{
    candles: any[];
    entryCandleTime: number;
    exitCandleTime: number;
    intervalMs: number;
    isReal: boolean;
    isLoading: boolean;
  }>({
    candles: [],
    entryCandleTime: 0,
    exitCandleTime: 0,
    intervalMs: 60000,
    isReal: false,
    isLoading: true,
  });

  // Fetch real market data or fall back to simulated candles
  useEffect(() => {
    let active = true;
    setChartState((s) => ({ ...s, isLoading: true }));

    async function loadData() {
      try {
        const queryParams = new URLSearchParams({
          symbol: trade.symbol,
          entryDate: trade.entryDate,
          exitDate: trade.exitDate,
        });
        const res = await fetch(`/api/market-data?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error(`API returned status ${res.status}`);
        }
        const data = await res.json();
        if (!data.candles || data.candles.length === 0) {
          throw new Error("Empty candles list returned");
        }

        const realCandles = data.candles;
        const entryTimeSec = Math.floor(new Date(trade.entryDate).getTime() / 1000);
        const exitTimeSec = Math.floor(new Date(trade.exitDate).getTime() / 1000);

        let entryIdx = 0;
        let exitIdx = 0;
        let minEntryDiff = Infinity;
        let minExitDiff = Infinity;

        for (let i = 0; i < realCandles.length; i++) {
          const cTime = realCandles[i].time;
          const entryDiff = Math.abs(cTime - entryTimeSec);
          const exitDiff = Math.abs(cTime - exitTimeSec);

          if (entryDiff < minEntryDiff) {
            minEntryDiff = entryDiff;
            entryIdx = i;
          }
          if (exitDiff < minExitDiff) {
            minExitDiff = exitDiff;
            exitIdx = i;
          }
        }

        if (exitIdx <= entryIdx) {
          exitIdx = Math.min(entryIdx + 1, realCandles.length - 1);
        }

        const entryCandleTime = realCandles[entryIdx].time;
        const exitCandleTime = realCandles[exitIdx].time;

        // intervalMs estimation for showing/hiding seconds
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
            entryCandleTime,
            exitCandleTime,
            intervalMs,
            isReal: true,
            isLoading: false,
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch real market data for ${trade.symbol}, falling back to simulated candles:`, err);
        // Fallback to simulated candles
        const sim = generateTradeCandles(trade);
        if (active) {
          setChartState({
            candles: sim.candles,
            entryCandleTime: sim.entryCandleTime,
            exitCandleTime: sim.exitCandleTime,
            intervalMs: sim.intervalMs,
            isReal: false,
            isLoading: false,
          });
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [trade]);

  const { candles, entryCandleTime, exitCandleTime, intervalMs, isReal, isLoading } = chartState;

  useEffect(() => {
    if (isLoading || candles.length === 0 || !chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8B8FA3",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: intervalMs < 60000, // show seconds for sub-minute candlestick durations
      },
      autoSize: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00FFB2",
      downColor: "#FF2D55",
      borderVisible: false,
      wickUpColor: "#00FFB2",
      wickDownColor: "#FF2D55",
    });

    candlestickSeries.setData(candles);

    // Add Markers for Entry and Exit using snapped timestamps
    const markers: any[] = [];
    
    if (trade.entryPrice) {
      markers.push({
        time: entryCandleTime,
        position: trade.direction === "long" ? "belowBar" : "aboveBar",
        color: trade.direction === "long" ? "#00FFB2" : "#FF2D55",
        shape: trade.direction === "long" ? "arrowUp" : "arrowDown",
        text: "ENTRY",
      });
    }

    if (trade.exitPrice) {
      markers.push({
        time: exitCandleTime,
        position: trade.direction === "long" ? "aboveBar" : "belowBar",
        color: trade.netPnl >= 0 ? "#00FFB2" : "#FF2D55",
        shape: trade.direction === "long" ? "arrowDown" : "arrowUp",
        text: "EXIT",
      });
    }

    // Must sort markers by time as per lightweight-charts requirements
    markers.sort((a, b) => a.time - b.time);
    createSeriesMarkers(candlestickSeries, markers);

    // Add Stop Loss Line if exists
    if (trade.stopLoss) {
      candlestickSeries.createPriceLine({
        price: trade.stopLoss,
        color: "rgba(255, 45, 85, 0.5)",
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: "SL",
      });
    }

    // Add Take Profit Line if exists
    if (trade.takeProfit) {
      candlestickSeries.createPriceLine({
        price: trade.takeProfit,
        color: "rgba(0, 255, 178, 0.5)",
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: "TP",
      });
    }

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [candles, entryCandleTime, exitCandleTime, intervalMs, isLoading, trade]);

  return (
    <div className="w-full h-full relative" ref={chartContainerRef}>
      {isLoading && (
        <div className="absolute inset-0 bg-[#0B0F19]/65 backdrop-blur-md flex flex-col items-center justify-center rounded-xl z-20 border border-white/5 animate-fade-in">
          <div className="w-8 h-8 rounded-full border-2 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent animate-spin mb-3"></div>
          <p className="text-xs text-text-muted font-medium tracking-wide">Syncing real market history for {trade.symbol}...</p>
        </div>
      )}
      {!isLoading && (
        <div className={`absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-md transition-all duration-300 ${
          isReal 
            ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400" 
            : "bg-white/5 border border-white/10 text-text-muted"
        }`}>
          {isReal && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>}
          {isReal ? "Real Market Data" : "Simulated Replay"}
        </div>
      )}
    </div>
  );
}
