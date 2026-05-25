import { create } from 'zustand';

const MAX_HISTORY = 50;

const useHistoryStore = create((set, get) => ({
  past: [],
  future: [],

  push: (command) => {
    set((state) => ({
      past: [...state.past, command].slice(-MAX_HISTORY),
      future: [],
    }));
  },

  popPast: () => {
    const { past, future } = get();
    if (past.length === 0) return null;
    const command = past[past.length - 1];
    set({ past: past.slice(0, -1), future: [command, ...future] });
    return command;
  },

  popFuture: () => {
    const { past, future } = get();
    if (future.length === 0) return null;
    const command = future[0];
    set({ past: [...past, command], future: future.slice(1) });
    return command;
  },

  clearHistory: () => set({ past: [], future: [] }),
}));

export default useHistoryStore;