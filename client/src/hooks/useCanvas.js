// useCanvas.js - Updated for Phase 3 realtime sync

import { useRef, useEffect, useCallback } from 'react';
import useCanvasStore from '../store/canvasStore';
import socket from '../socket/socket';

// Throttle helper: limits how often a function can fire
// WHY: mousemove fires 100+ times/sec. We only need ~60fps max.
// Without throttling we'd send hundreds of socket events per second
// which would lag everyone in the room.
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

export function useCanvas() {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);
  const { tool, color, brushSize } = useCanvasStore();

  // Store tool/color/brushSize in refs so the socket listener
  // always has the latest values without needing to re-register
  // WHY refs here? The socket.on callback is registered once in useEffect.
  // If we used the variables directly, the callback would close over
  // the initial values and never see updates (stale closure bug).
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const brushSizeRef = useRef(brushSize);

  // Keep refs in sync with store values
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  }, []);

  // Setup canvas size and background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const handleResize = () => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // drawSegment: the core function that paints one line segment
  // Used for BOTH local drawing and rendering remote strokes
  // WHY one function for both? DRY principle — same canvas API calls
  // whether it's your stroke or someone else's
  const drawSegment = useCallback((ctx, x0, y0, x1, y1, strokeColor, size, strokeTool) => {
    ctx.lineWidth = strokeTool === 'eraser' ? size * 3 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeTool === 'eraser' ? '#111111' : strokeColor;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }, []);

  // Listen for remote strokes from other users
  // This useEffect registers socket listeners ONCE on mount
  useEffect(() => {
    // 'stroke-received': another user drew a segment, render it
    // In the handleRemoteStroke listener:
    const handleRemoteStroke = (data) => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Convert percentages back to this screen's pixel coordinates
    drawSegment(
        ctx,
        data.x0 * canvas.width,   // 0.5 * 1400 = 700px on Bob's screen
        data.y0 * canvas.height,
        data.x1 * canvas.width,
        data.y1 * canvas.height,
        data.color,
        data.brushSize,
        data.tool
    );
    };

    // 'canvas-cleared': another user cleared the canvas
    const handleRemoteClear = () => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!ctx || !canvas) return;
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('stroke-received', handleRemoteStroke);
    socket.on('canvas-cleared', handleRemoteClear);

    // Cleanup listeners on unmount
    return () => {
      socket.off('stroke-received', handleRemoteStroke);
      socket.off('canvas-cleared', handleRemoteClear);
    };
  }, [getCtx, drawSegment]);

  const getCanvasPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  // Throttled emit — max once per 16ms (60fps)
  // useRef so it persists across renders without recreating
  const emitStroke = useRef(
    throttle((strokeData) => {
      socket.emit('draw-stroke', strokeData);
    }, 8)
  ).current;

  const startDrawing = useCallback((e) => {
    const ctx = getCtx();
    if (!ctx) return;

    isDrawing.current = true;
    const point = getCanvasPoint(e);
    lastPoint.current = point;

    // Draw click dot
    ctx.beginPath();
    ctx.arc(point.x, point.y, brushSizeRef.current / 2, 0, Math.PI * 2);
    ctx.fillStyle = toolRef.current === 'eraser' ? '#111111' : colorRef.current;
    ctx.fill();
  }, [getCtx, getCanvasPoint]);

  const draw = useCallback((e) => {
    if (!isDrawing.current) return;
    const ctx = getCtx();
    if (!ctx) return;

    const currentPoint = getCanvasPoint(e);
    const prev = lastPoint.current;

    // 1. Draw locally for instant feedback (no waiting for server)
    drawSegment(
      ctx,
      prev.x, prev.y,
      currentPoint.x, currentPoint.y,
      colorRef.current,
      brushSizeRef.current,
      toolRef.current
    );

    // 2. Emit to server (throttled) so others see it too
    // We send all the data needed to reproduce this segment
    // In the draw() function, update emitStroke call:
    const canvas = canvasRef.current;
    emitStroke({
    // Send as percentage of canvas size (0 to 1)
    // So a point at x=500 on a 1000px wide screen = 0.5
    // Bob's canvas at 1400px wide will draw at x=700 — correct!
        x0: prev.x / canvas.width,
        y0: prev.y / canvas.height,
        x1: currentPoint.x / canvas.width,
        y1: currentPoint.y / canvas.height,
        color: colorRef.current,
        brushSize: brushSizeRef.current,
        tool: toolRef.current,
    });

    lastPoint.current = currentPoint;
  }, [getCtx, getCanvasPoint, drawSegment, emitStroke]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    lastPoint.current = null;
    const ctx = getCtx();
    if (ctx) ctx.closePath();
  }, [getCtx]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Tell everyone else to clear too
    socket.emit('clear-canvas');
  }, [getCtx]);

  return {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
  };
}