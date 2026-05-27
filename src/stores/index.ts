"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Trade, Playbook, TradingAccount, PropFirmChallenge } from "@/lib/types";
import { generateMockTrades } from "@/lib/mock-data";
import { generateId } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, setDoc, deleteDoc, writeBatch, deleteField } from "firebase/firestore";

const sanitizeForFirestore = (obj: any): any => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      result[key] = deleteField();
    } else {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result;
};

const recalculate = (trades: Trade[]) => {
  const sorted = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
  let equity = 50000;
  return sorted.map(t => {
    equity += t.netPnl;
    // Fallback rMultiple & rr to $200 unit risk baseline if zero or falsy
    const rMultiple = t.rMultiple !== 0 ? (t.rMultiple || 0) : parseFloat((t.netPnl / 200).toFixed(2));
    const rr = t.rr !== 0 ? (t.rr || 0) : parseFloat(Math.abs(t.netPnl / 200).toFixed(2));
    return { 
      ...t, 
      rMultiple,
      rr,
      accountEquityAfter: parseFloat(equity.toFixed(2)) 
    };
  });
};

interface TradeStore {
  trades: Trade[];
  initialized: boolean;
  initializeTrades: () => void;
  addTrade: (trade: Omit<Trade, "id">) => void;
  importTrades: (trades: Omit<Trade, "id" | "accountEquityAfter">[]) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  deleteTrades: (ids: string[]) => Promise<void>;
  listenToTrades: (userId: string) => () => void;
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      trades: [],
      initialized: false,
      initializeTrades: () => {
        if (!get().initialized) {
          set({ trades: recalculate(generateMockTrades()), initialized: true });
        }
      },
      addTrade: async (trade) => {
        const newTrade: Trade = { ...trade, id: generateId(), accountEquityAfter: 0 };
        // Optimistic update with recalculation
        set((state) => {
          const updated = [...state.trades, newTrade];
          return { trades: recalculate(updated) };
        });
        
        // Sync to cloud if authenticated
        const user = auth?.currentUser;
        if (user && db) {
          try {
            const cleanTrade = sanitizeForFirestore(newTrade);
            await setDoc(doc(db, `users/${user.uid}/trades`, newTrade.id), cleanTrade);
          } catch (error) {
            console.error("Error syncing trade to cloud:", error);
          }
        }
      },
      importTrades: async (incoming) => {
        const newTrades: Trade[] = incoming.map((t) => ({ 
          ...t, 
          id: generateId(), 
          accountEquityAfter: 0 
        }));
        
        // Optimistic update
        set((state) => ({ trades: recalculate([...state.trades, ...newTrades]) }));
        
        // Batch write to cloud
        const user = auth?.currentUser;
        if (user && db) {
          try {
            const batch = writeBatch(db);
            newTrades.forEach(trade => {
              if (db) {
                const ref = doc(db, `users/${user.uid}/trades`, trade.id);
                batch.set(ref, sanitizeForFirestore(trade));
              }
            });
            await batch.commit();
          } catch (error) {
            console.error("Error batch syncing trades:", error);
          }
        }
      },
      updateTrade: async (id, updates) => {
        set((state) => {
          const updated = state.trades.map((t) => (t.id === id ? { ...t, ...updates } : t));
          return { trades: recalculate(updated) };
        });
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            const cleanUpdates = sanitizeForFirestore(updates);
            await setDoc(doc(db, `users/${user.uid}/trades`, id), cleanUpdates, { merge: true });
          } catch (error) {
            console.error("Error updating trade in cloud:", error);
          }
        }
      },
      deleteTrade: async (id) => {
        set((state) => ({ trades: recalculate(state.trades.filter((t) => t.id !== id)) }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            await deleteDoc(doc(db, `users/${user.uid}/trades`, id));
          } catch (error) {
            console.error("Error deleting trade from cloud:", error);
          }
        }
      },
      deleteTrades: async (ids) => {
        set((state) => ({ trades: recalculate(state.trades.filter((t) => !ids.includes(t.id))) }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            const batch = writeBatch(db);
            ids.forEach(id => {
              if (db) {
                const ref = doc(db, `users/${user.uid}/trades`, id);
                batch.delete(ref);
              }
            });
            await batch.commit();
          } catch (error) {
            console.error("Error batch deleting trades:", error);
          }
        }
      },
      listenToTrades: (userId: string) => {
        if (!userId || !db) return () => {};

        const q = query(collection(db, `users/${userId}/trades`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const cloudTrades: Trade[] = [];
          snapshot.forEach((doc) => {
            cloudTrades.push(doc.data() as Trade);
          });
          
          const localTrades = get().trades;
          if (cloudTrades.length === 0 && localTrades.length > 0 && db) {
            // Upload local trades to cloud instead of letting empty cloud wipe them out
            const batch = writeBatch(db);
            localTrades.forEach(trade => {
              if (db) {
                const ref = doc(db, `users/${userId}/trades`, trade.id);
                batch.set(ref, trade);
              }
            });
            batch.commit().catch(err => console.error("Error syncing local trades to cloud:", err));
          } else {
            set({ trades: recalculate(cloudTrades) });
          }
        }, (error) => {
          // Silently ignore permission errors until rules are updated
        });

        return unsubscribe;
      },
    }),
    { name: "edgevault-trades" }
  )
);

interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  journalView: "list" | "calendar";
  setJournalView: (view: "list" | "calendar") => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  journalView: "list",
  setJournalView: (view) => set({ journalView: view }),
}));

// ═══════════════════════════════
// Phase 2 Stores
// ═══════════════════════════════

interface PlaybookStore {
  playbooks: Playbook[];
  addPlaybook: (playbook: Omit<Playbook, "id" | "createdAt" | "updatedAt">) => void;
  updatePlaybook: (id: string, updates: Partial<Playbook>) => void;
  deletePlaybook: (id: string) => void;
  linkTrade: (playbookId: string, tradeId: string) => void;
  unlinkTrade: (playbookId: string, tradeId: string) => void;
  listenToPlaybooks: (userId: string) => () => void;
}

export const usePlaybookStore = create<PlaybookStore>()(
  persist(
    (set, get) => ({
      playbooks: [],
      addPlaybook: async (playbook) => {
        const now = new Date().toISOString();
        const newPlaybook = { ...playbook, id: generateId(), createdAt: now, updatedAt: now };
        
        // Optimistic update
        set((s) => ({ playbooks: [...s.playbooks, newPlaybook] }));
        
        // Cloud sync
        const user = auth?.currentUser;
        if (user && db) {
          try {
            await setDoc(doc(db, `users/${user.uid}/playbooks`, newPlaybook.id), newPlaybook);
          } catch (error) {
            console.error("Error syncing playbook to cloud:", error);
          }
        }
      },
      updatePlaybook: async (id, updates) => {
        set((s) => ({ playbooks: s.playbooks.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)) }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            await setDoc(doc(db, `users/${user.uid}/playbooks`, id), { ...updates, updatedAt: new Date().toISOString() }, { merge: true });
          } catch (error) {
            console.error("Error updating playbook in cloud:", error);
          }
        }
      },
      deletePlaybook: async (id) => {
        set((s) => ({ playbooks: s.playbooks.filter((p) => p.id !== id) }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            await deleteDoc(doc(db, `users/${user.uid}/playbooks`, id));
          } catch (error) {
            console.error("Error deleting playbook from cloud:", error);
          }
        }
      },
      linkTrade: async (playbookId, tradeId) => {
        set((s) => ({ playbooks: s.playbooks.map((p) => p.id === playbookId ? { ...p, linkedTradeIds: [...new Set([...p.linkedTradeIds, tradeId])] } : p) }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            const playbook = get().playbooks.find(p => p.id === playbookId);
            if (playbook) await setDoc(doc(db, `users/${user.uid}/playbooks`, playbookId), { linkedTradeIds: playbook.linkedTradeIds }, { merge: true });
          } catch (error) {
            console.error("Error linking trade to playbook:", error);
          }
        }
      },
      unlinkTrade: async (playbookId, tradeId) => {
        set((s) => ({ playbooks: s.playbooks.map((p) => p.id === playbookId ? { ...p, linkedTradeIds: p.linkedTradeIds.filter((id) => id !== tradeId) } : p) }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            const playbook = get().playbooks.find(p => p.id === playbookId);
            if (playbook) await setDoc(doc(db, `users/${user.uid}/playbooks`, playbookId), { linkedTradeIds: playbook.linkedTradeIds }, { merge: true });
          } catch (error) {
            console.error("Error unlinking trade from playbook:", error);
          }
        }
      },
      listenToPlaybooks: (userId: string) => {
        if (!userId || !db) return () => {};
        const q = query(collection(db, `users/${userId}/playbooks`));
        return onSnapshot(q, (snapshot) => {
          const items: Playbook[] = [];
          snapshot.forEach((doc) => items.push(doc.data() as Playbook));
          
          const localPlaybooks = get().playbooks;
          if (items.length === 0 && localPlaybooks.length > 0) {
            // Upload local playbooks to cloud instead of letting empty cloud wipe them out
            localPlaybooks.forEach(p => {
              if (db) setDoc(doc(db, `users/${userId}/playbooks`, p.id), p);
            });
          } else {
            set({ playbooks: items });
          }
        }, (error) => {
          // Silently ignore permission errors until rules are updated
        });
      },
    }),
    { name: "edgevault-playbooks" }
  )
);

