"use client";
import React, { useEffect, useRef, useMemo } from "react";
import { createChart, ColorType, CrosshairMode } from "lightweight-charts";
import { Trade } from "@/lib/types";

// Helper to generate realistic-looking 1-minute candles around the trade
function generateTradeCandles(trade: Trade) {
  const candles: any[] = [];
  const entryTime = new Date(trade.entryDate).getTime();
  const exitTime = new Date(trade.exitDate).getTime();
  
  // Pad the chart with 30 mins before and 30 mins after
  const startTime = entryTime - 30 * 60 * 1000;
  const endTime = exitTime + 30 * 60 * 1000;
  
  let currentPrice = trade.entryPrice ? trade.entryPrice * 0.998 : 100; // Start slightly below/above
  
  for (let t = startTime; t <= endTime; t += 60 * 1000) {
    const isEntry = t >= entryTime && t < entryTime + 60000;
    const isExit = t >= exitTime && t < exitTime + 60000;
    
    // Force the price to hit entry and exit precisely at the right time
    if (isEntry && trade.entryPrice) {
      currentPrice = trade.entryPrice;
    } else if (isExit && trade.exitPrice) {
      currentPrice = trade.exitPrice;
    } else {
      // Random walk with a slight drift towards exit if we are in the trade
      const drift = (t >= entryTime && t <= exitTime) 
        ? ((trade.exitPrice || currentPrice) - (trade.entryPrice || currentPrice)) / ((exitTime - entryTime) / 60000 || 1)
        : 0;
      const volatility = trade.entryPrice ? trade.entryPrice * 0.0005 : 0.5; // 0.05% volatility
      currentPrice += drift + (Math.random() - 0.5) * volatility;
    }

    const open = currentPrice;
    const close = currentPrice + (Math.random() - 0.5) * (trade.entryPrice ? trade.entryPrice * 0.0005 : 0.5);
    const high = Math.max(open, close) + Math.random() * (trade.entryPrice ? trade.entryPrice * 0.0002 : 0.2);
    const low = Math.min(open, close) - Math.random() * (trade.entryPrice ? trade.entryPrice * 0.0002 : 0.2);

    candles.push({
      time: Math.floor(t / 1000), // lightweight-charts expects UNIX timestamp in seconds
      open,
      high,
      low,
      close
    });
    
    currentPrice = close;
  }
  
  return candles;
}

export function InteractiveChart({ trade }: { trade: Trade }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Generate data once
  const data = useMemo(() => generateTradeCandles(trade), [trade]);

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
        secondsVisible: false,
      },
      autoSize: true,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#00FFB2",
      downColor: "#FF2D55",
      borderVisible: false,
      wickUpColor: "#00FFB2",
      wickDownColor: "#FF2D55",
    });

    candlestickSeries.setData(data);

    // Add Markers for Entry and Exit
    const markers: any[] = [];
    
    if (trade.entryPrice) {
      markers.push({
        time: Math.floor(new Date(trade.entryDate).getTime() / 1000),
        position: trade.direction === "long" ? "belowBar" : "aboveBar",
        color: trade.direction === "long" ? "#00FFB2" : "#FF2D55",
        shape: trade.direction === "long" ? "arrowUp" : "arrowDown",
        text: "ENTRY",
      });
    }

    if (trade.exitPrice) {
      markers.push({
        time: Math.floor(new Date(trade.exitDate).getTime() / 1000),
        position: trade.direction === "long" ? "aboveBar" : "belowBar",
        color: trade.netPnl >= 0 ? "#00FFB2" : "#FF2D55",
        shape: trade.direction === "long" ? "arrowDown" : "arrowUp",
        text: "EXIT",
      });
    }

    // Must sort markers by time as per lightweight-charts requirements
    markers.sort((a, b) => a.time - b.time);
    candlestickSeries.setMarkers(markers);

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
  }, [data, trade]);

  return (
    <div className="w-full h-full relative" ref={chartContainerRef}>
      {/* Chart is injected here */}
    </div>
  );
}
