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
  const lowercaseHeaders = headers.map(h => h.toLowerCase().trim());
  let broker = "Unknown";
  let trades: Omit<Trade, "id">[] = [];
  let errors: string[] = [];

  // 1. Detect Broker Format (using case-insensitive matches)
  if (lowercaseHeaders.includes("instrument") && 
      (lowercaseHeaders.includes("market pos.") || lowercaseHeaders.includes("direction")) && 
      lowercaseHeaders.includes("entry time")) {
    broker = "NinjaTrader";
    trades = parseNinjaTrader(data, errors);
  } else if (lowercaseHeaders.includes("symbol") && 
             lowercaseHeaders.includes("side") && 
             (lowercaseHeaders.includes("p/l") || lowercaseHeaders.includes("net pnl") || lowercaseHeaders.includes("pnl")) && 
             lowercaseHeaders.includes("closetime")) {
    broker = "TopstepX";
    trades = parseTopstep(data, errors);
  } else if (lowercaseHeaders.includes("symbol") && 
             lowercaseHeaders.includes("boughttimestamp") && 
             lowercaseHeaders.includes("soldtimestamp")) {
    broker = "Tradovate";
    trades = parseTradovate(data, errors);
  } else if (lowercaseHeaders.includes("symbol") && 
             lowercaseHeaders.includes("netpnl") && 
             lowercaseHeaders.includes("direction")) {
    broker = "EdgeVault Native";
    trades = parseEdgeVaultNative(data, errors);
  } else {
    throw new Error("Could not detect broker format from CSV headers. Supported: Tradovate, NinjaTrader, TopstepX, EdgeVault Export.");
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

// ------------------------------------------------------------------
// Tradovate Parser (Example: symbol, buyFillId, sellFillId, qty, buyPrice, sellPrice, pnl, boughtTimestamp, soldTimestamp, duration)
// ------------------------------------------------------------------
function parseTradovate(data: any[], errors: string[]): Omit<Trade, "id">[] {
  const trades: Omit<Trade, "id">[] = [];

  data.forEach((row, index) => {
    try {
      const symbol = getRowValueCaseInsensitive(row, "symbol");
      if (!symbol) return; // Skip empty rows or title rows

      const boughtTimeStr = getRowValueCaseInsensitive(row, "boughtTimestamp");
      const soldTimeStr = getRowValueCaseInsensitive(row, "soldTimestamp");
      
      const boughtDate = parseDateString(boughtTimeStr);
      const soldDate = parseDateString(soldTimeStr);
      
      const isLong = boughtDate.getTime() < soldDate.getTime();
      const direction = isLong ? "long" : "short";
      
      const entryDate = isLong ? boughtDate : soldDate;
      const exitDate = isLong ? soldDate : boughtDate;
      
      const buyPrice = parseFloat(getRowValueCaseInsensitive(row, "buyPrice") || "0");
      const sellPrice = parseFloat(getRowValueCaseInsensitive(row, "sellPrice") || "0");
      
      const entryPrice = isLong ? buyPrice : sellPrice;
      const exitPrice = isLong ? sellPrice : buyPrice;
      
      const qty = parseFloat(getRowValueCaseInsensitive(row, "qty") || "1");
      
      // Clean and parse P&L (supports standard and parenthesized format like ($21.00))
      const rawPnl = getRowValueCaseInsensitive(row, "pnl") || "0";
      let cleanPnl = rawPnl.trim();
      let isNegative = false;
      if (cleanPnl.startsWith("(") && cleanPnl.endsWith(")")) {
        isNegative = true;
        cleanPnl = cleanPnl.substring(1, cleanPnl.length - 1);
      }
      cleanPnl = cleanPnl.replace(/[^0-9.-]/g, "");
      let profit = parseFloat(cleanPnl);
      if (isNegative) profit = -profit;

      const durationMins = Math.max(1, Math.round(Math.abs(soldDate.getTime() - boughtDate.getTime()) / 60000));

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
        commission: 0,
        netPnl: profit,
        result: profit > 0 ? "win" : profit < 0 ? "loss" : "breakeven",
        rMultiple: 0,
        rr: 0,
        durationMinutes: durationMins,
        emotion: 0,
        preTradeNotes: "Imported from Tradovate (Lucid Prop Firm)",
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
      errors.push(`Row ${index + 1}: Failed to parse Tradovate row.`);
    }
  });

  return trades;
}

// Helper: Safely parse MM/DD/YYYY HH:mm:ss dates across all systems
function parseDateString(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  try {
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length >= 1) {
      const dateParts = parts[0].split("/");
      if (dateParts.length === 3) {
        const month = parseInt(dateParts[0]) - 1;
        const day = parseInt(dateParts[1]);
        const year = parseInt(dateParts[2]);
        
        let hours = 0;
        let minutes = 0;
        let seconds = 0;
        
        if (parts.length >= 2) {
          const timeParts = parts[1].split(":");
          if (timeParts.length >= 2) {
            hours = parseInt(timeParts[0]);
            minutes = parseInt(timeParts[1]);
            if (timeParts.length >= 3) {
              seconds = parseInt(timeParts[2]);
            }
          }
        }
        
        const dateObj = new Date(year, month, day, hours, minutes, seconds);
        if (!isNaN(dateObj.getTime())) {
          return dateObj;
        }
      }
    }
  } catch (e) {
    console.error("Error manually parsing date:", dateStr, e);
  }
  
  return new Date();
}

// Helper: Case-insensitive value extraction from a parsed CSV row
function getRowValueCaseInsensitive(row: any, keyName: string): string {
  const keys = Object.keys(row);
  const targetKey = keyName.toLowerCase();
  for (const k of keys) {
    if (k.toLowerCase().trim() === targetKey) {
      return (row[k] || "").toString().trim();
    }
  }
  return "";
}
