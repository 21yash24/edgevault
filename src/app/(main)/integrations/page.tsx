"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion, AnimatePresence } from "framer-motion";
import { Link as LinkIcon, UploadCloud, CheckCircle2, ChevronRight, X, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { parseCSVFile, ParsedCSVResult } from "@/lib/integrations/csv-parser";
import { mapTradovatePayloadToTrades } from "@/lib/integrations/tradovate-mapper";
import { useTradeStore } from "@/stores";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

const brokers = [
  { id: "tradovate", name: "Tradovate", type: "Futures API", logo: "T", status: "available" },
  { id: "ninjatrader", name: "NinjaTrader", type: "Desktop Export", logo: "NT", status: "available" },
  { id: "topstep", name: "TopstepX", type: "Prop Firm API", logo: "TS", status: "available" },
  { id: "tradestation", name: "TradeStation", type: "Broker API", logo: "TS", status: "beta" },
];

export default function IntegrationsPage() {
  const { addTrade, importTrades } = useTradeStore();
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<any>(null);
  const [connectionStep, setConnectionStep] = useState(0);

  // Tradovate Auth State
  const [trEnv, setTrEnv] = useState("Live");
  const [trUsername, setTrUsername] = useState("");
  const [trPassword, setTrPassword] = useState("");
  const [trError, setTrError] = useState("");

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCSVResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const result = await parseCSVFile(file);
      setParsedData(result);
      setIsImportModalOpen(true);
    } catch (error) {
      alert(`Error parsing CSV: ${error}`);
    } finally {
      setIsParsing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  const handleImportConfirm = () => {
    if (!parsedData) return;
    
    // Import all trades as a single optimized batch
    importTrades(parsedData.trades);
    
    setIsImportModalOpen(false);
    setParsedData(null);
    alert(`Successfully imported ${parsedData.trades.length} trades!`);
  };

  const handleConnect = (broker: any) => {
    setSelectedBroker(broker);
    setTrError("");
    if (broker.id === "tradovate") {
      setConnectionStep(0); // Show form
      setIsApiModalOpen(true);
    } else {
      setConnectionStep(1); // Show connecting
      setIsApiModalOpen(true);
      setTimeout(() => {
        setConnectionStep(2);
      }, 2500);
    }
  };

  const handleTradovateAuth = async () => {
    if (!trUsername || !trPassword) {
      setTrError("Username and password are required");
      return;
    }
    setTrError("");
    setConnectionStep(1); // Show connecting spinner
    
    try {
      // 1. Authenticate
      const authRes = await fetch("/api/tradovate/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trUsername, password: trPassword, env: trEnv, appId: "EdgeVault", appVersion: "1.0", cid: 1, sec: "mock" })
      });
      const authData = await authRes.json();
      
      if (!authRes.ok) throw new Error(authData.error || "Authentication failed");

      // 2. Sync Trades
      const syncRes = await fetch("/api/tradovate/sync", {
        method: "POST",
        headers: { "Authorization": `Bearer ${authData.accessToken}` }
      });
      const syncData = await syncRes.json();
      
      if (!syncRes.ok) throw new Error(syncData.error || "Sync failed");

      // 3. Map and Save
      const newTrades = mapTradovatePayloadToTrades(syncData);
      newTrades.forEach(t => addTrade({...t}));
      
      setConnectionStep(2); // Success UI
      alert(`Successfully synced ${newTrades.length} trades from Tradovate!`);
    } catch (err: any) {
      setTrError(err.message);
      setConnectionStep(0); // Go back to form
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-[family-name:var(--font-inter)] font-black text-2xl">Broker Integrations</h1>
        <p className="text-sm text-text-secondary mt-1">
          Connect your futures broker or prop firm to automatically sync trades, or use the Universal Importer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Direct API Connections */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Direct Sync</h2>
          {brokers.map((broker, i) => (
            <GlassCard key={broker.id} className="group hover:border-accent-violet/30 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-bg-secondary border border-border-subtle flex items-center justify-center font-bold text-xl group-hover:bg-accent-violet/10 group-hover:text-accent-violet transition-colors">
                    {broker.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary">{broker.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">{broker.type}</span>
                      {broker.status === "beta" && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20">Beta</span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleConnect(broker)}
                  className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted group-hover:bg-accent-violet group-hover:text-white transition-all shadow-[0_0_0_rgba(123,97,255,0)] group-hover:shadow-[0_0_15px_rgba(123,97,255,0.4)]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Universal CSV Importer */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Manual Import</h2>
          <div {...getRootProps()} className="h-[calc(100%-2rem)]">
            <input {...getInputProps()} />
            <GlassCard className={cn(
              "h-full flex flex-col items-center justify-center border-dashed border-2 transition-all group cursor-pointer relative overflow-hidden",
              isDragActive ? "border-accent-green bg-accent-green/10" : "border-border-subtle/50 hover:border-accent-green hover:bg-accent-green/5"
            )}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={cn(
                "w-16 h-16 rounded-full bg-bg-secondary border border-border-subtle flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:border-accent-green group-hover:shadow-[0_0_30px_rgba(0,255,178,0.2)]",
                isDragActive && "scale-110 border-accent-green shadow-[0_0_30px_rgba(0,255,178,0.2)]"
              )}>
                {isParsing ? (
                  <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud size={24} className={cn("text-text-muted transition-colors", (isDragActive || "group-hover:text-accent-green"))} />
                )}
              </div>
              
              <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg mb-1">
                {isDragActive ? "Drop CSV Here" : "Universal CSV Importer"}
              </h3>
              <p className="text-sm text-text-muted text-center max-w-[250px] mb-6">
                Drag and drop exports from NinjaTrader, MetaTrader, or Sierra Chart.
              </p>

              <button className="px-6 py-2.5 rounded-xl bg-bg-secondary border border-border-subtle text-sm font-bold group-hover:bg-accent-green group-hover:text-bg-base transition-all">
                Select File
              </button>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Mock Plaid-style API Connection Modal */}
      <AnimatePresence>
        {isApiModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsApiModalOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-bg-card border border-border-subtle rounded-3xl overflow-hidden shadow-2xl relative"
              >
                {/* Header */}
                <div className="h-20 bg-bg-secondary border-b border-border-subtle relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-violet/10 to-accent-green/10" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-black border border-border-subtle flex items-center justify-center font-bold text-lg shadow-lg">EV</div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse delay-75" />
                      <div className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse delay-150" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-bg-card border border-border-subtle flex items-center justify-center font-bold text-lg shadow-lg text-accent-violet">
                      {selectedBroker?.logo}
                    </div>
                  </div>
                  <button onClick={() => setIsApiModalOpen(false)} className="absolute top-4 right-4 text-text-muted hover:text-white"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-8 text-center min-h-[300px] flex flex-col justify-center">
                  {connectionStep === 0 && selectedBroker?.id === "tradovate" ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start text-left w-full">
                      <h3 className="text-xl font-bold font-[family-name:var(--font-inter)] mb-4">Tradovate Credentials</h3>
                      {trError && <div className="w-full p-3 mb-4 rounded-xl bg-accent-coral/10 border border-accent-coral/20 text-accent-coral text-sm">{trError}</div>}
                      
                      <div className="w-full space-y-3">
                        <div>
                          <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">Environment</label>
                          <select value={trEnv} onChange={e => setTrEnv(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40">
                            <option value="Live">Live</option>
                            <option value="Demo">Demo</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">Username</label>
                          <input type="text" value={trUsername} onChange={e => setTrUsername(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40" />
                        </div>
                        <div>
                          <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">Password</label>
                          <input type="password" value={trPassword} onChange={e => setTrPassword(e.target.value)} className="w-full bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40" />
                        </div>
                      </div>

                      <button onClick={handleTradovateAuth} className="w-full py-3 mt-6 rounded-xl bg-accent-violet text-bg-base font-bold hover:shadow-[0_0_20px_rgba(123,97,255,0.4)] transition-all">
                        Connect & Sync
                      </button>
                    </motion.div>
                  ) : connectionStep === 1 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full border-4 border-accent-violet/20 border-t-accent-violet animate-spin mb-6" />
                      <h3 className="text-xl font-bold font-[family-name:var(--font-inter)] mb-2">Connecting to {selectedBroker?.name}</h3>
                      <p className="text-sm text-text-muted">Establishing secure connection via OAuth...</p>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,255,178,0.3)]">
                        <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-xl font-bold font-[family-name:var(--font-inter)] mb-2 text-accent-green">Connection Successful</h3>
                      <p className="text-sm text-text-muted mb-8">
                        Your {selectedBroker?.name} account is now securely linked. Trades will sync automatically.
                      </p>
                      <button 
                        onClick={() => setIsApiModalOpen(false)}
                        className="w-full py-3 rounded-xl bg-accent-green text-bg-base font-bold hover:shadow-[0_0_20px_rgba(0,255,178,0.4)] transition-all"
                      >
                        Continue to Dashboard
                      </button>
                    </motion.div>
                  )}
                </div>
                
                <div className="p-4 bg-bg-secondary border-t border-border-subtle text-center flex items-center justify-center gap-2 text-xs text-text-muted">
                  <AlertCircle size={12} />
                  Secured by EdgeVault Sync API
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CSV Import Preview Modal */}
      <AnimatePresence>
        {isImportModalOpen && parsedData && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsImportModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-bg-card border border-border-subtle rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border-subtle flex items-center justify-between">
                <div>
                  <h2 className="font-[family-name:var(--font-inter)] font-bold text-xl">Import Summary</h2>
                  <p className="text-sm text-text-muted">Detected Format: <span className="text-accent-green">{parsedData.broker}</span></p>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="p-2 text-text-muted hover:text-white rounded-lg hover:bg-bg-secondary transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="glass-static p-4 rounded-xl text-center">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Trades Found</div>
                    <div className="font-[family-name:var(--font-space-mono)] font-black text-2xl">{parsedData.trades.length}</div>
                  </div>
                  <div className="glass-static p-4 rounded-xl text-center">
                    <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Total P&L</div>
                    <div className={cn("font-[family-name:var(--font-space-mono)] font-black text-2xl", parsedData.trades.reduce((s, t) => s + t.netPnl, 0) >= 0 ? "text-accent-green" : "text-accent-coral")}>
                      ${parsedData.trades.reduce((s, t) => s + t.netPnl, 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {parsedData.errors.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <h4 className="text-sm font-bold text-yellow-500 flex items-center gap-2 mb-2">
                      <AlertCircle size={16} /> Parsing Warnings
                    </h4>
                    <ul className="text-xs text-text-secondary list-disc pl-5 space-y-1">
                      {parsedData.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                      {parsedData.errors.length > 5 && <li>...and {parsedData.errors.length - 5} more</li>}
                    </ul>
                  </div>
                )}
                
                <h4 className="text-sm font-bold mb-3">Preview First 5 Trades</h4>
                <div className="bg-bg-secondary rounded-xl overflow-hidden border border-border-subtle">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bg-card border-b border-border-subtle text-xs text-text-muted uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Symbol</th>
                        <th className="p-3">Side</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {parsedData.trades.slice(0, 5).map((t, i) => (
                        <tr key={i} className="hover:bg-bg-card transition-colors">
                          <td className="p-3 font-[family-name:var(--font-space-mono)]">{t.symbol}</td>
                          <td className="p-3"><span className={cn("text-[10px] uppercase px-1.5 py-0.5 rounded", t.direction === 'long' ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral")}>{t.direction}</span></td>
                          <td className="p-3 text-text-muted">{new Date(t.entryDate).toLocaleDateString()}</td>
                          <td className={cn("p-3 text-right font-[family-name:var(--font-space-mono)] font-bold", t.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                            {t.netPnl >= 0 ? '+' : ''}{t.netPnl.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-6 border-t border-border-subtle bg-bg-secondary flex justify-end gap-3">
                <button onClick={() => setIsImportModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleImportConfirm} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-accent-green text-bg-base hover:shadow-[0_0_20px_rgba(0,255,178,0.4)] transition-all flex items-center gap-2">
                  <CheckCircle2 size={18} /> Confirm Import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
