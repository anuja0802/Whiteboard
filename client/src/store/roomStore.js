// roomStore.js — updated with cursor tracking
import { create } from 'zustand';

const useRoomStore = create((set) => ({
  // Existing state
  roomId: null,
  username: '',
  users: [],
  isConnected: false,

  // NEW: cursor positions keyed by userId
  // { userId: { x, y, username } }
  cursors: {},

  // Existing actions
  setRoom: (roomId) => set({ roomId }),
  setUsername: (username) => set({ username }),
  setConnected: (isConnected) => set({ isConnected }),

  addUser: (user) => set((state) => ({
    users: [...state.users.filter(u => u.userId !== user.userId), user],
  })),

  removeUser: (userId) => set((state) => ({
    users: state.users.filter(u => u.userId !== userId),
    // Also remove their cursor when they leave
    cursors: Object.fromEntries(
      Object.entries(state.cursors).filter(([id]) => id !== userId)
    ),
  })),

  setUsers: (users) => set({ users }),

  // NEW cursor actions
  updateCursor: (userId, cursorData) => set((state) => ({
    cursors: {
      ...state.cursors,
      [userId]: cursorData,
    },
  })),

  removeCursor: (userId) => set((state) => {
    const newCursors = { ...state.cursors };
    delete newCursors[userId];
    return { cursors: newCursors };
  }),

  reset: () => set({
    roomId: null,
    users: [],
    isConnected: false,
    cursors: {},
  }),
}));

export default useRoomStore;