interface AccountStore {
  accounts: TradingAccount[];
  addAccount: (account: Omit<TradingAccount, "id" | "createdAt">) => void;
  updateAccount: (id: string, updates: Partial<TradingAccount>) => void;
  deleteAccount: (id: string) => void;
  listenToAccounts: (userId: string) => () => void;
}

export const useAccountStore = create<AccountStore>()(
  persist(
    (set, get) => ({
      accounts: [],
      addAccount: async (account) => {
        const newAccount = { ...account, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ accounts: [...s.accounts, newAccount] }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            await setDoc(doc(db, `users/${user.uid}/accounts`, newAccount.id), sanitizeForFirestore(newAccount));
          } catch (error) {
            console.error("Error syncing account to cloud:", error);
          }
        }
      },
      updateAccount: async (id, updates) => {
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)) }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            await setDoc(doc(db, `users/${user.uid}/accounts`, id), sanitizeForFirestore(updates), { merge: true });
          } catch (error) {
            console.error("Error updating account in cloud:", error);
          }
        }
      },
      deleteAccount: async (id) => {
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            await deleteDoc(doc(db, `users/${user.uid}/accounts`, id));
          } catch (error) {
            console.error("Error deleting account from cloud:", error);
          }
        }
      },
      listenToAccounts: (userId: string) => {
        if (!userId || !db) return () => {};
        const q = query(collection(db, `users/${userId}/accounts`));
        return onSnapshot(q, (snapshot) => {
          const items: TradingAccount[] = [];
          snapshot.forEach((doc) => items.push(doc.data() as TradingAccount));
          
          const localAccounts = get().accounts;
          if (items.length === 0 && localAccounts.length > 0) {
            // Upload local accounts to cloud
            localAccounts.forEach(a => {
              if (db) setDoc(doc(db, `users/${userId}/accounts`, a.id), a);
            });
          } else {
            set({ accounts: items });
          }
        }, (error) => {
          // Silently ignore permission errors until rules are updated
        });
      },
    }),
    { name: "edgevault-accounts" }
  )
);

interface PropFirmStore {
  challenges: PropFirmChallenge[];
  addChallenge: (challenge: Omit<PropFirmChallenge, "id">) => void;
  updateChallenge: (id: string, updates: Partial<PropFirmChallenge>) => void;
  deleteChallenge: (id: string) => void;
  listenToChallenges: (userId: string) => () => void;
}

