"use client";
import { usePropFirmStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { PROP_FIRM_RULES, PropFirmPhase } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { Plus, Trophy, AlertTriangle, Shield, Clock, Calendar, TrendingUp, Flame, Target, CheckCircle, XCircle, Zap, ChevronDown, DollarSign } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";

function ProgressBar({ value, max, label, color = "bg-accent-green", danger = false }: {
  value: number; max: number; label: string; color?: string; danger?: boolean;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const isDanger = danger && pct >= 80;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-text-muted">{label}</span>
        <span className={cn("font-[family-name:var(--font-space-mono)] font-bold", isDanger ? "text-accent-coral" : value >= max ? "text-accent-green" : "text-text-secondary")}>
          {value.toFixed(2)}% / {max}%
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

function ChallengeCard({ challenge }: { challenge: ReturnType<typeof usePropFirmStore.getState>["challenges"][0] }) {
  const profitPct = (challenge.currentPnl / challenge.accountSize) * 100;
  const drawdownFromHWM = ((challenge.highWaterMark - challenge.currentBalance) / challenge.accountSize) * 100;
  const daysUsed = differenceInDays(new Date(), new Date(challenge.startDate));
  const daysLeft = challenge.rules.maxDuration > 0 ? challenge.rules.maxDuration - daysUsed : null;

  const profitTargetReached = profitPct >= challenge.rules.profitTarget;
  const dailyLimitBreached = false; // Would be computed from today's trades
  const drawdownBreached = drawdownFromHWM >= challenge.rules.maxDrawdown;
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
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg">{challenge.firmName}</h3>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium uppercase",
              challenge.status === "active" ? "bg-accent-green/10 text-accent-green" :
              challenge.status === "passed" ? "bg-accent-violet/10 text-accent-violet" :
              challenge.status === "funded" ? "bg-accent-green/10 text-accent-green" :
              "bg-accent-coral/10 text-accent-coral")}>
              {challenge.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-accent-violet">{challenge.phase}</span>
            <span className="text-xs text-text-muted">${challenge.accountSize.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("font-[family-name:var(--font-space-mono)] font-bold text-xl", profitPct >= 0 ? "text-accent-green" : "text-accent-coral")}>
            {profitPct >= 0 ? "+" : ""}{profitPct.toFixed(2)}%
          </div>
          <div className={cn("font-[family-name:var(--font-space-mono)] text-sm", challenge.currentPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
            {formatCurrency(challenge.currentPnl)}
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 mb-4">
        <ProgressBar value={profitPct} max={challenge.rules.profitTarget} label="Profit Target" color="bg-accent-green" />
        <ProgressBar value={drawdownFromHWM} max={challenge.rules.maxDrawdown} label={challenge.rules.trailingDrawdown ? "Trailing Drawdown" : "Max Drawdown"} color="bg-accent-coral" danger />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="glass-static p-2.5 rounded-lg text-center">
          <Calendar size={12} className="mx-auto text-accent-violet mb-1" />
          <div className="text-[9px] text-text-muted uppercase">Trading Days</div>
          <div className="font-[family-name:var(--font-space-mono)] text-sm font-bold">
            {challenge.tradingDays}/{challenge.rules.minTradingDays}
          </div>
        </div>
        {daysLeft !== null && (
          <div className="glass-static p-2.5 rounded-lg text-center">
            <Clock size={12} className={cn("mx-auto mb-1", daysLeft <= 5 ? "text-accent-coral" : "text-accent-violet")} />
            <div className="text-[9px] text-text-muted uppercase">Days Left</div>
            <div className={cn("font-[family-name:var(--font-space-mono)] text-sm font-bold", daysLeft <= 5 && "text-accent-coral")}>{daysLeft}</div>
          </div>
        )}
        <div className="glass-static p-2.5 rounded-lg text-center">
          <DollarSign size={12} className="mx-auto text-accent-green mb-1" />
          <div className="text-[9px] text-text-muted uppercase">Balance</div>
          <div className="font-[family-name:var(--font-space-mono)] text-sm font-bold">${challenge.currentBalance.toLocaleString()}</div>
        </div>
        <div className="glass-static p-2.5 rounded-lg text-center">
          <TrendingUp size={12} className="mx-auto text-accent-violet mb-1" />
          <div className="text-[9px] text-text-muted uppercase">HWM</div>
          <div className="font-[family-name:var(--font-space-mono)] text-sm font-bold">${challenge.highWaterMark.toLocaleString()}</div>
        </div>
      </div>

      {/* Rules Checklist */}
      <div className="space-y-1.5 pt-3 border-t border-border-subtle">
        <div className="text-[9px] text-text-muted uppercase tracking-wider mb-1">Rule Compliance</div>
        {[
          { label: `Profit target: ${challenge.rules.profitTarget}%`, ok: profitTargetReached, icon: Target },
          { label: `Min trading days: ${challenge.rules.minTradingDays}`, ok: minDaysMet, icon: Calendar },
          { label: `Daily loss limit: ${challenge.rules.dailyLossLimit}%`, ok: !dailyLimitBreached, icon: Shield },
          { label: `Max drawdown: ${challenge.rules.maxDrawdown}%${challenge.rules.trailingDrawdown ? " (trailing)" : ""}`, ok: !drawdownBreached, icon: AlertTriangle },
        ].map((rule, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {rule.ok ? <CheckCircle size={12} className="text-accent-green" /> : <XCircle size={12} className="text-accent-coral" />}
            <span className="text-text-secondary">{rule.label}</span>
          </div>
        ))}
        {challenge.rules.newsRestriction && (
          <div className="flex items-center gap-2 text-xs"><AlertTriangle size={12} className="text-yellow-500" /><span className="text-text-secondary">News trading restricted</span></div>
        )}
        {!challenge.rules.weekendHolding && (
          <div className="flex items-center gap-2 text-xs"><AlertTriangle size={12} className="text-yellow-500" /><span className="text-text-secondary">No weekend holding</span></div>
        )}
      </div>
    </GlassCard>
  );
}



export default function PropTrackerPage() {
  const { challenges, addChallenge } = usePropFirmStore();
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
  const phases = selectedFirm ? Object.keys(PROP_FIRM_RULES[selectedFirm].phases) : [];

  const filtered = statusFilter === "all" ? challenges : challenges.filter((c) => c.status === statusFilter);

  const handleAdd = () => {
    if (!selectedFirm || !selectedPhase) return;
    const rules = PROP_FIRM_RULES[selectedFirm].phases[selectedPhase];
    const size = parseInt(accountSize) || 100000;
    addChallenge({
      firmName: selectedFirm, phase: selectedPhase as PropFirmPhase, accountSize: size, rules,
      startDate: new Date().toISOString(), currentBalance: size, currentPnl: 0, tradingDays: 0, highWaterMark: size, status: "active",
    });
    setShowAdd(false);
    setSelectedFirm(""); setSelectedPhase(""); setAccountSize("100000");
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl">Prop Firm Tracker</h1>
          <p className="text-sm text-text-secondary mt-1">{challenges.length} challenge{challenges.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-accent-green text-bg-base px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-[0_0_30px_rgba(0,255,178,0.3)] transition-all">
          <Plus size={16} /> Add Challenge
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "active", "passed", "funded", "breached"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
              statusFilter === s ? "bg-accent-green/10 text-accent-green border border-accent-green/20" : "bg-bg-card text-text-muted border border-border-subtle")}>
            {s}
          </button>
        ))}
      </div>

      {/* Challenge Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <ChallengeCard challenge={c} />
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <GlassCard className="text-center py-12">
          <Trophy size={40} className="mx-auto text-text-muted mb-3 opacity-40" />
          <p className="text-sm text-text-muted">No {statusFilter !== "all" ? statusFilter : ""} challenges yet</p>
        </GlassCard>
      )}

      {/* Add Challenge Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
            <motion.div className="glass-static w-full max-w-md m-4 p-6 rounded-2xl"
              onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl mb-4">Add Challenge</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Prop Firm</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {firmNames.map((f) => (
                      <button key={f} onClick={() => { setSelectedFirm(f); setSelectedPhase(Object.keys(PROP_FIRM_RULES[f].phases)[0]); }}
                        className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-all text-left",
                          selectedFirm === f ? "bg-accent-green/15 text-accent-green border border-accent-green/30" : "bg-bg-card text-text-muted border border-border-subtle")}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedFirm && phases.length > 1 && (
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Phase</label>
                    <div className="flex gap-2">
                      {phases.map((p) => (
                        <button key={p} onClick={() => setSelectedPhase(p)}
                          className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                            selectedPhase === p ? "bg-accent-violet/15 text-accent-violet border border-accent-violet/30" : "bg-bg-card text-text-muted border border-border-subtle")}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Account Size</label>
                  <div className="flex gap-2">
                    {["25000", "50000", "100000", "200000"].map((s) => (
                      <button key={s} onClick={() => setAccountSize(s)}
                        className={cn("flex-1 py-2 rounded-lg text-xs font-medium font-[family-name:var(--font-space-mono)] transition-all",
                          accountSize === s ? "bg-accent-green/15 text-accent-green border border-accent-green/30" : "bg-bg-card text-text-muted border border-border-subtle")}>
                        ${parseInt(s).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rules Preview */}
                {selectedFirm && selectedPhase && PROP_FIRM_RULES[selectedFirm]?.phases[selectedPhase] && (
                  <div className="p-3 rounded-xl bg-bg-card border border-border-subtle">
                    <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Rules Preview</div>
                    {(() => {
                      const r = PROP_FIRM_RULES[selectedFirm].phases[selectedPhase];
                      return (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-text-muted">Target:</span> <span className="text-accent-green font-bold">{r.profitTarget}%</span></div>
                          <div><span className="text-text-muted">Daily Loss:</span> <span className="text-accent-coral font-bold">{r.dailyLossLimit}%</span></div>
                          <div><span className="text-text-muted">Max DD:</span> <span className="text-accent-coral font-bold">{r.maxDrawdown}%</span></div>
                          <div><span className="text-text-muted">Min Days:</span> <span className="font-bold">{r.minTradingDays}</span></div>
                          <div><span className="text-text-muted">Duration:</span> <span className="font-bold">{r.maxDuration > 0 ? `${r.maxDuration}d` : "∞"}</span></div>
                          <div><span className="text-text-muted">Trailing:</span> <span className="font-bold">{r.trailingDrawdown ? "Yes" : "No"}</span></div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-text-secondary">Cancel</button>
                <button onClick={handleAdd} disabled={!selectedFirm || !selectedPhase}
                  className="bg-accent-green text-bg-base px-6 py-2 rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,255,178,0.2)] transition-all disabled:opacity-40">
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
