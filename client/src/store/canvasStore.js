// canvasStore.js
// All brush/tool settings live here.
// Any component can read or update these without prop drilling.

import { create } from 'zustand';

const useCanvasStore = create((set) => ({
  // Current active tool
  tool: 'pen',          // 'pen' | 'eraser'
  
  // Brush settings
  color: '#ffffff',     // Default white on dark canvas
  brushSize: 4,         // Stroke width in pixels
  
  // Canvas history for undo/redo (Phase 9)
  // We store it here so it's accessible from anywhere
  history: [],
  historyIndex: -1,

  // Actions
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (size) => set({ brushSize: size }),
  
  // We'll use these in Phase 9
  pushHistory: (imageData) => set((state) => ({
    history: [...state.history.slice(0, state.historyIndex + 1), imageData],
    historyIndex: state.historyIndex + 1,
  })),
}));

export default useCanvasStore;