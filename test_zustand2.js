const { create } = require('zustand');
const { persist, createJSONStorage } = require('zustand/middleware');

const memoryStorage = {
  getItem: (name) => {
    return JSON.stringify({ state: { trades: [{ id: "1", entryDate: "2024-01-01" }] }, version: 0 });
  },
  setItem: () => {},
  removeItem: () => {},
};

const useStore = create(
  persist(
    (set) => ({ trades: [], initialized: false }),
    {
      name: "edgevault-trades",
      storage: createJSONStorage(() => memoryStorage),
      merge: (persistedState, currentState) => {
        if (!persistedState) return currentState;
        const trades = Array.isArray(persistedState.trades) 
          ? persistedState.trades.filter((t) => t && t.id && t.entryDate) 
          : [];
        return { ...currentState, ...persistedState, trades };
      }
    }
  )
);

console.log("FINAL STATE:", useStore.getState());
