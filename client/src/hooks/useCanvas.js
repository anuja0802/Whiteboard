// useCanvas.js — Phase 4: Infinite Canvas
// Big architecture change: we now store strokes in world coords
// and use ctx.setTransform() to render everything in screen space.

import { useRef, useEffect, useCallback } from 'react';
import useCanvasStore from '../store/canvasStore';
import socket from '../socket/socket';

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
  const animFrameRef = useRef(null);

  const {
    tool, color, brushSize,
    zoom, panX, panY,
    strokes, currentStroke,
    addStroke, setCurrentStroke,
    clearStrokes,
  } = useCanvasStore();

  // Refs for event handlers (avoid stale closures)
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const brushSizeRef = useRef(brushSize);
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);
  const strokesRef = useRef(strokes);
  const currentStrokeRef = useRef(currentStroke);

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panXRef.current = panX; }, [panX]);
  useEffect(() => { panYRef.current = panY; }, [panY]);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);
  useEffect(() => { currentStrokeRef.current = currentStroke; }, [currentStroke]);

  // Convert screen coordinates to world coordinates
  // This is used when the user clicks/drags — we store in world space
  const screenToWorld = useCallback((sx, sy) => {
    return {
      x: (sx - panXRef.current) / zoomRef.current,
      y: (sy - panYRef.current) / zoomRef.current,
    };
  }, []);

  // Get mouse position relative to canvas
  const getCanvasPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return screenToWorld(clientX - rect.left, clientY - rect.top);
  }, [screenToWorld]);

  // drawStroke: renders ONE stroke onto the canvas using current transform
  // ctx already has setTransform applied, so we draw in world coords
  const drawStroke = useCallback((ctx, stroke) => {
    if (!stroke.points || stroke.points.length < 2) return;

    ctx.lineWidth = stroke.tool === 'eraser'
      ? stroke.brushSize * 3
      : stroke.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#111111' : stroke.color;

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      // Smooth with midpoint quadratic curve
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    ctx.stroke();
  }, []);

  // THE RENDER LOOP
  // Every time zoom/pan/strokes change, we redraw everything.
  // This is the core of the infinite canvas — clear then redraw with transform.
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1. Clear entire canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw grid (gives sense of infinite space)
    drawGrid(ctx, canvas.width, canvas.height,
      panXRef.current, panYRef.current, zoomRef.current);

    // 3. Apply zoom + pan transform ONCE
    // All subsequent drawing happens in world coordinates
    ctx.setTransform(
      zoomRef.current, 0,
      0, zoomRef.current,
      panXRef.current, panYRef.current
    );

    // 4. Draw all committed strokes
    strokesRef.current.forEach(stroke => drawStroke(ctx, stroke));

    // 5. Draw the current in-progress stroke
    if (currentStrokeRef.current) {
      drawStroke(ctx, currentStrokeRef.current);
    }
  }, [drawStroke]);

  // Draw a subtle dot grid — gives sense of space and scale
  function drawGrid(ctx, width, height, panX, panY, zoom) {
    const gridSize = 40; // world units between dots
    const dotSize = 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Calculate which grid lines are visible
    const startX = Math.floor(-panX / zoom / gridSize) * gridSize;
    const startY = Math.floor(-panY / zoom / gridSize) * gridSize;
    const endX = Math.ceil((width - panX) / zoom / gridSize) * gridSize;
    const endY = Math.ceil((height - panY) / zoom / gridSize) * gridSize;

    ctx.fillStyle = 'rgba(255,255,255,0.12)';

    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        // Convert world to screen
        const sx = x * zoom + panX;
        const sy = y * zoom + panY;
        ctx.beginPath();
        ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Re-render whenever state changes
  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [zoom, panX, panY, strokes, currentStroke, render]);

  // Canvas size setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      render();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Socket: receive remote strokes
  useEffect(() => {
    const handleRemoteStroke = (stroke) => {
      // Remote strokes come in world coords already — just add them
      useCanvasStore.getState().addStroke(stroke);
    };

    const handleRemoteClear = () => {
      clearStrokes();
    };

    socket.on('stroke-received', handleRemoteStroke);
    socket.on('canvas-cleared', handleRemoteClear);

    return () => {
      socket.off('stroke-received', handleRemoteStroke);
      socket.off('canvas-cleared', handleRemoteClear);
    };
  }, [clearStrokes]);

  // Throttled socket emit for current stroke updates
  const emitStroke = useRef(
    throttle((stroke) => {
      socket.emit('draw-stroke', stroke);
    }, 16)
  ).current;

  // ── Drawing event handlers ──

  const startDrawing = useCallback((e) => {
    // Don't draw when middle-mouse panning
    if (e.button === 1) return;

    isDrawing.current = true;
    const point = getCanvasPoint(e);
    lastPoint.current = point;

    // Start new stroke in world coordinates
    const newStroke = {
      points: [point],
      color: colorRef.current,
      brushSize: brushSizeRef.current,
      tool: toolRef.current,
    };
    setCurrentStroke(newStroke);
  }, [getCanvasPoint, setCurrentStroke]);

  const draw = useCallback((e) => {
    if (!isDrawing.current) return;

    const point = getCanvasPoint(e);
    const current = currentStrokeRef.current;
    if (!current) return;

    // Append point to current stroke
    const updatedStroke = {
      ...current,
      points: [...current.points, point],
    };
    setCurrentStroke(updatedStroke);

    // Emit to server for realtime sync
    emitStroke(updatedStroke);

    lastPoint.current = point;
  }, [getCanvasPoint, setCurrentStroke, emitStroke]);

  const stopDrawing = useCallback((e) => {
    if (e && e.button === 1) return;
    if (!isDrawing.current) return;

    isDrawing.current = false;

    const current = currentStrokeRef.current;
    if (current && current.points.length > 0) {
      // Commit the stroke to permanent storage
      addStroke(current);
    }

    lastPoint.current = null;
  }, [addStroke]);

  const clearCanvas = useCallback(() => {
    clearStrokes();
    socket.emit('clear-canvas');
  }, [clearStrokes]);

  return {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
  };
}