export const usePropFirmStore = create<PropFirmStore>()(
  persist(
    (set, get) => ({
      challenges: [],
      addChallenge: async (challenge) => {
        const newChallenge = { ...challenge, id: generateId() };
        set((s) => ({ challenges: [...s.challenges, newChallenge] }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            await setDoc(doc(db, `users/${user.uid}/challenges`, newChallenge.id), sanitizeForFirestore(newChallenge));
          } catch (error) {
            console.error("Error syncing challenge to cloud:", error);
          }
        }
      },
      updateChallenge: async (id, updates) => {
        set((s) => ({ challenges: s.challenges.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            await setDoc(doc(db, `users/${user.uid}/challenges`, id), sanitizeForFirestore(updates), { merge: true });
          } catch (error) {
            console.error("Error updating challenge in cloud:", error);
          }
        }
      },
      deleteChallenge: async (id) => {
        set((s) => ({ challenges: s.challenges.filter((c) => c.id !== id) }));
        
        const user = auth?.currentUser;
        if (user && db) {
          try {
            await deleteDoc(doc(db, `users/${user.uid}/challenges`, id));
          } catch (error) {
            console.error("Error deleting challenge from cloud:", error);
          }
        }
      },
      listenToChallenges: (userId: string) => {
        if (!userId || !db) return () => {};
        const q = query(collection(db, `users/${userId}/challenges`));
        return onSnapshot(q, (snapshot) => {
          const items: PropFirmChallenge[] = [];
          snapshot.forEach((doc) => items.push(doc.data() as PropFirmChallenge));
          
          const localChallenges = get().challenges;
          if (items.length === 0 && localChallenges.length > 0) {
            // Upload local challenges to cloud
            localChallenges.forEach(c => {
              if (db) setDoc(doc(db, `users/${userId}/challenges`, c.id), c);
            });
          } else {
            set({ challenges: items });
          }
        }, (error) => {
          // Silently ignore permission errors until rules are updated
        });
      },
    }),
    { name: "edgevault-propfirm" }
  )
);

// ═══════════════════════════════
// Settings Store
// ═══════════════════════════════

export interface UserSettings {
  profile: { name: string; email: string; timezone: string; currency: string };
  trading: { maxLoss: number; maxTrades: number; maxRisk: number; enforceRules: boolean; forceChecklist: boolean; cooldownEnabled: boolean; checklist: string[] };
  notifications: { tradeSync: boolean; dailyReport: boolean; ruleViolation: boolean; weeklyDigest: boolean; propAlerts: boolean; browserNotif: boolean };
  appearance: { accentColor: string; compactMode: boolean; animationsEnabled: boolean };
  api: { geminiKey: string; telegramToken: string; telegramChatId: string };
}

const defaultSettings: UserSettings = {
  profile: { name: "", email: "", timezone: "America/New_York", currency: "USD ($)" },
  trading: { maxLoss: 500, maxTrades: 3, maxRisk: 1, enforceRules: true, forceChecklist: false, cooldownEnabled: true, checklist: ["HTF Bias Confirmed", "Liquidity Sweep Detected", "SMT Divergence Present", "displacement & IFVG Formed", "Risk Managed (1% Max)"] },
  notifications: { tradeSync: true, dailyReport: true, ruleViolation: true, weeklyDigest: false, propAlerts: true, browserNotif: false },
  appearance: { accentColor: "#00FFB2", compactMode: false, animationsEnabled: true },
  api: { geminiKey: "", telegramToken: "", telegramChatId: "" }
};

interface SettingsStore {
  settings: UserSettings;
  updateSettings: (category: keyof UserSettings, updates: Partial<UserSettings[keyof UserSettings]>) => void;
  listenToSettings: (userId: string) => () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      updateSettings: async (category, updates) => {
        const newCategoryState = { ...get().settings[category], ...updates };
        const newSettings = { ...get().settings, [category]: newCategoryState };
        set({ settings: newSettings });

        const user = auth?.currentUser;
        if (user && db) {
          try {
            await setDoc(doc(db, `users/${user.uid}/settings`, "preferences"), newSettings, { merge: true });
          } catch (error) {
            console.error("Error saving settings to cloud:", error);
          }
        }
      },
      listenToSettings: (userId: string) => {
        if (!userId || !db) return () => {};
        const q = doc(db, `users/${userId}/settings`, "preferences");
        return onSnapshot(q, (docSnapshot) => {
          if (docSnapshot.exists()) {
            set({ settings: { ...defaultSettings, ...docSnapshot.data() as UserSettings } });
          }
        }, (error) => {
          // Silently ignore permission errors
        });
      },
    }),
    { name: "edgevault-settings" }
  )
);

