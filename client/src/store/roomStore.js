// roomStore.js
// Zustand is a minimal state manager. Think of it as useState 
// but accessible from ANY component without prop drilling.
// The pattern: create a store with state + actions, use it anywhere.

import { create } from 'zustand';

const useRoomStore = create((set) => ({
  // State
  roomId: null,
  username: '',
  users: [],          // Other users in this room
  isConnected: false,

  // Actions — functions that update state
  setRoom: (roomId) => set({ roomId }),
  setUsername: (username) => set({ username }),
  setConnected: (isConnected) => set({ isConnected }),
  
  addUser: (user) => set((state) => ({
    // Avoid duplicates by filtering first
    users: [...state.users.filter(u => u.userId !== user.userId), user]
  })),
  
  removeUser: (userId) => set((state) => ({
    users: state.users.filter(u => u.userId !== userId)
  })),
  
  setUsers: (users) => set({ users }),
  
  reset: () => set({ roomId: null, users: [], isConnected: false }),
}));

export default useRoomStore;