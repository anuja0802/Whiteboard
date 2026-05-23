// objectsStore.js
// Stores all whiteboard objects: sticky notes, shapes, arrows.
// Each object has a unique id, type, position in world coords,
// and type-specific properties.
//
// Object schema:
// {
//   id: 'uuid',
//   type: 'sticky' | 'rect' | 'circle' | 'arrow',
//   x: number,      // world x
//   y: number,      // world y
//   width: number,  // world width
//   height: number, // world height
//   // sticky specific:
//   text: string,
//   bgColor: string,
//   // shape specific:
//   strokeColor: string,
//   fillColor: string,
//   // arrow specific:
//   x2: number, y2: number,
// }

import { create } from 'zustand';

// Simple unique ID generator
// In production use nanoid: npm install nanoid
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const useObjectsStore = create((set, get) => ({
  objects: {},      // keyed by id for O(1) lookup and update
  selectedId: null, // currently selected object id

  // Add a new object
  addObject: (obj) => {
    const id = obj.id || generateId();
    const newObj = { ...obj, id };
    set((state) => ({
      objects: { ...state.objects, [id]: newObj },
    }));
    return newObj;
  },

  // Update any properties of an existing object
  updateObject: (id, updates) => set((state) => ({
    objects: {
      ...state.objects,
      [id]: { ...state.objects[id], ...updates },
    },
  })),

  // Remove an object
  removeObject: (id) => set((state) => {
    const newObjects = { ...state.objects };
    delete newObjects[id];
    return { objects: newObjects, selectedId: null };
  }),

  // Selection
  setSelected: (id) => set({ selectedId: id }),
  clearSelected: () => set({ selectedId: null }),

  // Replace all objects (used when joining a room with existing state)
  setObjects: (objects) => set({ objects }),

  // Clear everything
  clearObjects: () => set({ objects: {}, selectedId: null }),
}));

export default useObjectsStore;