// ═══════════════════════════════
// Risk Store (Daily Transient)
// ═══════════════════════════════

interface RiskStore {
  lastChecklistDate: string;
  checkedItems: string[];
  setCheckedItems: (items: string[]) => void;
  resetIfNewDay: () => void;
}

export const useRiskStore = create<RiskStore>()(
  persist(
    (set, get) => ({
      lastChecklistDate: new Date().toISOString().split("T")[0],
      checkedItems: [],
      setCheckedItems: (items) => set({ checkedItems: items }),
      resetIfNewDay: () => {
        const today = new Date().toISOString().split("T")[0];
        if (get().lastChecklistDate !== today) {
          set({ lastChecklistDate: today, checkedItems: [] });
        }
      }
    }),
    { name: "edgevault-risk" }
  )
);

// ═══════════════════════════════
// Daily Notebook Store (TradeZella Inspired)
// ═══════════════════════════════

export interface DailyNote {
  date: string; // YYYY-MM-DD
  preMarketPlan: string;
  bias: "bullish" | "bearish" | "neutral" | "";
  sleepScore: number; // 1 to 5
  focusScore: number; // 1 to 5
  postMarketReview: string;
  intradayNotes: string;
  checklistComplete: boolean;
  sessionGrade: "A" | "B" | "C" | "D" | "F" | "";
}

export interface NotebookTemplate {
  id: string;
  name: string;
  content: string;
}

export interface CustomNote {
  id: string;
  title: string;
  content: string;
  date: string;
  type: "daily" | "loss-recap" | "custom";
  linkedTradeIds?: string[];
}

interface NotebookStore {
  notes: Record<string, DailyNote>;
  customNotes: Record<string, CustomNote>;
  templates: NotebookTemplate[];
  saveNote: (date: string, note: Partial<DailyNote>) => void;
  saveCustomNote: (note: CustomNote) => void;
  deleteCustomNote: (id: string) => void;
  saveTemplate: (template: NotebookTemplate) => void;
  deleteTemplate: (id: string) => void;
}

export const useNotebookStore = create<NotebookStore>()(
  persist(
    (set, get) => ({
      notes: {},
      customNotes: {},
      templates: [
        { id: "tmpl-loss-recap", name: "Deep Loss Review", content: "### What went wrong?\n\n### Did I follow my rules?\n\n### Emotional State\n\n### Adjustments for next time\n" },
        { id: "tmpl-weekly-review", name: "Weekly Review", content: "### Best Trade of the Week\n\n### Worst Trade of the Week\n\n### What I learned\n\n### Goals for next week\n" }
      ],
      saveNote: (date, updatedFields) => {
        set((state) => {
          const existing = state.notes[date] || {
            date,
            preMarketPlan: "",
            bias: "",
            sleepScore: 3,
            focusScore: 3,
            postMarketReview: "",
            intradayNotes: "",
            checklistComplete: false,
            sessionGrade: ""
          };
          return {
            notes: {
              ...state.notes,
              [date]: { ...existing, ...updatedFields }
            }
          };
        });
      },
      saveCustomNote: (note) => set((state) => ({ customNotes: { ...state.customNotes, [note.id]: note } })),
      deleteCustomNote: (id) => set((state) => {
        const next = { ...state.customNotes };
        delete next[id];
        return { customNotes: next };
      }),
      saveTemplate: (template) => set((state) => ({ templates: [...state.templates.filter(t => t.id !== template.id), template] })),
      deleteTemplate: (id) => set((state) => ({ templates: state.templates.filter(t => t.id !== id) }))
    }),
    { name: "edgevault-notebook" }
  )
);

// ═══════════════════════════════
// Wiki Store (TradeZella Inspired Canvas)
// ═══════════════════════════════

export interface WikiFolder {
  id: string;
  name: string;
  icon?: string;
  defaultTemplateId?: string;
}

