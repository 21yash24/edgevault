"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTradeStore } from "@/stores";
import { Trade, SessionTag, SETUP_TAGS, SYMBOLS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { X, Zap, CheckCircle2 } from "lucide-react";

// ─── Emotion emoji map ─────────────────────────────────────────────────────
const emotionEmoji = (v: number) => {
  if (v <= -4) return "😤";
  if (v <= -2) return "😟";
  if (v === 0) return "😐";
  if (v <= 2) return "🙂";
  return "😄";
};

const SESSIONS: SessionTag[] = ["Pre-Market", "London", "NY AM", "NY PM", "Asian", "Overnight"];
const RECENT_SYMBOLS = ["NQ", "ES", "MNQ", "MES", "BTCUSD", "EURUSD"];
const TOP_SETUPS = SETUP_TAGS.slice(0, 5);

// ─── Toast ─────────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-24 right-6 z-[9999] flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold"
          style={{
            background: "rgba(0,255,178,0.12)",
            border: "1px solid rgba(0,255,178,0.35)",
            boxShadow: "0 8px 32px rgba(0,255,178,0.2)",
            backdropFilter: "blur(20px)",
            color: "var(--accent-green)",
          }}
        >
          <CheckCircle2 size={15} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── QuickLogModal ─────────────────────────────────────────────────────────
export function QuickLogModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addTrade } = useTradeStore();

  const [direction, setDirection] = useState<"long" | "short">("long");
  const [symbol, setSymbol] = useState("NQ");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [size, setSize] = useState("1");
  const [emotion, setEmotion] = useState(0);
  const [setup, setSetup] = useState("");
  const [session, setSession] = useState<SessionTag>("NY AM");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setDirection("long");
      setSymbol("NQ");
      setEntry("");
      setExit("");
      setSize("1");
      setEmotion(0);
      setSetup("");
      setSession("NY AM");
      setNotes("");
      setErrors({});
      setSuccess(false);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!symbol.trim()) e.symbol = "Symbol required";
    if (!entry || isNaN(Number(entry))) e.entry = "Valid entry price required";
    if (!exit || isNaN(Number(exit))) e.exit = "Valid exit price required";
    if (!size || isNaN(Number(size)) || Number(size) <= 0) e.size = "Valid size required";
    return e;
  }, [symbol, entry, exit, size]);

  const handleSubmit = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    const entryPrice = Number(entry);
    const exitPrice = Number(exit);
    const posSize = Number(size);
    const dir = direction === "long" ? 1 : -1;
    const netPnl = parseFloat(((exitPrice - entryPrice) * posSize * dir).toFixed(2));
    const result: Trade["result"] = netPnl > 0 ? "win" : netPnl < 0 ? "loss" : "be";

    const trade: Omit<Trade, "id"> = {
      symbol: symbol.toUpperCase(),
      direction,
      entryPrice,
      exitPrice,
      positionSize: posSize,
      entryDate: new Date().toISOString(),
      exitDate: new Date().toISOString(),
      commission: 0,
      netPnl,
      rMultiple: 0,
      rr: 0,
      result,
      emotion,
      preTradeNotes: notes,
      postTradeReview: "",
      setupTags: setup ? [setup] : [],
      sessionTag: session,
      marketCondition: "Trending",
      mistakeTags: [],
      screenshotUrls: [],
      mindsetTags: [],
      durationMinutes: 0,
      accountEquityAfter: 0,
    };

    await addTrade(trade);
    setSubmitting(false);
    setSuccess(true);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
    setTimeout(() => onClose(), 1500);
  }, [validate, direction, symbol, entry, exit, size, emotion, setup, session, notes, addTrade, onClose]);

  const clearError = (field: string) => setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  const inputBase = "w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition-all duration-200";
  const inputStyle = (errKey: string) => ({
    background: "rgba(255,255,255,0.05)",
    border: errors[errKey] ? "1px solid rgba(255,45,85,0.5)" : "1px solid rgba(255,255,255,0.1)",
    color: "var(--text-primary)",
    boxShadow: errors[errKey] ? "0 0 0 3px rgba(255,45,85,0.08)" : "none",
  });

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div key="qlm-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[8900] bg-black/55 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <motion.div key="qlm-modal"
              initial={{ opacity: 0, y: 48, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.94 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[8901] flex items-center justify-center px-4 pointer-events-none">
              <div className="w-full max-w-md rounded-2xl overflow-hidden pointer-events-auto"
                style={{ background: "rgba(8,12,26,0.98)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(91,63,232,0.08)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)" }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(91,63,232,0.2)", border: "1px solid rgba(91,63,232,0.35)" }}>
                      <Zap size={13} className="text-accent-violet" />
                    </div>
                    <span className="text-sm font-black text-text-primary">Quick Log Trade</span>
                  </div>
                  <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <X size={13} />
                  </button>
                </div>

                {/* Success overlay */}
                <AnimatePresence>
                  {success && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl"
                      style={{ background: "rgba(8,12,26,0.97)" }}>
                      <div className="flex flex-col items-center gap-3">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 300 }}>
                          <CheckCircle2 size={48} className="text-accent-green" />
                        </motion.div>
                        <div className="text-sm font-black text-text-primary">Trade Logged!</div>
                        <div className="text-xs text-text-muted">Added to your journal</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">

                  {/* Direction + Symbol row */}
                  <div className="flex items-center gap-3">
                    {/* Direction toggle */}
                    <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                      {(["long", "short"] as const).map(d => (
                        <button key={d} onClick={() => setDirection(d)}
                          className={cn("px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-150", direction === d ? "" : "text-text-muted")}
                          style={{
                            background: direction === d ? (d === "long" ? "rgba(0,255,178,0.15)" : "rgba(255,45,85,0.15)") : "transparent",
                            color: direction === d ? (d === "long" ? "var(--accent-green)" : "var(--accent-coral)") : undefined,
                            borderRight: d === "long" ? "1px solid rgba(255,255,255,0.08)" : undefined,
                          }}>
                          {d === "long" ? "▲ LONG" : "▼ SHORT"}
                        </button>
                      ))}
                    </div>

                    {/* Symbol input */}
                    <div className="flex-1">
                      <input type="text" value={symbol} onChange={e => { setSymbol(e.target.value.toUpperCase()); clearError("symbol"); }}
                        placeholder="Symbol"
                        className={cn(inputBase, "text-center font-black text-sm uppercase tracking-wider")}
                        style={inputStyle("symbol")} />
                      {errors.symbol && <p className="text-[9px] text-accent-coral mt-1 px-1">{errors.symbol}</p>}
                    </div>
                  </div>

                  {/* Recent symbol chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {RECENT_SYMBOLS.map(s => (
                      <button key={s} onClick={() => { setSymbol(s); clearError("symbol"); }}
                        className={cn("text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all duration-100", symbol === s ? "text-accent-violet" : "text-text-muted hover:text-text-secondary")}
                        style={{
                          background: symbol === s ? "rgba(91,63,232,0.15)" : "rgba(255,255,255,0.04)",
                          border: symbol === s ? "1px solid rgba(91,63,232,0.35)" : "1px solid rgba(255,255,255,0.07)",
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Entry / Exit / Size row */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-muted px-1 mb-1 block">Entry</label>
                      <input type="number" value={entry} onChange={e => { setEntry(e.target.value); clearError("entry"); }} placeholder="0.00"
                        className={inputBase} style={inputStyle("entry")} />
                      {errors.entry && <p className="text-[9px] text-accent-coral mt-0.5 px-1">{errors.entry}</p>}
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-muted px-1 mb-1 block">Exit</label>
                      <input type="number" value={exit} onChange={e => { setExit(e.target.value); clearError("exit"); }} placeholder="0.00"
                        className={inputBase} style={inputStyle("exit")} />
                      {errors.exit && <p className="text-[9px] text-accent-coral mt-0.5 px-1">{errors.exit}</p>}
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-muted px-1 mb-1 block">Size</label>
                      <input type="number" value={size} onChange={e => { setSize(e.target.value); clearError("size"); }} placeholder="1"
                        className={inputBase} style={inputStyle("size")} />
                      {errors.size && <p className="text-[9px] text-accent-coral mt-0.5 px-1">{errors.size}</p>}
                    </div>
                  </div>

                  {/* Live P&L preview */}
                  {entry && exit && size && !isNaN(Number(entry)) && !isNaN(Number(exit)) && Number(size) > 0 && (() => {
                    const pnl = (Number(exit) - Number(entry)) * Number(size) * (direction === "long" ? 1 : -1);
                    const isWin = pnl >= 0;
                    return (
                      <div className="flex items-center justify-center gap-2 py-1.5 rounded-xl"
                        style={{ background: isWin ? "rgba(0,255,178,0.06)" : "rgba(255,45,85,0.06)", border: `1px solid ${isWin ? "rgba(0,255,178,0.15)" : "rgba(255,45,85,0.15)"}` }}>
                        <span className="text-[10px] font-bold text-text-muted">Estimated P&L:</span>
                        <span className={cn("text-sm font-black", isWin ? "text-accent-green" : "text-accent-coral")}>
                          {isWin ? "+" : ""}${pnl.toFixed(2)}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Emotion slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-text-muted">Emotion</label>
                      <span className="text-lg">{emotionEmoji(emotion)}</span>
                    </div>
                    <input type="range" min={-5} max={5} step={1} value={emotion} onChange={e => setEmotion(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, rgba(255,45,85,0.5) 0%, rgba(91,63,232,0.4) 50%, rgba(0,255,178,0.5) 100%)` }} />
                    <div className="flex justify-between mt-1">
                      <span className="text-[8px] text-text-muted">Fearful</span>
                      <span className="text-[8px] text-text-muted">Neutral</span>
                      <span className="text-[8px] text-text-muted">Confident</span>
                    </div>
                  </div>

                  {/* Setup tags */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-2">Setup</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TOP_SETUPS.map(tag => (
                        <button key={tag} onClick={() => setSetup(setup === tag ? "" : tag)}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all duration-100"
                          style={{
                            background: setup === tag ? "rgba(91,63,232,0.15)" : "rgba(255,255,255,0.04)",
                            border: setup === tag ? "1px solid rgba(91,63,232,0.35)" : "1px solid rgba(255,255,255,0.07)",
                            color: setup === tag ? "var(--accent-violet)" : "var(--text-muted)",
                          }}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Session dropdown */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Session</label>
                    <select value={session} onChange={e => setSession(e.target.value as SessionTag)}
                      className="w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)" }}>
                      {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Quick Note</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Brief notes about the trade..."
                      rows={2}
                      className="w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none transition-all duration-200 resize-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)" }} />
                  </div>

                  {/* Submit */}
                  <motion.button
                    onClick={handleSubmit}
                    disabled={submitting || success}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl text-sm font-black tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
                    style={{
                      background: submitting ? "rgba(91,63,232,0.3)" : "linear-gradient(135deg, rgba(0,255,178,0.9) 0%, rgba(0,212,255,0.9) 100%)",
                      color: submitting ? "var(--text-muted)" : "var(--bg-base)",
                      boxShadow: submitting ? "none" : "0 4px 24px rgba(0,255,178,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
                    }}>
                    {submitting ? (
                      <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Logging...</>
                    ) : (
                      <><CheckCircle2 size={14} /> LOG TRADE</>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toast message="Trade logged successfully!" visible={toastVisible} />
    </>
  );
}

// ─── Floating Action Button ────────────────────────────────────────────────
export function QuickLogFAB() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-[8800] w-13 h-13 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{
          width: 52,
          height: 52,
          background: "linear-gradient(135deg, rgba(91,63,232,0.95) 0%, rgba(0,212,255,0.8) 100%)",
          boxShadow: "0 8px 32px rgba(91,63,232,0.45), 0 0 0 1px rgba(91,63,232,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
        title="Quick Log Trade (⌘N)"
      >
        <Zap size={20} className="text-white" />

        {/* Tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div initial={{ opacity: 0, x: 8, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 8, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              className="absolute right-full mr-3 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap pointer-events-none"
              style={{ background: "rgba(8,12,26,0.95)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-primary)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
              ⚡ Quick Log
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <QuickLogModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
