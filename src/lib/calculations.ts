import { Trade, DailyStats, PerformanceMetrics, PropFirmChallenge } from "./types";
import { format, differenceInDays } from "date-fns";

export function calculateMetrics(trades: Trade[]): PerformanceMetrics {
  if (trades.length === 0) {
    return {
      totalNetPnl: 0, winRate: 0, profitFactor: 0, avgWin: 0, avgLoss: 0,
      maxDrawdown: 0, maxConsecutiveWins: 0, maxConsecutiveLosses: 0,
      avgRR: 0, avgHoldTime: 0, totalTrades: 0, totalCommissions: 0,
      sharpeRatio: 0, sortinoRatio: 0, expectancy: 0,
      bestDay: { date: "", pnl: 0 }, worstDay: { date: "", pnl: 0 },
      currentWinStreak: 0, currentLossStreak: 0, maxWinStreak: 0, maxLossStreak: 0,
    };
  }

  const wins = trades.filter(t => t.result === "win");
  const losses = trades.filter(t => t.result === "loss");
  const totalPnl = trades.reduce((s, t) => s + t.netPnl, 0);
  const totalComm = trades.reduce((s, t) => s + t.commission, 0);
  const grossWins = wins.reduce((s, t) => s + t.netPnl, 0);
  const grossLosses = Math.abs(losses.reduce((s, t) => s + t.netPnl, 0));

  // Streaks
  let curWin = 0, curLoss = 0, maxWin = 0, maxLoss = 0;
  let tempWin = 0, tempLoss = 0;
  for (const t of trades) {
    if (t.result === "win") { tempWin++; tempLoss = 0; }
    else if (t.result === "loss") { tempLoss++; tempWin = 0; }
    maxWin = Math.max(maxWin, tempWin);
    maxLoss = Math.max(maxLoss, tempLoss);
  }
  // Current streaks from end
  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].result === "win" && curLoss === 0) curWin++;
    else if (trades[i].result === "loss" && curWin === 0) curLoss++;
    else break;
  }

  // Max drawdown
  let peak = trades[0]?.accountEquityAfter ?? 0;
  let maxDD = 0;
  for (const t of trades) {
    peak = Math.max(peak, t.accountEquityAfter);
    const dd = ((peak - t.accountEquityAfter) / peak) * 100;
    maxDD = Math.max(maxDD, dd);
  }

  // Daily stats
  const dailyMap = getDailyStats(trades);
  const dailyPnls = dailyMap.map(d => d.pnl);
  const best = dailyMap.reduce((b, d) => d.pnl > b.pnl ? d : b, dailyMap[0]);
  const worst = dailyMap.reduce((w, d) => d.pnl < w.pnl ? d : w, dailyMap[0]);

  // Sharpe & Sortino (annualized, assuming 252 trading days)
  const meanDaily = dailyPnls.reduce((s, v) => s + v, 0) / dailyPnls.length;
  const variance = dailyPnls.reduce((s, v) => s + (v - meanDaily) ** 2, 0) / dailyPnls.length;
  const stdDev = Math.sqrt(variance);
  const downside = dailyPnls.filter(v => v < 0);
  const downsideVar = downside.length > 0
    ? downside.reduce((s, v) => s + v ** 2, 0) / downside.length
    : 0;
  const downsideDev = Math.sqrt(downsideVar);

  const sharpe = stdDev > 0 ? (meanDaily / stdDev) * Math.sqrt(252) : 0;
  const sortino = downsideDev > 0 ? (meanDaily / downsideDev) * Math.sqrt(252) : 0;

  const winRate = (wins.length / trades.length) * 100;
  const avgWin = wins.length > 0 ? grossWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLosses / losses.length : 0;
  const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;

  return {
    totalNetPnl: parseFloat(totalPnl.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(1)),
    profitFactor: grossLosses > 0 ? parseFloat((grossWins / grossLosses).toFixed(2)) : grossWins > 0 ? 999 : 0,
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    maxDrawdown: parseFloat(maxDD.toFixed(2)),
    maxConsecutiveWins: maxWin,
    maxConsecutiveLosses: maxLoss,
    avgRR: parseFloat((trades.reduce((s, t) => s + t.rr, 0) / trades.length).toFixed(2)),
    avgHoldTime: Math.round(trades.reduce((s, t) => s + t.durationMinutes, 0) / trades.length),
    totalTrades: trades.length,
    totalCommissions: parseFloat(totalComm.toFixed(2)),
    sharpeRatio: parseFloat(sharpe.toFixed(2)),
    sortinoRatio: parseFloat(sortino.toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    bestDay: { date: best?.date ?? "", pnl: best?.pnl ?? 0 },
    worstDay: { date: worst?.date ?? "", pnl: worst?.pnl ?? 0 },
    currentWinStreak: curWin,
    currentLossStreak: curLoss,
    maxWinStreak: maxWin,
    maxLossStreak: maxLoss,
  };
}

