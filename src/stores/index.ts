"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Trade, Playbook, TradingAccount, PropFirmChallenge, AIChatThread, AIChatMessage, AppNotification, AlertRule, MissedTrade } from "@/lib/types";
import { generateMockTrades } from "@/lib/mock-data";
import { generateId } from "@/lib/utils";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, setDoc, deleteDoc, writeBatch, deleteField, getDocs } from "firebase/firestore";

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
  const validTrades = trades.filter(t => t && t.entryDate && !isNaN(new Date(t.entryDate).getTime()));
  const sorted = [...validTrades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
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
            await setDoc(doc(db, `users/${user.uid}/trades`, newTrade.id), cleanTrade, { merge: true });
          } catch (error: any) {
            console.error("Error syncing trade to cloud:", error);
            if (typeof window !== "undefined") {
              alert("Failed to sync trade to cloud: " + error.message);
            }
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
                batch.set(ref, sanitizeForFirestore(trade), { merge: true });
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
          set({ trades: recalculate(cloudTrades) });
        }, (error) => {
          // Silently ignore permission errors until rules are updated
        });

        return unsubscribe;
      },
    }),
    { 
      name: "edgevault-trades",
      merge: (persistedState: any, currentState) => {
        if (!persistedState || typeof persistedState !== "object") return currentState;
        const state = { ...persistedState };
        if (Array.isArray(state.trades)) {
          state.trades = state.trades.filter((t: any) => t && t.id);
        }
        return { ...currentState, ...state };
      }
    }
  )
);

interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  journalView: "list" | "calendar";
  setJournalView: (view: "list" | "calendar") => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
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
        const newPlaybook = { ...playbook, id: generateId(), createdAt: now, updatedAt: now, linkedTradeIds: [] };
        
        // Optimistic update
        set((s) => ({ playbooks: [...s.playbooks, newPlaybook] }));
        
        // Cloud sync
        const user = auth?.currentUser;
        if (user && db) {
          try {
            await setDoc(doc(db, `users/${user.uid}/playbooks`, newPlaybook.id), newPlaybook, { merge: true });
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
          
          set({ playbooks: items });
        }, (error) => {
          // Silently ignore permission errors until rules are updated
        });
      },
    }),
    { 
      name: "edgevault-playbooks",
      merge: (persistedState: any, currentState) => {
        if (!persistedState || typeof persistedState !== "object") return currentState;
        const state = { ...persistedState };
        if (Array.isArray(state.playbooks)) {
          state.playbooks = state.playbooks.filter((p: any) => p && p.id);
        }
        return { ...currentState, ...state };
      }
    }
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
            await setDoc(doc(db, `users/${user.uid}/accounts`, newAccount.id), sanitizeForFirestore(newAccount), { merge: true });
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
          
          set({ accounts: items });
        }, (error) => {
          // Silently ignore permission errors until rules are updated
        });
      },
    }),
    { 
      name: "edgevault-accounts",
      merge: (persistedState: any, currentState) => {
        if (!persistedState || typeof persistedState !== "object") return currentState;
        const state = { ...persistedState };
        if (Array.isArray(state.accounts)) {
          state.accounts = state.accounts.filter((a: any) => a && a.id);
        }
        return { ...currentState, ...state };
      }
    }
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
            await setDoc(doc(db, `users/${user.uid}/challenges`, newChallenge.id), sanitizeForFirestore(newChallenge), { merge: true });
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
          
          set({ challenges: items });
        }, (error) => {
          // Silently ignore permission errors until rules are updated
        });
      },
    }),
    { 
      name: "edgevault-propfirm",
      merge: (persistedState: any, currentState) => {
        if (!persistedState || typeof persistedState !== "object") return currentState;
        const state = { ...persistedState };
        if (Array.isArray(state.challenges)) {
          state.challenges = state.challenges.filter((c: any) => c && c.id);
        }
        return { ...currentState, ...state };
      }
    }
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

export type NotebookCategory = "All Notes" | "Favorites" | "Trade Notes" | "Daily Journal" | "Sessions Recap" | string;

export interface NotebookEntry {
  id: string;
  title: string;
  content: string;
  category: NotebookCategory;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  linkedTradeIds?: string[];
}

export interface NotebookTemplate {
  id: string;
  name: string;
  content: string;
}

