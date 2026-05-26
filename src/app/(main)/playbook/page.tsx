"use client";
import { usePlaybookStore, useTradeStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCurrency } from "@/lib/utils";
import { MARKET_CONDITIONS, SESSION_TAGS, MarketCondition, SessionTag, Trade } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import { Plus, BookOpen, Target, Clock, TrendingUp, ChevronRight, X, Check, BarChart3, Zap, Shield, Sparkles, Activity, Camera } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import html2canvas from "html2canvas";
import { useRef } from "react";

export default function PlaybookPage() {
  const { playbooks, addPlaybook, deletePlaybook } = usePlaybookStore();
  const { trades } = useTradeStore();
  const [mounted, setMounted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const playbookRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!playbookRef.current || !selectedId) return;
    try {
      const canvas = await html2canvas(playbookRef.current, { backgroundColor: "#0a0a0a", scale: 2 });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      const pb = playbooks.find(p => p.id === selectedId);
      link.download = `edgevault-playbook-${pb?.name.replace(/\\s+/g, '-').toLowerCase() || 'export'}.png`;
      link.click();
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Auto-select first playbook if available
    if (playbooks.length > 0 && !selectedId) {
      setSelectedId(playbooks[0].id);
    }
  }, [playbooks, selectedId]);

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

  // Compute selected playbook's trades and chronological equity curve
  const selectedTradesAndChart = useMemo(() => {
    if (!selected) return { trades: [], chartData: [] };
    const pTrades = trades
      .filter((t) => selected.linkedTradeIds.includes(t.id) || t.playbook === selected.name)
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    let balance = 0;
    const chartData = [
      { tradeIndex: 0, date: "Start", pnl: 0, balance: 0 }
    ];

    pTrades.forEach((t, idx) => {
      balance += t.netPnl;
      chartData.push({
        tradeIndex: idx + 1,
        date: format(new Date(t.entryDate), "MM/dd"),
        pnl: t.netPnl,
        balance: parseFloat(balance.toFixed(2))
      });
    });

    return {
      trades: pTrades,
      chartData
    };
  }, [selected, trades]);

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

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-inter)] font-black text-2xl text-text-primary flex items-center gap-2">
            Execution Playbook <Target size={22} className="text-accent-violet animate-pulse" />
          </h1>
          <p className="text-sm text-text-secondary mt-1">{playbooks.length} documented strategies & custom confluences</p>
        </div>
        
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-accent-violet to-accent-blue text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(123,97,255,0.4)] transition-all">
          <Plus size={16} /> New Playbook
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Playbook List */}
        <div className="lg:col-span-1 space-y-3">
          {playbookStats.map((pb, i) => (
            <motion.div key={pb.id}
              onClick={() => setSelectedId(pb.id)}
              className={cn("glass cursor-pointer p-4 transition-all rounded-2xl relative overflow-hidden group",
                selectedId === pb.id ? "border-accent-violet/30 bg-accent-violet/5" : "hover:border-accent-violet/15")}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              
              {selectedId === pb.id && (
                <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-accent-violet rounded-r" />
              )}

              <div className="flex items-start justify-between mb-2">
                <h3 className="font-[family-name:var(--font-inter)] font-bold text-sm text-text-primary group-hover:text-accent-violet transition-colors truncate pr-4">{pb.name}</h3>
                <ChevronRight size={14} className={cn("text-text-muted transition-transform", selectedId === pb.id && "rotate-90 text-accent-violet")} />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[9px] text-text-muted uppercase">Win Rate</div>
                  <div className={cn("font-[family-name:var(--font-space-mono)] text-xs font-bold", pb.winRate >= 50 ? "text-accent-green" : "text-accent-coral")}>
                    {pb.winRate.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-text-muted uppercase">Avg R</div>
                  <div className={cn("font-[family-name:var(--font-space-mono)] text-xs font-bold", pb.avgR >= 0 ? "text-accent-green" : "text-accent-coral")}>
                    {pb.avgR >= 0 ? "+" : ""}{pb.avgR.toFixed(2)}R
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-text-muted uppercase">Trades</div>
                  <div className="font-[family-name:var(--font-space-mono)] text-xs font-bold text-text-primary">{pb.tradeCount}</div>
                </div>
              </div>
            </motion.div>
          ))}

          {playbookStats.length === 0 && (
            <GlassCard className="text-center py-10 text-text-muted">
              <BookOpen size={24} className="mx-auto opacity-20 mb-2" />
              <p className="text-xs">No playbooks added yet.</p>
              <button 
                onClick={() => setShowCreate(true)} 
                className="text-[10px] font-bold text-accent-violet mt-1 hover:underline"
              >
                Create your first playbook +
              </button>
            </GlassCard>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div ref={playbookRef}>
              <GlassCard className="border-accent-violet/10 p-6 space-y-6">
                
                {/* Detail Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-[family-name:var(--font-inter)] font-bold text-xl text-text-primary">{selected.name}</h2>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">{selected.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-base border border-border-subtle text-[10px] font-bold text-text-muted hover:text-text-primary hover:border-accent-violet/30 transition-all">
                      <Camera size={13} /> Export Plan
                    </button>
                    <button onClick={() => { deletePlaybook(selected.id); setSelectedId(null); }}
                      className="p-2 rounded-lg text-text-muted hover:text-accent-coral hover:bg-accent-coral/10 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Win Rate", value: `${selected.winRate.toFixed(1)}%`, icon: Target, color: selected.winRate >= 50 ? "text-accent-green" : "text-accent-coral" },
                  { label: "Total P&L", value: formatCurrency(selected.totalPnl), icon: TrendingUp, color: selected.totalPnl >= 0 ? "text-accent-green" : "text-accent-coral" },
                  { label: "Avg Expectancy", value: `${selected.avgR.toFixed(2)}R`, icon: BarChart3, color: "text-accent-violet" },
                  { label: "Trades logged", value: `${selected.tradeCount}`, icon: Zap, color: "text-text-primary" },
                ].map((s, i) => (
                  <div key={i} className="glass-static p-3.5 rounded-xl border border-border-subtle/50">
                    <s.icon size={15} className={s.color} />
                    <div className="text-[9px] text-text-muted uppercase mt-1">{s.label}</div>
                    <div className={cn("font-[family-name:var(--font-space-mono)] font-bold text-sm mt-0.5", s.color)}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Entry & Exit rules side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Entry Rules */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-accent-green uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border-subtle/40">
                    <Check size={13} /> Entry Requirements
                  </h4>
                  <ol className="space-y-2.5">
                    {selected.entryRules && selected.entryRules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-text-secondary">
                        <span className="w-5 h-5 rounded-full bg-accent-green/10 text-accent-green text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span className="leading-relaxed">{r}</span>
                      </li>
                    ))}
                    {(!selected.entryRules || selected.entryRules.length === 0) && (
                      <p className="text-xs text-text-muted italic">No specific entry rules defined.</p>
                    )}
                  </ol>
                </div>

                {/* Exit Rules */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-accent-coral uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-border-subtle/40">
                    <X size={13} className="text-accent-coral" /> Exit Requirements
                  </h4>
                  <ol className="space-y-2.5">
                    {selected.exitRules && selected.exitRules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-text-secondary">
                        <span className="w-5 h-5 rounded-full bg-accent-coral/10 text-accent-coral text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span className="leading-relaxed">{r}</span>
                      </li>
                    ))}
                    {(!selected.exitRules || selected.exitRules.length === 0) && (
                      <p className="text-xs text-text-muted italic">No specific exit rules defined.</p>
                    )}
                  </ol>
                </div>

              </div>

              {/* Dynamic Recharts Chart for this Playbook specifically */}
              {selectedTradesAndChart.trades.length >= 2 && (
                <div className="space-y-2 pt-4 border-t border-border-subtle/40">
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={13} className="text-accent-violet" /> Playbook Profit Trajectory
                  </h4>
                  
                  <div className="h-[180px] w-full bg-white/[0.01] border border-border-subtle/40 p-3 rounded-xl">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedTradesAndChart.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="playbookPnlGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8F00FF" stopOpacity={0.12}/>
                            <stop offset="95%" stopColor="#8F00FF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 8, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 8, fontFamily: "Space Mono" }} tickFormatter={(v) => `$${v}`} tickLine={false} axisLine={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              if (data.tradeIndex === 0) return null;
                              return (
                                <div className="bg-bg-card border border-border-subtle p-2.5 rounded-lg shadow-xl text-[10px] space-y-0.5">
                                  <p className="text-text-muted">Trade #{data.tradeIndex} ({data.date})</p>
                                  <p className="font-bold text-text-primary">Playbook PnL: {formatCurrency(data.balance)}</p>
                                  <p className={cn("font-semibold", data.pnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                                    Result: {data.pnl >= 0 ? "+" : ""}{formatCurrency(data.pnl)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="balance" stroke="#8F00FF" strokeWidth={1.5} fillOpacity={1} fill="url(#playbookPnlGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Playbook Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle/40 text-xs">
                <div>
                  <span className="text-text-muted">Target Risk:Reward</span>
                  <span className="font-[family-name:var(--font-space-mono)] font-bold text-accent-violet ml-2">1:{selected.targetRR}</span>
                </div>
                <div>
                  <span className="text-text-muted">Max Account Risk</span>
                  <span className="font-[family-name:var(--font-space-mono)] font-bold text-text-primary ml-2">{selected.maxRiskPercent}%</span>
                </div>
                <div>
                  <span className="text-text-muted block mb-1">Ideal Conditions</span>
                  <div className="flex flex-wrap gap-1">
                    {selected.idealConditions && selected.idealConditions.map((c) => (
                      <span key={c} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-accent-green/10 text-accent-green border border-accent-green/20">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-text-muted block mb-1">Best Trading Sessions</span>
                  <div className="flex flex-wrap gap-1">
                    {selected.bestSessions && selected.bestSessions.map((s) => (
                      <span key={s} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-accent-violet/10 text-accent-violet border border-accent-violet/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </GlassCard>
            </div>
          ) : (
            <GlassCard className="flex flex-col items-center justify-center min-h-[400px] border-border-subtle/50 text-center">
              <BookOpen size={40} className="text-text-muted mb-3 opacity-25" />
              <h3 className="font-semibold text-sm text-text-secondary">Awaiting Strategy Analysis</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Select a playbook from the sidebar to inspect its rules,<br />confluences, and dedicated Recharts equity curves.
              </p>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
            <motion.div className="glass-static w-full max-w-xl max-h-[85vh] overflow-y-auto m-4 p-6 rounded-2xl border border-border-subtle"
              onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <h2 className="font-[family-name:var(--font-inter)] font-bold text-xl mb-4 text-text-primary flex items-center gap-1.5">
                New Systematic Playbook <Sparkles size={18} className="text-accent-green" />
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Strategy Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ICT Silver Bullet, SMT Divergence..."
                    className="w-full bg-white/[0.02] border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors text-text-primary" />
                </div>
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Description / Purpose</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Briefly describe the setup core thesis..."
                    className="w-full bg-white/[0.02] border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors resize-none text-text-primary" />
                </div>

                {/* Entry Rules */}
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Entry Checklist</label>
                  {entryRules.map((r, i) => (
                    <input key={i} value={r} onChange={(e) => updateRule(entryRules, setEntryRules, i, e.target.value)}
                      placeholder={`Rule ${i + 1}: e.g. Wait for NY 10:00 AM Open...`}
                      className="w-full bg-white/[0.02] border border-border-subtle rounded-xl px-4 py-2 text-sm mb-1.5 focus:outline-none focus:border-accent-green/40 transition-colors text-text-primary" />
                  ))}
                  <button onClick={() => addRule(entryRules, setEntryRules)} className="text-xs text-accent-green hover:underline font-bold">+ Add Step</button>
                </div>

                {/* Exit Rules */}
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Exit & Take-Profit Rules</label>
                  {exitRules.map((r, i) => (
                    <input key={i} value={r} onChange={(e) => updateRule(exitRules, setExitRules, i, e.target.value)}
                      placeholder={`Condition ${i + 1}: e.g. Close 50% at 1.5R...`}
                      className="w-full bg-white/[0.02] border border-border-subtle rounded-xl px-4 py-2 text-sm mb-1.5 focus:outline-none focus:border-accent-coral/40 transition-colors text-text-primary" />
                  ))}
                  <button onClick={() => addRule(exitRules, setExitRules)} className="text-xs text-accent-coral hover:underline font-bold">+ Add Condition</button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Target R:R</label>
                    <input type="number" step="0.5" value={targetRR} onChange={(e) => setTargetRR(e.target.value)}
                      className="w-full bg-white/[0.02] border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40 text-text-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Max Account Risk %</label>
                    <input type="number" step="0.25" value={maxRisk} onChange={(e) => setMaxRisk(e.target.value)}
                      className="w-full bg-white/[0.02] border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40 text-text-primary" />
                  </div>
                </div>

                {/* Conditions */}
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Ideal Conditions</label>
                  <div className="flex flex-wrap gap-1.5">
                    {MARKET_CONDITIONS.map((m) => (
                      <button key={m} type="button" onClick={() => setConditions(conditions.includes(m) ? conditions.filter((c) => c !== m) : [...conditions, m])}
                        className={cn("px-3 py-1.5 rounded-lg text-xs transition-all border font-semibold",
                          conditions.includes(m) ? "bg-accent-green/10 text-accent-green border-accent-green/30" : "bg-white/[0.01] text-text-muted border-border-subtle")}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sessions */}
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Best Sessions</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SESSION_TAGS.map((s) => (
                      <button key={s} type="button" onClick={() => setSessions(sessions.includes(s) ? sessions.filter((x) => x !== s) : [...sessions, s])}
                        className={cn("px-3 py-1.5 rounded-lg text-xs transition-all border font-semibold",
                          sessions.includes(s) ? "bg-accent-violet/10 text-accent-violet border-accent-violet/30" : "bg-white/[0.01] text-text-muted border-border-subtle")}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-border-subtle/30 pt-4">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={!name.trim()}
                  className="bg-gradient-to-r from-accent-green to-accent-blue text-bg-base shadow-[0_0_20px_rgba(0,255,178,0.2)] hover:shadow-[0_0_30px_rgba(0,255,178,0.35)] px-6 py-2 rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,255,178,0.2)] transition-all disabled:opacity-40">
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
