"use client";
import { usePlaybookStore, useTradeStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCurrency } from "@/lib/utils";
import { MARKET_CONDITIONS, SESSION_TAGS, MarketCondition, SessionTag } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { Plus, BookOpen, Target, Clock, TrendingUp, ChevronRight, X, Check, BarChart3, Zap, Shield } from "lucide-react";

export default function PlaybookPage() {
  const { playbooks, addPlaybook, deletePlaybook } = usePlaybookStore();
  const { trades } = useTradeStore();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [entryRules, setEntryRules] = useState<string[]>([""]);
  const [exitRules, setExitRules] = useState<string[]>([""]);
  const [conditions, setConditions] = useState<MarketCondition[]>(["Trending"]);
  const [sessions, setSessions] = useState<SessionTag[]>(["NY AM"]);
  const [targetRR, setTargetRR] = useState("2");
  const [maxRisk, setMaxRisk] = useState("1");

  const playbookStats = useMemo(() => {
    return playbooks.map((pb) => {
      const linked = trades.filter((t) => pb.linkedTradeIds.includes(t.id) || t.playbook === pb.name);
      const wins = linked.filter((t) => t.result === "win").length;
      const totalPnl = linked.reduce((s, t) => s + t.netPnl, 0);
      const avgR = linked.length > 0 ? linked.reduce((s, t) => s + (t.rMultiple || 0), 0) / linked.length : 0;
      return { ...pb, tradeCount: linked.length, winRate: linked.length > 0 ? (wins / linked.length) * 100 : 0, totalPnl, avgR };
    });
  }, [playbooks, trades]);

  const selected = selectedId ? playbookStats.find((p) => p.id === selectedId) : null;

  const handleCreate = () => {
    if (!name.trim()) return;
    addPlaybook({
      name, description,
      entryRules: entryRules.filter((r) => r.trim()),
      exitRules: exitRules.filter((r) => r.trim()),
      idealConditions: conditions,
      targetRR: parseFloat(targetRR) || 2,
      maxRiskPercent: parseFloat(maxRisk) || 1,
      bestSessions: sessions,
      linkedTradeIds: [],
    });
    setShowCreate(false);
    setName(""); setDescription(""); setEntryRules([""]); setExitRules([""]); setConditions(["Trending"]); setSessions(["NY AM"]); setTargetRR("2"); setMaxRisk("1");
  };

  const addRule = (list: string[], setter: (v: string[]) => void) => setter([...list, ""]);
  const updateRule = (list: string[], setter: (v: string[]) => void, idx: number, val: string) => {
    const updated = [...list];
    updated[idx] = val;
    setter(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl">Playbook</h1>
          <p className="text-sm text-text-secondary mt-1">{playbooks.length} strategies documented</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-accent-green text-bg-base px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-[0_0_30px_rgba(0,255,178,0.3)] transition-all">
          <Plus size={16} /> New Playbook
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Playbook List */}
        <div className="lg:col-span-1 space-y-3">
          {playbookStats.map((pb, i) => (
            <motion.div key={pb.id}
              onClick={() => setSelectedId(pb.id)}
              className={cn("glass cursor-pointer p-4 transition-all",
                selectedId === pb.id ? "border-accent-violet/30 bg-accent-violet/5" : "hover:border-accent-violet/15")}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm">{pb.name}</h3>
                <ChevronRight size={14} className={cn("text-text-muted transition-transform", selectedId === pb.id && "rotate-90 text-accent-violet")} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><div className="text-[9px] text-text-muted uppercase">Win Rate</div>
                  <div className={cn("font-[family-name:var(--font-space-mono)] text-sm font-bold", pb.winRate >= 50 ? "text-accent-green" : "text-accent-coral")}>
                    {pb.winRate.toFixed(0)}%
                  </div>
                </div>
                <div><div className="text-[9px] text-text-muted uppercase">Avg R</div>
                  <div className={cn("font-[family-name:var(--font-space-mono)] text-sm font-bold", pb.avgR >= 0 ? "text-accent-green" : "text-accent-coral")}>
                    {pb.avgR >= 0 ? "+" : ""}{pb.avgR.toFixed(2)}R
                  </div>
                </div>
                <div><div className="text-[9px] text-text-muted uppercase">Trades</div>
                  <div className="font-[family-name:var(--font-space-mono)] text-sm font-bold">{pb.tradeCount}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <GlassCard className="border-accent-violet/10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl">{selected.name}</h2>
                  <p className="text-sm text-text-secondary mt-1">{selected.description}</p>
                </div>
                <button onClick={() => { deletePlaybook(selected.id); setSelectedId(null); }}
                  className="p-2 rounded-lg text-text-muted hover:text-accent-coral hover:bg-accent-coral/10 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Win Rate", value: `${selected.winRate.toFixed(1)}%`, icon: Target, color: selected.winRate >= 50 ? "text-accent-green" : "text-accent-coral" },
                  { label: "Total P&L", value: formatCurrency(selected.totalPnl), icon: TrendingUp, color: selected.totalPnl >= 0 ? "text-accent-green" : "text-accent-coral" },
                  { label: "Avg R", value: `${selected.avgR.toFixed(2)}R`, icon: BarChart3, color: "text-accent-violet" },
                  { label: "Trades", value: `${selected.tradeCount}`, icon: Zap, color: "text-text-primary" },
                ].map((s, i) => (
                  <div key={i} className="glass-static p-3 rounded-xl">
                    <s.icon size={14} className={s.color} />
                    <div className="text-[9px] text-text-muted uppercase mt-1">{s.label}</div>
                    <div className={cn("font-[family-name:var(--font-space-mono)] font-bold text-sm mt-0.5", s.color)}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Entry Rules */}
              <div className="mb-4">
                <h4 className="text-xs text-accent-green uppercase tracking-wider mb-2 flex items-center gap-1"><Check size={12} /> Entry Rules</h4>
                <ol className="space-y-1.5">
                  {selected.entryRules.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="w-5 h-5 rounded-full bg-accent-green/10 text-accent-green text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Exit Rules */}
              <div className="mb-4">
                <h4 className="text-xs text-accent-coral uppercase tracking-wider mb-2 flex items-center gap-1"><X size={12} /> Exit Rules</h4>
                <ol className="space-y-1.5">
                  {selected.exitRules.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="w-5 h-5 rounded-full bg-accent-coral/10 text-accent-coral text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-subtle">
                <div><span className="text-xs text-text-muted">Target R:R</span><span className="font-[family-name:var(--font-space-mono)] text-sm font-bold text-accent-violet ml-2">1:{selected.targetRR}</span></div>
                <div><span className="text-xs text-text-muted">Max Risk</span><span className="font-[family-name:var(--font-space-mono)] text-sm font-bold ml-2">{selected.maxRiskPercent}%</span></div>
                <div><span className="text-xs text-text-muted">Conditions</span>
                  <div className="flex gap-1 mt-1">{selected.idealConditions.map((c) => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green">{c}</span>)}</div>
                </div>
                <div><span className="text-xs text-text-muted">Sessions</span>
                  <div className="flex gap-1 mt-1">{selected.bestSessions.map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-violet/10 text-accent-violet">{s}</span>)}</div>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="flex flex-col items-center justify-center min-h-[400px]">
              <BookOpen size={40} className="text-text-muted mb-3 opacity-40" />
              <p className="text-sm text-text-muted">Select a playbook to view details</p>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
            <motion.div className="glass-static w-full max-w-xl max-h-[85vh] overflow-y-auto m-4 p-6 rounded-2xl"
              onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl mb-4">New Playbook</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ICT Silver Bullet..."
                    className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Describe the strategy..."
                    className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors resize-none" />
                </div>

                {/* Entry Rules */}
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Entry Rules</label>
                  {entryRules.map((r, i) => (
                    <input key={i} value={r} onChange={(e) => updateRule(entryRules, setEntryRules, i, e.target.value)}
                      placeholder={`Step ${i + 1}...`}
                      className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2 text-sm mb-1.5 focus:outline-none focus:border-accent-green/40 transition-colors" />
                  ))}
                  <button onClick={() => addRule(entryRules, setEntryRules)} className="text-xs text-accent-green hover:underline">+ Add Step</button>
                </div>

                {/* Exit Rules */}
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Exit Rules</label>
                  {exitRules.map((r, i) => (
                    <input key={i} value={r} onChange={(e) => updateRule(exitRules, setExitRules, i, e.target.value)}
                      placeholder={`Exit condition ${i + 1}...`}
                      className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2 text-sm mb-1.5 focus:outline-none focus:border-accent-coral/40 transition-colors" />
                  ))}
                  <button onClick={() => addRule(exitRules, setExitRules)} className="text-xs text-accent-coral hover:underline">+ Add Condition</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Target R:R</label>
                    <input type="number" step="0.5" value={targetRR} onChange={(e) => setTargetRR(e.target.value)}
                      className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Max Risk %</label>
                    <input type="number" step="0.25" value={maxRisk} onChange={(e) => setMaxRisk(e.target.value)}
                      className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40" />
                  </div>
                </div>

                {/* Conditions */}
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Ideal Conditions</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MARKET_CONDITIONS.map((m) => (
                      <button key={m} onClick={() => setConditions(conditions.includes(m) ? conditions.filter((c) => c !== m) : [...conditions, m])}
                        className={cn("px-3 py-1.5 rounded-lg text-xs transition-all",
                          conditions.includes(m) ? "bg-accent-green/15 text-accent-green border border-accent-green/30" : "bg-bg-card text-text-muted border border-border-subtle")}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sessions */}
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Best Sessions</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SESSION_TAGS.map((s) => (
                      <button key={s} onClick={() => setSessions(sessions.includes(s) ? sessions.filter((x) => x !== s) : [...sessions, s])}
                        className={cn("px-3 py-1.5 rounded-lg text-xs transition-all",
                          sessions.includes(s) ? "bg-accent-violet/15 text-accent-violet border border-accent-violet/30" : "bg-bg-card text-text-muted border border-border-subtle")}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary">Cancel</button>
                <button onClick={handleCreate} disabled={!name.trim()}
                  className="bg-accent-green text-bg-base px-6 py-2 rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,255,178,0.2)] transition-all disabled:opacity-40">
                  Create Playbook
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