interface NotebookStore {
  entries: Record<string, NotebookEntry>;
  templates: NotebookTemplate[];
  saveEntry: (entry: NotebookEntry) => void;
  deleteEntry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  saveTemplate: (template: NotebookTemplate) => void;
  deleteTemplate: (id: string) => void;
  listenToNotebook: (userId: string) => () => void;
}

export const useNotebookStore = create<NotebookStore>()(
  persist(
    (set, get) => ({
      entries: {},
      templates: [
        { id: "tmpl-loss-recap", name: "Deep Loss Review", content: "<h3>What went wrong?</h3><br/><p></p><h3>Did I follow my rules?</h3><br/><p></p><h3>Emotional State</h3><br/><p></p><h3>Adjustments for next time</h3><br/><p></p>" },
        { id: "tmpl-weekly-review", name: "Weekly Review", content: "<h3>Best Trade of the Week</h3><br/><p></p><h3>Worst Trade of the Week</h3><br/><p></p><h3>What I learned</h3><br/><p></p><h3>Goals for next week</h3><br/><p></p>" },
        { id: "tmpl-daily", name: "Daily Log Default", content: "<h3>Pre-Market Plan</h3><br/><p></p><h3>Intraday Notes</h3><br/><p></p><h3>Post-Market Review</h3><br/><p></p><p><strong>Bias:</strong> </p><p><strong>Sleep Score:</strong> /5</p><p><strong>Focus Score:</strong> /5</p>" }
      ],
      saveEntry: (entry) => {
        const nextEntry = { ...entry, updatedAt: new Date().toISOString() };
        set((state) => ({ entries: { ...state.entries, [nextEntry.id]: nextEntry } }));
        const user = auth?.currentUser;
        if (user && db) setDoc(doc(db, `users/${user.uid}/notebookEntries`, nextEntry.id), nextEntry, { merge: true }).catch(console.error);
      },
      deleteEntry: (id) => {
        set((state) => {
          const next = { ...state.entries };
          delete next[id];
          return { entries: next };
        });
        const user = auth?.currentUser;
        if (user && db) deleteDoc(doc(db, `users/${user.uid}/notebookEntries`, id)).catch(console.error);
      },
      toggleFavorite: (id) => {
        const entry = get().entries[id];
        if (entry) {
          get().saveEntry({ ...entry, isFavorite: !entry.isFavorite });
        }
      },
      saveTemplate: (template) => {
        set((state) => ({ templates: [...state.templates.filter(t => t.id !== template.id), template] }));
        const user = auth?.currentUser;
        if (user && db) setDoc(doc(db, `users/${user.uid}/notebookTemplates`, template.id), template, { merge: true }).catch(console.error);
      },
      deleteTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter(t => t.id !== id) }));
        const user = auth?.currentUser;
        if (user && db) deleteDoc(doc(db, `users/${user.uid}/notebookTemplates`, id)).catch(console.error);
      },
      listenToNotebook: (userId: string) => {
        if (!userId || !db) return () => {};
        
        // One-time migration of legacy Firebase collections to the new notebookEntries format
        const migrateLegacyFirebaseNotes = async () => {
          try {
            const dailySnap = await getDocs(collection(db, `users/${userId}/dailyNotes`));
            dailySnap.forEach(async (documentSnap) => {
              const n = documentSnap.data();
              const content = `<h3>Pre-Market Plan</h3><p>${n.preMarketPlan || ""}</p>
                               <h3>Intraday Notes</h3><p>${n.intradayNotes || ""}</p>
                               <h3>Post-Market Review</h3><p>${n.postMarketReview || ""}</p>
                               <p>Bias: ${n.bias} | Sleep: ${n.sleepScore}/5 | Focus: ${n.focusScore}/5 | Grade: ${n.sessionGrade}</p>`;
              const id = `daily-${n.date}`;
              const entry: NotebookEntry = {
                 id, title: `Daily Journal: ${n.date}`, content, category: "Daily Journal",
                 isFavorite: false, createdAt: n.date + "T00:00:00Z", updatedAt: n.date + "T00:00:00Z"
              };
              await setDoc(doc(db, `users/${userId}/notebookEntries`, id), entry, { merge: true });
              await deleteDoc(documentSnap.ref);
            });

            const customSnap = await getDocs(collection(db, `users/${userId}/customNotes`));
            customSnap.forEach(async (documentSnap) => {
              const cn = documentSnap.data();
              const entry: NotebookEntry = {
                  id: cn.id, title: cn.title, content: cn.content, category: cn.type === "loss-recap" ? "Trade Notes" : "All Notes",
                  isFavorite: false, createdAt: cn.date + "T00:00:00Z", updatedAt: cn.date + "T00:00:00Z"
              };
              await setDoc(doc(db, `users/${userId}/notebookEntries`, entry.id), entry, { merge: true });
              await deleteDoc(documentSnap.ref);
            });
          } catch (e) {
            console.error("Migration failed", e);
          }
        };
        migrateLegacyFirebaseNotes();

        const unsubEntries = onSnapshot(query(collection(db, `users/${userId}/notebookEntries`)), (snapshot) => {
          const cloudEntries: Record<string, NotebookEntry> = {};
          snapshot.forEach(doc => { cloudEntries[doc.id] = doc.data() as NotebookEntry; });
          
          set((state) => {
            const nextEntries = { ...state.entries };
            
            // 1. Update local state with cloud state
            for (const [id, entry] of Object.entries(cloudEntries)) {
              nextEntries[id] = entry;
            }
            
            // 2. Identify local-only entries that failed to upload, and upload them
            for (const [id, entry] of Object.entries(state.entries || {})) {
              if (!cloudEntries[id]) {
                // This entry exists locally but not in the cloud database. Push it!
                setDoc(doc(db, `users/${userId}/notebookEntries`, id), entry, { merge: true }).catch(console.error);
                nextEntries[id] = entry; // Keep it in UI while it uploads
              }
            }
            
            return { entries: nextEntries };
          });
        });
        const unsubTemplates = onSnapshot(query(collection(db, `users/${userId}/notebookTemplates`)), (snapshot) => {
          const cloudTemplates: NotebookTemplate[] = [];
          snapshot.forEach(doc => { cloudTemplates.push(doc.data() as NotebookTemplate); });
          if (cloudTemplates.length > 0) set({ templates: cloudTemplates });
        });
        return () => { unsubEntries(); unsubTemplates(); };
      }
    }),
    { 
      name: "edgevault-notebook",
      merge: (persistedState: any, currentState) => {
        if (!persistedState || typeof persistedState !== "object") return currentState;
        const state = { ...persistedState };
        
        // Migration logic
        if (!state.entries && (state.notes || state.customNotes)) {
           const newEntries: Record<string, NotebookEntry> = {};
           if (state.notes) {
              Object.values(state.notes).forEach((n: any) => {
                  const content = `<h3>Pre-Market Plan</h3><p>${n.preMarketPlan || ""}</p>
                                   <h3>Intraday Notes</h3><p>${n.intradayNotes || ""}</p>
                                   <h3>Post-Market Review</h3><p>${n.postMarketReview || ""}</p>
                                   <p>Bias: ${n.bias} | Sleep: ${n.sleepScore}/5 | Focus: ${n.focusScore}/5 | Grade: ${n.sessionGrade}</p>`;
                  const id = `daily-${n.date}`;
                  newEntries[id] = {
                     id,
                     title: `Daily Journal: ${n.date}`,
                     content,
                     category: "Daily Journal",
                     isFavorite: false,
                     createdAt: n.date + "T00:00:00Z",
                     updatedAt: n.date + "T00:00:00Z"
                  };
              });
           }
           if (state.customNotes) {
              Object.values(state.customNotes).forEach((cn: any) => {
                  newEntries[cn.id] = {
                      id: cn.id,
                      title: cn.title,
                      content: cn.content,
                      category: cn.type === "loss-recap" ? "Trade Notes" : "All Notes",
                      isFavorite: false,
                      createdAt: cn.date + "T00:00:00Z",
                      updatedAt: cn.date + "T00:00:00Z"
                  };
              });
           }
           state.entries = newEntries;
           delete state.notes;
           delete state.customNotes;
        }

        return { ...currentState, ...state };
      }
    }
  )
);