export function getDailyStats(trades: Trade[]): DailyStats[] {
  const map = new Map<string, DailyStats>();
  for (const t of trades) {
    try {
      const d = format(new Date(t.entryDate || new Date().toISOString()), "yyyy-MM-dd");
      const existing = map.get(d) ?? { date: d, pnl: 0, trades: 0, wins: 0, losses: 0 };
      existing.pnl += t.netPnl;
      existing.trades++;
      if (t.result === "win") existing.wins++;
      if (t.result === "loss") existing.losses++;
      map.set(d, existing);
    } catch (e) { console.warn("Invalid date in getDailyStats", e); }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function getEquityCurve(trades: Trade[]): { time: string; value: number }[] {
  const startEquity = trades.length > 0 ? trades[0].accountEquityAfter - trades[0].netPnl : 50000;
  const points = [{ time: "2025-03-31", value: startEquity }];
  for (const t of trades) {
    try {
      points.push({ time: format(new Date(t.exitDate || new Date().toISOString()), "yyyy-MM-dd"), value: t.accountEquityAfter });
    } catch (e) { console.warn("Invalid date in getEquityCurve", e); }
  }
  return points;
}

export function getWinRateByField(trades: Trade[], field: "symbol" | "sessionTag" | "marketCondition"): { name: string; winRate: number; total: number }[] {
  const map = new Map<string, { wins: number; total: number }>();
  for (const t of trades) {
    const key = t[field];
    const existing = map.get(key) ?? { wins: 0, total: 0 };
    existing.total++;
    if (t.result === "win") existing.wins++;
    map.set(key, existing);
  }
  return Array.from(map.entries())
    .map(([name, { wins, total }]) => ({ name, winRate: parseFloat(((wins / total) * 100).toFixed(1)), total }))
    .sort((a, b) => b.total - a.total);
}

export function getPnlBySymbol(trades: Trade[]): { symbol: string; pnl: number; trades: number }[] {
  const map = new Map<string, { pnl: number; trades: number }>();
  for (const t of trades) {
    const existing = map.get(t.symbol) ?? { pnl: 0, trades: 0 };
    existing.pnl += t.netPnl;
    existing.trades++;
    map.set(t.symbol, existing);
  }
  return Array.from(map.entries())
    .map(([symbol, data]) => ({ symbol, ...data }))
    .sort((a, b) => b.pnl - a.pnl);
}

export function getRMultipleDistribution(trades: Trade[]): { range: string; count: number }[] {
  const buckets: Record<string, number> = {
    "< -3R": 0, "-3R to -2R": 0, "-2R to -1R": 0, "-1R to 0R": 0,
    "0R to 1R": 0, "1R to 2R": 0, "2R to 3R": 0, "> 3R": 0,
  };
  for (const t of trades) {
    const r = t.rMultiple || 0;
    if (r < -3) buckets["< -3R"]++;
    else if (r < -2) buckets["-3R to -2R"]++;
    else if (r < -1) buckets["-2R to -1R"]++;
    else if (r < 0) buckets["-1R to 0R"]++;
    else if (r < 1) buckets["0R to 1R"]++;
    else if (r < 2) buckets["1R to 2R"]++;
    else if (r < 3) buckets["2R to 3R"]++;
    else buckets["> 3R"]++;
  }
  return Object.entries(buckets).map(([range, count]) => ({ range, count }));
}

export function getHourlyHeatmap(trades: Trade[]): { day: number; hour: number; avgPnl: number; count: number }[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const t of trades) {
    const d = new Date(t.entryDate || new Date().toISOString());
    const day = d.getDay() || 0;
    const hour = d.getHours() || 0;
    const key = `${day}-${hour}`;
    const existing = map.get(key) ?? { total: 0, count: 0 };
    existing.total += t.netPnl;
    existing.count++;
    map.set(key, existing);
  }
  const result: { day: number; hour: number; avgPnl: number; count: number }[] = [];
  for (let day = 1; day <= 5; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const data = map.get(`${day}-${hour}`);
      result.push({
        day, hour,
        avgPnl: data ? parseFloat((data.total / data.count).toFixed(2)) : 0,
        count: data?.count ?? 0,
      });
    }
  }
  return result;
}
export function getWinRateByMindset(trades: Trade[]): { name: string; winRate: number; total: number; pnl: number }[] {
  const map = new Map<string, { wins: number; total: number; pnl: number }>();
  for (const t of trades) {
    const tags = t.mindsetTags || [];
    if (tags.length === 0) {
      const key = "Untagged";
      const existing = map.get(key) ?? { wins: 0, total: 0, pnl: 0 };
      existing.total++;
      existing.pnl += t.netPnl;
      if (t.result === "win") existing.wins++;
      map.set(key, existing);
    } else {
      for (const tag of tags) {
        const existing = map.get(tag) ?? { wins: 0, total: 0, pnl: 0 };
        existing.total++;
        existing.pnl += t.netPnl;
        if (t.result === "win") existing.wins++;
        map.set(tag, existing);
      }
    }
  }
  return Array.from(map.entries())
    .map(([name, { wins, total, pnl }]) => ({ name, winRate: parseFloat(((wins / total) * 100).toFixed(1)), total, pnl }))
    .sort((a, b) => b.pnl - a.pnl);
}

