"use client";
import { useTradeStore, useSettingsStore, useRiskStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { Shield, Calculator, AlertTriangle, Clock, Target, TrendingDown, Flame, CheckSquare, Square, RotateCcw, DollarSign, Percent, BarChart3, Lock } from "lucide-react";
import { format, isToday } from "date-fns";

function PositionSizeCalculator({ currentBalance, defaultRisk }: { currentBalance: number, defaultRisk: number }) {
  const [accountSize, setAccountSize] = useState(currentBalance.toString());
  const [riskPercent, setRiskPercent] = useState(defaultRisk.toString());
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  // Sync if balance or default risk changes
  useEffect(() => {
    setAccountSize(currentBalance.toString());
  }, [currentBalance]);

  useEffect(() => {
    setRiskPercent(defaultRisk.toString());
  }, [defaultRisk]);

  const result = useMemo(() => {
    const account = parseFloat(accountSize) || 0;
    const risk = parseFloat(riskPercent) || 0;
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    if (!account || !risk || !entry || !sl) return null;

    const riskAmount = account * (risk / 100);
    const priceDiff = Math.abs(entry - sl);
    if (priceDiff === 0) return null;

    const positionSize = riskAmount / priceDiff;
    const contracts = Math.floor(positionSize);
    const lotSize = parseFloat((positionSize / 100000).toFixed(2)); // Forex lots

    return { riskAmount, positionSize, contracts, lotSize, priceDiff };
  }, [accountSize, riskPercent, entryPrice, stopLoss]);

  return (
    <GlassCard>
      <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4 flex items-center gap-2">
        <Calculator size={16} className="text-accent-violet" /> Position Size Calculator
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Account Size</label>
          <div className="relative">
            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="number" value={accountSize} onChange={(e) => setAccountSize(e.target.value)}
              className="w-full bg-bg-card border border-border-subtle rounded-xl pl-8 pr-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40 transition-colors" />
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Risk %</label>
          <div className="relative">
            <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="number" step="0.25" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)}
              className="w-full bg-bg-card border border-border-subtle rounded-xl pl-8 pr-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40 transition-colors" />
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Entry Price</label>
          <input type="number" step="any" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="0.00"
            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-green/40 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Stop Loss</label>
          <input type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="0.00"
            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-coral/40 transition-colors" />
        </div>
      </div>

      {result && (
        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border-subtle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass-static p-3 rounded-xl text-center">
            <div className="text-[9px] text-text-muted uppercase">Risk Amount</div>
            <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-coral text-lg">${result.riskAmount.toFixed(2)}</div>
          </div>
          <div className="glass-static p-3 rounded-xl text-center">
            <div className="text-[9px] text-text-muted uppercase">Position Size</div>
            <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green text-lg">{result.positionSize.toFixed(2)}</div>
          </div>
          <div className="glass-static p-3 rounded-xl text-center">
            <div className="text-[9px] text-text-muted uppercase">Contracts</div>
            <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-violet text-lg">{result.contracts}</div>
          </div>
          <div className="glass-static p-3 rounded-xl text-center">
            <div className="text-[9px] text-text-muted uppercase">Forex Lots</div>
            <div className="font-[family-name:var(--font-space-mono)] font-bold text-text-primary text-lg">{result.lotSize}</div>
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
}

function RRCalculator() {
  const [entry, setEntry] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");

  const result = useMemo(() => {
    const e = parseFloat(entry), s = parseFloat(sl), t = parseFloat(tp);
    if (!e || !s || !t) return null;
    const risk = Math.abs(e - s);
    const reward = Math.abs(t - e);
    if (risk === 0) return null;
    return { rr: (reward / risk).toFixed(2), risk, reward };
  }, [entry, sl, tp]);

  return (
    <GlassCard>
      <h3 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4 flex items-center gap-2">
        <Target size={16} className="text-accent-green" /> R:R Calculator
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Entry</label>
          <input type="number" step="any" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="0.00"
            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Stop Loss</label>
          <input type="number" step="any" value={sl} onChange={(e) => setSl(e.target.value)} placeholder="0.00"
            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-coral/40 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Take Profit</label>
          <input type="number" step="any" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="0.00"
            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-green/40 transition-colors" />
        </div>
      </div>

      {result && (
        <motion.div className="flex items-center justify-center gap-6 pt-4 border-t border-border-subtle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-center">
            <div className="text-xs text-text-muted">Risk</div>
            <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-coral">{result.risk.toFixed(4)}</div>
          </div>
          <div className="text-2xl text-text-muted">:</div>
          <div className="text-center">
            <div className="text-xs text-text-muted">Reward</div>
            <div className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green">{result.reward.toFixed(4)}</div>
          </div>
          <div className="text-2xl text-text-muted">=</div>
          <div className="text-center">
            <div className="text-xs text-text-muted">R:R Ratio</div>
            <div className="font-[family-name:var(--font-syne)] font-bold text-2xl text-accent-violet">1:{result.rr}</div>
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
}

export default function RiskPage() {
  const { trades } = useTradeStore();
  const { settings, updateSettings } = useSettingsStore();
  const { checkedItems, setCheckedItems, resetIfNewDay } = useRiskStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    resetIfNewDay();
    setMounted(true);
  }, [resetIfNewDay]);

  const { maxLoss, maxTrades, maxRisk, checklist } = settings.trading;

  const todayTrades = useMemo(() => trades.filter((t) => {
    try { return isToday(new Date(t.entryDate)); } catch { return false; }
  }), [trades]);
  const todayPnl = todayTrades.reduce((s, t) => s + t.netPnl, 0);
  const dailyLossPct = Math.min((Math.abs(Math.min(todayPnl, 0)) / maxLoss) * 100, 100);

  // Consecutive losses
  const consecutiveLosses = useMemo(() => {
    let count = 0;
    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].result === "loss") count++;
      else break;
    }
    return count;
  }, [trades]);

  const toggleCheck = (text: string) => {
    if (checkedItems.includes(text)) {
      setCheckedItems(checkedItems.filter(item => item !== text));
    } else {
      setCheckedItems([...checkedItems, text]);
    }
  };
  const allChecked = checklist.length > 0 && checklist.every((text) => checkedItems.includes(text));

  const isLockedOut = (todayPnl < 0 && Math.abs(todayPnl) >= maxLoss) || todayTrades.length >= maxTrades;
  const currentBalance = trades.length > 0 ? trades[trades.length - 1].accountEquityAfter : 50000;

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl">Risk Command Center</h1>
          <p className="text-sm text-text-secondary mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
      </div>

      <AnimatePresence>
        {isLockedOut && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-accent-coral/10 border border-accent-coral/30 rounded-2xl p-6 flex items-start gap-4 shadow-[0_0_40px_rgba(255,45,85,0.15)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-accent-coral" />
            <div className="w-12 h-12 rounded-xl bg-accent-coral/20 flex items-center justify-center flex-shrink-0">
              <Lock size={24} className="text-accent-coral" />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl text-accent-coral mb-1">Trading Locked for Today</h2>
              <p className="text-sm text-text-primary max-w-2xl">
                You have reached your daily risk limits. Stepping away now protects your capital and prevents emotional revenge trading. Come back tomorrow with a clear mind.
              </p>
              <div className="flex gap-4 mt-3 text-xs">
                {Math.abs(Math.min(todayPnl, 0)) >= maxLoss && (
                  <span className="flex items-center gap-1.5 font-[family-name:var(--font-space-mono)] bg-accent-coral/20 text-accent-coral px-2.5 py-1 rounded-md">
                    <TrendingDown size={14} /> Max Loss Hit: {formatCurrency(Math.abs(todayPnl))} / {formatCurrency(maxLoss)}
                  </span>
                )}
                {todayTrades.length >= maxTrades && (
                  <span className="flex items-center gap-1.5 font-[family-name:var(--font-space-mono)] bg-accent-coral/20 text-accent-coral px-2.5 py-1 rounded-md">
                    <BarChart3 size={14} /> Max Trades Hit: {todayTrades.length} / {maxTrades}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Danger Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Daily P&L Gauge */}
        <GlassCard className={cn(todayPnl < 0 && Math.abs(todayPnl) >= maxLoss * 0.8 ? "border-accent-coral/30 ring-1 ring-accent-coral/20" : "")}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className={todayPnl < 0 ? "text-accent-coral" : "text-accent-green"} />
            <span className="text-xs text-text-muted uppercase">Today&apos;s P&L</span>
          </div>
          <div className={cn("font-[family-name:var(--font-space-mono)] font-bold text-2xl", todayPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
            {formatCurrency(todayPnl)}
          </div>
          {todayPnl < 0 && (
            <div className="mt-2">
              <div className="h-2 bg-bg-card rounded-full overflow-hidden border border-border-subtle relative">
                <motion.div className={cn("h-full rounded-full", dailyLossPct >= 80 ? "bg-accent-coral" : "bg-yellow-500")}
                  initial={{ width: 0 }} animate={{ width: `${dailyLossPct}%` }} transition={{ duration: 0.8 }} />
              </div>
              <div className="flex justify-between text-[10px] text-text-muted mt-1 font-[family-name:var(--font-space-mono)]">
                <span>{dailyLossPct.toFixed(0)}% Utilized</span>
                <span>{formatCurrency(maxLoss)} Limit</span>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Trade Count */}
        <GlassCard className={cn(todayTrades.length >= maxTrades ? "border-accent-coral/30" : "")}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-accent-violet" />
            <span className="text-xs text-text-muted uppercase">Trades Today</span>
          </div>
          <div className="font-[family-name:var(--font-space-mono)] font-bold text-2xl">
            {todayTrades.length}
            <span className="text-sm text-text-muted font-normal"> / {maxTrades}</span>
          </div>
          {todayTrades.length >= maxTrades && (
            <div className="mt-2 text-xs text-accent-coral flex items-center gap-1"><AlertTriangle size={12} /> Daily limit reached</div>
          )}
        </GlassCard>

        {/* Consecutive Losses */}
        <GlassCard className={cn(consecutiveLosses >= 3 ? "border-accent-coral/30" : "")}>
          <div className="flex items-center gap-2 mb-2">
            <Flame size={16} className={consecutiveLosses >= 3 ? "text-accent-coral" : "text-text-muted"} />
            <span className="text-xs text-text-muted uppercase">Loss Streak</span>
          </div>
          <div className={cn("font-[family-name:var(--font-space-mono)] font-bold text-2xl", consecutiveLosses >= 3 ? "text-accent-coral" : "")}>
            {consecutiveLosses}
          </div>
          {consecutiveLosses >= 3 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-accent-coral">
              <Clock size={12} /> Cooldown recommended
            </div>
          )}
        </GlassCard>

        {/* Checklist Status */}
        <GlassCard className={cn(allChecked ? "border-accent-green/20" : "border-yellow-500/20")}>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className={allChecked ? "text-accent-green" : "text-yellow-500"} />
            <span className="text-xs text-text-muted uppercase">Pre-Market Readiness</span>
          </div>
          <div className={cn("font-[family-name:var(--font-space-mono)] font-bold text-2xl", allChecked ? "text-accent-green" : "text-yellow-500")}>
            {checkedItems.length}/{checklist.length}
          </div>
          <div className="text-xs text-text-muted mt-1">{allChecked ? "✅ Cleared to Trade" : "⏳ Action Required"}</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pre-Market Checklist */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-base flex items-center gap-2">
              <CheckSquare size={16} className="text-accent-green" /> Pre-Market Checklist
            </h3>
            <button onClick={() => setCheckedItems([])}
              className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1 transition-colors">
              <RotateCcw size={12} /> Reset
            </button>
          </div>
          <div className="space-y-2">
            {checklist.length === 0 ? (
              <p className="text-sm text-text-muted italic">No checklist items configured. Add some in settings.</p>
            ) : (
              checklist.map((text, idx) => {
                const isDone = checkedItems.includes(text);
                return (
                  <button key={idx} onClick={() => toggleCheck(text)}
                    className={cn("w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                      isDone ? "bg-accent-green/5 border border-accent-green/15" : "bg-bg-card border border-border-subtle hover:border-accent-green/20")}>
                    {isDone ? (
                      <CheckSquare size={18} className="text-accent-green flex-shrink-0" />
                    ) : (
                      <Square size={18} className="text-text-muted flex-shrink-0" />
                    )}
                    <span className={cn("text-sm", isDone ? "text-text-primary line-through opacity-60" : "text-text-secondary")}>
                      {text}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </GlassCard>

        {/* Risk Settings */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-base flex items-center gap-2">
              <Shield size={16} className="text-accent-coral" /> Risk Limits
            </h3>
            <span className="text-xs text-text-muted">Auto-saves to cloud</span>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Daily Max Loss</span>
                <span className="font-[family-name:var(--font-space-mono)] font-bold text-accent-coral">${maxLoss}</span>
              </label>
              <input type="range" min={50} max={5000} step={50} value={maxLoss} onChange={(e) => updateSettings("trading", { maxLoss: parseInt(e.target.value) })}
                className="w-full accent-accent-coral h-1.5 rounded-full appearance-none bg-bg-card cursor-pointer" />
              <div className="flex justify-between text-[9px] text-text-muted mt-1 font-[family-name:var(--font-space-mono)]"><span>$50</span><span>$5,000</span></div>
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Max Trades Per Day</span>
                <span className="font-[family-name:var(--font-space-mono)] font-bold text-accent-violet">{maxTrades}</span>
              </label>
              <input type="range" min={1} max={20} value={maxTrades} onChange={(e) => updateSettings("trading", { maxTrades: parseInt(e.target.value) })}
                className="w-full accent-accent-violet h-1.5 rounded-full appearance-none bg-bg-card cursor-pointer" />
              <div className="flex justify-between text-[9px] text-text-muted mt-1 font-[family-name:var(--font-space-mono)]"><span>1</span><span>20</span></div>
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 flex justify-between">
                <span>Default Risk Per Trade (%)</span>
                <span className="font-[family-name:var(--font-space-mono)] font-bold text-accent-green">{maxRisk}%</span>
              </label>
              <input type="range" min={0.25} max={5} step={0.25} value={maxRisk} onChange={(e) => updateSettings("trading", { maxRisk: parseFloat(e.target.value) })}
                className="w-full accent-accent-green h-1.5 rounded-full appearance-none bg-bg-card cursor-pointer" />
              <div className="flex justify-between text-[9px] text-text-muted mt-1 font-[family-name:var(--font-space-mono)]"><span>0.25%</span><span>5%</span></div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Calculators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PositionSizeCalculator currentBalance={currentBalance} defaultRisk={maxRisk} />
        <RRCalculator />
      </div>
    </div>
  );
}
