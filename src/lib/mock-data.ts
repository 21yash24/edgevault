import { Trade } from "./types";
import { generateId } from "./utils";

function makeTrade(overrides: Partial<Trade> & Pick<Trade, "symbol" | "direction" | "entryPrice" | "exitPrice" | "stopLoss" | "takeProfit" | "positionSize" | "entryDate" | "exitDate" | "sessionTag" | "setupTags" | "marketCondition">): Trade {
  const { direction, entryPrice = 0, exitPrice = 0, stopLoss = 0, positionSize = 0, commission = 4.5 } = overrides;
  const rawPnl = direction === "long"
    ? (exitPrice - entryPrice) * positionSize
    : (entryPrice - exitPrice) * positionSize;
  const netPnl = parseFloat((rawPnl - commission).toFixed(2));
  const risk = Math.abs(entryPrice - stopLoss) * positionSize;
  const rMultiple = risk > 0 ? parseFloat((netPnl / risk).toFixed(2)) : 0;
  const rr = overrides.takeProfit && overrides.takeProfit > 0 ? Math.abs(overrides.takeProfit - entryPrice) / Math.abs(entryPrice - stopLoss) : 0;
  const entryD = new Date(overrides.entryDate);
  const exitD = new Date(overrides.exitDate);
  const durationMinutes = Math.round((exitD.getTime() - entryD.getTime()) / 60000);
  const result = netPnl > 5 ? "win" : netPnl < -5 ? "loss" : "breakeven";

  return {
    id: generateId(),
    symbol: overrides.symbol,
    direction,
    entryPrice,
    exitPrice,
    stopLoss,
    takeProfit: overrides.takeProfit,
    positionSize,
    entryDate: overrides.entryDate,
    exitDate: overrides.exitDate,
    commission,
    netPnl,
    rMultiple,
    rr: parseFloat(rr.toFixed(2)),
    result,
    emotion: overrides.emotion ?? 0,
    preTradeNotes: overrides.preTradeNotes ?? "",
    postTradeReview: overrides.postTradeReview ?? "",
    setupTags: overrides.setupTags,
    sessionTag: overrides.sessionTag,
    marketCondition: overrides.marketCondition,
    mistakeTags: overrides.mistakeTags ?? [],
    playbook: overrides.playbook,
    screenshotUrls: [],
    mindsetTags: [],
    mindsetNotes: "",
    durationMinutes,
    accountEquityAfter: 0,
  };
}

