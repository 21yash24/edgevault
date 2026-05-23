"use client";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { motion, AnimatePresence } from "framer-motion";
import { Link as LinkIcon, UploadCloud, CheckCircle2, ChevronRight, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const brokers = [
  { id: "tradovate", name: "Tradovate", type: "Futures API", logo: "T", status: "available" },
  { id: "ninjatrader", name: "NinjaTrader", type: "Desktop Export", logo: "NT", status: "available" },
  { id: "topstep", name: "TopstepX", type: "Prop Firm API", logo: "TS", status: "available" },
  { id: "tradestation", name: "TradeStation", type: "Broker API", logo: "TS", status: "beta" },
];

export default function IntegrationsPage() {
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<any>(null);
  const [connectionStep, setConnectionStep] = useState(0); // 0: select, 1: auth, 2: success

  const handleConnect = (broker: any) => {
    setSelectedBroker(broker);
    setConnectionStep(1);
    setIsApiModalOpen(true);

    // Simulate API connection flow
    setTimeout(() => {
      setConnectionStep(2);
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-[family-name:var(--font-syne)] font-bold text-2xl">Broker Integrations</h1>
        <p className="text-sm text-text-secondary mt-1">
          Connect your futures broker or prop firm to automatically sync trades, or use the Universal Importer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Direct API Connections */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Direct Sync</h2>
          {brokers.map((broker, i) => (
            <GlassCard key={broker.id} className="group hover:border-accent-violet/30 transition-all cursor-pointer" transition={{ delay: i * 0.1 }}>
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
          <GlassCard className="h-[calc(100%-2rem)] flex flex-col items-center justify-center border-dashed border-2 border-border-subtle/50 hover:border-accent-green hover:bg-accent-green/5 transition-all group cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="w-16 h-16 rounded-full bg-bg-secondary border border-border-subtle flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:border-accent-green group-hover:shadow-[0_0_30px_rgba(0,255,178,0.2)]">
              <UploadCloud size={24} className="text-text-muted group-hover:text-accent-green transition-colors" />
            </div>
            
            <h3 className="font-[family-name:var(--font-syne)] font-bold text-lg mb-1">Universal CSV Importer</h3>
            <p className="text-sm text-text-muted text-center max-w-[250px] mb-6">
              Drag and drop exports from NinjaTrader, MetaTrader, or Sierra Chart.
            </p>

            <button className="px-6 py-2.5 rounded-xl bg-bg-secondary border border-border-subtle text-sm font-bold group-hover:bg-accent-green group-hover:text-bg-base transition-all">
              Select File
            </button>
          </GlassCard>
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
                  {connectionStep === 1 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full border-4 border-accent-violet/20 border-t-accent-violet animate-spin mb-6" />
                      <h3 className="text-xl font-bold font-[family-name:var(--font-syne)] mb-2">Connecting to {selectedBroker?.name}</h3>
                      <p className="text-sm text-text-muted">Establishing secure connection via OAuth...</p>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,255,178,0.3)]">
                        <CheckCircle2 size={32} />
                      </div>
                      <h3 className="text-xl font-bold font-[family-name:var(--font-syne)] mb-2 text-accent-green">Connection Successful</h3>
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
    </div>
  );
}
