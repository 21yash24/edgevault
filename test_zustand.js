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
    (set) => ({ trades: [] }),
    {
      name: "edgevault-trades",
      storage: createJSONStorage(() => memoryStorage),
      merge: (persistedState, currentState) => {
        console.log("persistedState passed to merge:", persistedState);
        return { ...currentState, ...persistedState };
      }
    }
  )
);

useStore.getState();
