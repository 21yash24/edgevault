const currentState = { trades: [], initialized: false };
const persistedState = { trades: [{ id: "1", entryDate: "2024" }] };

const merge = (persistedState, currentState) => {
  if (!persistedState) return currentState;
  const trades = Array.isArray(persistedState.trades) 
    ? persistedState.trades.filter(t => t && t.id && t.entryDate) 
    : [];
  return { ...currentState, ...persistedState, trades };
};

console.log(merge(persistedState, currentState));
