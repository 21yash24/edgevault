import { Trade } from "./types";
import { generateId } from "./utils";

interface MT5RawDeal {
  ticket: string;
  time: string;
  type: string;
  symbol: string;
  volume: string;
  price: string;
  sl: string;
  tp: string;
  profit: string;
  commission: string;
  swap: string;
  comment: string;
}

// Common broker symbol mappings
const SYMBOL_MAP: Record<string, string> = {
  "EURUSD.m": "EURUSD", "EURUSD.i": "EURUSD", "EURUSD.a": "EURUSD", "EURUSDm": "EURUSD",
  "GBPUSD.m": "GBPUSD", "GBPUSD.i": "GBPUSD", "GBPUSDm": "GBPUSD",
  "USDJPY.m": "USDJPY", "USDJPY.i": "USDJPY", "USDJPYm": "USDJPY",
  "AUDUSD.m": "AUDUSD", "AUDUSD.i": "AUDUSD",
  "USDCHF.m": "USDCHF", "USDCAD.m": "USDCAD",
  "NZDUSD.m": "NZDUSD", "EURGBP.m": "EURGBP",
  "XAUUSD.m": "GC", "XAUUSD": "GC", "GOLD": "GC", "Gold": "GC",
  "XAGUSD.m": "SI", "XAGUSD": "SI", "SILVER": "SI",
  "BTCUSD.m": "BTCUSD", "BTCUSDm": "BTCUSD", "Bitcoin": "BTCUSD",
  "ETHUSD.m": "ETHUSD", "ETHUSDm": "ETHUSD",
  "US500": "ES", "US500.m": "ES", "SP500": "ES",
  "US100": "NQ", "US100.m": "NQ", "USTEC": "NQ", "NAS100": "NQ",
  "US30": "YM", "US30.m": "YM", "DJ30": "YM",
  "USOIL": "CL", "USOIL.m": "CL", "WTI": "CL", "CrudeOil": "CL",
  "NATGAS": "NG", "NATGAS.m": "NG",
};

function normalizeSymbol(raw: string): string {
  const trimmed = raw.trim();
  if (SYMBOL_MAP[trimmed]) return SYMBOL_MAP[trimmed];
  // Strip common suffixes
  const cleaned = trimmed.replace(/\.(m|i|a|e|r|z|pro|raw|std|ecn)$/i, "").replace(/m$/, "");
  if (SYMBOL_MAP[cleaned]) return SYMBOL_MAP[cleaned];
  return cleaned.toUpperCase();
}

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0];
  if (firstLine.includes("\t")) return "\t";
  if (firstLine.includes(";")) return ";";
  return ",";
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += char;
  }
  result.push(current.trim());
  return result;
}

