"use client";
import { useAccountStore, useTradeStore } from "@/stores";
import { GlassCard } from "@/components/ui/glass-card";
import { cn, formatCurrency, generateId } from "@/lib/utils";
import { parseMT5CSV, parseMT5HTML } from "@/lib/mt5-parser";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import {
  Plus, Upload, Wifi, Edit3, Trash2, Server, DollarSign,
  TrendingUp, FileText, CheckCircle, AlertCircle, Copy,
  ArrowRight, Download, Settings, Zap, ChevronDown, ChevronUp,
} from "lucide-react";

function CSVImportModal({ onClose, onImport }: { onClose: () => void; onImport: (count: number) => void }) {
  const { importTrades } = useTradeStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof parseMT5CSV>> | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    const text = await f.text();
    const result = f.name.endsWith(".html") || f.name.endsWith(".htm")
      ? parseMT5HTML(text)
      : parseMT5CSV(text);
    setPreview(result);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleImport = () => {
    if (!preview || preview.trades.length === 0) return;
    setImporting(true);
    setTimeout(() => {
      importTrades(preview.trades);
      onImport(preview.trades.length);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div className="glass-static w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4 p-6 rounded-2xl"
        onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <h2 className="font-[family-name:var(--font-syne)] font-bold text-xl mb-4">Import MT5 Trade History</h2>

        {!preview && (
          <div
            className="border-2 border-dashed border-border-subtle rounded-xl p-12 text-center hover:border-accent-green/30 transition-colors cursor-pointer"
            onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()}
          >
            <Upload size={40} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-secondary mb-1">Drop your MT5 export file here</p>
            <p className="text-xs text-text-muted">CSV, TSV, or HTML format</p>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.html,.htm,.txt" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        )}

        {preview && (
          <div className="space-y-4">
            {preview.errors.length > 0 && (
              <div className="bg-accent-coral/10 border border-accent-coral/20 rounded-xl p-3">
                {preview.errors.map((e, i) => (
                  <p key={i} className="text-sm text-accent-coral flex items-center gap-2"><AlertCircle size={14} />{e}</p>
                ))}
              </div>
            )}

            {preview.trades.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-accent-green">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">{preview.trades.length} trades found in {file?.name}</span>
                </div>

                <div className="overflow-x-auto max-h-60 no-scrollbar">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th className="text-left py-2 px-2 text-text-muted">Symbol</th>
                        <th className="text-left py-2 px-2 text-text-muted">Side</th>
                        <th className="text-left py-2 px-2 text-text-muted">Entry</th>
                        <th className="text-left py-2 px-2 text-text-muted">Exit</th>
                        <th className="text-left py-2 px-2 text-text-muted">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.trades.slice(0, 15).map((t, i) => (
                        <tr key={i} className="border-b border-border-subtle/50">
                          <td className="py-1.5 px-2 font-[family-name:var(--font-space-mono)] font-bold">{t.symbol}</td>
                          <td className="py-1.5 px-2">
                            <span className={cn("px-1.5 py-0.5 rounded text-[10px] uppercase",
                              t.direction === "long" ? "bg-accent-green/10 text-accent-green" : "bg-accent-coral/10 text-accent-coral")}>
                              {t.direction}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 font-[family-name:var(--font-space-mono)]">{t.entryPrice}</td>
                          <td className="py-1.5 px-2 font-[family-name:var(--font-space-mono)]">{t.exitPrice}</td>
                          <td className={cn("py-1.5 px-2 font-[family-name:var(--font-space-mono)] font-bold",
                            t.netPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
                            {formatCurrency(t.netPnl)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.trades.length > 15 && (
                    <p className="text-xs text-text-muted mt-2 text-center">...and {preview.trades.length - 15} more trades</p>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => { setPreview(null); setFile(null); }}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                Choose Different File
              </button>
              <button onClick={handleImport} disabled={preview.trades.length === 0 || importing}
                className="flex items-center gap-2 bg-accent-green text-bg-base px-6 py-2 rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,255,178,0.2)] transition-all disabled:opacity-40">
                {importing ? "Importing..." : `Import ${preview.trades.length} Trades`}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function EASetupGuide({ apiKey }: { apiKey: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { title: "Download the EA", desc: "Download EDGEVAULT_Bridge.mq5 and save it to your MT5 data folder.", action: "Download EA", icon: Download },
    { title: "Install in MT5", desc: 'Copy the file to: [MT5 Data Folder]/MQL5/Experts/', action: null, icon: FileText },
    { title: "Allow WebRequest", desc: 'In MT5: Tools → Options → Expert Advisors → Check "Allow WebRequest for listed URL" → Add our endpoint URL.', action: null, icon: Settings },
    { title: "Attach to Chart", desc: "Open any chart in MT5 → Drag EDGEVAULT_Bridge from Navigator → Paste your API key in the inputs.", action: null, icon: Zap },
  ];

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-card border border-border-subtle hover:border-accent-violet/20 transition-all">
        <div className="flex items-center gap-2">
          <Wifi size={16} className="text-accent-green" />
          <span className="text-sm font-medium">MT5 EA Bridge Setup</span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 space-y-4">
              {/* API Key */}
              <div className="p-3 rounded-xl bg-bg-card border border-accent-green/20">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Your API Key</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-[family-name:var(--font-space-mono)] text-sm text-accent-green bg-bg-base rounded-lg px-3 py-2 overflow-x-auto">{apiKey}</code>
                  <button onClick={copyKey} className="p-2 rounded-lg bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors">
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Steps */}
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent-violet/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-accent-violet">{i + 1}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{step.title}</div>
                    <p className="text-xs text-text-secondary mt-0.5">{step.desc}</p>
                    {step.action && (
                      <a href="/downloads/EDGEVAULT_Bridge.mq5" download
                        className="inline-flex items-center gap-1 mt-2 text-xs text-accent-green hover:underline">
                        <step.icon size={12} /> {step.action}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AccountsPage() {
  const { accounts, addAccount, deleteAccount } = useAccountStore();
  const { trades } = useTradeStore();
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalPnl = trades.reduce((s, t) => s + t.netPnl, 0);

  const handleAddManual = () => {
    addAccount({ name: `Account ${accounts.length + 1}`, type: "manual", broker: "Manual", balance: 50000, startingBalance: 50000, linkedTradeIds: [] });
  };

  const handleAddEA = () => {
    const apiKey = `ev_${generateId()}_${generateId()}`;
    addAccount({ name: `MT5 Account ${accounts.length + 1}`, type: "mt5-ea", broker: "MT5 EA Bridge", balance: 0, startingBalance: 0, linkedTradeIds: [], apiKey });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl">Accounts</h1>
          <p className="text-sm text-text-secondary mt-1">{accounts.length} account{accounts.length !== 1 ? "s" : ""} connected</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <DollarSign size={16} className="text-accent-green mb-1" />
          <div className="text-xs text-text-muted uppercase tracking-wider">Total Balance</div>
          <div className="font-[family-name:var(--font-space-mono)] font-bold text-xl text-accent-green mt-1">
            ${totalBalance.toLocaleString()}
          </div>
        </GlassCard>
        <GlassCard>
          <TrendingUp size={16} className="text-accent-violet mb-1" />
          <div className="text-xs text-text-muted uppercase tracking-wider">All Time P&L</div>
          <div className={cn("font-[family-name:var(--font-space-mono)] font-bold text-xl mt-1", totalPnl >= 0 ? "text-accent-green" : "text-accent-coral")}>
            {formatCurrency(totalPnl)}
          </div>
        </GlassCard>
        <GlassCard>
          <Server size={16} className="text-accent-violet mb-1" />
          <div className="text-xs text-text-muted uppercase tracking-wider">Total Trades</div>
          <div className="font-[family-name:var(--font-space-mono)] font-bold text-xl mt-1">{trades.length}</div>
        </GlassCard>
      </div>

      {/* Import success */}
      <AnimatePresence>
        {importResult && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-accent-green/10 border border-accent-green/20 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-accent-green" />
            <span className="text-sm text-accent-green">{importResult}</span>
            <button onClick={() => setImportResult(null)} className="ml-auto text-text-muted hover:text-text-primary">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc, i) => (
          <GlassCard key={acc.id} transition={{ delay: i * 0.05 }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-[family-name:var(--font-syne)] font-bold text-base">{acc.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn("w-2 h-2 rounded-full", acc.type === "mt5-ea" ? "bg-accent-green animate-glow-pulse" : "bg-text-muted")} />
                  <span className="text-xs text-text-muted">{acc.broker || acc.type}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors">
                  <Edit3 size={14} />
                </button>
                {acc.id !== "acc-default" && (
                  <button onClick={() => deleteAccount(acc.id)} className="p-1.5 rounded-lg text-text-muted hover:text-accent-coral hover:bg-accent-coral/10 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm"><span className="text-text-muted">Balance</span>
                <span className="font-[family-name:var(--font-space-mono)] font-bold">${acc.balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm"><span className="text-text-muted">Starting</span>
                <span className="font-[family-name:var(--font-space-mono)] text-text-secondary">${acc.startingBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm"><span className="text-text-muted">P&L</span>
                <span className={cn("font-[family-name:var(--font-space-mono)] font-bold",
                  acc.balance - acc.startingBalance >= 0 ? "text-accent-green" : "text-accent-coral")}>
                  {formatCurrency(acc.balance - acc.startingBalance)}
                </span>
              </div>
            </div>

            {/* Type badge */}
            <div className={cn("text-[10px] px-2 py-1 rounded-lg inline-flex items-center gap-1",
              acc.type === "manual" ? "bg-text-muted/10 text-text-muted" :
              acc.type === "mt5-csv" ? "bg-accent-violet/10 text-accent-violet" : "bg-accent-green/10 text-accent-green")}>
              {acc.type === "mt5-ea" ? <Wifi size={10} /> : acc.type === "mt5-csv" ? <Upload size={10} /> : <Edit3 size={10} />}
              {acc.type === "manual" ? "Manual" : acc.type === "mt5-csv" ? "MT5 CSV" : "MT5 EA Bridge"}
            </div>

            {acc.type === "mt5-ea" && acc.apiKey && (
              <div className="mt-3"><EASetupGuide apiKey={acc.apiKey} /></div>
            )}
          </GlassCard>
        ))}

        {/* Add Account Card */}
        <GlassCard className="border-dashed border-border-subtle/50 flex flex-col items-center justify-center min-h-[200px]">
          <Plus size={24} className="text-text-muted mb-3" />
          <h3 className="font-[family-name:var(--font-syne)] font-bold text-sm mb-3">Add Account</h3>
          <div className="space-y-2 w-full max-w-xs">
            <button onClick={handleAddManual}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-bg-card border border-border-subtle hover:border-accent-violet/30 transition-all text-left">
              <Edit3 size={14} className="text-accent-violet" /> Manual Account
            </button>
            <button onClick={() => setShowImport(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-bg-card border border-border-subtle hover:border-accent-green/30 transition-all text-left">
              <Upload size={14} className="text-accent-green" /> Import MT5 CSV
            </button>
            <button onClick={handleAddEA}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-bg-card border border-border-subtle hover:border-accent-green/30 transition-all text-left">
              <Wifi size={14} className="text-accent-green" /> MT5 EA Bridge
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Import Modal */}
      {showImport && (
        <CSVImportModal onClose={() => setShowImport(false)} onImport={(count) => setImportResult(`Successfully imported ${count} trades!`)} />
      )}
    </div>
  );
}
