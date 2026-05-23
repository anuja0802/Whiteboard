// useObjects.js
// Handles all object operations and syncs them via Socket.IO.
// Pattern: optimistic update (local first) then broadcast.

import { useCallback, useEffect } from 'react';
import socket from '../socket/socket';
import useObjectsStore from '../store/objectsStore';
import useCanvasStore from '../store/canvasStore';

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

  // Convert screen coords to world coords
  // Needed when user clicks to place a new object
  const screenToWorld = useCallback((sx, sy) => ({
    x: (sx - panX) / zoom,
    y: (sy - panY) / zoom,
  }), [zoom, panX, panY]);

  // Listen for remote object events
  useEffect(() => {
    // Another user added an object
    socket.on('object-added', (obj) => {
      addObject(obj);
    });

    // Another user moved/resized/edited an object
    socket.on('object-updated', ({ id, updates }) => {
      updateObject(id, updates);
    });

    // Another user deleted an object
    socket.on('object-removed', ({ id }) => {
      removeObject(id);
    });

    // Someone cleared the board
    socket.on('objects-cleared', () => {
      clearObjects();
    });

    // When joining a room that has existing objects
    socket.on('room-objects', (existingObjects) => {
      setObjects(existingObjects);
    });

    return () => {
      socket.off('object-added');
      socket.off('object-updated');
      socket.off('object-removed');
      socket.off('objects-cleared');
      socket.off('room-objects');
    };
  }, [addObject, updateObject, removeObject, clearObjects, setObjects]);

  // Create and broadcast a new sticky note
  const createStickyNote = useCallback((screenX, screenY) => {
    const worldPos = screenToWorld(screenX, screenY);
    const obj = {
      type: 'sticky',
      x: worldPos.x - 100, // center on click
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

  // Create and broadcast a shape
  const createShape = useCallback((type, screenX, screenY) => {
    const worldPos = screenToWorld(screenX, screenY);
    const obj = {
      type, // 'rect' or 'circle'
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

  // Create an arrow
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

  // Update and broadcast object changes (move, resize, edit)
  const updateAndBroadcast = useCallback((id, updates) => {
    updateObject(id, updates);
    socket.emit('object-update', { id, updates });
  }, [updateObject]);

  // Delete and broadcast
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