export interface ComputedChallenge {
  currentBalance: number;
  currentPnl: number;
  highWaterMark: number;
  tradingDays: number;
  status: "active" | "passed" | "breached" | "funded";
  hasDailyLossBreach: boolean;
  hasDrawdownBreach: boolean;
  profitPct: number;
  drawdownPct: number;
  daysUsed: number;
  daysLeft: number | null;
  profitTargetReached: boolean;
  minDaysMet: boolean;
}

export function getComputedChallenge(challenge: PropFirmChallenge, trades: Trade[]): ComputedChallenge {
  const challengeTrades = trades.filter((t) => t.propChallengeId === challenge.id);
  const sorted = [...challengeTrades].sort((a, b) => new Date(a.entryDate || 0).getTime() - new Date(b.entryDate || 0).getTime());

  let balance = challenge.accountSize;
  let pnl = 0;
  let hwm = challenge.accountSize;

  const uniqueDays = new Set<string>();
  const dailyPnls: Record<string, number> = {};
  let hasDailyLossBreach = false;
  let hasDrawdownBreach = false;

  const isFutures = challenge.rules.isFutures;

  const dailyLossLimitVal = challenge.rules.dailyLossLimit
    ? (isFutures ? challenge.rules.dailyLossLimit : challenge.accountSize * (challenge.rules.dailyLossLimit / 100))
    : 0;

  const maxDrawdownVal = challenge.rules.maxDrawdown
    ? (isFutures ? challenge.rules.maxDrawdown : challenge.accountSize * (challenge.rules.maxDrawdown / 100))
    : 0;

  for (const t of sorted) {
    pnl += t.netPnl;
    balance += t.netPnl;

    if (balance > hwm) {
      hwm = balance;
    }

    const drawdown = challenge.rules.trailingDrawdown
      ? hwm - balance
      : challenge.accountSize - balance;

    if (maxDrawdownVal > 0 && drawdown > maxDrawdownVal) {
      hasDrawdownBreach = true;
    }

    const dateStr = t.entryDate.split("T")[0];
    uniqueDays.add(dateStr);
    dailyPnls[dateStr] = (dailyPnls[dateStr] || 0) + t.netPnl;

    if (dailyLossLimitVal > 0 && dailyPnls[dateStr] < -dailyLossLimitVal) {
      hasDailyLossBreach = true;
    }
  }

  const tradingDays = uniqueDays.size;

  // Determine status
  let status = challenge.status;
  if (hasDailyLossBreach || hasDrawdownBreach) {
    status = "breached";
  } else if (challenge.status === "active") {
    const targetPnl = isFutures
      ? challenge.rules.profitTarget
      : challenge.accountSize * (challenge.rules.profitTarget / 100);

    const targetReached = challenge.rules.profitTarget > 0 && pnl >= targetPnl;
    const minDaysMet = tradingDays >= challenge.rules.minTradingDays;
    if (targetReached && minDaysMet) {
      status = "passed";
    }
  }

  // If futures, value and max for progress are raw P&L and absolute profit target, respectively
  // For drawdowns, it's raw drawdown and absolute max drawdown limit
  const profitPct = isFutures ? pnl : (pnl / challenge.accountSize) * 100;
  const drawdownPct = isFutures 
    ? (challenge.rules.trailingDrawdown ? (hwm - balance) : Math.max(0, challenge.accountSize - balance))
    : (challenge.rules.trailingDrawdown
        ? ((hwm - balance) / challenge.accountSize) * 100
        : Math.max(0, ((challenge.accountSize - balance) / challenge.accountSize) * 100));

  const daysUsed = differenceInDays(new Date(), new Date(challenge.startDate || new Date().toISOString()));
  const daysLeft = challenge.rules.maxDuration > 0 ? challenge.rules.maxDuration - daysUsed : null;

  const profitTargetReached = isFutures
    ? (challenge.rules.profitTarget > 0 && pnl >= challenge.rules.profitTarget)
    : (challenge.rules.profitTarget > 0 && profitPct >= challenge.rules.profitTarget);

  const minDaysMet = tradingDays >= challenge.rules.minTradingDays;

  return {
    currentBalance: parseFloat(balance.toFixed(2)),
    currentPnl: parseFloat(pnl.toFixed(2)),
    highWaterMark: parseFloat(hwm.toFixed(2)),
    tradingDays,
    status,
    hasDailyLossBreach,
    hasDrawdownBreach,
    profitPct,
    drawdownPct,
    daysUsed,
    daysLeft,
    profitTargetReached,
    minDaysMet
  };
}
