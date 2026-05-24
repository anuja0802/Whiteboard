import { useCallback, useEffect, useRef } from 'react';
import socket from '../socket/socket';
import useObjectsStore from '../store/objectsStore';
import useCanvasStore from '../store/canvasStore';

// Debounce per object id — each object gets its own timer
function debounce(fn, delay) {
  const timers = {};
  return (id, ...args) => {
    clearTimeout(timers[id]);
    timers[id] = setTimeout(() => {
      fn(id, ...args);
      delete timers[id];
    }, delay);
  };
}

export function useObjects() {
  const {
    objects,
    addObject,
    updateObject,
    removeObject,
    clearObjects,
    setObjects,
  } = useObjectsStore();

  const { zoom, panX, panY } = useCanvasStore();

  const screenToWorld = useCallback((sx, sy) => ({
    x: (sx - panX) / zoom,
    y: (sy - panY) / zoom,
  }), [zoom, panX, panY]);

  // Socket listeners
  useEffect(() => {
    socket.on('object-added', (obj) => addObject(obj));
    socket.on('object-updated', ({ id, updates }) => updateObject(id, updates));
    socket.on('object-removed', ({ id }) => removeObject(id));
    socket.on('objects-cleared', () => clearObjects());
    socket.on('room-objects', (existingObjects) => setObjects(existingObjects));

    const handleBoardState = ({ objects }) => {
      if (objects && Object.keys(objects).length > 0) {
        setObjects(objects);
      }
    };
    socket.on('board-state', handleBoardState);

    return () => {
      socket.off('object-added');
      socket.off('object-updated');
      socket.off('object-removed');
      socket.off('objects-cleared');
      socket.off('room-objects');
      socket.off('board-state', handleBoardState);
    };
  }, [addObject, updateObject, removeObject, clearObjects, setObjects]);

  // Debounced emit — sends updates to server at most every 100ms per object
  // This prevents flooding the server during drag operations
  const debouncedEmit = useRef(
    debounce((id, updates) => {
      socket.emit('object-update', { id, updates });
    }, 100)
  ).current;

  // Create sticky note
  const createStickyNote = useCallback((screenX, screenY) => {
    const worldPos = screenToWorld(screenX, screenY);
    const obj = {
      type: 'sticky',
      x: worldPos.x - 100,
      y: worldPos.y - 60,
      width: 200,
      height: 150,
      text: '',
      bgColor: '#fbbf24',
    };
    const created = addObject(obj);
    socket.emit('object-add', created);
    return created;
  }, [addObject, screenToWorld]);

  // Create shape
  const createShape = useCallback((type, screenX, screenY) => {
    const worldPos = screenToWorld(screenX, screenY);
    const obj = {
      type,
      x: worldPos.x - 60,
      y: worldPos.y - 40,
      width: 120,
      height: 80,
      strokeColor: '#60a5fa',
      fillColor: 'rgba(96,165,250,0.1)',
      label: '',
    };
    const created = addObject(obj);
    socket.emit('object-add', created);
    return created;
  }, [addObject, screenToWorld]);

  // Create arrow
  const createArrow = useCallback((screenX, screenY) => {
    const worldPos = screenToWorld(screenX, screenY);
    const obj = {
      type: 'arrow',
      x: worldPos.x,
      y: worldPos.y,
      x2: worldPos.x + 120,
      y2: worldPos.y,
      strokeColor: '#f87171',
    };
    const created = addObject(obj);
    socket.emit('object-add', created);
    return created;
  }, [addObject, screenToWorld]);

  // Update locally immediately + debounced server emit
  const updateAndBroadcast = useCallback((id, updates) => {
    updateObject(id, updates);       // instant local update
    debouncedEmit(id, updates);      // debounced server sync
  }, [updateObject, debouncedEmit]);

  // Delete immediately — no debounce needed
  const removeAndBroadcast = useCallback((id) => {
    removeObject(id);
    socket.emit('object-remove', { id });
  }, [removeObject]);

  return {
    objects,
    createStickyNote,
    createShape,
    createArrow,
    updateAndBroadcast,
    removeAndBroadcast,
    screenToWorld,
  };
}