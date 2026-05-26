"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTradeStore, useSettingsStore, usePropFirmStore, usePlaybookStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { SYMBOLS, SETUP_TAGS, SESSION_TAGS, MARKET_CONDITIONS, MISTAKE_TAGS, PLAYBOOKS, MINDSET_TAGS, Trade, SessionTag, MarketCondition, MistakeTag } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight, ArrowDownRight, Save, Mic, MicOff, ChevronLeft, Upload, Zap, Settings2,
  Image as ImageIcon, X, Plus, Brain, CheckCircle, AlertTriangle, Clock, DollarSign, TrendingUp
} from "lucide-react";
import Link from "next/link";

const emotionLabels: Record<number, { label: string; emoji: string; color: string }> = {
  "-5": { label: "Terrified", emoji: "😰", color: "text-red-500" },
  "-4": { label: "Very Fearful", emoji: "😨", color: "text-red-400" },
  "-3": { label: "Fearful", emoji: "😟", color: "text-orange-400" },
  "-2": { label: "Anxious", emoji: "😕", color: "text-orange-300" },
  "-1": { label: "Uneasy", emoji: "😐", color: "text-yellow-400" },
  "0":  { label: "Neutral", emoji: "😶", color: "text-text-secondary" },
  "1":  { label: "Confident", emoji: "🙂", color: "text-accent-green" },
  "2":  { label: "Very Confident", emoji: "😊", color: "text-accent-green" },
  "3":  { label: "Aggressive", emoji: "😤", color: "text-yellow-400" },
  "4":  { label: "Overconfident", emoji: "😎", color: "text-orange-400" },
  "5":  { label: "Euphoric", emoji: "🤩", color: "text-red-400" },
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
        const MAX_WIDTH = 1200, MAX_HEIGHT = 800;
        let width = img.width, height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height = (height * MAX_WIDTH) / width; width = MAX_WIDTH; } }
        else { if (height > MAX_HEIGHT) { width = (width * MAX_HEIGHT) / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL("image/jpeg", 0.7)); }
        else resolve(event.target?.result as string);
      };
    };
  });
};

