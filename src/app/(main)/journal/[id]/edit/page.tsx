"use client";
import { useState, useMemo, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useTradeStore, usePropFirmStore, usePlaybookStore, useAccountStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { SYMBOLS, SETUP_TAGS, SESSION_TAGS, MARKET_CONDITIONS, MISTAKE_TAGS, PLAYBOOKS, MINDSET_TAGS, Trade, SessionTag, MarketCondition, MistakeTag } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Save, Mic, MicOff, ChevronLeft, Upload, Zap, Settings2, Image as ImageIcon, X, Plus, Brain, CheckSquare } from "lucide-react";
import Link from "next/link";
import { storage, auth } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const emotionLabels: Record<number, { label: string; emoji: string }> = {
  "-5": { label: "Terrified", emoji: "😰" },
  "-4": { label: "Very Fearful", emoji: "😨" },
  "-3": { label: "Fearful", emoji: "😟" },
  "-2": { label: "Anxious", emoji: "😕" },
  "-1": { label: "Uneasy", emoji: "😐" },
  "0": { label: "Neutral", emoji: "😶" },
  "1": { label: "Confident", emoji: "🙂" },
  "2": { label: "Very Confident", emoji: "😊" },
  "3": { label: "Aggressive", emoji: "😤" },
  "4": { label: "Overconfident", emoji: "😎" },
  "5": { label: "Euphoric", emoji: "🤩" },
};

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        } else {
          resolve(event.target?.result as string);
        }
      };
    };
  });
};

