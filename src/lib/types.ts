export type TradeDirection = "long" | "short";
export type TradeResult = "win" | "loss" | "breakeven";
export type SessionTag = "Pre-Market" | "London" | "NY AM" | "NY PM" | "Asian" | "Overnight";
export type MarketCondition = "Trending" | "Ranging" | "Choppy" | "News-driven";
export type MistakeTag = "Chased entry" | "Moved SL" | "Sized too big" | "Broke rules" | "Early exit" | "Late entry" | "No plan" | "Revenge trade" | "FOMO";

export interface Trade {
  id: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  entryDate: string;
  exitDate: string;
  commission: number;
  netPnl: number;
  rMultiple: number;
  rr: number;
  result: TradeResult;
  emotion: number; // -5 to +5
  preTradeNotes: string;
  postTradeReview: string;
  setupTags: string[];
  sessionTag: SessionTag;
  marketCondition: MarketCondition;
  mistakeTags: MistakeTag[];
  playbook?: string;
  screenshotUrls: string[];
  mindsetTags: string[];
  mindsetNotes?: string;
  durationMinutes: number;
  accountEquityAfter: number;
  mae?: number;
  mfe?: number;
  isPublic?: boolean;
  publicUrl?: string;
  propChallengeId?: string;
}

export interface DailyStats {
  date: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
}

export interface PerformanceMetrics {
  totalNetPnl: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgRR: number;
  avgHoldTime: number;
  totalTrades: number;
  totalCommissions: number;
  sharpeRatio: number;
  sortinoRatio: number;
  expectancy: number;
  bestDay: { date: string; pnl: number };
  worstDay: { date: string; pnl: number };
  currentWinStreak: number;
  currentLossStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;
}

export const SYMBOLS = [
  // Futures
  "NQ", "ES", "YM", "RTY", "MNQ", "MES", "CL", "GC", "SI", "NG",
  // Forex
  "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCHF", "USDCAD", "NZDUSD", "EURGBP",
  // Crypto
  "BTCUSD", "ETHUSD", "SOLUSD",
  // Stocks
  "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "META", "GOOGL", "SPY", "QQQ",
];

export const SETUP_TAGS = [
  "IFVG", "Order Block", "Breaker Block", "FVG", "Liquidity Sweep",
  "SMT Divergence", "ICT Silver Bullet", "Opening Range", "VWAP Bounce",
  "Trend Continuation", "Reversal", "Breakout", "Mean Reversion",
  "Gap Fill", "News Reaction",
];

export const SESSION_TAGS: SessionTag[] = [
  "Pre-Market", "London", "NY AM", "NY PM", "Asian", "Overnight",
];

export const MARKET_CONDITIONS: MarketCondition[] = [
  "Trending", "Ranging", "Choppy", "News-driven",
];

export const MISTAKE_TAGS: MistakeTag[] = [
  "Chased entry", "Moved SL", "Sized too big", "Broke rules",
  "Early exit", "Late entry", "No plan", "Revenge trade", "FOMO",
];

export const PLAYBOOKS = [
  "ICT Silver Bullet",
  "Liquidity Sweep + IFVG",
  "Opening Range Breakout",
  "VWAP Mean Reversion",
  "SMT + OB Confluence",
  "London Session Sweep",
  "Asian Range Breakout",
];

export const MINDSET_TAGS = [
  "Disciplined", "Patience", "Calm", "Focused", "Anxious", "Greedy", 
  "Fearful", "Revengeful", "FOMO", "Confident", "Hesitant", "Impulsive"
];

// ═══════════════════════════════
// Phase 2 Types
// ═══════════════════════════════

