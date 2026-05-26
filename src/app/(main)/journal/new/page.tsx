"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTradeStore, useSettingsStore, usePropFirmStore, usePlaybookStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { SYMBOLS, SETUP_TAGS, SESSION_TAGS, MARKET_CONDITIONS, MISTAKE_TAGS, PLAYBOOKS, MINDSET_TAGS, Trade, SessionTag, MarketCondition, MistakeTag } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Save, Mic, MicOff, ChevronLeft, Upload, Zap, Settings2, Image as ImageIcon, X, Plus, Brain, CheckCircle, AlertTriangle } from "lucide-react";
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

  const activeChallenges = useMemo(() => challenges.filter(c => c.status === "active"), [challenges]);
  
  const allPlaybooks = useMemo(() => {
    const customs = playbooks.map(p => p.name);
    const defaults = ["ICT Silver Bullet", "Liquidity Sweep + IFVG", "Opening Range Breakout", "VWAP Mean Reversion", "SMT + OB Confluence", "London Session Sweep", "Asian Range Breakout"];
    return Array.from(new Set([...customs, ...defaults]));
  }, [playbooks]);

  const [mindsetTags, setMindsetTags] = useState<string[]>([]);
  const [mindsetNotes, setMindsetNotes] = useState("");
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        parseVoiceCommand(currentTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  }, [direction, symbol, quickNetPnl]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        setTranscript("");
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert("Voice recognition is not supported in this browser. Try Chrome or Safari.");
      }
    }
  };

  const parseVoiceCommand = (text: string) => {
    const lower = text.toLowerCase();
    
    // Direction
    if (lower.includes("long") || lower.includes("bought") || lower.includes("buy")) setDirection("long");
    if (lower.includes("short") || lower.includes("sold") || lower.includes("sell")) setDirection("short");

    // Symbol parsing
    const symbolsMap: Record<string, string> = { 
      "nq": "NQ", "nasdaq": "NQ", "es": "ES", "s&p": "ES", 
      "apple": "AAPL", "tesla": "TSLA", "gold": "GC", "oil": "CL",
      "euro": "EURUSD", "pound": "GBPUSD", "bitcoin": "BTCUSD"
    };
    for (const [key, val] of Object.entries(symbolsMap)) {
      if (lower.includes(key)) setSymbol(val);
    }

    // PnL parsing
    const madeMatch = lower.match(/(?:made|won|up|profit)[\s$]*(\d+(?:\.\d+)?)/);
    if (madeMatch) setQuickNetPnl(madeMatch[1]);
    
    const lostMatch = lower.match(/(?:lost|down|loss|minus)[\s$]*(\d+(?:\.\d+)?)/);
    if (lostMatch) setQuickNetPnl(`-${lostMatch[1]}`);
  };

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
      symbol,
      direction,
      entryDate: entryD.toISOString(),
      exitDate: exitD.toISOString(),
      commission: mode === "quick" ? 0 : parseFloat(commission) || 0,
      netPnl: parseFloat(netPnl.toFixed(2)),
      rMultiple: mode === "quick" ? parseFloat((netPnl / 200).toFixed(2)) : parseFloat((detailedCalculations?.rMultiple || (netPnl / 200)).toFixed(2)),
      rr: mode === "quick" ? parseFloat(Math.abs(netPnl / 200).toFixed(2)) : parseFloat((detailedCalculations?.rr || Math.abs(netPnl / 200)).toFixed(2)),
      result: netPnl >= 0 ? "win" : "loss",
      emotion: emotion || 0,
      preTradeNotes: preNotes,
      postTradeReview: postReview,
      setupTags,
      sessionTag,
      marketCondition,
      mistakeTags,
      playbook: playbook || undefined,
      propChallengeId: propChallengeId || undefined,
      durationMinutes: Math.max(durationMinutes, 1),
      accountEquityAfter: parseFloat((lastEquity + netPnl).toFixed(2)),
      screenshotUrls,
      mindsetTags,
      mindsetNotes,
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
    setter(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/journal" className="p-2 rounded-xl bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl">Log New Trade</h1>
            <p className="text-sm text-text-secondary mt-0.5">Record your trade execution and review</p>
          </div>
        </div>

        <div className="flex p-1 bg-bg-card border border-border-subtle rounded-xl">
          <button onClick={() => setMode("quick")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === "quick" ? "bg-accent-violet text-white shadow-md" : "text-text-muted hover:text-text-primary")}>
            <Zap size={16} /> Quick Log
          </button>
          <button onClick={() => setMode("detailed")}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === "detailed" ? "bg-accent-violet text-white shadow-md" : "text-text-muted hover:text-text-primary")}>
            <Settings2 size={16} /> Detailed Log
          </button>
        </div>
      </div>

      {/* Voice Assistant Bar (Quick Mode Only) */}
      <AnimatePresence>
        {mode === "quick" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className={cn("p-4 rounded-2xl flex items-center justify-between transition-all", 
              isRecording ? "bg-accent-violet/10 border-2 border-accent-violet shadow-[0_0_20px_rgba(106,76,255,0.2)]" : "glass-static")}>
              <div className="flex items-center gap-4">
                <button onClick={toggleRecording} 
                  className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isRecording ? "bg-accent-coral text-white animate-pulse" : "bg-bg-secondary text-text-secondary hover:bg-accent-violet hover:text-white")}>
                  {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <div>
                  <div className="text-sm font-medium">{isRecording ? "Listening..." : "Voice Dictation"}</div>
                  <div className="text-xs text-text-muted">
                    {transcript ? <span className="italic text-accent-violet">"{transcript}"</span> : 'Say: "Long NQ made 500" or "Shorted ES lost 100"'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Trade Setup */}
        <GlassCard>
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4">Trade Setup</h2>
          <div className="space-y-4">
            
            {/* Live P&L Preview (Inside Setup for better layout) */}
            {(livePnl !== 0 || isReady) && (
              <div className={cn("p-3 rounded-xl border flex items-center justify-between", livePnl >= 0 ? "bg-accent-green/10 border-accent-green/20" : "bg-accent-coral/10 border-accent-coral/20")}>
                <span className="text-sm font-medium uppercase tracking-wider">Net P&L</span>
                <span className={cn("font-[family-name:var(--font-space-mono)] font-bold text-xl", livePnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                  {formatCurrency(livePnl)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Symbol */}
              <div className="relative">
                <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Symbol</label>
                <input
                  type="text"
                  value={symbolSearch || symbol}
                  onChange={(e) => { setSymbolSearch(e.target.value); setShowSymbols(true); setSymbol(""); }}
                  onFocus={() => setShowSymbols(true)}
                  placeholder="e.g. NQ"
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

              {/* Quick PnL Input */}
              {mode === "quick" && (
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Net P&L ($)</label>
                  <input type="number" step="any" value={quickNetPnl} onChange={(e) => setQuickNetPnl(e.target.value)}
                    className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40 transition-colors"
                    placeholder="e.g. 150 or -50" />
                </div>
              )}
            </div>

            {/* Direction */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Direction</label>
              <div className="flex gap-2">
                <button onClick={() => setDirection("long")}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                    direction === "long" ? "bg-accent-green/15 text-accent-green border border-accent-green/30 shadow-[0_0_15px_rgba(0,255,178,0.1)]" : "bg-bg-card text-text-muted border border-border-subtle hover:border-accent-green/20")}>
                  <ArrowUpRight size={16} /> Long
                </button>
                <button onClick={() => setDirection("short")}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                    direction === "short" ? "bg-accent-coral/15 text-accent-coral border border-accent-coral/30 shadow-[0_0_15px_rgba(255,45,85,0.1)]" : "bg-bg-card text-text-muted border border-border-subtle hover:border-accent-coral/20")}>
                  <ArrowDownRight size={16} /> Short
                </button>
              </div>
            </div>

            {/* Detailed Execution Inputs (Only visible in Detailed Mode) */}
            <AnimatePresence>
              {mode === "detailed" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="pt-4 border-t border-border-subtle mt-4">
                    <label className="text-xs text-text-muted uppercase tracking-wider mb-3 block">Execution Details</label>
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
                            className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40 transition-colors"
                            placeholder="0.00" />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-subtle">
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Entry Time (Optional)</label>
                <input type="datetime-local" value={entryDate} onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent-violet/40 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Exit Time (Optional)</label>
                <input type="datetime-local" value={exitDate} onChange={(e) => setExitDate(e.target.value)}
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent-violet/40 transition-colors" />
              </div>
            </div>

          </div>
        </GlassCard>

        {/* Section 3: Psychology */}
        <GlassCard>
          <h2 className="font-[family-name:var(--font-syne)] font-bold text-base mb-4">Psychology & Tags</h2>
          <div className="space-y-4">
            
            {/* Playbook */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Playbook</label>
              <select value={playbook} onChange={(e) => setPlaybook(e.target.value)}
                className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors appearance-none">
                <option value="">Select playbook...</option>
                {allPlaybooks.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

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

            {/* Emotion Selector */}
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">
                How did you feel? <span className="text-accent-coral">*</span>
                {emotion !== null && (
                  <span className="ml-2 text-accent-violet">
                    ({emotionLabels[emotion]?.emoji} {emotionLabels[emotion]?.label})
                  </span>
                )}
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-1">
                {Object.entries(emotionLabels).map(([val, { emoji, label }]) => {
                  const numVal = parseInt(val);
                  const isSelected = emotion === numVal;
                  return (
                    <button
                      key={val}
                      onClick={() => setEmotion(numVal)}
                      title={label}
                      className={cn(
                        "aspect-square flex items-center justify-center text-xl rounded-lg transition-all hover:-translate-y-1",
                        isSelected 
                          ? "bg-accent-violet border border-accent-violet shadow-[0_0_15px_rgba(123,97,255,0.4)] transform scale-110 z-10" 
                          : "bg-bg-card border border-border-subtle opacity-60 hover:opacity-100"
                      )}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session & Conditions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Session</label>
                <select value={sessionTag} onChange={(e) => setSessionTag(e.target.value as SessionTag)}
                  className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent-violet/40">
                  {SESSION_TAGS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 block">Condition</label>
                <select value={marketCondition} onChange={(e) => setMarketCondition(e.target.value as MarketCondition)}
                  className="w-full bg-bg-card border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent-violet/40">
                  {MARKET_CONDITIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Setup Tags */}
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

            {/* Mistake Tags */}
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
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Mindset & Analysis</h2>
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
              <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Mindset Notes / Self-Talk</label>
              <textarea value={mindsetNotes} onChange={(e) => setMindsetNotes(e.target.value)}
                placeholder="What were you thinking before and during the trade? Any internal bias?"
                className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-violet/40 min-h-[100px] resize-none transition-all" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Pre-Trade Notes</label>
                <textarea value={preNotes} onChange={(e) => setPreNotes(e.target.value)}
                  placeholder="Plan for the trade..."
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-violet/40 min-h-[80px] resize-none" />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Post-Trade Review</label>
                <textarea value={postReview} onChange={(e) => setPostReview(e.target.value)}
                  placeholder="What went well? What didn't?"
                  className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-violet/40 min-h-[80px] resize-none" />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Section 5: Media & Screenshots */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon size={18} className="text-accent-violet" />
            <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Media & Screenshots</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input type="text" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste chart URL (TradingView, Imgur...)"
                className="flex-1 bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-all" />
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
                className="bg-accent-violet text-white p-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(123,97,255,0.3)] transition-all">
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
                <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-border-subtle bg-bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Screenshot ${i+1}`} className="w-full h-full object-cover" />
                  <button onClick={() => setScreenshotUrls(screenshotUrls.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 bg-accent-coral text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {screenshotUrls.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-border-subtle rounded-xl p-8 flex flex-col items-center justify-center text-text-muted">
                  <Upload size={24} className="mb-2 opacity-40" />
                  <p className="text-xs text-center">No screenshots added yet.<br/>Add links from TradingView or Lightshot.</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Section 6: Checklist */}
      {checklistItems.length > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-accent-green" />
              <h2 className="font-[family-name:var(--font-syne)] font-bold text-base">Pre-Trade Checklist</h2>
            </div>
            <span className="text-xs text-text-muted">{checkedItems.length}/{checklistItems.length} verified</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {checklistItems.map((item) => (
              <button
                key={item}
                onClick={() => toggleTag(item, checkedItems, setCheckedItems)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  checkedItems.includes(item)
                    ? "bg-accent-green/10 border-accent-green/30 text-accent-green"
                    : "bg-bg-card border-border-subtle text-text-secondary hover:border-accent-green/20"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                  checkedItems.includes(item) ? "bg-accent-green border-accent-green text-bg-base" : "border-text-muted/30"
                )}>
                  {checkedItems.includes(item) && <CheckCircle size={12} />}
                </div>
                <span className="text-xs font-medium">{item}</span>
              </button>
            ))}
          </div>
          {settings.trading.forceChecklist && checkedItems.length < checklistItems.length && (
            <p className="mt-4 text-[10px] text-accent-coral flex items-center gap-1.5">
              <AlertTriangle size={12} /> Verification required to save trade.
            </p>
          )}
        </GlassCard>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
        <Link href="/journal" className="px-6 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary bg-bg-card border border-border-subtle hover:border-accent-violet/30 transition-all">
          Cancel
        </Link>
        <button onClick={handleSubmit}
          className="flex items-center gap-2 bg-accent-green text-bg-base px-8 py-2.5 rounded-xl text-sm font-semibold hover:shadow-[0_0_30px_rgba(0,255,178,0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!isReady}>
          <Save size={16} /> Save Trade
        </button>
      </div>
    </div>
  );
}
