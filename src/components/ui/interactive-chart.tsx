"use client";
import React, { useEffect, useRef, useMemo } from "react";
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

  // Generate dynamic candles and marker times once
  const { candles, entryCandleTime, exitCandleTime, intervalMs } = useMemo(
    () => generateTradeCandles(trade),
    [trade]
  );

  useEffect(() => {
    if (!chartContainerRef.current) return;

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
  }, [candles, entryCandleTime, exitCandleTime, intervalMs, trade]);

  return (
    <div className="w-full h-full relative" ref={chartContainerRef}>
      {/* Chart is injected here */}
    </div>
  );
}