export interface Playbook {
  id: string;
  name: string;
  description: string;
  entryRules: string[];
  exitRules: string[];
  idealConditions: MarketCondition[];
  targetRR: number;
  maxRiskPercent: number;
  bestSessions: SessionTag[];
  linkedTradeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type AccountType = "manual" | "mt5-csv" | "mt5-ea";

export interface TradingAccount {
  id: string;
  name: string;
  type: AccountType;
  broker?: string;
  balance: number;
  startingBalance: number;
  linkedTradeIds: string[];
  apiKey?: string; // For EA bridge
  mt5AccountId?: string;
  createdAt: string;
}

export type PropFirmPhase = "Phase 1" | "Phase 2" | "Funded" | "Breached" | "Passed";

export interface PropFirmRules {
  firmName: string;
  profitTarget: number; // percent
  dailyLossLimit: number; // percent
  maxDrawdown: number; // percent
  minTradingDays: number;
  maxDuration: number; // days, 0 = unlimited
  trailingDrawdown: boolean;
  newsRestriction: boolean;
  weekendHolding: boolean;
}

export interface PropFirmChallenge {
  id: string;
  firmName: string;
  phase: PropFirmPhase;
  accountSize: number;
  rules: PropFirmRules;
  linkedAccountId?: string;
  startDate: string;
  endDate?: string;
  currentBalance: number;
  currentPnl: number;
  tradingDays: number;
  highWaterMark: number;
  status: "active" | "passed" | "breached" | "funded";
}

export const PROP_FIRM_RULES: Record<string, { phases: Record<string, PropFirmRules> }> = {
  "Lucid": {
    phases: {
      "Phase 1": { firmName: "Lucid", profitTarget: 10, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 0, maxDuration: 0, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
      "Phase 2": { firmName: "Lucid", profitTarget: 5, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 0, maxDuration: 0, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
      "Funded": { firmName: "Lucid", profitTarget: 0, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 0, maxDuration: 0, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
    },
  },
  "FTMO": {
    phases: {
      "Phase 1": { firmName: "FTMO", profitTarget: 10, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 4, maxDuration: 30, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
      "Phase 2": { firmName: "FTMO", profitTarget: 5, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 4, maxDuration: 60, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
    },
  },
  "Apex": {
    phases: {
      "Phase 1": { firmName: "Apex", profitTarget: 6, dailyLossLimit: 2.5, maxDrawdown: 6, minTradingDays: 7, maxDuration: 0, trailingDrawdown: true, newsRestriction: false, weekendHolding: false },
    },
  },
  "TopStep": {
    phases: {
      "Phase 1": { firmName: "TopStep", profitTarget: 6, dailyLossLimit: 2, maxDrawdown: 4, minTradingDays: 5, maxDuration: 0, trailingDrawdown: false, newsRestriction: true, weekendHolding: false },
      "Phase 2": { firmName: "TopStep", profitTarget: 3, dailyLossLimit: 2, maxDrawdown: 4, minTradingDays: 5, maxDuration: 0, trailingDrawdown: false, newsRestriction: true, weekendHolding: false },
    },
  },
  "MyForexFunds": {
    phases: {
      "Phase 1": { firmName: "MyForexFunds", profitTarget: 8, dailyLossLimit: 5, maxDrawdown: 12, minTradingDays: 5, maxDuration: 30, trailingDrawdown: false, newsRestriction: true, weekendHolding: true },
      "Phase 2": { firmName: "MyForexFunds", profitTarget: 5, dailyLossLimit: 5, maxDrawdown: 12, minTradingDays: 5, maxDuration: 60, trailingDrawdown: false, newsRestriction: true, weekendHolding: true },
    },
  },
  "E8 Funding": {
    phases: {
      "Phase 1": { firmName: "E8 Funding", profitTarget: 8, dailyLossLimit: 5, maxDrawdown: 8, minTradingDays: 0, maxDuration: 30, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
    },
  },
  "FundedNext": {
    phases: {
      "Phase 1": { firmName: "FundedNext", profitTarget: 10, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 5, maxDuration: 30, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
      "Phase 2": { firmName: "FundedNext", profitTarget: 5, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 5, maxDuration: 60, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
    },
  },
  "Goat Funded": {
    phases: {
      "Phase 1": { firmName: "Goat Funded", profitTarget: 8, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 3, maxDuration: 45, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
      "Phase 2": { firmName: "Goat Funded", profitTarget: 5, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 3, maxDuration: 45, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
    },
  },
  "Alpha Capital": {
    phases: {
      "Phase 1": { firmName: "Alpha Capital", profitTarget: 8, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 5, maxDuration: 30, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
      "Phase 2": { firmName: "Alpha Capital", profitTarget: 5, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 5, maxDuration: 60, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
    },
  },
  "Funding Pips": {
    phases: {
      "Phase 1": { firmName: "Funding Pips", profitTarget: 8, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 3, maxDuration: 0, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
      "Phase 2": { firmName: "Funding Pips", profitTarget: 5, dailyLossLimit: 5, maxDrawdown: 10, minTradingDays: 3, maxDuration: 0, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
    },
  },
  "The5ers": {
    phases: {
      "Phase 1": { firmName: "The5ers", profitTarget: 6, dailyLossLimit: 3, maxDrawdown: 6, minTradingDays: 3, maxDuration: 0, trailingDrawdown: false, newsRestriction: false, weekendHolding: true },
    },
  },
};
