import { NextRequest, NextResponse } from "next/server";
import yahooFinance from 'yahoo-finance2';

function cleanSymbolForYahoo(symbol: string): string {
  const upper = symbol.toUpperCase().trim();
  
  // Futures contract mapping (e.g. MNQM6 -> MNQ=F, NQH24 -> NQ=F)
  if (upper.startsWith("MNQ")) return "MNQ=F";
  if (upper.startsWith("MES")) return "MES=F";
  if (upper.startsWith("NQ")) return "NQ=F";
  if (upper.startsWith("ES")) return "ES=F";
  if (upper.startsWith("YM")) return "YM=F";
  if (upper.startsWith("RTY")) return "RTY=F";
  if (upper.startsWith("CL")) return "CL=F";
  if (upper.startsWith("GC")) return "GC=F";
  if (upper.startsWith("SI")) return "SI=F";
  if (upper.startsWith("NG")) return "NG=F";

  // Forex
  if (upper === "EURUSD") return "EURUSD=X";
  if (upper === "GBPUSD") return "GBPUSD=X";
  if (upper === "USDJPY") return "USDJPY=X";
  if (upper === "AUDUSD") return "AUDUSD=X";
  if (upper === "USDCHF") return "USDCHF=X";
  if (upper === "USDCAD") return "USDCAD=X";
  if (upper === "NZDUSD") return "NZDUSD=X";
  if (upper === "EURGBP") return "EURGBP=X";

  // Crypto
  if (upper === "BTCUSD" || upper === "BTC") return "BTC-USD";
  if (upper === "ETHUSD" || upper === "ETH") return "ETH-USD";
  if (upper === "SOLUSD" || upper === "SOL") return "SOL-USD";

  // If already formatted, return it
  if (upper.includes("=F") || upper.includes("=X") || upper.includes("-USD")) {
    return upper;
  }

  // Stock default
  return upper;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSymbol = searchParams.get("symbol");
    const entryDate = searchParams.get("entryDate");
    const exitDate = searchParams.get("exitDate");

    if (!rawSymbol || !entryDate || !exitDate) {
      return NextResponse.json(
        { error: "Missing required query parameters: symbol, entryDate, exitDate" },
        { status: 400 }
      );
    }

    const ticker = cleanSymbolForYahoo(rawSymbol);
    const entryTime = new Date(entryDate).getTime();
    const exitTime = new Date(exitDate).getTime();

    if (isNaN(entryTime) || isNaN(exitTime)) {
      return NextResponse.json({ error: "Invalid dates provided" }, { status: 400 });
    }

    const durationMs = exitTime - entryTime;
    const ageMs = Date.now() - entryTime;

    // Determine interval and padding based on trade duration and age
    let interval: "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "1d" = "1d";
    let paddingMs = 30 * 24 * 60 * 60 * 1000; // default 30 days padding for daily charts

    if (ageMs < 7 * 24 * 60 * 60 * 1000) {
      // Under 7 days old: we can fetch 1m/2m/5m/15m data
      if (durationMs < 30 * 60 * 1000) {
        interval = "1m";
        paddingMs = 60 * 60 * 1000; // 60 mins padding
      } else if (durationMs < 2 * 60 * 60 * 1000) {
        interval = "2m";
        paddingMs = 120 * 60 * 1000;
      } else if (durationMs < 6 * 60 * 60 * 1000) {
        interval = "5m";
        paddingMs = 240 * 60 * 1000;
      } else {
        interval = "15m";
        paddingMs = 480 * 60 * 1000;
      }
    } else if (ageMs < 58 * 24 * 60 * 60 * 1000) {
      // Under 60 days old: we can fetch 5m/15m/30m data
      if (durationMs < 2 * 60 * 60 * 1000) {
        interval = "5m";
        paddingMs = 240 * 60 * 1000;
      } else if (durationMs < 12 * 60 * 60 * 1000) {
        interval = "15m";
        paddingMs = 720 * 60 * 1000;
      } else {
        interval = "30m";
        paddingMs = 1440 * 60 * 1000;
      }
    } else if (ageMs < 700 * 24 * 60 * 60 * 1000) {
      // Under 730 days old: we can fetch 60m data
      if (durationMs < 24 * 60 * 60 * 1000) {
        interval = "60m";
        paddingMs = 24 * 60 * 60 * 1000;
      } else {
        interval = "1d";
        paddingMs = 15 * 24 * 60 * 60 * 1000;
      }
    } else {
      // Very old trade: use 1d candles
      interval = "1d";
      paddingMs = 30 * 24 * 60 * 60 * 1000;
    }

    const period1Date = new Date(entryTime - paddingMs);
    const period2Date = new Date(exitTime + paddingMs);

    const result = (await yahooFinance.chart(ticker, {
      period1: period1Date,
      period2: period2Date,
      interval: interval
    })) as any;

    if (!result || !result.quotes || result.quotes.length === 0) {
      return NextResponse.json(
        { error: "No market data found for the specified period and symbol" },
        { status: 404 }
      );
    }

    const candles = result.quotes
      .map((q: any) => ({
        time: Math.floor(q.date.getTime() / 1000),
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
      }))
      // Filter out any entries with incomplete data
      .filter(
        (c: any) =>
          c.open !== null &&
          c.open !== undefined &&
          c.high !== null &&
          c.high !== undefined &&
          c.low !== null &&
          c.low !== undefined &&
          c.close !== null &&
          c.close !== undefined
      );

    if (candles.length === 0) {
      return NextResponse.json(
        { error: "Cleaned market data list is empty" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      candles,
      ticker,
      interval,
      isReal: true
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch market data" },
      { status: 500 }
    );
  }
}

