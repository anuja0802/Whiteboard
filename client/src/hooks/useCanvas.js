import { useRef, useEffect, useCallback } from 'react';
import useCanvasStore from '../store/canvasStore';
import socket from '../socket/socket';
import useHistoryStore from '../store/historyStore';

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

  // Track remote users' last points for smooth segment drawing
  // { userId: { x, y } }
  const remoteLastPoints = useRef({});

  const {
    tool, color, brushSize,
    zoom, panX, panY,
    strokes, currentStroke,
    addStroke, setCurrentStroke,
    clearStrokes,
  } = useCanvasStore();

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

  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext('2d') || null;
  }, []);

  const screenToWorld = useCallback((sx, sy) => ({
    x: (sx - panXRef.current) / zoomRef.current,
    y: (sy - panYRef.current) / zoomRef.current,
  }), []);

  const getCanvasPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return screenToWorld(clientX - rect.left, clientY - rect.top);
  }, [screenToWorld]);

  // Draw a single segment directly on canvas
  // Used for BOTH local active drawing and incoming remote segments
  // This bypasses React state entirely — direct imperative draw
  const drawSegmentDirect = useCallback((ctx, x0, y0, x1, y1,
    strokeColor, size, strokeTool) => {
    ctx.lineWidth = strokeTool === 'eraser' ? size * 3 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeTool === 'eraser' ? '#111111' : strokeColor;

    ctx.save();
    // Apply current zoom/pan transform so world coords render correctly
    ctx.setTransform(
      zoomRef.current, 0, 0,
      zoomRef.current,
      panXRef.current, panYRef.current
    );

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    ctx.quadraticCurveTo(x0, y0, midX, midY);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.restore();
  }, []);

  // Full redraw — only called when zoom/pan changes or stroke committed
  // NOT called on every mousemove
  const drawStroke = useCallback((ctx, stroke) => {
    if (!stroke.points || stroke.points.length < 2) return;

    ctx.lineWidth = stroke.tool === 'eraser'
      ? stroke.brushSize * 3
      : stroke.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.tool === 'eraser'
      ? '#111111'
      : stroke.color;

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    ctx.stroke();
  }, []);

  function drawGrid(ctx, width, height, panX, panY, zoom) {
    const gridSize = 40;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const startX = Math.floor(-panX / zoom / gridSize) * gridSize;
    const startY = Math.floor(-panY / zoom / gridSize) * gridSize;
    const endX = Math.ceil((width - panX) / zoom / gridSize) * gridSize;
    const endY = Math.ceil((height - panY) / zoom / gridSize) * gridSize;

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let x = startX; x <= endX; x += gridSize) {
      for (let y = startY; y <= endY; y += gridSize) {
        const sx = x * zoom + panX;
        const sy = y * zoom + panY;
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Full render — only triggered by zoom/pan/committed strokes
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid(ctx, canvas.width, canvas.height,
      panXRef.current, panYRef.current, zoomRef.current);

    ctx.setTransform(
      zoomRef.current, 0, 0,
      zoomRef.current,
      panXRef.current, panYRef.current
    );

    strokesRef.current.forEach(stroke => drawStroke(ctx, stroke));
  }, [drawStroke]);

  // Re-render only when zoom/pan/committed strokes change
  // NOT on currentStroke — that's drawn directly
  useEffect(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [zoom, panX, panY, strokes, render]);

  // Canvas resize
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

  // ── SOCKET LISTENERS ──