// ═══════════════════════════════
// AI Chat Store
// ═══════════════════════════════

interface AIChatStore {
  threads: AIChatThread[];
  activeThreadId: string | null;
  createThread: (title: string) => string;
  setActiveThread: (id: string | null) => void;
  addMessage: (threadId: string, message: Omit<AIChatMessage, "id" | "timestamp">) => void;
  deleteThread: (id: string) => void;
  renameThread: (id: string, title: string) => void;
}

export const useAIChatStore = create<AIChatStore>()(
  persist(
    (set, get) => ({
      threads: [],
      activeThreadId: null,
      createThread: (title) => {
        const id = generateId();
        const now = new Date().toISOString();
        const thread: AIChatThread = { id, title, messages: [], createdAt: now, updatedAt: now };
        set((s) => ({ threads: [...s.threads, thread], activeThreadId: id }));
        return id;
      },
      setActiveThread: (id) => set({ activeThreadId: id }),
      addMessage: (threadId, message) => {
        const msg: AIChatMessage = { ...message, id: generateId(), timestamp: new Date().toISOString() };
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === threadId
              ? { ...t, messages: [...t.messages, msg], updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },
      deleteThread: (id) =>
        set((s) => ({
          threads: s.threads.filter((t) => t.id !== id),
          activeThreadId: s.activeThreadId === id ? null : s.activeThreadId,
        })),
      renameThread: (id, title) =>
        set((s) => ({
          threads: s.threads.map((t) => (t.id === id ? { ...t, title } : t)),
        })),
    }),
    {
      name: "edgevault-ai-chat",
      merge: (persistedState: any, currentState) => {
        if (!persistedState || typeof persistedState !== "object") return currentState;
        return { ...currentState, ...persistedState };
      },
    }
  )
);

// ═══════════════════════════════
// Notification Store
// ═══════════════════════════════

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) => {
        const newNotif: AppNotification = {
          ...notification,
          id: generateId(),
          timestamp: new Date().toISOString(),
          read: false,
        };
        set((s) => ({ notifications: [newNotif, ...s.notifications].slice(0, 100) }));
      },
      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      deleteNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: "edgevault-notifications",
      merge: (persistedState: any, currentState) => {
        if (!persistedState || typeof persistedState !== "object") return currentState;
        return { ...currentState, ...persistedState };
      },
    }
  )
);

