"use client";

import { useState, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { usePlaybookStore, useTradeStore, useMissedTradeStore } from "@/stores";
import { Playbook, PlaybookRule, MissedTrade } from "@/lib/types";
import { 
  BookOpen, Plus, Search, Trash2, ArrowRight, Download, Edit3, 
  CheckSquare, BarChart2, EyeOff, LayoutList
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

export default function PlaybookPage() {
  const { playbooks, addPlaybook, updatePlaybook, deletePlaybook } = usePlaybookStore();
  const { trades } = useTradeStore();
  const { missedTrades, addMissedTrade, deleteMissedTrade } = useMissedTradeStore();

  const [activeTab, setActiveTab] = useState<"library" | "compare" | "missed">("library");
  const [showModal, setShowModal] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
  const [showMissedModal, setShowMissedModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<Partial<Playbook>>({
    name: "", description: "", targetRR: 2, maxRiskPercent: 1, rules: []
  });

  const [newRuleText, setNewRuleText] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState<"entry" | "exit" | "risk">("entry");

  const [missedFormData, setMissedFormData] = useState<Partial<MissedTrade>>({
    symbol: "NQ", playbookId: "", direction: "long", reason: "", potentialPnl: 0, notes: ""
  });

  const handleOpenEdit = (p?: Playbook) => {
    if (p) {
      setEditingPlaybook(p);
      setFormData(p);
    } else {
      setEditingPlaybook(null);
      setFormData({ name: "", description: "", targetRR: 2, maxRiskPercent: 1, rules: [] });
    }
    setShowModal(true);
  };

  const handleSavePlaybook = () => {
    if (!formData.name) return;
    if (editingPlaybook) {
      updatePlaybook(editingPlaybook.id, formData);
    } else {
      addPlaybook(formData as Omit<Playbook, "id" | "createdAt" | "updatedAt">);
    }
    setShowModal(false);
  };

  const handleAddRule = () => {
    if (!newRuleText) return;
    const rules = formData.rules || [];
    setFormData({
      ...formData,
      rules: [...rules, { id: Math.random().toString(), text: newRuleText, category: newRuleCategory }]
    });
    setNewRuleText("");
  };

  const handleRemoveRule = (id: string) => {
    setFormData({
      ...formData,
      rules: (formData.rules || []).filter(r => r.id !== id)
    });
  };

  const handleSaveMissedTrade = () => {
    if (!missedFormData.symbol || !missedFormData.reason) return;
    addMissedTrade({
      ...missedFormData as Omit<MissedTrade, "id" | "createdAt">,
      date: new Date().toISOString()
    });
    setShowMissedModal(false);
  };

  // Compute Playbook Stats
  const playbookStats = useMemo(() => {
    return playbooks.map(p => {
      const pTrades = trades.filter(t => t.playbook === p.name || p.linkedTradeIds.includes(t.id));
      const wins = pTrades.filter(t => t.result === "win");
      const pnl = pTrades.reduce((s, t) => s + t.netPnl, 0);
      const grossWins = wins.reduce((s, t) => s + t.netPnl, 0);
      const grossLosses = Math.abs(pTrades.filter(t => t.result === "loss").reduce((s, t) => s + t.netPnl, 0));
      return {
        ...p,
        tradeCount: pTrades.length,
        winRate: pTrades.length ? (wins.length / pTrades.length) * 100 : 0,
        pnl,
        profitFactor: grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? Infinity : 0,
      };
    }).sort((a, b) => b.pnl - a.pnl);
  }, [playbooks, trades]);

  const missedPnl = missedTrades.reduce((s, t) => s + (t.potentialPnl || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-inter)] font-black tracking-tight text-text-primary flex items-center gap-2">
            <BookOpen className="text-accent-violet" /> Playbook
          </h1>
          <p className="text-sm text-text-muted mt-1">Define, track, and optimize your trading strategies.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-bg-card border border-border-subtle rounded-xl p-1">
          <button onClick={() => setActiveTab("library")} className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", activeTab === "library" ? "bg-accent-violet/20 text-accent-violet" : "text-text-muted hover:text-text-primary")}>Library</button>
          <button onClick={() => setActiveTab("compare")} className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", activeTab === "compare" ? "bg-accent-violet/20 text-accent-violet" : "text-text-muted hover:text-text-primary")}>Compare</button>
          <button onClick={() => setActiveTab("missed")} className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all", activeTab === "missed" ? "bg-accent-violet/20 text-accent-violet" : "text-text-muted hover:text-text-primary")}>Missed Trades</button>
        </div>
      </div>

      {activeTab === "library" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input type="text" placeholder="Search playbooks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-bg-card border border-border-subtle rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent-violet" />
            </div>
            <button onClick={() => handleOpenEdit()} className="flex items-center gap-2 px-4 py-2 bg-accent-violet hover:bg-accent-violet/90 text-white rounded-xl font-bold transition-all text-sm shadow-[0_0_20px_rgba(123,97,255,0.2)]">
              <Plus size={16} /> Create Playbook
            </button>
          </div>

          {/* PNL Chart */}
          <GlassCard className="p-4 border-border-subtle h-64">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-4">P&L by Playbook</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={playbookStats}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8B8FA3' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8B8FA3' }} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-bg-card border border-border-subtle p-3 rounded-lg shadow-xl">
                        <p className="font-bold text-sm mb-1">{payload[0].payload.name}</p>
                        <p className={cn("font-[family-name:var(--font-space-mono)] font-bold text-lg", Number(payload[0].value) >= 0 ? "text-accent-green" : "text-accent-coral")}>
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {playbookStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#00FFB2' : '#FF2D55'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Playbook Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playbookStats.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(playbook => (
              <GlassCard key={playbook.id} className="p-5 flex flex-col hover:bg-bg-secondary transition-all border-border-subtle hover:border-accent-violet/30 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center text-accent-violet">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(playbook)} className="p-1.5 text-text-muted hover:text-accent-blue rounded-lg"><Edit3 size={16} /></button>
                    <button onClick={() => deletePlaybook(playbook.id)} className="p-1.5 text-text-muted hover:text-accent-coral rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-text-primary mb-1">{playbook.name}</h3>
                <p className="text-sm text-text-secondary line-clamp-2 mb-4">{playbook.description || "No description provided."}</p>
                
                <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-border-subtle/50">
                  <div>
                    <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Win Rate</div>
                    <div className="text-lg font-[family-name:var(--font-space-mono)] font-black text-text-primary">{playbook.winRate.toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Net P&L</div>
                    <div className={cn("text-lg font-[family-name:var(--font-space-mono)] font-black", playbook.pnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                      {formatCurrency(playbook.pnl)}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === "compare" && (
        <GlassCard className="p-0 border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-secondary/50 border-b border-border-subtle">
                  <th className="p-4 text-[10px] uppercase font-black tracking-widest text-text-muted">Playbook Name</th>
                  <th className="p-4 text-[10px] uppercase font-black tracking-widest text-text-muted">Trades</th>
                  <th className="p-4 text-[10px] uppercase font-black tracking-widest text-text-muted">Win Rate</th>
                  <th className="p-4 text-[10px] uppercase font-black tracking-widest text-text-muted">Profit Factor</th>
                  <th className="p-4 text-[10px] uppercase font-black tracking-widest text-text-muted">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/30">
                {playbookStats.map(p => (
                  <tr key={p.id} className="hover:bg-bg-secondary/30 transition-colors">
                    <td className="p-4 text-sm font-bold text-text-primary">{p.name}</td>
                    <td className="p-4 text-sm font-[family-name:var(--font-space-mono)] text-text-secondary">{p.tradeCount}</td>
                    <td className="p-4 text-sm font-[family-name:var(--font-space-mono)] text-text-secondary">{p.winRate.toFixed(1)}%</td>
                    <td className="p-4 text-sm font-[family-name:var(--font-space-mono)] text-text-secondary">{p.profitFactor.toFixed(2)}</td>
                    <td className={cn("p-4 text-sm font-[family-name:var(--font-space-mono)] font-bold", p.pnl >= 0 ? "text-accent-green" : "text-accent-coral")}>{formatCurrency(p.pnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {activeTab === "missed" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <GlassCard className="p-4 border-border-subtle">
              <h3 className="text-xs font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
                <EyeOff size={14} className="text-accent-coral" /> Missed Opportunity Cost
              </h3>
              <div className={cn("text-2xl font-black font-[family-name:var(--font-space-mono)]", missedPnl > 0 ? "text-accent-coral" : "text-text-muted")}>{formatCurrency(missedPnl)}</div>
            </GlassCard>
            <button onClick={() => setShowMissedModal(true)} className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-subtle hover:border-accent-coral/50 text-text-primary rounded-xl font-bold transition-all text-sm">
              <Plus size={16} className="text-accent-coral" /> Log Missed Trade
            </button>
          </div>

          <div className="grid gap-4">
            {missedTrades.length === 0 ? (
              <div className="text-center py-12 text-text-muted">No missed trades logged.</div>
            ) : (
              missedTrades.map(mt => (
                <GlassCard key={mt.id} className="p-4 border-l-4 border-l-accent-coral border-border-subtle flex justify-between items-center group">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-text-primary">{mt.symbol}</span>
                      <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded", mt.direction === 'long' ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral")}>{mt.direction}</span>
                      <span className="text-xs text-text-muted">{new Date(mt.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-text-secondary"><span className="text-text-muted">Reason:</span> {mt.reason}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Potential P&L</div>
                      <div className="text-sm font-[family-name:var(--font-space-mono)] font-bold text-accent-coral">{formatCurrency(mt.potentialPnl || 0)}</div>
                    </div>
                    <button onClick={() => deleteMissedTrade(mt.id)} className="p-2 opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-coral transition-opacity"><Trash2 size={16} /></button>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Playbook Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-2xl">
              <GlassCard className="border-accent-violet/30 p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <h2 className="text-xl font-black text-text-primary mb-6">{editingPlaybook ? "Edit Playbook" : "New Playbook"}</h2>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm focus:border-accent-violet outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Description</label>
                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm focus:border-accent-violet outline-none" rows={2} />
                  </div>

                  <div className="pt-4 border-t border-border-subtle/50">
                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2"><CheckSquare size={16} className="text-accent-violet" /> Rule Checklist Builder</h3>
                    <div className="flex gap-2 mb-4">
                      <select value={newRuleCategory} onChange={e => setNewRuleCategory(e.target.value as any)} className="bg-bg-secondary border border-border-subtle rounded-xl px-3 py-2 text-sm outline-none">
                        <option value="entry">Entry</option><option value="exit">Exit</option><option value="risk">Risk</option>
                      </select>
                      <input type="text" placeholder="e.g. Price sweeps liquidity" value={newRuleText} onChange={e => setNewRuleText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddRule()} className="flex-1 bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm outline-none focus:border-accent-violet" />
                      <button onClick={handleAddRule} className="px-4 bg-accent-violet hover:bg-accent-violet/90 text-white rounded-xl font-bold transition-all"><Plus size={16} /></button>
                    </div>

                    <div className="space-y-2">
                      {formData.rules?.map(r => (
                        <div key={r.id} className="flex justify-between items-center p-2 bg-bg-secondary/50 border border-border-subtle rounded-lg group">
                          <div className="flex items-center gap-3">
                            <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded", r.category === 'entry' ? 'bg-accent-blue/10 text-accent-blue' : r.category === 'exit' ? 'bg-accent-coral/10 text-accent-coral' : 'bg-accent-violet/10 text-accent-violet')}>{r.category}</span>
                            <span className="text-sm text-text-primary">{r.text}</span>
                          </div>
                          <button onClick={() => handleRemoveRule(r.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-coral transition-opacity"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border-subtle">
                  <button onClick={() => setShowModal(false)} className="px-5 py-2 hover:bg-bg-secondary rounded-xl text-sm font-bold transition-colors">Cancel</button>
                  <button onClick={handleSavePlaybook} className="px-5 py-2 bg-accent-violet hover:bg-accent-violet/90 text-white rounded-xl text-sm font-bold transition-colors">Save Playbook</button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Missed Trade Modal */}
      <AnimatePresence>
        {showMissedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md">
              <GlassCard className="border-accent-coral/30 p-6 shadow-2xl">
                <h2 className="text-xl font-black text-text-primary mb-6 flex items-center gap-2"><EyeOff className="text-accent-coral" /> Log Missed Trade</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Symbol</label>
                      <input type="text" value={missedFormData.symbol} onChange={e => setMissedFormData({...missedFormData, symbol: e.target.value.toUpperCase()})} className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm outline-none focus:border-accent-coral" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Direction</label>
                      <select value={missedFormData.direction} onChange={e => setMissedFormData({...missedFormData, direction: e.target.value as any})} className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm outline-none">
                        <option value="long">Long</option><option value="short">Short</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Reason for missing</label>
                    <input type="text" placeholder="e.g. Hesitated on entry" value={missedFormData.reason} onChange={e => setMissedFormData({...missedFormData, reason: e.target.value})} className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm outline-none focus:border-accent-coral" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Potential P&L ($) <span className="text-text-muted/50 font-normal">(optional)</span></label>
                    <input type="number" value={missedFormData.potentialPnl || ''} onChange={e => setMissedFormData({...missedFormData, potentialPnl: Number(e.target.value)})} className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm outline-none font-[family-name:var(--font-space-mono)]" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowMissedModal(false)} className="px-5 py-2 hover:bg-bg-secondary rounded-xl text-sm font-bold">Cancel</button>
                  <button onClick={handleSaveMissedTrade} className="px-5 py-2 bg-accent-coral hover:bg-accent-coral/90 text-white rounded-xl text-sm font-bold">Save</button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