export interface WikiTag {
  id: string;
  name: string;
  color: string;
}

export interface WikiNote {
  id: string;
  title: string;
  content: string;
  folderId: string;
  tags: string[];
  date: string;
  createdAt: number;
  updatedAt: number;
}

export interface WikiTemplate {
  id: string;
  name: string;
  content: string;
}

interface WikiStore {
  folders: WikiFolder[];
  tags: WikiTag[];
  notes: Record<string, WikiNote>;
  templates: WikiTemplate[];
  
  addFolder: (folder: Omit<WikiFolder, "id">) => void;
  updateFolder: (id: string, updates: Partial<WikiFolder>) => void;
  deleteFolder: (id: string) => void;

  addTag: (tag: Omit<WikiTag, "id">) => void;
  updateTag: (id: string, updates: Partial<WikiTag>) => void;
  deleteTag: (id: string) => void;

  saveNote: (note: WikiNote) => void;
  deleteNote: (id: string) => void;

  saveTemplate: (template: WikiTemplate) => void;
  deleteTemplate: (id: string) => void;
}

const DEFAULT_WIKI_FOLDERS: WikiFolder[] = [
  { id: "wf-journal", name: "Daily Journal", icon: "BookOpen", defaultTemplateId: "tmpl-start-day" },
  { id: "wf-weekly", name: "Weekly Recaps", icon: "Calendar", defaultTemplateId: "tmpl-weekly-review" },
  { id: "wf-loss", name: "Loss Reviews", icon: "Flame", defaultTemplateId: "tmpl-loss-recap" },
];

const DEFAULT_WIKI_TEMPLATES: WikiTemplate[] = [
  { id: "tmpl-start-day", name: "Start My Day", content: "<h2>Pre-Market Prep</h2><p><br/></p><h2>Mindset Check</h2><p><br/></p>" },
  { id: "tmpl-intraday", name: "Intraday Check-In", content: "<h2>10:00 AM Check-In</h2><p><br/></p>" },
  { id: "tmpl-loss-recap", name: "Deep Loss Review", content: "<h3>What went wrong?</h3><p><br/></p>" },
  { id: "tmpl-weekly-review", name: "Weekly Review", content: "<h3>Best Trade of the Week</h3><p><br/></p>" }
];

const DEFAULT_WIKI_TAGS: WikiTag[] = [
  { id: "tag-tilt", name: "Tilt", color: "#FF6B35" },
  { id: "tag-fomo", name: "FOMO", color: "#FF357A" },
  { id: "tag-a-plus", name: "A+ Setup", color: "#00FFB2" },
];

export const useWikiStore = create<WikiStore>()(
  persist(
    (set, get) => ({
      folders: DEFAULT_WIKI_FOLDERS,
      tags: DEFAULT_WIKI_TAGS,
      notes: {},
      templates: DEFAULT_WIKI_TEMPLATES,

      addFolder: (folder) => set((s) => ({ folders: [...s.folders, { ...folder, id: `wf-${Date.now()}` }] })),
      updateFolder: (id, updates) => set((s) => ({ folders: s.folders.map(f => f.id === id ? { ...f, ...updates } : f) })),
      deleteFolder: (id) => set((s) => ({ folders: s.folders.filter(f => f.id !== id) })),

      addTag: (tag) => set((s) => ({ tags: [...s.tags, { ...tag, id: `wtag-${Date.now()}` }] })),
      updateTag: (id, updates) => set((s) => ({ tags: s.tags.map(t => t.id === id ? { ...t, ...updates } : t) })),
      deleteTag: (id) => set((s) => ({ tags: s.tags.filter(t => t.id !== id) })),

      saveNote: (note) => set((s) => ({ notes: { ...s.notes, [note.id]: note } })),
      deleteNote: (id) => set((s) => {
        const next = { ...s.notes };
        delete next[id];
        return { notes: next };
      }),

      saveTemplate: (template) => set((s) => ({ templates: [...s.templates.filter(t => t.id !== template.id), template] })),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter(t => t.id !== id) }))
    }),
    { name: "edgevault-wiki" }
  )
);