useEffect(() => {
    const handleRemoteSegment = (data) => {
      const ctx = getCtx();
      if (!ctx) return;
      const userId = data.userId;

      if (data.type === 'start') {
        remoteLastPoints.current[userId] = { x: data.x, y: data.y };
        return;
      }
      if (data.type === 'move') {
        const last = remoteLastPoints.current[userId];
        if (!last) return;
        drawSegmentDirect(ctx, last.x, last.y, data.x, data.y,
          data.color, data.brushSize, data.tool);
        remoteLastPoints.current[userId] = { x: data.x, y: data.y };
      }
      if (data.type === 'end') {
        if (data.stroke) {
          useCanvasStore.getState().addStroke(data.stroke);
        }
        delete remoteLastPoints.current[userId];
      }
    };

    const handleRemoteClear = () => {
      clearStrokes();
      remoteLastPoints.current = {};
    };

    // NEW: load saved board state when joining a room
    const handleBoardState = ({ strokes }) => {
      if (!strokes || strokes.length === 0) return;
      // Add all saved strokes to the store
      // The render loop will draw them automatically
      useCanvasStore.setState({ strokes });
    };

    socket.on('stroke-received', handleRemoteSegment);
    socket.on('canvas-cleared', handleRemoteClear);
    socket.on('board-state', handleBoardState); // NEW

    return () => {
      socket.off('stroke-received', handleRemoteSegment);
      socket.off('canvas-cleared', handleRemoteClear);
      socket.off('board-state', handleBoardState); // NEW
    };
  }, [getCtx, drawSegmentDirect, clearStrokes]);

  // Throttled emit — send segments as they happen
  const emitSegment = useRef(
    throttle((data) => {
      socket.emit('draw-stroke', data);
    }, 16) // 60fps max
  ).current;

  // ── DRAWING HANDLERS ──

  const startDrawing = useCallback((e) => {
  if (e.button === 1) return;

  // Don't start drawing if using object placement tools
  const currentTool = toolRef.current;
  if (currentTool === 'sticky' || currentTool === 'rect' || 
      currentTool === 'circle' || currentTool === 'arrow' || 
      currentTool === 'select') return;

  isDrawing.current = true;
  const point = getCanvasPoint(e);
  lastPoint.current = point;

  setCurrentStroke({
    id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    points: [point],
    color: colorRef.current,
    brushSize: brushSizeRef.current,
    tool: toolRef.current,
  });

  emitSegment({
    type: 'start',
    x: point.x,
    y: point.y,
    userId: socket.id,
    color: colorRef.current,
    brushSize: brushSizeRef.current,
    tool: toolRef.current,
  });
}, [getCanvasPoint, setCurrentStroke, emitSegment]);

  const draw = useCallback((e) => {
    if (!isDrawing.current) return;
    const ctx = getCtx();
    if (!ctx) return;

    const point = getCanvasPoint(e);
    const prev = lastPoint.current;
    if (!prev) return;

    // 1. Draw locally IMMEDIATELY — no state, pure canvas API
    drawSegmentDirect(
      ctx,
      prev.x, prev.y,
      point.x, point.y,
      colorRef.current,
      brushSizeRef.current,
      toolRef.current
    );

    // 2. Accumulate points in store for persistence
    const current = currentStrokeRef.current;
    if (current) {
      // Update store silently — don't trigger re-render
      currentStrokeRef.current = {
        ...current,
        points: [...current.points, point],
      };
      useCanvasStore.setState({ currentStroke: currentStrokeRef.current });
    }

    // 3. Emit segment to server (throttled)
    emitSegment({
      type: 'move',
      x: point.x,
      y: point.y,
      userId: socket.id,
      color: colorRef.current,
      brushSize: brushSizeRef.current,
      tool: toolRef.current,
    });

    lastPoint.current = point;
  }, [getCtx, getCanvasPoint, drawSegmentDirect, emitSegment]);

  const stopDrawing = useCallback((e) => {
  if (e?.button === 1) return;
  if (!isDrawing.current) return;

  // Don't process if using object tools
  const currentTool = toolRef.current;
  if (currentTool === 'sticky' || currentTool === 'rect' ||
      currentTool === 'circle' || currentTool === 'arrow' ||
      currentTool === 'select') return;

  isDrawing.current = false;

  const current = currentStrokeRef.current;
  if (current?.points?.length > 0) {
    addStroke(current);
    useHistoryStore.getState().push({ type: 'stroke-add', stroke: current });
    socket.emit('draw-stroke', { type: 'end', userId: socket.id, stroke: current });
  }

  lastPoint.current = null;
  setCurrentStroke(null);
}, [addStroke, setCurrentStroke]);

  const clearCanvas = useCallback(() => {
    clearStrokes();
    remoteLastPoints.current = {};
    socket.emit('clear-canvas');
  }, [clearStrokes]);

  return { canvasRef, startDrawing, draw, stopDrawing, clearCanvas };
}