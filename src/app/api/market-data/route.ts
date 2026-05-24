import { NextRequest, NextResponse } from "next/server";

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
    let interval = "1d";
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

    const period1 = Math.floor((entryTime - paddingMs) / 1000);
    const period2 = Math.floor((exitTime + paddingMs) / 1000);

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=${interval}`;

    const res = await fetch(yahooUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Yahoo Finance API returned status ${res.status}: ${errorText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const result = data.chart?.result?.[0];

    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      return NextResponse.json(
        { error: "No market data found for the specified period and symbol" },
        { status: 404 }
      );
    }

    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];

    const candles = timestamps
      .map((ts: number, i: number) => ({
        time: ts,
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
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
