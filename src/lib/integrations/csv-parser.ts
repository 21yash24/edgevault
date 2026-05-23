import Papa from "papaparse";
import { Trade, SessionTag, MarketCondition } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export interface ParsedCSVResult {
  trades: Omit<Trade, "id">[];
  broker: string;
  errors: string[];
}

export function parseCSVFile(file: File): Promise<ParsedCSVResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsed = processCSVData(results.data);
          resolve(parsed);
        } catch (error: any) {
          reject(error.message);
        }
      },
      error: (error) => {
        reject(error.message);
      },
    });
  });
}

function processCSVData(data: any[]): ParsedCSVResult {
  if (!data || data.length === 0) {
    throw new Error("CSV file is empty or could not be read.");
  }

  const headers = Object.keys(data[0]);
  let broker = "Unknown";
  let trades: Omit<Trade, "id">[] = [];
  let errors: string[] = [];

  // 1. Detect Broker Format
  if (headers.includes("Instrument") && headers.includes("Market pos.") && headers.includes("Entry time")) {
    // NinjaTrader Format (approximate)
    broker = "NinjaTrader";
    trades = parseNinjaTrader(data, errors);
  } else if (headers.includes("Symbol") && headers.includes("Side") && headers.includes("P/L") && headers.includes("CloseTime")) {
    // TopstepX / TradeStation Format (approximate)
    broker = "TopstepX";
    trades = parseTopstep(data, errors);
  } else if (headers.includes("symbol") && headers.includes("netPnl") && headers.includes("direction")) {
    // EdgeVault Native Export Format
    broker = "EdgeVault Native";
    trades = parseEdgeVaultNative(data, errors);
  } else {
    // Fallback or Unknown
    throw new Error("Could not detect broker format from CSV headers. Supported: NinjaTrader, TopstepX, EdgeVault Export.");
  }

  return { trades, broker, errors };
}

// ------------------------------------------------------------------
// NinjaTrader Parser (Example: Instrument, Market pos., Entry time, Exit time, Entry price, Exit price, Profit)
// ------------------------------------------------------------------
function parseNinjaTrader(data: any[], errors: string[]): Omit<Trade, "id">[] {
  const trades: Omit<Trade, "id">[] = [];

  data.forEach((row, index) => {
    try {
      const symbol = row["Instrument"] || row["Symbol"];
      const pos = (row["Market pos."] || row["Direction"] || "").toString().toLowerCase();
      const direction = pos.includes("short") ? "short" : "long";
      
      const entryPrice = parseFloat(row["Entry price"] || "0");
      const exitPrice = parseFloat(row["Exit price"] || "0");
      const qty = parseFloat(row["Qty"] || row["Quantity"] || "1");
      const profit = parseFloat(row["Profit"] || row["Net PnL"] || row["PnL"] || "0");
      const comm = parseFloat(row["Commission"] || "0");
      
      const entryDate = new Date(row["Entry time"] || Date.now());
      const exitDate = new Date(row["Exit time"] || Date.now());
      
      const durationMins = Math.max(1, Math.round((exitDate.getTime() - entryDate.getTime()) / 60000));
      
      if (!symbol) return; // Skip invalid rows

      trades.push({
        symbol,
        direction,
        entryDate: entryDate.toISOString(),
        exitDate: exitDate.toISOString(),
        entryPrice,
        exitPrice,
        stopLoss: 0,
        takeProfit: 0,
        positionSize: qty,
        commission: comm,
        netPnl: profit,
        result: profit > 0 ? "win" : profit < 0 ? "loss" : "breakeven",
        rMultiple: 0,
        rr: 0,
        durationMinutes: durationMins,
        emotion: 0,
        preTradeNotes: "Imported from NinjaTrader",
        postTradeReview: "",
        setupTags: ["Imported"],
        sessionTag: "NY AM",
        marketCondition: "Trending",
        mistakeTags: [],
        screenshotUrls: [],
        mindsetTags: [],
        mindsetNotes: "",
        accountEquityAfter: 0, // Will be calculated upon insertion
      });
    } catch (e) {
      errors.push(`Row ${index + 1}: Failed to parse data.`);
    }
  });

  return trades;
}

