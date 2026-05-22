// useCursor.js
// Two responsibilities:
// 1. EMIT our cursor position to the server on mousemove
// 2. RECEIVE other users' cursor positions and update the store
//
// Cursors are stored in WORLD coordinates.
// The Cursors component converts them back to screen coords for rendering.

import { useEffect, useRef, useCallback } from 'react';
import socket from '../socket/socket';
import useRoomStore from '../store/roomStore';
import useCanvasStore from '../store/canvasStore';

// Throttle cursor emits — 30fps is plenty for cursors
// (drawing is 60fps but cursor positions don't need to be that fast)
function throttle(fn, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

export function useCursor(canvasRef) {
  const { updateCursor, removeCursor } = useRoomStore();

  // We need zoom/pan to convert screen → world for outgoing cursor
  const zoomRef = useRef(1);
  const panXRef = useRef(0);
  const panYRef = useRef(0);

  // Keep refs in sync with store
  useEffect(() => {
    // Subscribe to canvasStore changes
    const unsub = useCanvasStore.subscribe((state) => {
      zoomRef.current = state.zoom;
      panXRef.current = state.panX;
      panYRef.current = state.panY;
    });
    return unsub;
  }, []);

  // Convert screen position to world position
  const screenToWorld = useCallback((sx, sy) => ({
    x: (sx - panXRef.current) / zoomRef.current,
    y: (sy - panYRef.current) / zoomRef.current,
  }), []);

  // Throttled emit function
  const emitCursor = useRef(
    throttle((worldPos) => {
      socket.emit('cursor-move', worldPos);
    }, 33) // ~30fps
  ).current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Track our own mouse and emit world position
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldPos = screenToWorld(screenX, screenY);
      emitCursor(worldPos);
    };

    // Listen for other users' cursor updates
    const handleCursorUpdated = ({ userId, username, x, y }) => {
      updateCursor(userId, { x, y, username });
    };

    // Listen for cursor removal (user left)
    const handleCursorRemoved = ({ userId }) => {
      removeCursor(userId);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    socket.on('cursor-updated', handleCursorUpdated);
    socket.on('cursor-removed', handleCursorRemoved);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      socket.off('cursor-updated', handleCursorUpdated);
      socket.off('cursor-removed', handleCursorRemoved);
    };
  }, [canvasRef, screenToWorld, updateCursor, removeCursor, emitCursor]);
}