function formatDurationFromDates(entry: string, exit: string): string {
  if (!entry || !exit) return "";
  const ms = new Date(exit).getTime() - new Date(entry).getTime();
  if (ms <= 0) return "";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export default function NewTradePage() {
  const router = useRouter();
  const { addTrade, trades } = useTradeStore();
  const { settings } = useSettingsStore();
  const checklistItems = settings.trading.checklist || [];
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [mode, setMode] = useState<"quick" | "detailed">("quick");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const [symbol, setSymbol] = useState("");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [showSymbols, setShowSymbols] = useState(false);
  const [direction, setDirection] = useState<"long" | "short">("long");

  const [quickNetPnl, setQuickNetPnl] = useState("");

  const [entryPrice, setEntryPrice] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [exitDate, setExitDate] = useState("");
  const [commission, setCommission] = useState("4.50");

  const [emotion, setEmotion] = useState<number | null>(null);
  const [preNotes, setPreNotes] = useState("");
  const [postReview, setPostReview] = useState("");
  const [setupTags, setSetupTags] = useState<string[]>([]);
  const [sessionTag, setSessionTag] = useState<SessionTag>("NY AM");
  const [marketCondition, setMarketCondition] = useState<MarketCondition>("Trending");
  const [mistakeTags, setMistakeTags] = useState<MistakeTag[]>([]);
  const [playbook, setPlaybook] = useState("");
  const [propChallengeId, setPropChallengeId] = useState("");
  const { challenges } = usePropFirmStore();
  const { playbooks } = usePlaybookStore();
  const [mindsetTags, setMindsetTags] = useState<string[]>([]);
  const [mindsetNotes, setMindsetNotes] = useState("");
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const activeChallenges = useMemo(() => challenges.filter(c => c.status === "active"), [challenges]);
  const allPlaybooks = useMemo(() => {
    const customs = playbooks.map(p => p.name);
    const defaults = ["ICT Silver Bullet", "Liquidity Sweep + IFVG", "Opening Range Breakout", "VWAP Mean Reversion", "SMT + OB Confluence", "London Session Sweep", "Asian Range Breakout"];
    return Array.from(new Set([...customs, ...defaults]));
  }, [playbooks]);

  const recentSymbols = useMemo(() => {
    const used = trades.map(t => t.symbol);
    return Array.from(new Set(used)).slice(-6).reverse();
  }, [trades]);

  const recognitionRef = useRef<any>(null);
  useEffect(() => {
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        let t = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) t += event.results[i][0].transcript;
        setTranscript(t);
        parseVoiceCommand(t);
      };
      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
    return () => { if (recognitionRef.current) recognitionRef.current.stop(); };
  }, [direction, symbol, quickNetPnl]);

  const toggleRecording = () => {
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); }
    else {
      if (recognitionRef.current) { setTranscript(""); recognitionRef.current.start(); setIsRecording(true); }
      else alert("Voice recognition not supported. Try Chrome or Safari.");
    }
  };

  const parseVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("long") || lower.includes("bought") || lower.includes("buy")) setDirection("long");
    if (lower.includes("short") || lower.includes("sold") || lower.includes("sell")) setDirection("short");
    const symbolsMap: Record<string, string> = { "nq": "NQ", "nasdaq": "NQ", "es": "ES", "s&p": "ES", "apple": "AAPL", "tesla": "TSLA", "gold": "GC", "oil": "CL", "euro": "EURUSD", "pound": "GBPUSD", "bitcoin": "BTCUSD" };
    for (const [key, val] of Object.entries(symbolsMap)) { if (lower.includes(key)) setSymbol(val); }
    const madeMatch = lower.match(/(?:made|won|up|profit)[\s$]*(\d+(?:\.\d+)?)/);
    if (madeMatch) setQuickNetPnl(madeMatch[1]);
    const lostMatch = lower.match(/(?:lost|down|loss|minus)[\s$]*(\d+(?:\.\d+)?)/);
    if (lostMatch) setQuickNetPnl(`-${lostMatch[1]}`);
  };

  const filteredSymbols = useMemo(() => SYMBOLS.filter(s => s.toLowerCase().includes(symbolSearch.toLowerCase())).slice(0, 8), [symbolSearch]);

  const detailedCalculations = useMemo(() => {
    if (mode === "quick") return null;
    const entry = parseFloat(entryPrice), exit = parseFloat(exitPrice), sl = parseFloat(stopLoss), tp = parseFloat(takeProfit);
    const size = parseFloat(positionSize), comm = parseFloat(commission) || 0;
    if (isNaN(entry) || isNaN(exit) || isNaN(size)) return null;
    const rawPnl = direction === "long" ? (exit - entry) * size : (entry - exit) * size;
    const netPnl = rawPnl - comm;
    const risk = (!isNaN(sl) && sl > 0) ? Math.abs(entry - sl) * size : 200;
    const rMultiple = netPnl / (risk || 200);
    const rr = (!isNaN(sl) && !isNaN(tp) && sl > 0) ? Math.abs(tp - entry) / Math.abs(entry - sl) : Math.abs(netPnl) / (risk || 200);
    const pctChange = ((exit - entry) / entry) * 100 * (direction === "long" ? 1 : -1);
    return { netPnl, rMultiple, rr, pctChange };
  }, [mode, entryPrice, exitPrice, stopLoss, takeProfit, positionSize, commission, direction]);

  const livePnl = mode === "quick" ? parseFloat(quickNetPnl) || 0 : detailedCalculations?.netPnl || 0;
  const holdDuration = formatDurationFromDates(entryDate, exitDate);
  const isChecklistMet = !settings.trading.forceChecklist || checkedItems.length === checklistItems.length;
  const isReady = symbol && (mode === "quick" ? quickNetPnl !== "" : (entryPrice && exitPrice && positionSize)) && isChecklistMet && emotion !== null;

  const handleSubmit = () => {
    if (!isReady) return;
    const lastEquity = trades.length > 0 ? trades[trades.length - 1].accountEquityAfter : 50000;
    const entryD = new Date(entryDate || Date.now());
    const exitD = new Date(exitDate || Date.now());
    const durationMinutes = Math.round((exitD.getTime() - entryD.getTime()) / 60000);
    const netPnl = mode === "quick" ? parseFloat(quickNetPnl) : detailedCalculations?.netPnl || 0;
    const trade: Omit<Trade, "id"> = {
      symbol, direction,
      entryDate: entryD.toISOString(), exitDate: exitD.toISOString(),
      commission: mode === "quick" ? 0 : parseFloat(commission) || 0,
      netPnl: parseFloat(netPnl.toFixed(2)),
      rMultiple: mode === "quick" ? parseFloat((netPnl / 200).toFixed(2)) : parseFloat((detailedCalculations?.rMultiple || (netPnl / 200)).toFixed(2)),
      rr: mode === "quick" ? parseFloat(Math.abs(netPnl / 200).toFixed(2)) : parseFloat((detailedCalculations?.rr || Math.abs(netPnl / 200)).toFixed(2)),
      result: netPnl >= 0 ? "win" : "loss",
      emotion: emotion || 0, preTradeNotes: preNotes, postTradeReview: postReview,
      setupTags, sessionTag, marketCondition, mistakeTags,
      playbook: playbook || undefined, propChallengeId: propChallengeId || undefined,
      durationMinutes: Math.max(durationMinutes, 1),
      accountEquityAfter: parseFloat((lastEquity + netPnl).toFixed(2)),
      screenshotUrls, mindsetTags, mindsetNotes,
    };
    if (mode === "detailed") {
      trade.entryPrice = isNaN(parseFloat(entryPrice)) ? undefined : parseFloat(entryPrice);
      trade.exitPrice = isNaN(parseFloat(exitPrice)) ? undefined : parseFloat(exitPrice);
      trade.stopLoss = isNaN(parseFloat(stopLoss)) ? undefined : parseFloat(stopLoss);
      trade.takeProfit = isNaN(parseFloat(takeProfit)) ? undefined : parseFloat(takeProfit);
      trade.positionSize = isNaN(parseFloat(positionSize)) ? 0 : parseFloat(positionSize);
    }
    addTrade(trade);
    router.push("/journal");
  };

  const toggleTag = (tag: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag]);
  };

  const currentEmotionData = emotion !== null ? emotionLabels[emotion] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/journal" className="p-2 rounded-xl bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="font-[family-name:var(--font-syne)] font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-accent-green to-accent-blue">Log New Trade</h1>
            <p className="text-xs text-text-secondary mt-0.5">Record your execution — be honest, be accurate</p>
          </div>
        </div>
        <div className="flex p-1 bg-bg-card border border-border-subtle rounded-xl">
          <button onClick={() => setMode("quick")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              mode === "quick" ? "bg-accent-violet text-white shadow-md" : "text-text-muted hover:text-text-primary")}>
            <Zap size={14} /> Quick
          </button>
          <button onClick={() => setMode("detailed")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              mode === "detailed" ? "bg-accent-violet text-white shadow-md" : "text-text-muted hover:text-text-primary")}>
            <Settings2 size={14} /> Detailed
          </button>
        </div>
      </div>

      {/* === SECTION 1: EMOTION FIRST — most important === */}
      <GlassCard className="border border-border-subtle relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-accent-violet/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-4">
          <Brain size={18} className="text-accent-violet" />
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">How Are You Feeling Right Now?</h2>
          <span className="text-accent-coral text-sm font-black">*</span>
          {currentEmotionData && (
            <motion.span key={emotion} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className={cn("ml-auto text-sm font-bold", currentEmotionData.color)}>
              {currentEmotionData.emoji} {currentEmotionData.label}
            </motion.span>
          )}
        </div>
        <div className="flex gap-2 justify-between">
          {Object.entries(emotionLabels).map(([val, { emoji, label, color }]) => {
            const numVal = parseInt(val);
            const isSelected = emotion === numVal;
            return (
              <motion.button key={val} onClick={() => setEmotion(numVal)} title={label}
                whileHover={{ scale: 1.2, y: -3 }} whileTap={{ scale: 0.9 }}
                className={cn("flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xl transition-all",
                  isSelected
                    ? "bg-accent-violet/20 border-2 border-accent-violet shadow-[0_0_20px_rgba(123,97,255,0.3)]\\'"
                    : "bg-bg-secondary/20 dark:bg-white/[0.01] border-2 border-transparent opacity-50 hover:opacity-100")}>
                {emoji}
                <span className={cn("text-[8px] font-black uppercase tracking-tight leading-none", isSelected ? "text-accent-violet" : "text-text-muted/50 group-hover:text-text-muted")}>{numVal > 0 ? "+" : ""}{numVal}</span>
              </motion.button>
            );
          })}
        </div>
        {emotion !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={cn("mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-center border",
              emotion >= 2 && emotion <= -2 ? "bg-accent-green/5 border-accent-green/20 text-accent-green" :
              Math.abs(emotion) >= 3 ? "bg-accent-coral/5 border-accent-coral/20 text-accent-coral" :
              "bg-bg-secondary/30 dark:bg-white/[0.01] border-border-subtle text-text-secondary")}>
            {emotion > 2 ? "⚠️ High confidence detected — be cautious of overtrading" :
             emotion < -2 ? "⚠️ High fear detected — consider sitting out this session" :
             emotion === 0 ? "✓ Neutral mindset — ideal baseline for disciplined trading" :
             "✓ Good emotional baseline for execution"}
          </motion.div>
        )}
      </GlassCard>

      {/* Voice Bar (Quick mode) */}
      <AnimatePresence>
        {mode === "quick" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className={cn("p-3.5 rounded-2xl flex items-center justify-between transition-all",
              isRecording ? "bg-accent-violet/10 border-2 border-accent-violet shadow-[0_0_20px_rgba(106,76,255,0.2)]" : "glass-static")}>
              <div className="flex items-center gap-3">
                <button onClick={toggleRecording}
                  className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isRecording ? "bg-accent-coral text-white animate-pulse" : "bg-bg-secondary text-text-secondary hover:bg-accent-violet hover:text-white")}>
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <div>
                  <div className="text-sm font-bold">{isRecording ? "🔴 Listening..." : "Voice Dictation"}</div>
                  <div className="text-xs text-text-muted">
                    {transcript ? <span className="italic text-accent-violet">"{transcript}"</span> : 'Say: "Long NQ made 500" or "Short ES lost 150"'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === SECTION 2: Trade Setup === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Trade Setup</h2>
            {/* Live P&L Preview */}
            <AnimatePresence>
              {(livePnl !== 0) && (
                <motion.div key="pnl" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-[family-name:var(--font-space-mono)] font-black text-sm",
                    livePnl >= 0 ? "bg-accent-green/10 border-accent-green/20 text-accent-green" : "bg-accent-coral/10 border-accent-coral/20 text-accent-coral")}>
                  <DollarSign size={13} />
                  {livePnl >= 0 ? "+" : ""}{formatCurrency(livePnl)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="space-y-4">
            {/* Recent Symbols */}
            {recentSymbols.length > 0 && !symbol && (
              <div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 font-bold">Recent Symbols</div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSymbols.map(s => (
                    <button key={s} onClick={() => { setSymbol(s); setSymbolSearch(""); setShowSymbols(false); }}
                      className="px-2.5 py-1 rounded-lg bg-bg-secondary/30 dark:bg-white/[0.02] border border-border-subtle text-xs font-[family-name:var(--font-space-mono)] font-bold hover:border-accent-violet/40 hover:bg-accent-violet/10 hover:text-accent-violet transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Symbol */}
              <div className="relative">
                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Symbol</label>
                <input
                  type="text" value={symbolSearch || symbol}
                  onChange={e => { setSymbolSearch(e.target.value); setShowSymbols(true); setSymbol(""); }}
                  onFocus={() => setShowSymbols(true)}
                  placeholder="e.g. NQ"
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2.5 text-sm font-[family-name:var(--font-space-mono)] uppercase focus:outline-none focus:border-accent-violet/50 transition-colors" />
                {symbol && (
                  <span className="absolute right-2 top-9 text-[10px] font-black text-accent-green">✓</span>
                )}
                {showSymbols && filteredSymbols.length > 0 && !symbol && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border-subtle rounded-xl overflow-hidden z-10 shadow-xl">
                    {filteredSymbols.map(s => (
                      <button key={s} onClick={() => { setSymbol(s); setSymbolSearch(""); setShowSymbols(false); }}
                        className="w-full text-left px-3 py-2 text-sm font-[family-name:var(--font-space-mono)] hover:bg-accent-violet/10 hover:text-accent-violet transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Net PnL */}
              {mode === "quick" && (
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Net P&L ($)</label>
                  <input type="number" step="any" value={quickNetPnl} onChange={e => setQuickNetPnl(e.target.value)}
                    className={cn("w-full bg-bg-card border rounded-xl px-3 py-2.5 text-sm font-[family-name:var(--font-space-mono)] font-bold focus:outline-none transition-colors",
                      quickNetPnl ? (parseFloat(quickNetPnl) >= 0 ? "border-accent-green/40 text-accent-green" : "border-accent-coral/40 text-accent-coral") : "border-border-subtle focus:border-accent-violet/50")}
                    placeholder="e.g. 150 or -50" />
                </div>
              )}
            </div>

            {/* Direction */}
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Direction</label>
              <div className="flex gap-2">
                <button onClick={() => setDirection("long")}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                    direction === "long" ? "bg-accent-green/15 text-accent-green border-2 border-accent-green/40 shadow-[0_0_20px_rgba(0,255,178,0.12)]" : "bg-bg-card text-text-muted border border-border-subtle hover:border-accent-green/20")}>
                  <ArrowUpRight size={16} /> Long
                </button>
                <button onClick={() => setDirection("short")}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                    direction === "short" ? "bg-accent-coral/15 text-accent-coral border-2 border-accent-coral/40 shadow-[0_0_20px_rgba(255,45,85,0.12)]" : "bg-bg-card text-text-muted border border-border-subtle hover:border-accent-coral/20")}>
                  <ArrowDownRight size={16} /> Short
                </button>
              </div>
            </div>

            {/* Detailed Execution Inputs */}
            <AnimatePresence>
              {mode === "detailed" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="pt-3 border-t border-border-subtle">
                    <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block font-bold">Execution Prices</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: "Entry", value: entryPrice, setter: setEntryPrice },
                        { label: "Exit", value: exitPrice, setter: setExitPrice },
                        { label: "Stop Loss", value: stopLoss, setter: setStopLoss },
                        { label: "Take Profit", value: takeProfit, setter: setTakeProfit },
                        { label: "Position Size", value: positionSize, setter: setPositionSize },
                        { label: "Commission", value: commission, setter: setCommission },
                      ].map(field => (
                        <div key={field.label}>
                          <label className="text-[9px] text-text-muted uppercase tracking-wider mb-1 block font-bold">{field.label}</label>
                          <input type="number" step="any" value={field.value} onChange={e => field.setter(e.target.value)}
                            className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40 transition-colors"
                            placeholder="0.00" />
                        </div>
                      ))}
                    </div>
                    {detailedCalculations && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className={cn("mt-3 p-3 rounded-xl border flex justify-between items-center",
                          detailedCalculations.netPnl >= 0 ? "bg-accent-green/5 border-accent-green/20" : "bg-accent-coral/5 border-accent-coral/20")}>
                        <div>
                          <div className="text-[9px] text-text-muted uppercase font-bold tracking-wider">Net P&L</div>
                          <div className={cn("font-[family-name:var(--font-space-mono)] font-black text-lg", detailedCalculations.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                            {detailedCalculations.netPnl >= 0 ? "+" : ""}{formatCurrency(detailedCalculations.netPnl)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-text-muted uppercase font-bold tracking-wider">R-Multiple</div>
                          <div className={cn("font-[family-name:var(--font-space-mono)] font-black text-sm", detailedCalculations.rMultiple >= 0 ? "text-accent-green" : "text-accent-coral")}>
                            {detailedCalculations.rMultiple >= 0 ? "+" : ""}{detailedCalculations.rMultiple.toFixed(2)}R
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] text-text-muted uppercase font-bold tracking-wider">R:R Ratio</div>
                          <div className="font-[family-name:var(--font-space-mono)] font-black text-sm">1:{detailedCalculations.rr.toFixed(1)}</div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Entry/Exit Times */}
            <div className="pt-3 border-t border-border-subtle">
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block font-bold">Trade Timestamps</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-text-muted uppercase tracking-wider mb-1 block">Entry Time</label>
                  <input type="datetime-local" value={entryDate} onChange={e => setEntryDate(e.target.value)}
                    className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent-violet/40 transition-colors" />
                </div>
                <div>
                  <label className="text-[9px] text-text-muted uppercase tracking-wider mb-1 block">Exit Time</label>
                  <input type="datetime-local" value={exitDate} onChange={e => setExitDate(e.target.value)}
                    className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent-violet/40 transition-colors" />
                </div>
              </div>
              {holdDuration && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
                  <Clock size={11} className="text-accent-violet" />
                  Hold Duration: <span className="font-[family-name:var(--font-space-mono)] font-bold text-accent-violet">{holdDuration}</span>
                </motion.div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Psychology & Tags */}
        <GlassCard>
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4">Psychology & Tags</h2>
          <div className="space-y-4">
            {/* Playbook */}
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Playbook</label>
              <select value={playbook} onChange={e => setPlaybook(e.target.value)}
                className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors appearance-none">
                <option value="">Select playbook...</option>
                {allPlaybooks.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {activeChallenges.length > 0 && (
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Link Prop Challenge</label>
                <select value={propChallengeId} onChange={e => setPropChallengeId(e.target.value)}
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors appearance-none">
                  <option value="">No challenge link</option>
                  {activeChallenges.map(c => <option key={c.id} value={c.id}>{c.firmName} ({c.phase}) — ${c.accountSize.toLocaleString()}</option>)}
                </select>
              </div>
            )}

            {/* Session & Conditions */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Session</label>
                <select value={sessionTag} onChange={e => setSessionTag(e.target.value as SessionTag)}
                  className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent-violet/40">
                  {SESSION_TAGS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Condition</label>
                <select value={marketCondition} onChange={e => setMarketCondition(e.target.value as MarketCondition)}
                  className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent-violet/40">
                  {MARKET_CONDITIONS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Setup Tags */}
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Setup Tags</label>
              <div className="flex flex-wrap gap-1">
                {SETUP_TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag, setupTags, setSetupTags)}
                    className={cn("px-2 py-1 rounded-lg border text-[10px] font-bold transition-all",
                      setupTags.includes(tag) ? "bg-accent-violet/15 text-accent-violet border-accent-violet/30" : "bg-bg-card text-text-muted border-border-subtle hover:border-accent-violet/20")}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Mistake Tags */}
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Execution Mistakes</label>
              <div className="flex flex-wrap gap-1">
                {MISTAKE_TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag, mistakeTags as string[], setMistakeTags as (v: string[]) => void)}
                    className={cn("px-2 py-1 rounded-lg border text-[10px] font-bold transition-all",
                      mistakeTags.includes(tag) ? "bg-accent-coral/15 text-accent-coral border-accent-coral/30" : "bg-bg-card text-text-muted border-border-subtle hover:border-accent-coral/20")}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Mindset & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} className="text-accent-violet" />
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Mindset & Analysis</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block font-bold">Mindset State</label>
              <div className="flex flex-wrap gap-1.5">
                {MINDSET_TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag, mindsetTags, setMindsetTags)}
                    className={cn("px-2.5 py-1 rounded-xl border text-xs font-bold transition-all",
                      mindsetTags.includes(tag) ? "bg-accent-violet/15 text-accent-violet border-accent-violet/30" : "bg-bg-card text-text-muted border-border-subtle hover:border-accent-violet/20")}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-text-muted uppercase tracking-wider mb-2 block font-bold">Mindset Notes</label>
              <textarea value={mindsetNotes} onChange={e => setMindsetNotes(e.target.value)}
                placeholder="What were you thinking before/during the trade? Any bias?"
                className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-violet/40 min-h-[80px] resize-none transition-all" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Pre-Trade Plan</label>
                <textarea value={preNotes} onChange={e => setPreNotes(e.target.value)}
                  placeholder="Your thesis going into the trade..."
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent-violet/40 min-h-[80px] resize-none" />
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block font-bold">Post-Trade Review</label>
                <textarea value={postReview} onChange={e => setPostReview(e.target.value)}
                  placeholder="What went well? What to fix next time?"
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent-violet/40 min-h-[80px] resize-none" />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Media & Screenshots */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon size={16} className="text-accent-violet" />
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Chart Screenshots</h2>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input type="text" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
                placeholder="Paste TradingView or Imgur URL..."
                className="flex-1 bg-bg-card border border-border-subtle rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-all" />
              <button onClick={() => { if (newImageUrl) { const cleaned = newImageUrl.trim(); setScreenshotUrls(prev => [...prev, cleaned]); setNewImageUrl(""); } }}
                className="bg-accent-violet text-white p-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(123,97,255,0.3)] transition-all">
                <Plus size={18} />
              </button>
              <label className={cn("flex items-center justify-center bg-bg-card border border-border-subtle hover:border-accent-violet/40 text-text-secondary hover:text-text-primary p-2.5 rounded-xl cursor-pointer transition-all", isUploading && "opacity-50 pointer-events-none")} title="Upload Screenshot">
                {isUploading ? <div className="w-4 h-4 border-2 border-accent-violet border-t-transparent rounded-full animate-spin" /> : <Upload size={18} />}
                <input type="file" accept="image/*" disabled={isUploading} onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploading(true);
                  try {
                    const compressed = await compressImage(file);
                    setScreenshotUrls(prev => [...prev, compressed]);
                  } catch {
                    const reader = new FileReader();
                    reader.onloadend = () => { if (typeof reader.result === "string") setScreenshotUrls(prev => [...prev, reader.result as string]); };
                    reader.readAsDataURL(file);
                  } finally { setIsUploading(false); }
                }} className="hidden" />
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {screenshotUrls.map((url, i) => (
                <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-border-subtle bg-bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => setScreenshotUrls(screenshotUrls.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 bg-accent-coral text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={11} />
                  </button>
                </div>
              ))}
              {screenshotUrls.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-border-subtle rounded-xl p-8 flex flex-col items-center justify-center text-text-muted">
                  <Upload size={24} className="mb-2 opacity-30" />
                  <p className="text-xs text-center">No screenshots yet.<br />Paste a TradingView link or upload.</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Checklist */}
      {checklistItems.length > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-accent-green" />
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Pre-Trade Checklist</h2>
            </div>
            <span className="text-xs text-text-muted">{checkedItems.length}/{checklistItems.length} verified</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checklistItems.map(item => (
              <button key={item} onClick={() => toggleTag(item, checkedItems, setCheckedItems)}
                className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  checkedItems.includes(item) ? "bg-accent-green/10 border-accent-green/30 text-accent-green" : "bg-bg-card border-border-subtle text-text-secondary hover:border-accent-green/20")}>
                <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0",
                  checkedItems.includes(item) ? "bg-accent-green border-accent-green text-bg-base" : "border-text-muted/30")}>
                  {checkedItems.includes(item) && <CheckCircle size={12} />}
                </div>
                <span className="text-xs font-bold">{item}</span>
              </button>
            ))}
          </div>
          {settings.trading.forceChecklist && checkedItems.length < checklistItems.length && (
            <p className="mt-4 text-[10px] text-accent-coral flex items-center gap-1.5">
              <AlertTriangle size={12} /> All checklist items must be verified before saving.
            </p>
          )}
        </GlassCard>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
        <Link href="/journal" className="px-6 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary bg-bg-card border border-border-subtle hover:border-accent-violet/30 transition-all">
          Cancel
        </Link>
        <motion.button
          onClick={handleSubmit}
          disabled={!isReady}
          whileHover={isReady ? { scale: 1.02 } : {}}
          whileTap={isReady ? { scale: 0.97 } : {}}
          className={cn(
            "flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-black transition-all duration-300 relative overflow-hidden",
            isReady
              ? "bg-gradient-to-r from-accent-green to-accent-blue text-bg-base shadow-[0_0_30px_rgba(0,255,178,0.25)] hover:shadow-[0_0_40px_rgba(0,255,178,0.4)] border border-white/10"
              : "bg-bg-secondary/40 text-text-muted border border-border-subtle cursor-not-allowed"
          )}>
          {isReady && <div className="absolute inset-0 bg-white/5 animate-pulse rounded-xl" />}
          <Save size={16} className="relative z-10" />
          <span className="relative z-10">Save Trade</span>
        </motion.button>
      </div>
    </div>
  );
}
