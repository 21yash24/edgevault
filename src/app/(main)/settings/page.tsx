"use client";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import {
  User as UserIcon, Shield, Bell, Palette, Database, Key, Globe, Monitor,
  Moon, Sun, Check, ChevronRight, Download, Trash2, Upload,
  LogOut, Save, Eye, EyeOff, ExternalLink,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useSettingsStore, useTradeStore, usePlaybookStore, useAccountStore, usePropFirmStore } from "@/stores";
import { useTheme } from "next-themes";
import { updateProfile } from "firebase/auth";

type SettingsTab = "profile" | "accounts" | "trading" | "notifications" | "data" | "api" | "appearance";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "accounts", label: "Accounts", icon: Database },
  { id: "trading", label: "Trading Rules", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "data", label: "Data & Export", icon: Download },
  { id: "api", label: "API & Integrations", icon: Key },
];

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!enabled)} className="flex items-center justify-between w-full py-3">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className={cn("w-10 h-5 rounded-full transition-colors relative", enabled ? "bg-accent-green" : "bg-bg-card border border-border-subtle")}>
        <motion.div
          className="w-4 h-4 rounded-full bg-white absolute top-0.5"
          animate={{ left: enabled ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  const { settings, updateSettings } = useSettingsStore();
  
  const [name, setName] = useState(user?.displayName || settings.profile.name || "Trader");
  const [timezone, setTimezone] = useState(settings.profile.timezone || "America/New_York");
  const [currency, setCurrency] = useState(settings.profile.currency || "USD ($)");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    if (user) {
      try {
        await updateProfile(user, { displayName: name });
      } catch (err) {
        console.error("Error updating profile", err);
      }
    }
    updateSettings("profile", { name, timezone, currency });
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg mb-1">Profile</h3>
        <p className="text-sm text-text-muted">Manage your account details</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-accent-green/10 flex items-center justify-center text-accent-green font-[family-name:var(--font-inter)] font-black text-2xl">
          {name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase()}
        </div>
        <div>
          <div className="font-[family-name:var(--font-inter)] font-bold">{name}</div>
          <div className="text-xs text-text-muted mt-0.5">{user?.email || "No email"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Display Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Email (Read Only)</label>
          <input value={user?.email || ""} readOnly
            className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-muted cursor-not-allowed focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Timezone</label>
          <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors appearance-none">
            <option value="America/New_York">Eastern (EST/EDT)</option>
            <option value="America/Chicago">Central (CST/CDT)</option>
            <option value="America/Los_Angeles">Pacific (PST/PDT)</option>
            <option value="Europe/London">London (GMT/BST)</option>
            <option value="Asia/Kolkata">India (IST)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-violet/40 transition-colors appearance-none">
            <option value="USD ($)">USD ($)</option>
            <option value="EUR (€)">EUR (€)</option>
            <option value="GBP (£)">GBP (£)</option>
            <option value="INR (₹)">INR (₹)</option>
          </select>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-accent-green to-accent-blue text-bg-base shadow-[0_0_20px_rgba(0,255,178,0.2)] hover:shadow-[0_0_30px_rgba(0,255,178,0.35)] px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(0,255,178,0.2)] transition-all">
        {saving ? <span className="animate-pulse">Saving...</span> : <><Save size={14} /> Save Changes</>}
      </button>
    </div>
  );
}