export function parseMT5CSV(csvText: string): { trades: Omit<Trade, "id" | "accountEquityAfter">[]; errors: string[] } {
  const errors: string[] = [];
  const delimiter = detectDelimiter(csvText);
  const lines = csvText.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    errors.push("File appears empty or has no data rows");
    return { trades: [], errors };
  }

  const headerLine = lines[0].toLowerCase();
  const headers = parseCSVLine(headerLine, delimiter);

  // Find column indices
  const findCol = (names: string[]) => headers.findIndex((h) => names.some((n) => h.includes(n)));
  const ticketIdx = findCol(["ticket", "order", "deal"]);
  const timeIdx = findCol(["time", "date", "open time"]);
  const closeTimeIdx = findCol(["close time", "closing time"]);
  const typeIdx = findCol(["type", "direction"]);
  const symbolIdx = findCol(["symbol", "instrument"]);
  const volumeIdx = findCol(["volume", "lots", "size"]);
  const priceIdx = findCol(["price", "open price", "entry"]);
  const closePriceIdx = findCol(["close price", "exit", "current price"]);
  const slIdx = findCol(["s/l", "sl", "stop loss", "stoploss"]);
  const tpIdx = findCol(["t/p", "tp", "take profit", "takeprofit"]);
  const profitIdx = findCol(["profit", "p/l", "pnl", "net profit"]);
  const commIdx = findCol(["commission", "comm"]);
  const swapIdx = findCol(["swap"]);

  if (symbolIdx === -1) { errors.push("Could not find Symbol column"); return { trades: [], errors }; }
  if (profitIdx === -1) { errors.push("Could not find Profit column"); return { trades: [], errors }; }

  const trades: Omit<Trade, "id" | "accountEquityAfter">[] = [];
  const seenTickets = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i], delimiter);
    if (cols.length < 3) continue;

    const ticket = ticketIdx >= 0 ? cols[ticketIdx] : "";
    if (ticket && seenTickets.has(ticket)) continue;
    if (ticket) seenTickets.add(ticket);

    const typeRaw = typeIdx >= 0 ? cols[typeIdx]?.toLowerCase() : "";
    if (!typeRaw.includes("buy") && !typeRaw.includes("sell") && !typeRaw.includes("long") && !typeRaw.includes("short")) continue;

    const direction = typeRaw.includes("buy") || typeRaw.includes("long") ? "long" as const : "short" as const;
    const symbol = normalizeSymbol(cols[symbolIdx] || "");
    const entryPrice = parseFloat(cols[priceIdx] || "0") || 0;
    const exitPrice = closePriceIdx >= 0 ? parseFloat(cols[closePriceIdx] || "0") || entryPrice : entryPrice;
    const stopLoss = slIdx >= 0 ? parseFloat(cols[slIdx] || "0") || 0 : 0;
    const takeProfit = tpIdx >= 0 ? parseFloat(cols[tpIdx] || "0") || 0 : 0;
    const positionSize = volumeIdx >= 0 ? parseFloat(cols[volumeIdx] || "1") || 1 : 1;
    const profit = parseFloat(cols[profitIdx] || "0") || 0;
    const commission = commIdx >= 0 ? Math.abs(parseFloat(cols[commIdx] || "0")) || 0 : 0;
    const swap = swapIdx >= 0 ? parseFloat(cols[swapIdx] || "0") || 0 : 0;
    const netPnl = parseFloat((profit - commission + swap).toFixed(2));

    const entryDate = timeIdx >= 0 ? new Date(cols[timeIdx] || Date.now()).toISOString() : new Date().toISOString();
    const exitDate = closeTimeIdx >= 0 && cols[closeTimeIdx] ? new Date(cols[closeTimeIdx]).toISOString() : entryDate;
    const durationMinutes = Math.max(Math.round((new Date(exitDate).getTime() - new Date(entryDate).getTime()) / 60000), 1);

    const risk = stopLoss > 0 ? Math.abs(entryPrice - stopLoss) * positionSize : 0;
    const rMultiple = risk > 0 ? parseFloat((netPnl / risk).toFixed(2)) : 0;
    const rr = stopLoss > 0 && takeProfit > 0 ? parseFloat((Math.abs(takeProfit - entryPrice) / Math.abs(entryPrice - stopLoss)).toFixed(2)) : 0;

    trades.push({
      symbol, direction, entryPrice, exitPrice, stopLoss, takeProfit,
      positionSize, entryDate, exitDate, commission, netPnl, rMultiple, rr,
      result: netPnl >= 0 ? "win" : "loss",
      emotion: 0, preTradeNotes: "", postTradeReview: `Imported from MT5 (Ticket: ${ticket})`,
      setupTags: [], sessionTag: "NY AM", marketCondition: "Trending",
      mistakeTags: [], durationMinutes,
      screenshotUrls: [],
      mindsetTags: [],
      mindsetNotes: "",
    });
  }

  if (trades.length === 0 && errors.length === 0) {
    errors.push("No valid trades found in the file. Ensure it contains buy/sell entries.");
  }

  return { trades, errors };
}

export function parseMT5HTML(htmlText: string): { trades: Omit<Trade, "id" | "accountEquityAfter">[]; errors: string[] } {
  // Extract table from HTML and convert to CSV-like format
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");
  const tables = doc.querySelectorAll("table");

  for (const table of tables) {
    const rows = table.querySelectorAll("tr");
    if (rows.length < 2) continue;

    const headerCells = rows[0].querySelectorAll("th, td");
    const headerText = Array.from(headerCells).map((c) => c.textContent?.trim() || "").join("\t");
    if (!headerText.toLowerCase().includes("symbol") && !headerText.toLowerCase().includes("profit")) continue;

    const csvLines = [headerText];
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll("td");
      csvLines.push(Array.from(cells).map((c) => c.textContent?.trim() || "").join("\t"));
    }
    return parseMT5CSV(csvLines.join("\n"));
  }

  return { trades: [], errors: ["Could not find a trade history table in the HTML file"] };
}