// ------------------------------------------------------------------
// TopstepX Parser (Example: Symbol, Side, OpenTime, CloseTime, OpenPrice, ClosePrice, P/L, Comm)
// ------------------------------------------------------------------
function parseTopstep(data: any[], errors: string[]): Omit<Trade, "id">[] {
  const trades: Omit<Trade, "id">[] = [];

  data.forEach((row, index) => {
    try {
      const symbol = row["Symbol"];
      const side = (row["Side"] || "").toString().toLowerCase();
      const direction = side.includes("sell") || side.includes("short") ? "short" : "long";
      
      const entryPrice = parseFloat(row["OpenPrice"] || "0");
      const exitPrice = parseFloat(row["ClosePrice"] || "0");
      const qty = parseFloat(row["Quantity"] || "1");
      const profit = parseFloat(row["P/L"] || "0");
      const comm = parseFloat(row["Comm"] || "0");
      
      const entryDate = new Date(row["OpenTime"] || Date.now());
      const exitDate = new Date(row["CloseTime"] || Date.now());
      
      const durationMins = Math.max(1, Math.round((exitDate.getTime() - entryDate.getTime()) / 60000));
      
      if (!symbol) return;

      trades.push({
        symbol,
        direction,
        entryDate: entryDate.toISOString(),
        exitDate: exitDate.toISOString(),
        entryPrice,
        exitPrice,
        stopLoss: 0,
        takeProfit: 0,
        positionSize: qty,
        commission: comm,
        netPnl: profit,
        result: profit > 0 ? "win" : profit < 0 ? "loss" : "breakeven",
        rMultiple: 0,
        rr: 0,
        durationMinutes: durationMins,
        emotion: 0,
        preTradeNotes: "Imported from TopstepX",
        postTradeReview: "",
        setupTags: ["Imported"],
        sessionTag: "NY AM",
        marketCondition: "Trending",
        mistakeTags: [],
        screenshotUrls: [],
        mindsetTags: [],
        mindsetNotes: "",
        accountEquityAfter: 0,
      });
    } catch (e) {
      errors.push(`Row ${index + 1}: Failed to parse data.`);
    }
  });

  return trades;
}

// ------------------------------------------------------------------
// EdgeVault Native Importer
// ------------------------------------------------------------------
function parseEdgeVaultNative(data: any[], errors: string[]): Omit<Trade, "id">[] {
  const trades: Omit<Trade, "id">[] = [];

  data.forEach((row, index) => {
    try {
      if (!row["symbol"]) return;
      trades.push({
        symbol: row["symbol"],
        direction: row["direction"] as "long" | "short",
        entryDate: row["entryDate"],
        exitDate: row["exitDate"],
        entryPrice: parseFloat(row["entryPrice"]),
        exitPrice: parseFloat(row["exitPrice"]),
        stopLoss: parseFloat(row["stopLoss"] || "0"),
        takeProfit: parseFloat(row["takeProfit"] || "0"),
        positionSize: parseFloat(row["positionSize"]),
        commission: parseFloat(row["commission"] || "0"),
        netPnl: parseFloat(row["netPnl"]),
        result: row["result"] as "win" | "loss" | "breakeven",
        rMultiple: parseFloat(row["rMultiple"] || "0"),
        rr: parseFloat(row["rr"] || "0"),
        durationMinutes: parseInt(row["durationMinutes"] || "1"),
        emotion: parseInt(row["emotion"] || "0"),
        preTradeNotes: row["preTradeNotes"] || "",
        postTradeReview: row["postTradeReview"] || "",
        setupTags: row["setupTags"] ? row["setupTags"].split("|") : [],
        sessionTag: row["sessionTag"] as SessionTag,
        marketCondition: row["marketCondition"] as MarketCondition,
        mistakeTags: row["mistakeTags"] ? row["mistakeTags"].split("|") : [],
        screenshotUrls: row["screenshotUrls"] ? row["screenshotUrls"].split("|") : [],
        mindsetTags: row["mindsetTags"] ? row["mindsetTags"].split("|") : [],
        mindsetNotes: row["mindsetNotes"] || "",
        accountEquityAfter: parseFloat(row["accountEquityAfter"] || "0"),
      });
    } catch (e) {
       errors.push(`Row ${index + 1}: Failed to parse data.`);
    }
  });

  return trades;
}
