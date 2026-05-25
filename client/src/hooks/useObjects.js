import { useCallback, useEffect, useRef } from 'react';
import socket from '../socket/socket';
import useObjectsStore from '../store/objectsStore';
import useCanvasStore from '../store/canvasStore';
import useHistoryStore from '../store/historyStore';

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
    clearSelected,
  } = useObjectsStore();

  const { zoom, panX, panY } = useCanvasStore();

  const screenToWorld = useCallback((sx, sy) => ({
    x: (sx - panX) / zoom,
    y: (sy - panY) / zoom,
  }), [zoom, panX, panY]);

  // SOCKET LISTENERS
  useEffect(() => {
    const handleObjectAdded = (obj) => addObject(obj);
    const handleObjectUpdated = ({ id, updates }) => updateObject(id, updates);
    const handleObjectRemoved = ({ id }) => removeObject(id);
    const handleObjectsCleared = () => clearObjects();
    const handleRoomObjects = (existingObjects) => setObjects(existingObjects || {});
    const handleBoardState = ({ objects }) => setObjects(objects || {});

    socket.on('object-added', handleObjectAdded);
    socket.on('object-updated', handleObjectUpdated);
    socket.on('object-removed', handleObjectRemoved);
    socket.on('objects-cleared', handleObjectsCleared);
    socket.on('room-objects', handleRoomObjects);
    socket.on('board-state', handleBoardState);

    return () => {
      socket.off('object-added', handleObjectAdded);
      socket.off('object-updated', handleObjectUpdated);
      socket.off('object-removed', handleObjectRemoved);
      socket.off('objects-cleared', handleObjectsCleared);
      socket.off('room-objects', handleRoomObjects);
      socket.off('board-state', handleBoardState);
    };
  }, [addObject, updateObject, removeObject, clearObjects, setObjects]);

  const debouncedEmit = useRef(
    debounce((id, updates) => {
      socket.emit('object-update', { id, updates });
    }, 100)
  ).current;

  // CREATE STICKY NOTE
  const createStickyNote = useCallback((screenX, screenY) => {
    const worldPos = screenToWorld(screenX, screenY);
    const obj = {
      type: 'sticky',
      x: worldPos.x - 100, // center horizontally on click
      y: worldPos.y - 60,  // center vertically on click
      width: 200,
      height: 150,
      text: '',
      bgColor: '#fbbf24',
    };
    const created = addObject(obj);
    socket.emit('object-add', created);
    useHistoryStore.getState().push({ type: 'object-add', object: created });
    return created;
  }, [addObject, screenToWorld]);

  // CREATE SHAPE
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

    useHistoryStore.getState().push({
      type: 'object-add',
      object: created,
    });

    return created;
  }, [addObject, screenToWorld]);

  // CREATE ARROW
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

    useHistoryStore.getState().push({
      type: 'object-add',
      object: created,
    });

    return created;
  }, [addObject, screenToWorld]);

  // UPDATE OBJECT
  const updateAndBroadcast = useCallback((id, updates) => {
    updateObject(id, updates);
    debouncedEmit(id, updates);
  }, [updateObject, debouncedEmit]);

  // REMOVE OBJECT
  const removeAndBroadcast = useCallback((id) => {
    const obj = useObjectsStore.getState().objects[id];

    clearSelected();

    removeObject(id);

    socket.emit('object-remove', { id });

    if (obj) {
      useHistoryStore.getState().push({
        type: 'object-remove',
        object: obj,
      });
    }
  }, [removeObject, clearSelected]);

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