const rawTrades: Parameters<typeof makeTrade>[0][] = [
  { symbol: "MNQ", direction: "long", entryPrice: 18450, exitPrice: 18520, stopLoss: 18420, takeProfit: 18570, positionSize: 2, entryDate: "2025-04-01T09:45:00", exitDate: "2025-04-01T10:22:00", sessionTag: "NY AM", setupTags: ["IFVG", "Liquidity Sweep"], marketCondition: "Trending", emotion: 1, preTradeNotes: "Clean sweep of PDL, IFVG formed on M1", postTradeReview: "Perfect execution, held to target", playbook: "Liquidity Sweep + IFVG" },
  { symbol: "MNQ", direction: "short", entryPrice: 18600, exitPrice: 18545, stopLoss: 18630, takeProfit: 18510, positionSize: 2, entryDate: "2025-04-02T10:05:00", exitDate: "2025-04-02T10:40:00", sessionTag: "NY AM", setupTags: ["Order Block"], marketCondition: "Ranging", emotion: 0, postTradeReview: "Good entry, took partials too early" },
  { symbol: "ES", direction: "long", entryPrice: 5280, exitPrice: 5265, stopLoss: 5272, takeProfit: 5300, positionSize: 1, entryDate: "2025-04-02T14:30:00", exitDate: "2025-04-02T14:55:00", sessionTag: "NY PM", setupTags: ["VWAP Bounce"], marketCondition: "Choppy", emotion: -2, mistakeTags: ["Chased entry"], postTradeReview: "Chased into resistance, should have waited" },
  { symbol: "EURUSD", direction: "long", entryPrice: 1.0820, exitPrice: 1.0870, stopLoss: 1.0795, takeProfit: 1.0890, positionSize: 100000, entryDate: "2025-04-03T03:15:00", exitDate: "2025-04-03T05:30:00", sessionTag: "London", setupTags: ["FVG", "Trend Continuation"], marketCondition: "Trending", commission: 7, emotion: 2, preTradeNotes: "London open sweep of Asian lows", postTradeReview: "Textbook setup, great patience" },
  { symbol: "MNQ", direction: "long", entryPrice: 18380, exitPrice: 18460, stopLoss: 18350, takeProfit: 18470, positionSize: 3, entryDate: "2025-04-03T09:50:00", exitDate: "2025-04-03T10:35:00", sessionTag: "NY AM", setupTags: ["ICT Silver Bullet"], marketCondition: "Trending", emotion: 1, playbook: "ICT Silver Bullet" },
  { symbol: "BTCUSD", direction: "short", entryPrice: 68500, exitPrice: 69200, stopLoss: 69000, takeProfit: 67200, positionSize: 0.5, entryDate: "2025-04-04T02:00:00", exitDate: "2025-04-04T04:15:00", sessionTag: "Asian", setupTags: ["Reversal"], marketCondition: "News-driven", emotion: -3, mistakeTags: ["Broke rules", "Revenge trade"], postTradeReview: "Fought the trend after previous loss" },
  { symbol: "NQ", direction: "long", entryPrice: 18320, exitPrice: 18410, stopLoss: 18290, takeProfit: 18440, positionSize: 1, entryDate: "2025-04-07T09:48:00", exitDate: "2025-04-07T10:30:00", sessionTag: "NY AM", setupTags: ["Liquidity Sweep", "SMT Divergence"], marketCondition: "Trending", emotion: 0 },
  { symbol: "GBPUSD", direction: "short", entryPrice: 1.2650, exitPrice: 1.2605, stopLoss: 1.2680, takeProfit: 1.2580, positionSize: 50000, entryDate: "2025-04-07T08:30:00", exitDate: "2025-04-07T11:00:00", sessionTag: "London", setupTags: ["Breaker Block"], marketCondition: "Trending", commission: 5 },
  { symbol: "MES", direction: "short", entryPrice: 5310, exitPrice: 5325, stopLoss: 5325, takeProfit: 5280, positionSize: 2, entryDate: "2025-04-08T10:15:00", exitDate: "2025-04-08T10:30:00", sessionTag: "NY AM", setupTags: ["IFVG"], marketCondition: "Choppy", emotion: -1, mistakeTags: ["Sized too big"] },
  { symbol: "MNQ", direction: "short", entryPrice: 18550, exitPrice: 18480, stopLoss: 18580, takeProfit: 18450, positionSize: 2, entryDate: "2025-04-08T14:00:00", exitDate: "2025-04-08T14:45:00", sessionTag: "NY PM", setupTags: ["Order Block", "IFVG"], marketCondition: "Trending", emotion: 1, playbook: "Liquidity Sweep + IFVG" },
  { symbol: "TSLA", direction: "long", entryPrice: 172.50, exitPrice: 178.30, stopLoss: 170.00, takeProfit: 180.00, positionSize: 100, entryDate: "2025-04-09T09:35:00", exitDate: "2025-04-09T12:00:00", sessionTag: "NY AM", setupTags: ["Breakout"], marketCondition: "Trending", commission: 1 },
  { symbol: "MNQ", direction: "long", entryPrice: 18400, exitPrice: 18375, stopLoss: 18370, takeProfit: 18470, positionSize: 2, entryDate: "2025-04-09T10:00:00", exitDate: "2025-04-09T10:15:00", sessionTag: "NY AM", setupTags: ["FVG"], marketCondition: "Ranging", emotion: -2, mistakeTags: ["Late entry"] },
  { symbol: "EURUSD", direction: "short", entryPrice: 1.0910, exitPrice: 1.0875, stopLoss: 1.0935, takeProfit: 1.0850, positionSize: 100000, entryDate: "2025-04-10T03:00:00", exitDate: "2025-04-10T06:00:00", sessionTag: "London", setupTags: ["Liquidity Sweep"], marketCondition: "Trending", commission: 7, playbook: "London Session Sweep" },
  { symbol: "GC", direction: "long", entryPrice: 2320, exitPrice: 2345, stopLoss: 2308, takeProfit: 2350, positionSize: 1, entryDate: "2025-04-10T09:50:00", exitDate: "2025-04-10T11:30:00", sessionTag: "NY AM", setupTags: ["VWAP Bounce", "Trend Continuation"], marketCondition: "Trending", commission: 5 },
  { symbol: "MNQ", direction: "short", entryPrice: 18620, exitPrice: 18665, stopLoss: 18650, takeProfit: 18550, positionSize: 4, entryDate: "2025-04-11T10:10:00", exitDate: "2025-04-11T10:25:00", sessionTag: "NY AM", setupTags: ["IFVG"], marketCondition: "Choppy", emotion: 3, mistakeTags: ["Sized too big", "FOMO"] },
  { symbol: "NQ", direction: "long", entryPrice: 18500, exitPrice: 18580, stopLoss: 18470, takeProfit: 18600, positionSize: 1, entryDate: "2025-04-14T09:45:00", exitDate: "2025-04-14T10:50:00", sessionTag: "NY AM", setupTags: ["ICT Silver Bullet", "Liquidity Sweep"], marketCondition: "Trending", emotion: 0, playbook: "ICT Silver Bullet" },
  { symbol: "USDJPY", direction: "long", entryPrice: 152.50, exitPrice: 153.10, stopLoss: 152.10, takeProfit: 153.30, positionSize: 100000, entryDate: "2025-04-14T02:30:00", exitDate: "2025-04-14T05:00:00", sessionTag: "Asian", setupTags: ["Trend Continuation"], marketCondition: "Trending", commission: 6 },
  { symbol: "MNQ", direction: "long", entryPrice: 18480, exitPrice: 18440, stopLoss: 18450, takeProfit: 18550, positionSize: 2, entryDate: "2025-04-15T10:05:00", exitDate: "2025-04-15T10:20:00", sessionTag: "NY AM", setupTags: ["FVG"], marketCondition: "Choppy", emotion: -1, mistakeTags: ["No plan"] },
  { symbol: "NVDA", direction: "long", entryPrice: 880, exitPrice: 905, stopLoss: 868, takeProfit: 910, positionSize: 20, entryDate: "2025-04-15T09:35:00", exitDate: "2025-04-15T13:00:00", sessionTag: "NY AM", setupTags: ["Breakout", "Gap Fill"], marketCondition: "Trending", commission: 1 },
  { symbol: "CL", direction: "short", entryPrice: 82.50, exitPrice: 81.80, stopLoss: 83.00, takeProfit: 81.50, positionSize: 1, entryDate: "2025-04-16T09:55:00", exitDate: "2025-04-16T11:20:00", sessionTag: "NY AM", setupTags: ["Order Block"], marketCondition: "Trending", commission: 5 },
  { symbol: "MNQ", direction: "long", entryPrice: 18550, exitPrice: 18630, stopLoss: 18520, takeProfit: 18640, positionSize: 3, entryDate: "2025-04-16T09:46:00", exitDate: "2025-04-16T10:30:00", sessionTag: "NY AM", setupTags: ["IFVG", "SMT Divergence"], marketCondition: "Trending", emotion: 1, playbook: "Liquidity Sweep + IFVG" },
  { symbol: "EURUSD", direction: "long", entryPrice: 1.0850, exitPrice: 1.0830, stopLoss: 1.0825, takeProfit: 1.0900, positionSize: 50000, entryDate: "2025-04-17T03:10:00", exitDate: "2025-04-17T04:00:00", sessionTag: "London", setupTags: ["Mean Reversion"], marketCondition: "Ranging", commission: 5, emotion: -2, mistakeTags: ["Early exit"] },
  { symbol: "MNQ", direction: "short", entryPrice: 18700, exitPrice: 18640, stopLoss: 18730, takeProfit: 18620, positionSize: 2, entryDate: "2025-04-17T10:00:00", exitDate: "2025-04-17T10:50:00", sessionTag: "NY AM", setupTags: ["Order Block", "Liquidity Sweep"], marketCondition: "Trending", emotion: 0 },
  { symbol: "BTCUSD", direction: "long", entryPrice: 71000, exitPrice: 72500, stopLoss: 70200, takeProfit: 73000, positionSize: 0.3, entryDate: "2025-04-18T14:00:00", exitDate: "2025-04-18T18:00:00", sessionTag: "NY PM", setupTags: ["Breakout"], marketCondition: "Trending", commission: 12 },
  { symbol: "MNQ", direction: "long", entryPrice: 18600, exitPrice: 18570, stopLoss: 18575, takeProfit: 18670, positionSize: 2, entryDate: "2025-04-21T09:50:00", exitDate: "2025-04-21T10:05:00", sessionTag: "NY AM", setupTags: ["FVG"], marketCondition: "Ranging", emotion: -3, mistakeTags: ["Revenge trade", "FOMO"] },
  { symbol: "ES", direction: "long", entryPrice: 5340, exitPrice: 5375, stopLoss: 5325, takeProfit: 5380, positionSize: 1, entryDate: "2025-04-21T09:45:00", exitDate: "2025-04-21T11:00:00", sessionTag: "NY AM", setupTags: ["ICT Silver Bullet"], marketCondition: "Trending", playbook: "ICT Silver Bullet" },
  { symbol: "GBPUSD", direction: "long", entryPrice: 1.2700, exitPrice: 1.2755, stopLoss: 1.2670, takeProfit: 1.2770, positionSize: 100000, entryDate: "2025-04-22T03:20:00", exitDate: "2025-04-22T06:00:00", sessionTag: "London", setupTags: ["Liquidity Sweep", "FVG"], marketCondition: "Trending", commission: 7 },
  { symbol: "MNQ", direction: "short", entryPrice: 18750, exitPrice: 18690, stopLoss: 18780, takeProfit: 18660, positionSize: 2, entryDate: "2025-04-22T10:10:00", exitDate: "2025-04-22T10:55:00", sessionTag: "NY AM", setupTags: ["IFVG"], marketCondition: "Trending", emotion: 1 },
  { symbol: "MNQ", direction: "long", entryPrice: 18650, exitPrice: 18710, stopLoss: 18620, takeProfit: 18720, positionSize: 3, entryDate: "2025-04-23T09:48:00", exitDate: "2025-04-23T10:35:00", sessionTag: "NY AM", setupTags: ["Liquidity Sweep", "IFVG"], marketCondition: "Trending", emotion: 2, playbook: "Liquidity Sweep + IFVG", preTradeNotes: "PDL swept in pre-market, IFVG at 18650 on M1", postTradeReview: "Textbook A+ setup, held full position to TP" },
  { symbol: "AUDUSD", direction: "short", entryPrice: 0.6550, exitPrice: 0.6580, stopLoss: 0.6575, takeProfit: 0.6500, positionSize: 100000, entryDate: "2025-04-23T02:00:00", exitDate: "2025-04-23T03:30:00", sessionTag: "Asian", setupTags: ["Reversal"], marketCondition: "News-driven", commission: 6, emotion: -1, mistakeTags: ["Broke rules"] },
  { symbol: "MNQ", direction: "long", entryPrice: 18700, exitPrice: 18770, stopLoss: 18670, takeProfit: 18780, positionSize: 2, entryDate: "2025-04-24T09:50:00", exitDate: "2025-04-24T10:40:00", sessionTag: "NY AM", setupTags: ["SMT Divergence", "Order Block"], marketCondition: "Trending" },
  { symbol: "SPY", direction: "long", entryPrice: 535, exitPrice: 538.5, stopLoss: 533, takeProfit: 540, positionSize: 50, entryDate: "2025-04-24T09:35:00", exitDate: "2025-04-24T11:00:00", sessionTag: "NY AM", setupTags: ["Opening Range"], marketCondition: "Trending", commission: 1, playbook: "Opening Range Breakout" },
  { symbol: "MNQ", direction: "short", entryPrice: 18800, exitPrice: 18830, stopLoss: 18830, takeProfit: 18720, positionSize: 2, entryDate: "2025-04-25T10:00:00", exitDate: "2025-04-25T10:12:00", sessionTag: "NY AM", setupTags: ["IFVG"], marketCondition: "Choppy", emotion: -2, mistakeTags: ["Chased entry", "Late entry"] },
  { symbol: "ETHUSD", direction: "long", entryPrice: 3200, exitPrice: 3350, stopLoss: 3120, takeProfit: 3400, positionSize: 2, entryDate: "2025-04-25T15:00:00", exitDate: "2025-04-25T22:00:00", sessionTag: "Overnight", setupTags: ["Breakout", "Trend Continuation"], marketCondition: "Trending", commission: 8 },
  { symbol: "MNQ", direction: "long", entryPrice: 18820, exitPrice: 18900, stopLoss: 18790, takeProfit: 18910, positionSize: 3, entryDate: "2025-04-28T09:46:00", exitDate: "2025-04-28T10:30:00", sessionTag: "NY AM", setupTags: ["IFVG", "Liquidity Sweep"], marketCondition: "Trending", emotion: 1, playbook: "Liquidity Sweep + IFVG" },
  { symbol: "GC", direction: "long", entryPrice: 2360, exitPrice: 2380, stopLoss: 2348, takeProfit: 2385, positionSize: 1, entryDate: "2025-04-28T10:00:00", exitDate: "2025-04-28T12:00:00", sessionTag: "NY AM", setupTags: ["Trend Continuation"], marketCondition: "Trending", commission: 5 },
  { symbol: "MNQ", direction: "short", entryPrice: 18950, exitPrice: 18870, stopLoss: 18980, takeProfit: 18850, positionSize: 2, entryDate: "2025-04-29T10:05:00", exitDate: "2025-04-29T10:50:00", sessionTag: "NY AM", setupTags: ["Order Block"], marketCondition: "Trending" },
  { symbol: "EURUSD", direction: "long", entryPrice: 1.0900, exitPrice: 1.0950, stopLoss: 1.0870, takeProfit: 1.0960, positionSize: 100000, entryDate: "2025-04-29T03:00:00", exitDate: "2025-04-29T05:30:00", sessionTag: "London", setupTags: ["FVG", "Liquidity Sweep"], marketCondition: "Trending", commission: 7, playbook: "London Session Sweep" },
  { symbol: "MNQ", direction: "long", entryPrice: 18900, exitPrice: 18870, stopLoss: 18870, takeProfit: 18980, positionSize: 2, entryDate: "2025-04-30T09:50:00", exitDate: "2025-04-30T10:05:00", sessionTag: "NY AM", setupTags: ["FVG"], marketCondition: "Choppy", emotion: -2, mistakeTags: ["No plan", "FOMO"] },
  { symbol: "NQ", direction: "short", entryPrice: 18980, exitPrice: 18910, stopLoss: 19010, takeProfit: 18880, positionSize: 1, entryDate: "2025-04-30T10:15:00", exitDate: "2025-04-30T11:00:00", sessionTag: "NY AM", setupTags: ["ICT Silver Bullet"], marketCondition: "Trending", playbook: "ICT Silver Bullet" },
];

export function generateMockTrades(): Trade[] {
  let equity = 50000;
  const trades = rawTrades.map((raw) => {
    const trade = makeTrade(raw);
    equity += trade.netPnl;
    trade.accountEquityAfter = parseFloat(equity.toFixed(2));
    return trade;
  });
  return trades;
}