// ═══════════════════════════════
// Alert Rule Store
// ═══════════════════════════════

interface AlertRuleStore {
  rules: AlertRule[];
  addRule: (rule: Omit<AlertRule, "id" | "createdAt">) => void;
  updateRule: (id: string, updates: Partial<AlertRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
}

export const useAlertRuleStore = create<AlertRuleStore>()(
  persist(
    (set) => ({
      rules: [],
      addRule: (rule) => {
        const newRule: AlertRule = { ...rule, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ rules: [...s.rules, newRule] }));
      },
      updateRule: (id, updates) =>
        set((s) => ({ rules: s.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),
      deleteRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
      toggleRule: (id) =>
        set((s) => ({
          rules: s.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
        })),
    }),
    {
      name: "edgevault-alert-rules",
      merge: (persistedState: any, currentState) => {
        if (!persistedState || typeof persistedState !== "object") return currentState;
        return { ...currentState, ...persistedState };
      },
    }
  )
);

// ═══════════════════════════════
// Missed Trade Store
// ═══════════════════════════════

interface MissedTradeStore {
  missedTrades: MissedTrade[];
  addMissedTrade: (trade: Omit<MissedTrade, "id" | "createdAt">) => void;
  deleteMissedTrade: (id: string) => void;
}

export const useMissedTradeStore = create<MissedTradeStore>()(
  persist(
    (set) => ({
      missedTrades: [],
      addMissedTrade: (trade) => {
        const newTrade: MissedTrade = { ...trade, id: generateId(), createdAt: new Date().toISOString() };
        set((s) => ({ missedTrades: [...s.missedTrades, newTrade] }));
      },
      deleteMissedTrade: (id) =>
        set((s) => ({ missedTrades: s.missedTrades.filter((t) => t.id !== id) })),
    }),
    {
      name: "edgevault-missed-trades",
      merge: (persistedState: any, currentState) => {
        if (!persistedState || typeof persistedState !== "object") return currentState;
        return { ...currentState, ...persistedState };
      },
    }
  )
);