export default function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { trades, updateTrade } = useTradeStore();
  const trade = useMemo(() => trades.find((t) => t.id === id), [trades, id]);

  const [mode, setMode] = useState<"quick" | "detailed">("detailed");
  const [symbol, setSymbol] = useState("");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [showSymbols, setShowSymbols] = useState(false);
  const [direction, setDirection] = useState<"long" | "short">("long");
  
  // Quick Mode fields
  const [quickNetPnl, setQuickNetPnl] = useState("");

  // Detailed Mode fields
  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [commission, setCommission] = useState("4.50");

  // Shared fields
  const [emotion, setEmotion] = useState(0);
  const [preNotes, setPreNotes] = useState("");
  const [postReview, setPostReview] = useState("");
  const [setupTags, setSetupTags] = useState<string[]>([]);
  const [sessionTag, setSessionTag] = useState<SessionTag>("NY AM");
  const [marketCondition, setMarketCondition] = useState<MarketCondition>("Trending");
  const [mistakeTags, setMistakeTags] = useState<MistakeTag[]>([]);
  const [playbook, setPlaybook] = useState("");
  const [playbookRulesChecked, setPlaybookRulesChecked] = useState<string[]>([]);
  const [propChallengeId, setPropChallengeId] = useState("");
  const [accountId, setAccountId] = useState("");
  const { challenges } = usePropFirmStore();
  const { playbooks } = usePlaybookStore();
  const { accounts } = useAccountStore();

  const activeChallenges = useMemo(() => 
    challenges.filter(c => c.status === "active" || c.id === propChallengeId), 
    [challenges, propChallengeId]
  );

  const allPlaybooks = useMemo(() => {
    const customs = playbooks.map(p => p.name);
    const defaults = ["ICT Silver Bullet", "Liquidity Sweep + IFVG", "Opening Range Breakout", "VWAP Mean Reversion", "SMT + OB Confluence", "London Session Sweep", "Asian Range Breakout"];
    return Array.from(new Set([...customs, ...defaults]));
  }, [playbooks]);

  const selectedPlaybookObj = useMemo(() => playbooks.find(p => p.name === playbook), [playbooks, playbook]);

  const [mindsetTags, setMindsetTags] = useState<string[]>([]);
  const [mindsetNotes, setMindsetNotes] = useState("");
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [resultOverride, setResultOverride] = useState<"auto" | "win" | "loss" | "be">("auto");

  useEffect(() => {
    if (trade) {
      setSymbol(trade.symbol);
      setDirection(trade.direction);
      setEmotion(trade.emotion);
      setPreNotes(trade.preTradeNotes);
      setPostReview(trade.postTradeReview);
      setSetupTags(trade.setupTags);
      setSessionTag(trade.sessionTag);
      setMarketCondition(trade.marketCondition);
      setMistakeTags(trade.mistakeTags);
      setPlaybook(trade.playbook || "");
      setPlaybookRulesChecked(trade.playbookRulesChecked || []);
      setPropChallengeId(trade.propChallengeId || "");
      setAccountId(trade.accountId || "");
      setMindsetTags(trade.mindsetTags || []);
      setMindsetNotes(trade.mindsetNotes || "");
      setScreenshotUrls(trade.screenshotUrls || []);
      setResultOverride(trade.result || "auto");
      
      if (trade.entryPrice) {
        setMode("detailed");
        setEntryPrice(trade.entryPrice.toString());
        setExitPrice(trade.exitPrice?.toString() || "");
        setStopLoss(trade.stopLoss?.toString() || "");
        setTakeProfit(trade.takeProfit?.toString() || "");
        setPositionSize(trade.positionSize?.toString() || "");
        setCommission(trade.commission.toString());
      } else {
        setMode("quick");
        setQuickNetPnl(trade.netPnl.toString());
      }

      // Format dates for datetime-local input (YYYY-MM-DDThh:mm) in LOCAL time
      if (trade.entryDate) {
        const d = new Date(trade.entryDate);
        setEntryDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      }
      if (trade.exitDate) {
        const d = new Date(trade.exitDate);
        setExitDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
      }
    }
  }, [trade]);

  const filteredSymbols = useMemo(() =>
    SYMBOLS.filter((s) => s.toLowerCase().includes(symbolSearch.toLowerCase())).slice(0, 8),
    [symbolSearch]
  );

  const detailedCalculations = useMemo(() => {
    if (mode === "quick") return null;
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);
    const size = parseFloat(positionSize);
    const comm = parseFloat(commission) || 0;
    if (isNaN(entry) || isNaN(exit) || isNaN(size)) return null;

    const rawPnl = direction === "long" ? (exit - entry) * size : (entry - exit) * size;
    const netPnl = rawPnl - comm;
    const risk = (!isNaN(sl) && sl > 0) ? Math.abs(entry - sl) * size : 200;
    const rMultiple = netPnl / (risk || 200);
    const rr = (!isNaN(sl) && !isNaN(tp) && sl > 0) 
      ? Math.abs(tp - entry) / Math.abs(entry - sl) 
      : (isNaN(sl) || sl === 0) && !isNaN(tp) && size > 0 
        ? (Math.abs(tp - entry) * size) / 200 
        : Math.abs(netPnl) / (risk || 200);
    const pctChange = ((exit - entry) / entry) * 100 * (direction === "long" ? 1 : -1);

    return { netPnl, rMultiple, rr, pctChange };
  }, [mode, entryPrice, exitPrice, stopLoss, takeProfit, positionSize, commission, direction]);

  const livePnl = mode === "quick" ? parseFloat(quickNetPnl) || 0 : detailedCalculations?.netPnl || 0;
  const isReady = !!symbol; // Only symbol is strictly required

  const handleSubmit = () => {
    if (!isReady || !trade) return;

    const entryD = new Date(entryDate || Date.now());
    const exitD = new Date(exitDate || Date.now());
    const durationMinutes = Math.round((exitD.getTime() - entryD.getTime()) / 60000);

    const netPnl = mode === "quick" ? parseFloat(quickNetPnl) : detailedCalculations?.netPnl || 0;

    const updates: Partial<Trade> = {
      symbol,
      direction,
      entryDate: entryD.toISOString(),
      exitDate: exitD.toISOString(),
      commission: mode === "quick" ? 0 : parseFloat(commission) || 0,
      netPnl: parseFloat(netPnl.toFixed(2)),
      rMultiple: mode === "quick" ? parseFloat((netPnl / 200).toFixed(2)) : parseFloat((detailedCalculations?.rMultiple || (netPnl / 200)).toFixed(2)),
      rr: mode === "quick" ? parseFloat(Math.abs(netPnl / 200).toFixed(2)) : parseFloat((detailedCalculations?.rr || Math.abs(netPnl / 200)).toFixed(2)),
      result: resultOverride !== "auto" 
        ? resultOverride 
        : (netPnl > 1 ? "win" : netPnl < -1 ? "loss" : "be"),
      emotion,
      preTradeNotes: preNotes,
      postTradeReview: postReview,
      setupTags,
      sessionTag,
      marketCondition,
      mistakeTags,
      playbook: playbook || undefined,
      playbookRulesChecked,
      propChallengeId: propChallengeId || undefined,
      accountId: accountId || undefined,
      durationMinutes: Math.max(durationMinutes, 1),
      screenshotUrls,
      mindsetTags,
      mindsetNotes,
    };

    if (mode === "detailed") {
      updates.entryPrice = isNaN(parseFloat(entryPrice)) ? undefined : parseFloat(entryPrice);
      updates.exitPrice = isNaN(parseFloat(exitPrice)) ? undefined : parseFloat(exitPrice);
      updates.stopLoss = isNaN(parseFloat(stopLoss)) ? undefined : parseFloat(stopLoss);
      updates.takeProfit = isNaN(parseFloat(takeProfit)) ? undefined : parseFloat(takeProfit);
      updates.positionSize = isNaN(parseFloat(positionSize)) ? 0 : parseFloat(positionSize);
    }

    updateTrade(trade.id, updates);
    router.push(`/journal/${trade.id}`);
  };

  const toggleTag = (tag: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  if (!trade) return <div className="p-20 text-center">Trade not found...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/journal/${trade.id}`} className="p-2 rounded-xl bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="font-[family-name:var(--font-inter)] font-bold text-2xl">Edit Trade</h1>
            <p className="text-sm text-text-secondary mt-0.5">Modify your trade details and analysis</p>
          </div>
        </div>

        <div className="flex p-1 bg-bg-card border border-border-subtle rounded-xl">
          <button onClick={() => setMode("quick")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === "quick" ? "bg-accent-violet text-white shadow-md" : "text-text-muted hover:text-text-primary")}>
            <Zap size={16} /> Quick Mode
          </button>
          <button onClick={() => setMode("detailed")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === "detailed" ? "bg-accent-violet text-white shadow-md" : "text-text-muted hover:text-text-primary")}>
            <Settings2 size={16} /> Detailed Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Trade Setup */}
        <GlassCard>
          <h2 className="font-[family-name:var(--font-inter)] font-bold text-base mb-4">Trade Setup</h2>
          <div className="space-y-4">
            
            {(livePnl !== 0 || isReady) && (
              <div className={cn("p-3 rounded-xl border flex items-center justify-between", livePnl >= 0 ? "bg-accent-green/10 border-accent-green/20" : "bg-accent-coral/10 border-accent-coral/20")}>
                <span className="text-sm font-medium uppercase tracking-wider">Net P&L</span>
                <span className={cn("font-[family-name:var(--font-space-mono)] font-bold text-xl", livePnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                  {formatCurrency(livePnl)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Symbol</label>
                <input
                  type="text"
                  value={symbolSearch || symbol}
                  onChange={(e) => { setSymbolSearch(e.target.value); setShowSymbols(true); setSymbol(""); }}
                  onFocus={() => setShowSymbols(true)}
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] uppercase focus:outline-none focus:border-accent-violet/40 transition-colors"
                />
                {showSymbols && filteredSymbols.length > 0 && !symbol && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border-subtle rounded-xl overflow-hidden z-10 shadow-xl">
                    {filteredSymbols.map((s) => (
                      <button key={s} onClick={() => { setSymbol(s); setSymbolSearch(""); setShowSymbols(false); }}
                        className="w-full text-left px-4 py-2 text-sm font-[family-name:var(--font-space-mono)] hover:bg-accent-violet/10 transition-colors"
                      >{s}</button>
                    ))}
                  </div>
                )}
              </div>

              {mode === "quick" && (
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Net P&L ($)</label>
                  <input type="number" step="any" value={quickNetPnl} onChange={(e) => setQuickNetPnl(e.target.value)}
                    className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40 transition-colors" />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Direction</label>
              <div className="flex gap-2">
                <button onClick={() => setDirection("long")}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                    direction === "long" ? "bg-accent-green/15 text-accent-green border border-accent-green/30" : "bg-bg-card text-text-muted border border-border-subtle")}>
                  <ArrowUpRight size={16} /> Long
                </button>
                <button onClick={() => setDirection("short")}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                    direction === "short" ? "bg-accent-coral/15 text-accent-coral border border-accent-coral/30" : "bg-bg-card text-text-muted border border-border-subtle")}>
                  <ArrowDownRight size={16} /> Short
                </button>
              </div>
            </div>

            {/* Result Override */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Result Override <span className="text-text-muted/50 normal-case font-normal">(auto-detected from P&L)</span></label>
              <div className="flex gap-2">
                {(["auto", "win", "be", "loss"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResultOverride(r)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                      r === "auto" && resultOverride === "auto" && "bg-accent-violet/10 border-accent-violet/40 text-accent-violet",
                      r === "win" && resultOverride === "win" && "bg-accent-green/10 border-accent-green/40 text-accent-green",
                      r === "be" && resultOverride === "be" && "bg-accent-blue/10 border-accent-blue/40 text-accent-blue",
                      r === "loss" && resultOverride === "loss" && "bg-accent-coral/10 border-accent-coral/40 text-accent-coral",
                      resultOverride !== r && "bg-bg-card border-border-subtle text-text-muted hover:text-text-primary hover:border-border-subtle/80"
                    )}
                  >
                    {r === "auto" ? "Auto" : r === "be" ? "⚖️ BE" : r === "win" ? "✓ Win" : "✗ Loss"}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {mode === "detailed" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="pt-4 border-t border-border-subtle mt-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { label: "Entry Price", value: entryPrice, setter: setEntryPrice },
                        { label: "Exit Price", value: exitPrice, setter: setExitPrice },
                        { label: "Stop Loss", value: stopLoss, setter: setStopLoss },
                        { label: "Take Profit", value: takeProfit, setter: setTakeProfit },
                        { label: "Position Size", value: positionSize, setter: setPositionSize },
                        { label: "Commission", value: commission, setter: setCommission },
                      ].map((field) => (
                        <div key={field.label}>
                          <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">{field.label}</label>
                          <input type="number" step="any" value={field.value} onChange={(e) => field.setter(e.target.value)}
                            className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none" />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-subtle">
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Entry Time</label>
                <input type="datetime-local" value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-xs focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Exit Time</label>
                <input type="datetime-local" value={exitDate} onChange={(e) => setExitDate(e.target.value)}
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-xs focus:outline-none" />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Section 3: Psychology */}
        <GlassCard>
          <h2 className="font-[family-name:var(--font-inter)] font-bold text-base mb-4">Psychology & Tags</h2>
          <div className="space-y-4">
            {/* Playbook */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Playbook</label>
              <select value={playbook} onChange={(e) => {
                setPlaybook(e.target.value);
                setPlaybookRulesChecked([]); // reset checklist when playbook changes
              }}
                className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors appearance-none">
                <option value="">Select playbook...</option>
                {allPlaybooks.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {selectedPlaybookObj && selectedPlaybookObj.rules && selectedPlaybookObj.rules.length > 0 && (
              <div className="bg-bg-card border border-border-subtle rounded-xl p-4 mt-2">
                <h3 className="text-xs text-text-muted uppercase tracking-wider mb-3 font-bold flex items-center gap-2">
                  <CheckSquare size={14} className="text-accent-violet" />
                  Execution Checklist
                </h3>
                <div className="space-y-2">
                  {selectedPlaybookObj.rules.map(rule => (
                    <label key={rule.id} className="flex items-start gap-3 cursor-pointer group">
                      <div className={cn(
                        "w-4 h-4 rounded mt-0.5 flex-shrink-0 border flex items-center justify-center transition-colors",
                        playbookRulesChecked.includes(rule.id) ? "bg-accent-violet border-accent-violet" : "border-border-subtle group-hover:border-accent-violet/50"
                      )}>
                        {playbookRulesChecked.includes(rule.id) && <CheckSquare size={12} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm text-text-primary block">{rule.text}</span>
                        <span className={cn(
                          "text-[9px] uppercase font-bold tracking-widest",
                          rule.category === 'entry' ? "text-accent-blue" : rule.category === 'exit' ? "text-accent-coral" : "text-accent-green"
                        )}>{rule.category} Rule</span>
                      </div>
                      <input type="checkbox" className="hidden" checked={playbookRulesChecked.includes(rule.id)}
                        onChange={(e) => {
                          if (e.target.checked) setPlaybookRulesChecked([...playbookRulesChecked, rule.id]);
                          else setPlaybookRulesChecked(playbookRulesChecked.filter(id => id !== rule.id));
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Prop Challenge Selection */}
            {activeChallenges.length > 0 && (
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Link to Prop Challenge</label>
                <select value={propChallengeId} onChange={(e) => setPropChallengeId(e.target.value)}
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors appearance-none">
                  <option value="">Do not link challenge...</option>
                  {activeChallenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firmName} ({c.phase}) - ${c.accountSize.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Account Selection */}
            {accounts.length > 0 && (
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Trading Account</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors appearance-none">
                  <option value="">None (General)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type}) - {acc.currency}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">
                Emotion: <span className="text-accent-violet">{emotionLabels[emotion]?.emoji} {emotionLabels[emotion]?.label}</span>
              </label>
              <input type="range" min={-5} max={5} value={emotion} onChange={(e) => setEmotion(parseInt(e.target.value))}
                className="w-full accent-accent-violet h-1.5 rounded-full appearance-none bg-bg-card cursor-pointer" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Session</label>
                <select value={sessionTag} onChange={(e) => setSessionTag(e.target.value as SessionTag)}
                  className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-xs">
                  {SESSION_TAGS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Condition</label>
                <select value={marketCondition} onChange={(e) => setMarketCondition(e.target.value as MarketCondition)}
                  className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-xs">
                  {MARKET_CONDITIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Setup Tags</label>
              <div className="flex flex-wrap gap-1">
                {SETUP_TAGS.map((tag) => (
                  <button key={tag} onClick={() => toggleTag(tag, setupTags, setSetupTags)}
                    className={cn("px-2 py-1 rounded border text-[10px] transition-all",
                      setupTags.includes(tag) ? "bg-accent-violet/15 text-accent-violet border-accent-violet/30" : "bg-bg-card text-text-muted border-border-subtle")}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Mistakes</label>
              <div className="flex flex-wrap gap-1">
                {MISTAKE_TAGS.map((tag) => (
                  <button key={tag} onClick={() => toggleTag(tag, mistakeTags as string[], setMistakeTags as (v: string[]) => void)}
                    className={cn("px-2 py-1 rounded border text-[10px] transition-all",
                      mistakeTags.includes(tag) ? "bg-accent-coral/15 text-accent-coral border-accent-coral/30" : "bg-bg-card text-text-muted border-border-subtle")}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 4: Mindset & Notes */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-accent-violet" />
            <h2 className="font-[family-name:var(--font-inter)] font-bold text-base">Mindset & Analysis</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Mindset State</label>
              <div className="flex flex-wrap gap-1.5">
                {MINDSET_TAGS.map((tag) => (
                  <button key={tag} onClick={() => toggleTag(tag, mindsetTags, setMindsetTags)}
                    className={cn("px-3 py-1.5 rounded-xl border text-xs transition-all",
                      mindsetTags.includes(tag) ? "bg-accent-violet/15 text-accent-violet border-accent-violet/30" : "bg-bg-card text-text-muted border-border-subtle")}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Mindset Notes</label>
              <textarea value={mindsetNotes} onChange={(e) => setMindsetNotes(e.target.value)}
                className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3 text-sm min-h-[100px] resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Pre-Trade Notes</label>
                <textarea value={preNotes} onChange={(e) => setPreNotes(e.target.value)}
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2 text-sm min-h-[80px] resize-none" />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Post-Trade Review</label>
                <textarea value={postReview} onChange={(e) => setPostReview(e.target.value)}
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2 text-sm min-h-[80px] resize-none" />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Section 5: Media & Screenshots */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon size={18} className="text-accent-violet" />
            <h2 className="font-[family-name:var(--font-inter)] font-bold text-base">Media & Screenshots</h2>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input type="text" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste chart URL..."
                className="flex-1 bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm" />
              <button 
                type="button"
                onClick={() => { 
                  if (newImageUrl) { 
                    const cleanUrl = (url: string) => {
                      let cleaned = url.trim();
                      const tvMatch = cleaned.match(/https?:\/\/(?:\w+\.)?tradingview\.com\/x\/(\w+)\/?/);
                      if (tvMatch) {
                        return `https://s3.tradingview.com/x/${tvMatch[1]}.png`;
                      }
                      return cleaned;
                    };
                    setScreenshotUrls([...screenshotUrls, cleanUrl(newImageUrl)]); 
                    setNewImageUrl(""); 
                  } 
                }}
                className="bg-accent-violet text-white p-2.5 rounded-xl">
                <Plus size={20} />
              </button>
              <label className={cn("flex items-center justify-center bg-bg-card border border-border-subtle hover:border-accent-violet/40 text-text-secondary hover:text-text-primary p-2.5 rounded-xl cursor-pointer transition-all", isUploading && "opacity-50 pointer-events-none")} title="Upload Screenshot">
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-accent-violet border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={20} />
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  disabled={isUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    setIsUploading(true);
                    try {
                      const compressedDataUrl = await compressImage(file);
                      setScreenshotUrls((prev) => [...prev, compressedDataUrl]);
                    } catch (error) {
                      console.error("Upload/Compression error:", error);
                      // Absolute basic fallback in case of canvas issues
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === "string") {
                          setScreenshotUrls((prev) => [...prev, reader.result as string]);
                        }
                      };
                      reader.readAsDataURL(file);
                    } finally {
                      setIsUploading(false);
                    }
                  }} 
                  className="hidden" 
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {screenshotUrls.map((url, i) => (
                <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-border-subtle">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setScreenshotUrls(screenshotUrls.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 bg-accent-coral text-white rounded-md opacity-0 group-hover:opacity-100">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
        <Link href={`/journal/${trade.id}`} className="px-6 py-2.5 rounded-xl text-sm text-text-secondary bg-bg-card border border-border-subtle">
          Cancel
        </Link>
        <button onClick={handleSubmit}
          className="flex items-center gap-2 bg-gradient-to-r from-accent-violet to-accent-blue text-white shadow-[0_0_20px_rgba(143,0,255,0.2)] hover:shadow-[0_0_30px_rgba(143,0,255,0.35)] px-8 py-2.5 rounded-xl text-sm font-semibold hover:shadow-[0_0_30px_rgba(123,97,255,0.3)] transition-all disabled:opacity-40"
          disabled={!isReady}>
          <Save size={16} /> Update Trade
        </button>
      </div>
    </div>
  );
}