function AccountsSection() {
  const { accounts, addAccount, deleteAccount } = useAccountStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<"personal" | "prop" | "ira" | "margin">("personal");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("USD");

  const handleAdd = () => {
    if (!name || !balance) return;
    addAccount({ name, type, balance: Number(balance), startingBalance: Number(balance), currency, linkedTradeIds: [] });
    setName("");
    setBalance("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg mb-1">Trading Accounts</h3>
        <p className="text-sm text-text-muted">Manage your broker and prop firm accounts</p>
      </div>

      <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-4">
        <h4 className="text-sm font-bold text-text-primary">Add New Account</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Account Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apex 50K"
              className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-violet/40" />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-violet/40">
              <option value="personal">Personal</option>
              <option value="prop">Prop Firm</option>
              <option value="ira">IRA</option>
              <option value="margin">Margin</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Starting Balance</label>
            <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="50000"
              className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-violet/40" />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Currency</label>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD"
              className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent-violet/40" />
          </div>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 bg-accent-violet text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-violet/90 transition-colors">
          Add Account
        </button>
      </div>

      <div className="space-y-3">
        {accounts.map(acc => (
          <div key={acc.id} className="flex items-center justify-between p-4 rounded-xl bg-bg-base border border-border-subtle">
            <div>
              <div className="font-bold text-sm text-text-primary">{acc.name}</div>
              <div className="text-xs text-text-muted capitalize">{acc.type} • {acc.currency}</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="font-[family-name:var(--font-space-mono)] font-bold text-sm text-accent-green">
                {acc.balance.toLocaleString()}
              </div>
              <button onClick={() => deleteAccount(acc.id)} className="text-text-muted hover:text-accent-coral">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradingRulesSection() {
  const { settings, updateSettings } = useSettingsStore();
  const t = settings.trading;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg mb-1">Trading Rules</h3>
        <p className="text-sm text-text-muted">Configure risk management defaults</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Daily Max Loss</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
            <input type="number" value={t.maxLoss} onChange={(e) => updateSettings("trading", { maxLoss: Number(e.target.value) })}
              className="w-full bg-bg-card border border-border-subtle rounded-xl pl-7 pr-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-coral/40 transition-colors" />
          </div>
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Max Trades / Day</label>
          <input type="number" value={t.maxTrades} onChange={(e) => updateSettings("trading", { maxTrades: Number(e.target.value) })}
            className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Max Risk %</label>
          <div className="relative">
            <input type="number" step="0.25" value={t.maxRisk} onChange={(e) => updateSettings("trading", { maxRisk: Number(e.target.value) })}
              className="w-full bg-bg-card border border-border-subtle rounded-xl px-4 pr-8 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40 transition-colors" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
          </div>
        </div>
      </div>

      <div className="space-y-0 divide-y divide-border-subtle">
        <Toggle enabled={t.enforceRules} onChange={(v) => updateSettings("trading", { enforceRules: v })} label="Enforce daily loss limit warnings" />
        <Toggle enabled={t.forceChecklist} onChange={(v) => updateSettings("trading", { forceChecklist: v })} label="Require pre-market checklist before trading" />
        <Toggle enabled={t.cooldownEnabled} onChange={(v) => updateSettings("trading", { cooldownEnabled: v })} label="Auto-cooldown after 3 consecutive losses" />
      </div>
    </div>
  );
}

function NotificationsSection() {
  const { settings, updateSettings } = useSettingsStore();
  const n = settings.notifications;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg mb-1">Notifications</h3>
        <p className="text-sm text-text-muted">Configure alert preferences</p>
      </div>
      <div className="space-y-0 divide-y divide-border-subtle">
        <Toggle enabled={n.tradeSync} onChange={(v) => updateSettings("notifications", { tradeSync: v })} label="Trade sync confirmations" />
        <Toggle enabled={n.dailyReport} onChange={(v) => updateSettings("notifications", { dailyReport: v })} label="Daily performance summary" />
        <Toggle enabled={n.ruleViolation} onChange={(v) => updateSettings("notifications", { ruleViolation: v })} label="Rule violation alerts" />
        <Toggle enabled={n.propAlerts} onChange={(v) => updateSettings("notifications", { propAlerts: v })} label="Prop firm threshold warnings" />
        <Toggle enabled={n.weeklyDigest} onChange={(v) => updateSettings("notifications", { weeklyDigest: v })} label="Weekly performance digest" />
        <Toggle enabled={n.browserNotif} onChange={(v) => updateSettings("notifications", { browserNotif: v })} label="Browser push notifications" />
      </div>
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useSettingsStore();
  const a = settings.appearance;

  const themes = [
    { id: "dark", label: "Dark", bg: "#07080D", accent: "#00FFB2" },
    { id: "light", label: "Light", bg: "#F4F6F8", accent: "#00C88C" },
  ];

  const accents = [
    { color: "#00FFB2", label: "Neon Green" },
    { color: "#7B61FF", label: "Electric Violet" },
    { color: "#00D4FF", label: "Cyan" },
    { color: "#FF6B35", label: "Ember" },
    { color: "#FFD700", label: "Gold" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg mb-1">Appearance</h3>
        <p className="text-sm text-text-muted">Customize the look and feel</p>
      </div>

      <div>
        <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Theme</label>
        <div className="flex gap-3">
          {themes.map((t) => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              className={cn("relative flex-1 p-4 rounded-xl border-2 transition-all",
                theme === t.id ? "border-accent-green" : "border-border-subtle hover:border-border-subtle/80")}>
              <div className="w-full h-16 rounded-lg mb-2" style={{ backgroundColor: t.bg }}>
                <div className="w-1/2 h-2 rounded-full mt-3 ml-3" style={{ backgroundColor: t.accent }} />
                <div className="w-1/3 h-2 rounded-full mt-2 ml-3 opacity-40" style={{ backgroundColor: t.accent }} />
              </div>
              <span className="text-xs font-medium">{t.label}</span>
              {theme === t.id && <Check size={14} className="absolute top-2 right-2 text-accent-green" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Accent Color</label>
        <div className="flex gap-2">
          {accents.map((acc) => (
            <button key={acc.color} onClick={() => updateSettings("appearance", { accentColor: acc.color })}
              className={cn("w-10 h-10 rounded-xl border-2 transition-all hover:scale-110",
                a.accentColor === acc.color ? "border-white scale-110" : "border-transparent")}
              style={{ backgroundColor: acc.color }} title={acc.label} />
          ))}
        </div>
      </div>

      <div className="space-y-0 divide-y divide-border-subtle">
        <Toggle enabled={a.compactMode} onChange={(v) => updateSettings("appearance", { compactMode: v })} label="Compact mode (smaller cards and fonts)" />
        <Toggle enabled={a.animationsEnabled} onChange={(v) => updateSettings("appearance", { animationsEnabled: v })} label="Enable animations and transitions" />
      </div>
    </div>
  );
}

function DataSection() {
  const { trades, deleteTrades, importTrades } = useTradeStore();
  const { playbooks, deletePlaybook } = usePlaybookStore();
  const { accounts, deleteAccount } = useAccountStore();
  const { challenges, deleteChallenge } = usePropFirmStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    if (trades.length === 0) return alert("No trades to export.");
    const json = JSON.stringify(trades, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edgevault_trades_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        
        if (file.name.toLowerCase().endsWith(".json")) {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            importTrades(json);
            alert(`Successfully imported ${json.length} trades!`);
          } else {
            alert("Invalid JSON format. Must be an array of trades.");
          }
          setImporting(false);
        } else if (file.name.toLowerCase().endsWith(".csv")) {
          const lines = text.split("\n").filter(line => line.trim() !== "");
          if (lines.length < 2) {
            setImporting(false);
            return alert("Invalid CSV file. Must have headers and at least one trade.");
          }
          
          const rawHeaders = lines[0].split(",").map(h => h.trim());
          
          // Smart Header Mapping
          const HEADER_ALIASES: Record<string, string[]> = {
            symbol: ["ticker", "instrument", "asset", "contract", "item", "security", "pair", "market"],
            direction: ["side", "type", "action", "buy/sell", "b/s", "order type", "transaction"],
            netPnl: ["pnl", "profit", "loss", "gain", "realized pnl", "amount", "net profit", "total profit", "pl"],
            entryPrice: ["entry", "open price", "execution price", "avg price", "buy price", "short price", "opening price", "price"],
            exitPrice: ["exit", "close price", "sell price", "cover price", "closing price"],
            positionSize: ["size", "qty", "quantity", "volume", "contracts", "lots", "amount", "pos size"],
            entryDate: ["date", "time", "timestamp", "opening time", "trade time", "start date", "executed at"],
            exitDate: ["end date", "closing time", "finish date", "closed at"],
            commission: ["fees", "fee", "cost", "comm"]
          };

          const headerMap: Record<number, string> = {};
          rawHeaders.forEach((h, i) => {
            const cleanH = h.toLowerCase().replace(/[\s_-]/g, "");
            for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
              if (key.toLowerCase() === cleanH || aliases.some(a => a.replace(/[\s_-]/g, "").toLowerCase() === cleanH)) {
                headerMap[i] = key;
                break;
              }
            }
          });

          // Thinking Heuristic: If symbol/pnl not found by header, detect by data patterns
          const symbolIdx = Object.entries(headerMap).find(([_, v]) => v === "symbol")?.[0];
          if (symbolIdx === undefined) {
            for (let colIdx = 0; colIdx < rawHeaders.length; colIdx++) {
              const samples = lines.slice(1, 4).map(line => {
                const vals = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
                return vals[colIdx]?.replace(/^"|"$/g, "").trim() || "";
              });
              if (samples.length > 0 && samples.every(s => /^[A-Z0-9.]{2,10}$/.test(s))) {
                headerMap[colIdx] = "symbol";
                break;
              }
            }
          }

          // Final Fallback: AI Thinking (if API key exists and we are still missing core data)
          const runAISchemaDiscovery = async () => {
            const coreFields = ["symbol", "netPnl"];
            const missingCore = coreFields.filter(f => !Object.values(headerMap).includes(f));
            
            if (missingCore.length > 0 && process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY !== "demo") {
              try {
                const samples = lines.slice(1, 6);
                const response = await fetch("/api/analyze", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    type: "csv-schema", 
                    headers: rawHeaders, 
                    samples 
                  }),
                });
                if (response.ok) {
                  const aiMapping = await response.json();
                  Object.entries(aiMapping).forEach(([i, key]) => {
                    headerMap[parseInt(i)] = key as string;
                  });
                }
              } catch (e) {
                console.warn("AI Schema Discovery failed, falling back to heuristics");
              }
            }
          };

          const processTrades = () => {
            const tradesToImport: any[] = [];
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
              if (values.length === 0) continue;
              const obj: any = { id: crypto.randomUUID() };
              
              Object.entries(headerMap).forEach(([indexStr, key]) => {
                const index = parseInt(indexStr);
                let val = values[index] ? values[index].replace(/^"|"$/g, "").trim() : "";
                if (["netPnl", "entryPrice", "exitPrice", "positionSize", "commission"].includes(key)) {
                  const cleanVal = val.replace(/[$,]/g, "");
                  obj[key] = parseFloat(cleanVal) || 0;
                } else if (key === "direction") {
                  const lowVal = val.toLowerCase();
                  if (lowVal.startsWith("s") || lowVal.includes("sell") || lowVal.includes("short")) obj.direction = "short";
                  else obj.direction = "long";
                } else if (key === "symbol") obj.symbol = val.toUpperCase();
                else obj[key] = val;
              });

              obj.symbol = obj.symbol || "UNKNOWN";
              obj.direction = obj.direction || "long";
              if (obj.netPnl === undefined && obj.entryPrice && obj.exitPrice && obj.positionSize) {
                const diff = obj.direction === "long" ? obj.exitPrice - obj.entryPrice : obj.entryPrice - obj.exitPrice;
                obj.netPnl = (diff * obj.positionSize) - (obj.commission || 0);
              }
              obj.netPnl = obj.netPnl || 0;
              obj.entryDate = obj.entryDate || new Date().toISOString();
              obj.exitDate = obj.exitDate || obj.entryDate;
              obj.setupTags = [];
              obj.mistakeTags = [];
              obj.screenshotUrls = [];
              obj.mindsetTags = [];
              obj.mindsetNotes = "";
              obj.sessionTag = "NY AM";
              obj.marketCondition = "Trending";
              obj.emotion = 0;
              obj.result = obj.netPnl >= 0 ? "win" : "loss";
              tradesToImport.push(obj);
            }
            importTrades(tradesToImport);
            setImporting(false);
            alert(`Smart Importer: Successfully analyzed and imported ${tradesToImport.length} trades!`);
          };

          runAISchemaDiscovery().then(processTrades);
        } else {
          setImporting(false);
          alert("Unsupported file format. Please upload a .json or .csv file.");
        }
      } catch (err) {
        setImporting(false);
        alert("Error parsing file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    if (confirm("WARNING: This will permanently delete ALL your trades, playbooks, accounts, and prop challenges from the cloud database. Are you absolutely sure?")) {
      try {
        if (trades.length > 0) await deleteTrades(trades.map(t => t.id));
        playbooks.forEach(p => deletePlaybook(p.id));
        accounts.forEach(a => deleteAccount(a.id));
        challenges.forEach(c => deleteChallenge(c.id));
        alert("All data has been reset.");
      } catch (err) {
        alert("Error resetting data.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg mb-1">Data & Export</h3>
        <p className="text-sm text-text-muted">Manage your trading data</p>
      </div>

      <div className="space-y-3">
        <button onClick={handleExport} className="w-full flex items-center justify-between p-4 rounded-xl bg-bg-card border border-border-subtle hover:border-accent-green/20 transition-all text-left group">
          <div className="flex items-center gap-3">
            <Download size={18} className="text-accent-green" />
            <div>
              <div className="text-sm font-medium">Export All Trades ({trades.length})</div>
              <div className="text-xs text-text-muted">Download as JSON backup</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
        </button>

        <input type="file" accept=".json,.csv" className="hidden" ref={fileInputRef} onChange={handleImport} />
        <button onClick={() => fileInputRef.current?.click()} disabled={importing}
          className="w-full flex items-center justify-between p-4 rounded-xl bg-bg-card border border-border-subtle hover:border-accent-violet/20 transition-all text-left group disabled:opacity-50">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-accent-violet/10", importing && "animate-pulse")}>
              <Upload size={18} className="text-accent-violet" />
            </div>
            <div>
              <div className="text-sm font-medium">{importing ? "AI Thinking & Importing..." : "Import Trade Data"}</div>
              <div className="text-xs text-text-muted">{importing ? "Analyzing CSV patterns..." : "Import JSON or CSV backup"}</div>
            </div>
          </div>
          {importing ? (
            <div className="w-4 h-4 border-2 border-accent-violet/30 border-t-accent-violet rounded-full animate-spin" />
          ) : (
            <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
          )}
        </button>

        <button onClick={handleReset} className="w-full flex items-center justify-between p-4 rounded-xl bg-bg-card border border-border-subtle hover:border-accent-coral/20 transition-all text-left group">
          <div className="flex items-center gap-3">
            <Trash2 size={18} className="text-accent-coral" />
            <div>
              <div className="text-sm font-medium text-accent-coral">Reset All Data</div>
              <div className="text-xs text-text-muted">Permanently delete all trades and settings from cloud</div>
            </div>
          </div>
          <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
        </button>
      </div>
    </div>
  );
}

function APISection() {
  const { settings, updateSettings } = useSettingsStore();
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg mb-1">API & Integrations</h3>
        <p className="text-sm text-text-muted">Connect external services</p>
      </div>

      <div className="p-4 rounded-xl bg-bg-card border border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">🔥</div>
            <div>
              <div className="text-sm font-medium">Firebase</div>
              <div className="text-xs text-text-muted">Auth & Cloud Sync</div>
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-accent-green/10 text-accent-green">Connected</span>
        </div>
        <p className="text-xs text-text-muted">Cloud synchronization is active.</p>
      </div>

      <div className="p-4 rounded-xl bg-bg-card border border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-violet/10 flex items-center justify-center">✨</div>
            <div>
              <div className="text-sm font-medium">Google Gemini AI</div>
              <div className="text-xs text-text-muted">Trade Analysis Engine</div>
            </div>
          </div>
          <span className={cn("text-xs px-2 py-1 rounded-full",
            settings.api.geminiKey ? "bg-accent-green/10 text-accent-green" : "bg-text-muted/10 text-text-muted")}>
            {settings.api.geminiKey ? "Connected" : "Not Configured"}
          </span>
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">API Key</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input type={showKey ? "text" : "password"} placeholder="Paste Gemini API Key..." 
                value={settings.api.geminiKey} onChange={(e) => updateSettings("api", { geminiKey: e.target.value })}
                className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-accent-violet/40" />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-bg-card border border-border-subtle mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0088cc]/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0088cc]">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium">Telegram Bot</div>
              <div className="text-xs text-text-muted">Real-time alerts delivery</div>
            </div>
          </div>
          <span className={cn("text-xs px-2 py-1 rounded-full",
            settings.api.telegramToken && settings.api.telegramChatId ? "bg-accent-green/10 text-accent-green" : "bg-text-muted/10 text-text-muted")}>
            {settings.api.telegramToken && settings.api.telegramChatId ? "Connected" : "Not Configured"}
          </span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Bot Token</label>
            <input type={showKey ? "text" : "password"} placeholder="e.g. 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" 
              value={settings.api.telegramToken || ""} onChange={(e) => updateSettings("api", { telegramToken: e.target.value })}
              className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-[#0088cc]/40 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Chat ID</label>
            <input type="text" placeholder="e.g. 123456789" 
              value={settings.api.telegramChatId || ""} onChange={(e) => updateSettings("api", { telegramChatId: e.target.value })}
              className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2.5 text-sm font-[family-name:var(--font-space-mono)] focus:outline-none focus:border-[#0088cc]/40 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { logout } = useAuth();

  const sectionMap: Record<SettingsTab, React.ReactNode> = {
    profile: <ProfileSection />,
    accounts: <AccountsSection />,
    trading: <TradingRulesSection />,
    notifications: <NotificationsSection />,
    appearance: <AppearanceSection />,
    data: <DataSection />,
    api: <APISection />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-inter)] font-black text-2xl">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure your trading environment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left",
                activeTab === tab.id
                  ? "bg-accent-green/10 text-accent-green border border-accent-green/25 shadow-[0_0_10px_rgba(0,255,178,0.08)]"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-card")}>
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-border-subtle">
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-accent-coral hover:bg-accent-coral/10 transition-all text-left">
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          <GlassCard>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {sectionMap[activeTab]}
              </motion.div>
            </AnimatePresence>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
