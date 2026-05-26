"use client";
import { usePropFirmStore, useTradeStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { PROP_FIRM_RULES, PropFirmPhase, PropFirmChallenge, getRulesForChallenge } from "@/lib/types";
import { getComputedChallenge } from "@/lib/calculations";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { 
  Plus, Trophy, AlertTriangle, Shield, Clock, Calendar, 
  TrendingUp, Flame, Target, CheckCircle, XCircle, Zap, 
  ChevronDown, ChevronUp, DollarSign, Trash2, Link as LinkIcon, 
  Link2Off, Check 
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

function ProgressBar({ value, max, label, color = "bg-accent-green", danger = false, isCurrency = false }: {
  value: number; max: number; label: string; color?: string; danger?: boolean; isCurrency?: boolean;
}) {
  // Prevent wrapping or negative calculations
  const displayValue = Math.max(0, value);
  const pct = Math.min((displayValue / max) * 100, 100);
  const isDanger = danger && pct >= 80;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5 select-none">
        <span className="text-text-muted">{label}</span>
        <span className={cn("font-[family-name:var(--font-space-mono)] font-bold", isDanger ? "text-accent-coral" : value >= max ? "text-accent-green" : "text-text-secondary")}>
          {isCurrency ? formatCurrency(value) : `${value.toFixed(2)}%`} / {isCurrency ? formatCurrency(max) : `${max}%`}
        </span>
      </div>
      <div className="h-2.5 bg-bg-card rounded-full overflow-hidden border border-border-subtle">
        <motion.div
          className={cn("h-full rounded-full", isDanger ? "bg-accent-coral" : color)}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function LogTradeModal({ challenge, onClose }: { challenge: PropFirmChallenge; onClose: () => void }) {
  const { addTrade } = useTradeStore();
  const [symbol, setSymbol] = useState("NQ");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [pnl, setPnl] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!symbol || !pnl) return;
    const value = parseFloat(pnl) || 0;
    
    addTrade({
      symbol,
      direction,
      entryDate: new Date().toISOString(),
      exitDate: new Date().toISOString(),
      commission: 0,
      netPnl: value,
      rMultiple: 0,
      rr: 0,
      result: value >= 0 ? "win" : "loss",
      emotion: 0,
      preTradeNotes: notes || `Direct entry into ${challenge.firmName}`,
      postTradeReview: "",
      setupTags: [],
      sessionTag: "NY AM",
      marketCondition: "Trending",
      mistakeTags: [],
      playbook: undefined,
      durationMinutes: 5,
      accountEquityAfter: 0,
      screenshotUrls: [],
      mindsetTags: [],
      propChallengeId: challenge.id
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div className="glass-static w-full max-w-sm m-4 p-5 rounded-2xl"
        onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg mb-3">Quick Log: {challenge.firmName}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Contract / Symbol</label>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-sm font-[family-name:var(--font-space-mono)]" />
          </div>
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Direction</label>
            <div className="flex gap-2">
              <button onClick={() => setDirection("long")}
                className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  direction === "long" ? "bg-accent-green/10 text-accent-green border-accent-green/20" : "bg-bg-card text-text-muted border-border-subtle")}>
                Long
              </button>
              <button onClick={() => setDirection("short")}
                className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  direction === "short" ? "bg-accent-coral/10 text-accent-coral border-accent-coral/20" : "bg-bg-card text-text-muted border-border-subtle")}>
                Short
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Net P&L ($)</label>
            <input type="number" value={pnl} onChange={(e) => setPnl(e.target.value)} placeholder="e.g. 500 or -250"
              className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-sm font-[family-name:var(--font-space-mono)]" />
          </div>
          <div>
            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Quick Note</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Setup, details..."
              className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-xs resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2.5 mt-5">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-text-secondary">Cancel</button>
          <button onClick={handleSave} disabled={!symbol || !pnl}
            className="bg-gradient-to-r from-accent-green to-accent-blue text-bg-base shadow-[0_0_20px_rgba(0,255,178,0.2)] hover:shadow-[0_0_30px_rgba(0,255,178,0.35)] px-5 py-1.5 rounded-xl text-xs font-bold hover:shadow-[0_0_15px_rgba(0,255,178,0.2)] transition-all disabled:opacity-40">
            Submit Trade
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BulkLinkModal({ challenge, onClose }: { challenge: PropFirmChallenge; onClose: () => void }) {
  const { trades, updateTrade } = useTradeStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const unlinkedTrades = useMemo(() => {
    return trades.filter((t) => !t.propChallengeId);
  }, [trades]);

  const handleLink = () => {
    selectedIds.forEach((id) => {
      updateTrade(id, { propChallengeId: challenge.id });
    });
    onClose();
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div className="glass-static w-full max-w-md max-h-[80vh] overflow-y-auto m-4 p-5 rounded-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
        <div>
          <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg mb-1">Bulk Link: {challenge.firmName}</h3>
          <p className="text-xs text-text-secondary mb-3">Select from your unlinked trading logs to load them into this challenge</p>
          
          <div className="space-y-1.5 overflow-y-auto max-h-[45vh] no-scrollbar pr-1">
            {unlinkedTrades.length > 0 ? (
              unlinkedTrades.map((t) => {
                const isSelected = selectedIds.includes(t.id);
                return (
                  <div key={t.id} onClick={() => toggleSelect(t.id)}
                    className={cn("flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all",
                      isSelected ? "bg-accent-violet/5 border-accent-violet/20" : "bg-white/[0.01] border-white/[0.03] hover:border-white/10")}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-4 h-4 rounded flex items-center justify-center border", isSelected ? "bg-accent-violet border-accent-violet text-white" : "border-white/20")}>
                        {isSelected && <Check size={10} className="stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-[family-name:var(--font-space-mono)] font-bold text-xs">{t.symbol}</span>
                          <span className={cn("text-[8px] px-1 py-0.5 rounded uppercase font-black", t.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral")}>
                            {t.direction}
                          </span>
                        </div>
                        <div className="text-[9px] text-text-muted mt-0.5">{format(new Date(t.entryDate), "MMM d, h:mm a")}</div>
                      </div>
                    </div>
                    <div className="font-[family-name:var(--font-space-mono)] font-bold text-xs text-text-primary">
                      {t.netPnl >= 0 ? "+" : ""}{formatCurrency(t.netPnl)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-text-muted">All logged trades are already linked to a challenge!</div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-white/[0.05]">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-text-secondary">Cancel</button>
          <button onClick={handleLink} disabled={selectedIds.length === 0}
            className="bg-gradient-to-r from-accent-violet to-accent-blue text-white shadow-[0_0_20px_rgba(143,0,255,0.2)] hover:shadow-[0_0_30px_rgba(143,0,255,0.35)] px-5 py-1.5 rounded-xl text-xs font-bold hover:shadow-[0_0_15px_rgba(123,97,255,0.2)] transition-all disabled:opacity-40">
            Link {selectedIds.length} Trade{selectedIds.length !== 1 ? "s" : ""}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ChallengeCard({ challenge }: { challenge: PropFirmChallenge & { hasDailyLossBreach: boolean; hasDrawdownBreach: boolean } }) {
  const { deleteChallenge } = usePropFirmStore();
  const allTrades = useTradeStore((s) => s.trades);
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTradesList, setShowTradesList] = useState(false);

  const linkedTrades = useMemo(() => {
    return allTrades.filter((t) => t.propChallengeId === challenge.id);
  }, [allTrades, challenge.id]);

  const profitPct = (challenge.currentPnl / challenge.accountSize) * 100;
  const drawdownFromHWM = challenge.rules.trailingDrawdown
    ? ((challenge.highWaterMark - challenge.currentBalance) / challenge.accountSize) * 100
    : Math.max(0, ((challenge.accountSize - challenge.currentBalance) / challenge.accountSize) * 100);
  const daysUsed = differenceInDays(new Date(), new Date(challenge.startDate));
  const daysLeft = challenge.rules.maxDuration > 0 ? challenge.rules.maxDuration - daysUsed : null;

  const profitTargetReached = challenge.rules.profitTarget > 0 && challenge.currentPnl >= challenge.rules.profitTarget;
  const dailyLimitBreached = challenge.hasDailyLossBreach;
  const drawdownBreached = challenge.hasDrawdownBreach;
  const minDaysMet = challenge.tradingDays >= challenge.rules.minTradingDays;

  return (
    <GlassCard className={cn(
      challenge.status === "breached" ? "border-accent-coral/20" :
      challenge.status === "passed" || challenge.status === "funded" ? "border-accent-green/20" : ""
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg leading-none">{challenge.firmName}</h3>
            <span className={cn("text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider leading-none",
              challenge.status === "active" ? "bg-accent-green/10 text-accent-green animate-pulse" :
              challenge.status === "passed" ? "bg-accent-violet/10 text-accent-violet" :
              challenge.status === "funded" ? "bg-accent-green/10 text-accent-green border border-accent-green/25 shadow-[0_0_10px_rgba(0,255,178,0.08)]" :
              "bg-accent-coral/10 text-accent-coral shadow-[0_0_10px_rgba(255,45,85,0.2)]")}>
              {challenge.status}
            </span>
            {challenge.rules.isFutures && (
              <span className="text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider leading-none bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                FUTURES
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 select-none">
            <span className="text-xs text-accent-violet font-semibold leading-none">{challenge.phase}</span>
            <span className="text-xs text-text-muted leading-none font-medium">${challenge.accountSize.toLocaleString()} Starting</span>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("font-[family-name:var(--font-space-mono)] font-bold text-xl leading-none", challenge.currentPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
            {challenge.currentPnl >= 0 ? "+" : ""}{((challenge.currentPnl / challenge.accountSize) * 100).toFixed(1)}%
          </div>
          <div className={cn("font-[family-name:var(--font-space-mono)] text-xs font-semibold mt-1", challenge.currentPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
            {formatCurrency(challenge.currentPnl)}
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3.5 mb-4">
        <ProgressBar 
          value={challenge.rules.isFutures ? challenge.currentPnl : profitPct} 
          max={challenge.rules.profitTarget} 
          label="Profit Target" 
          color="bg-accent-green" 
          isCurrency={challenge.rules.isFutures} 
        />
        <ProgressBar 
          value={challenge.rules.isFutures 
            ? (challenge.rules.trailingDrawdown ? (challenge.highWaterMark - challenge.currentBalance) : Math.max(0, challenge.accountSize - challenge.currentBalance)) 
            : drawdownFromHWM} 
          max={challenge.rules.maxDrawdown} 
          label={challenge.rules.trailingDrawdown ? "Trailing Drawdown" : "Max Drawdown"} 
          color="bg-accent-coral" 
          danger 
          isCurrency={challenge.rules.isFutures} 
        />
      </div>

      {/* Stats Grid */}
      <div className={cn("grid gap-3 mb-4 select-none", challenge.rules.maxContracts ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4")}>
        <div className="glass-static p-2.5 rounded-xl text-center">
          <Calendar size={12} className="mx-auto text-accent-violet mb-1" />
          <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider">Trading Days</div>
          <div className="font-[family-name:var(--font-space-mono)] text-xs font-black mt-0.5">
            {challenge.tradingDays}/{challenge.rules.minTradingDays}
          </div>
        </div>
        {daysLeft !== null && (
          <div className="glass-static p-2.5 rounded-xl text-center">
            <Clock size={12} className={cn("mx-auto mb-1", daysLeft <= 5 ? "text-accent-coral" : "text-accent-violet")} />
            <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider">Days Left</div>
            <div className={cn("font-[family-name:var(--font-space-mono)] text-xs font-black mt-0.5", daysLeft <= 5 && "text-accent-coral")}>{daysLeft}</div>
          </div>
        )}
        <div className="glass-static p-2.5 rounded-xl text-center">
          <DollarSign size={12} className="mx-auto text-accent-green mb-1" />
          <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider">Balance</div>
          <div className="font-[family-name:var(--font-space-mono)] text-xs font-black mt-0.5">${challenge.currentBalance.toLocaleString()}</div>
        </div>
        <div className="glass-static p-2.5 rounded-xl text-center">
          <TrendingUp size={12} className="mx-auto text-accent-violet mb-1" />
          <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider">HWM</div>
          <div className="font-[family-name:var(--font-space-mono)] text-xs font-black mt-0.5">${challenge.highWaterMark.toLocaleString()}</div>
        </div>
        {challenge.rules.maxContracts && (
          <div className="glass-static p-2.5 rounded-xl text-center">
            <Zap size={12} className="mx-auto text-accent-blue mb-1" />
            <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider">Max Size</div>
            <div className="font-[family-name:var(--font-space-mono)] text-xs font-black mt-0.5">{challenge.rules.maxContracts} Contracts</div>
          </div>
        )}
      </div>

      {/* Rules Checklist */}
      <div className="space-y-1.5 pt-3 border-t border-white/[0.05] select-none">
        <div className="text-[8px] text-text-muted uppercase tracking-wider mb-1 font-bold">Rule Compliance Status</div>
        {[
          { 
            label: `Profit target: ${challenge.rules.isFutures ? formatCurrency(challenge.rules.profitTarget) : `${challenge.rules.profitTarget}%`}`, 
            ok: profitTargetReached, 
            icon: Target 
          },
          { 
            label: `Min trading days: ${challenge.rules.minTradingDays}`, 
            ok: minDaysMet, 
            icon: Calendar 
          },
          { 
            label: `Daily loss limit: ${challenge.rules.isFutures ? (challenge.rules.dailyLossLimit > 0 ? formatCurrency(challenge.rules.dailyLossLimit) : "None") : `${challenge.rules.dailyLossLimit}%`}`, 
            ok: !dailyLimitBreached, 
            icon: Shield 
          },
          { 
            label: `Max drawdown: ${challenge.rules.isFutures ? formatCurrency(challenge.rules.maxDrawdown) : `${challenge.rules.maxDrawdown}%`}${challenge.rules.trailingDrawdown ? " (trailing)" : ""}`, 
            ok: !drawdownBreached, 
            icon: AlertTriangle 
          },
        ].map((rule, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {rule.ok ? <CheckCircle size={12} className="text-accent-green" /> : <XCircle size={12} className="text-accent-coral" />}
            <span className="text-text-secondary font-medium">{rule.label}</span>
          </div>
        ))}
        {challenge.rules.newsRestriction && (
          <div className="flex items-center gap-2 text-xs"><AlertTriangle size={12} className="text-yellow-500" /><span className="text-text-secondary font-medium">News trading restricted</span></div>
        )}
        {!challenge.rules.weekendHolding && (
          <div className="flex items-center gap-2 text-xs"><AlertTriangle size={12} className="text-yellow-500" /><span className="text-text-secondary font-medium">No weekend holding</span></div>
        )}
      </div>

      {/* Interactive Cockpit Button Group */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 mt-4 border-t border-white/[0.05]">
        <div className="flex gap-2">
          <button onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 bg-accent-green/10 text-accent-green border border-accent-green/20 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-accent-green/20 transition-all">
            <Plus size={12} /> Log Trade
          </button>
          <button onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-1.5 bg-accent-violet/10 text-accent-violet border border-accent-violet/20 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-accent-violet/20 transition-all">
            <LinkIcon size={12} /> Link Existing
          </button>
        </div>
        <div className="flex gap-2">
          {linkedTrades.length > 0 && (
            <button onClick={() => setShowTradesList(!showTradesList)}
              className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] text-text-secondary px-3 py-1.5 rounded-xl text-xs font-semibold hover:border-white/10 transition-all">
              {linkedTrades.length} Trade{linkedTrades.length !== 1 ? "s" : ""} {showTradesList ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <button onClick={() => { if(confirm("Are you sure you want to delete this challenge tracker? Linked trades will not be deleted but will be unlinked.")) deleteChallenge(challenge.id); }}
            className="p-1.5 rounded-xl text-text-muted hover:text-accent-coral hover:bg-accent-coral/10 transition-all" title="Delete Challenge">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expandable Live Audit Logs / Linked Trades list */}
      <AnimatePresence>
        {showTradesList && linkedTrades.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-4 pt-3.5 border-t border-white/[0.05]"
          >
            <div className="text-[8px] text-text-muted uppercase font-bold tracking-wider mb-2 select-none">Linked Execution Audit Logs</div>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto no-scrollbar pr-1">
              {linkedTrades.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/[0.03] hover:border-white/[0.08] transition-all">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none",
                      t.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral")}>
                      {t.direction}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-[family-name:var(--font-space-mono)] font-bold text-xs leading-none">{t.symbol}</span>
                        <span className="text-[8px] text-text-muted font-bold leading-none select-none">
                          {format(new Date(t.entryDate), "MMM d")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("font-[family-name:var(--font-space-mono)] font-bold text-xs leading-none",
                      t.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                      {t.netPnl >= 0 ? "+" : ""}{formatCurrency(t.netPnl)}
                    </span>
                    <button onClick={() => useTradeStore.getState().updateTrade(t.id, { propChallengeId: "" })}
                      className="p-1 rounded text-text-muted hover:text-accent-coral transition-colors" title="Unlink Trade">
                      <Link2Off size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay Modals */}
      <AnimatePresence>
        {showLogModal && (
          <LogTradeModal challenge={challenge} onClose={() => setShowLogModal(false)} />
        )}
        {showLinkModal && (
          <BulkLinkModal challenge={challenge} onClose={() => setShowLinkModal(false)} />
        )}
      </AnimatePresence>

    </GlassCard>
  );
}

export default function PropTrackerPage() {
  const { challenges, addChallenge } = usePropFirmStore();
  const { trades } = useTradeStore();
  const [mounted, setMounted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [accountSize, setAccountSize] = useState("100000");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const firmNames = Object.keys(PROP_FIRM_RULES);
  
  // Resolve phases list depending on selection
  const phases = selectedFirm ? Object.keys(PROP_FIRM_RULES[selectedFirm].phases) : [];

  // Determine selectable account size options depending on firm type
  const isFuturesFirm = selectedFirm ? !!PROP_FIRM_RULES[selectedFirm]?.isFutures : false;
  const sizeOptions = isFuturesFirm ? ["25000", "50000", "100000", "150000"] : ["25000", "50000", "100000", "200000"];

  const computedChallenges = useMemo(() => {
    return challenges.map(c => {
      const comp = getComputedChallenge(c, trades);
      return {
        ...c,
        ...comp
      };
    });
  }, [challenges, trades]);

  const filtered = statusFilter === "all" ? computedChallenges : computedChallenges.filter((c) => c.status === statusFilter);

  const handleAdd = () => {
    if (!selectedFirm || !selectedPhase) return;
    const size = parseInt(accountSize) || 100000;
    
    // Resolve rules dynamically (supports absolute values & contract sizes for Futures!)
    const rules = getRulesForChallenge(selectedFirm, selectedPhase, size);
    
    addChallenge({
      firmName: selectedFirm, phase: selectedPhase as PropFirmPhase, accountSize: size, rules,
      startDate: new Date().toISOString(), currentBalance: size, currentPnl: 0, tradingDays: 0, highWaterMark: size, status: "active",
    });
    
    setShowAdd(false);
    setSelectedFirm(""); setSelectedPhase(""); setAccountSize("100000");
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-inter)] font-black text-2xl leading-none">Prop Firm Cockpit</h1>
          <p className="text-sm text-text-secondary mt-1 font-semibold">{challenges.length} active challenge account{challenges.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-accent-green to-accent-blue text-bg-base shadow-[0_0_20px_rgba(0,255,178,0.2)] hover:shadow-[0_0_30px_rgba(0,255,178,0.35)] px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-[0_0_25px_rgba(0,255,178,0.3)] transition-all">
          <Plus size={16} className="stroke-[3]" /> Add Account
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "active", "passed", "funded", "breached"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize border",
              statusFilter === s 
                ? "bg-accent-green/10 text-accent-green border-accent-green/20" 
                : "bg-bg-card text-text-secondary border-transparent hover:border-border-subtle hover:text-text-primary")}>
            {s}
          </button>
        ))}
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, type: "spring", stiffness: 350, damping: 26 }}>
            <ChallengeCard challenge={c} />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <GlassCard className="text-center py-16 flex flex-col items-center justify-center">
          <Trophy size={40} className="text-text-muted mb-3 opacity-25" />
          <p className="text-sm text-text-muted font-semibold">No {statusFilter !== "all" ? statusFilter : ""} challenges found</p>
        </GlassCard>
      )}

      {/* Add Challenge Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <motion.div className="glass-static w-full max-w-md m-4 p-6 rounded-2xl"
              onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <h2 className="font-[family-name:var(--font-inter)] font-bold text-xl mb-4">Add Challenge</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Prop Firm Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {firmNames.map((f) => {
                      const isFutures = !!PROP_FIRM_RULES[f]?.isFutures;
                      return (
                        <button key={f} onClick={() => { setSelectedFirm(f); setSelectedPhase(Object.keys(PROP_FIRM_RULES[f].phases)[0]); }}
                          className={cn("px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left flex flex-col justify-between h-[52px]",
                            selectedFirm === f ? "bg-accent-green/15 text-accent-green border-accent-green/30" : "bg-bg-card text-text-secondary border-border-subtle hover:border-white/10")}>
                          <span className="font-bold">{f}</span>
                          <span className={cn("text-[7px] font-black uppercase tracking-wider px-1 py-0.5 rounded leading-none self-start",
                            isFutures ? "bg-accent-blue/10 text-accent-blue" : "bg-accent-violet/10 text-accent-violet")}>
                            {isFutures ? "FUTURES" : "FOREX"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedFirm && phases.length > 1 && (
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Evaluation Phase</label>
                    <div className="flex gap-2">
                      {phases.map((p) => (
                        <button key={p} onClick={() => setSelectedPhase(p)}
                          className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all border",
                            selectedPhase === p ? "bg-accent-violet/15 text-accent-violet border-accent-violet/30" : "bg-bg-card text-text-secondary border-border-subtle")}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Account Program Size</label>
                  <div className="flex gap-2">
                    {sizeOptions.map((s) => (
                      <button key={s} onClick={() => setAccountSize(s)}
                        className={cn("flex-1 py-2.5 rounded-lg text-xs font-black font-[family-name:var(--font-space-mono)] border transition-all",
                          accountSize === s ? "bg-accent-green/15 text-accent-green border-accent-green/30" : "bg-bg-card text-text-secondary border-border-subtle hover:border-white/10")}>
                        ${parseInt(s).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rules Preview */}
                {selectedFirm && selectedPhase && (
                  <div className="p-3.5 rounded-xl bg-bg-card border border-border-subtle relative overflow-hidden select-none">
                    <div className="text-[8px] text-text-muted uppercase tracking-wider mb-2 font-bold">Automatic Program Specifications Preview</div>
                    {(() => {
                      const size = parseInt(accountSize) || 100000;
                      const r = getRulesForChallenge(selectedFirm, selectedPhase, size);
                      return (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-text-muted">Target:</span>{" "}
                            <span className="text-accent-green font-bold">
                              {r.isFutures ? formatCurrency(r.profitTarget) : `${r.profitTarget}%`}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted">Daily Loss Limit:</span>{" "}
                            <span className="text-accent-coral font-bold">
                              {r.isFutures 
                                ? (r.dailyLossLimit > 0 ? formatCurrency(r.dailyLossLimit) : "None") 
                                : `${r.dailyLossLimit}%`}
                            </span>
                          </div>
                          <div>
                            <span className="text-text-muted">Max Drawdown:</span>{" "}
                            <span className="text-accent-coral font-bold">
                              {r.isFutures ? formatCurrency(r.maxDrawdown) : `${r.maxDrawdown}%`}
                            </span>
                          </div>
                          <div><span className="text-text-muted">Min Days:</span> <span className="font-bold">{r.minTradingDays}</span></div>
                          <div><span className="text-text-muted">Duration:</span> <span className="font-bold">{r.maxDuration > 0 ? `${r.maxDuration}d` : "∞"}</span></div>
                          <div><span className="text-text-muted">Trailing Drawdown:</span> <span className="font-bold">{r.trailingDrawdown ? "Yes" : "No"}</span></div>
                          {r.isFutures && r.maxContracts && (
                            <div className="col-span-2 text-accent-blue font-black tracking-widest text-[9px] uppercase mt-1 border-t border-white/[0.03] pt-1">
                              Max leverage: {r.maxContracts} Max Contracts Allowed
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-text-secondary">Cancel</button>
                <button onClick={handleAdd} disabled={!selectedFirm || !selectedPhase}
                  className="bg-gradient-to-r from-accent-green to-accent-blue text-bg-base shadow-[0_0_20px_rgba(0,255,178,0.2)] hover:shadow-[0_0_30px_rgba(0,255,178,0.35)] px-6 py-2 rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(0,255,178,0.2)] transition-all disabled:opacity-40">
                  Start Challenge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
