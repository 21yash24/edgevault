import { Trade } from "@/lib/types";

// Tradovate API types (simplified for this context)
export interface TradovateFill {
  id: number;
  orderId: number;
  contractId: number;
  contractName: string; // e.g. "ESM4"
  action: "Buy" | "Sell";
  qty: number;
  price: number;
  timestamp: string;
}

export interface TradovatePosition {
  contractId: number;
  contractName: string;
  netPos: number;
  netPrice: number;
  realizedPnL: number;
}

// In a real implementation, we would group buy and sell fills by contractId 
// to calculate precise trades and PnL using FIFO or LIFO. 
// For this mock implementation, we'll map a pair of fills into a Trade, or 
// map a pre-calculated "closed position" into a Trade.

export function mapTradovatePayloadToTrades(payload: any): Omit<Trade, "id">[] {
  // Tradovate's API requires you to piece together orders, fills, and cash balances.
  // Often, developers fetch /fill/list and construct trades by matching Buys and Sells.
  
  const trades: Omit<Trade, "id">[] = [];
  
  if (!payload || !payload.fills || !Array.isArray(payload.fills)) {
    return trades;
  }

  // Very simplified matching logic for demonstration purposes. 
  // We assume sequential Buy then Sell, or Sell then Buy of the same qty.
  const fills = payload.fills as TradovateFill[];
  
  for (let i = 0; i < fills.length; i += 2) {
    if (i + 1 >= fills.length) break; // unmatched fill
    
    const entryFill = fills[i];
    const exitFill = fills[i + 1];
    
    // Determine direction based on the first fill
    const direction = entryFill.action === "Buy" ? "long" : "short";
    
    // Calculate basic PnL (ticks * tick value, but simplified here as raw points * qty * 50 for ES)
    // In reality, contract specifications must be fetched from Tradovate to know tick value.
    const multiplier = entryFill.contractName.includes("ES") ? 50 : 20; // mock multiplier
    let pnl = 0;
    
    if (direction === "long") {
      pnl = (exitFill.price - entryFill.price) * entryFill.qty * multiplier;
    } else {
      pnl = (entryFill.price - exitFill.price) * entryFill.qty * multiplier;
    }

    // Deduct standard commission (e.g., $4.50 round trip)
    const commission = 4.50 * entryFill.qty;
    const netPnl = pnl - commission;

    const entryDate = new Date(entryFill.timestamp);
    const exitDate = new Date(exitFill.timestamp);
    const durationMinutes = Math.max(1, Math.round((exitDate.getTime() - entryDate.getTime()) / 60000));

    trades.push({
      symbol: entryFill.contractName,
      direction,
      entryDate: entryDate.toISOString(),
      exitDate: exitDate.toISOString(),
      entryPrice: entryFill.price,
      exitPrice: exitFill.price,
      stopLoss: 0,
      takeProfit: 0,
      positionSize: entryFill.qty,
      commission,
      netPnl,
      result: netPnl >= 0 ? "win" : "loss",
      rMultiple: 0,
      rr: 0,
      durationMinutes,
      emotion: 0,
      preTradeNotes: "Synced via Tradovate API",
      postTradeReview: "",
      setupTags: ["API Sync"],
      sessionTag: "NY AM", // Default fallback
      marketCondition: "Trending",
      mistakeTags: [],
      screenshotUrls: [],
      mindsetTags: [],
      mindsetNotes: "",
      accountEquityAfter: 0,
    });
  }

  return trades;
}
