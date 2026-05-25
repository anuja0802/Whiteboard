import { create } from 'zustand';

const useCanvasStore = create((set, get) => ({
  // Tool settings
  tool: 'pen',
  color: '#ffffff',
  brushSize: 4,

  // ── Infinite canvas state ──
  // zoom: 1.0 = 100%, 0.5 = zoomed out, 2.0 = zoomed in
  zoom: 1,
  // panX/panY: how many pixels the world origin is offset from screen origin
  panX: 0,
  panY: 0,

  // All strokes stored in WORLD coordinates
  // Each stroke = { points: [{x,y}], color, brushSize, tool }
  strokes: [],

  // Currently-being-drawn stroke (not yet committed)
  currentStroke: null,

  // Actions
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (size) => set({ brushSize: size }),

  setZoom: (zoom) => set({ zoom: Math.min(Math.max(zoom, 0.05), 20) }),
  setPan: (panX, panY) => set({ panX, panY }),

  // Add a completed stroke to the permanent list
  addStroke: (stroke) => set((state) => ({
    strokes: [...state.strokes, stroke],
    currentStroke: null,
  })),

  // Remove stroke by id — used for undo
  undoStroke: (strokeId) => set((state) => ({
    strokes: state.strokes.filter(s => s.id !== strokeId),
  })),

  setCurrentStroke: (stroke) => set({ currentStroke: stroke }),

  clearStrokes: () => set({ strokes: [], currentStroke: null }),
}));

export default useCanvasStore;