// usePanZoom.js
// Handles three types of navigation input:
// 1. Scroll wheel → zoom in/out
// 2. Middle mouse button drag → pan
// 3. Two-finger trackpad → pan + zoom
//
// IMPORTANT: We zoom toward the cursor position, not the center.
// This is how Figma/Miro work and feels natural.
// The math: when zooming in, we want the point under the cursor
// to stay under the cursor. That requires adjusting panX/panY.

import { useEffect, useRef, useCallback } from 'react';
import useCanvasStore from '../store/canvasStore';

export function usePanZoom(canvasRef) {
  const { zoom, panX, panY, setZoom, setPan } = useCanvasStore();

  // Use refs for pan/zoom inside event handlers to avoid stale closures
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);

  // Keep refs in sync with store
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panXRef.current = panX; }, [panX]);
  useEffect(() => { panYRef.current = panY; }, [panY]);

  // Track middle-mouse panning state
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panStartOffset = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback((e) => {
    e.preventDefault(); // Prevent page scroll

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Mouse position relative to canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      // PINCH TO ZOOM (trackpad) or Ctrl+Scroll
      // e.deltaY is negative when pinching out (zoom in)
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const oldZoom = zoomRef.current;
      const newZoom = Math.min(Math.max(oldZoom * zoomFactor, 0.05), 20);

      // Zoom toward cursor:
      // We want the world point under the cursor to stay fixed.
      // worldX = (mouseX - panX) / zoom
      // After zoom: newPanX = mouseX - worldX * newZoom
      const worldX = (mouseX - panXRef.current) / oldZoom;
      const worldY = (mouseY - panYRef.current) / oldZoom;

      const newPanX = mouseX - worldX * newZoom;
      const newPanY = mouseY - worldY * newZoom;

      setZoom(newZoom);
      setPan(newPanX, newPanY);
    } else {
      // SCROLL TO PAN (two-finger drag on trackpad, or plain scroll)
      const newPanX = panXRef.current - e.deltaX;
      const newPanY = panYRef.current - e.deltaY;
      setPan(newPanX, newPanY);
    }
  }, [canvasRef, setZoom, setPan]);

  const handleMouseDown = useCallback((e) => {
    // Middle mouse button (button === 1) = start panning
    if (e.button === 1) {
      e.preventDefault();
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panStartOffset.current = { x: panXRef.current, y: panYRef.current };
      canvasRef.current.style.cursor = 'grabbing';
    }
  }, [canvasRef]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan(
      panStartOffset.current.x + dx,
      panStartOffset.current.y + dy,
    );
  }, [setPan]);

  const handleMouseUp = useCallback((e) => {
    if (e.button === 1) {
      isPanning.current = false;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'crosshair';
      }
    }
  }, [canvasRef]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Space + drag = pan (like Figma)
    if (e.code === 'Space' && canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
    // Ctrl+0 = reset zoom
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault();
      setZoom(1);
      setPan(0, 0);
    }
    // Ctrl++ / Ctrl+- = zoom
    if ((e.ctrlKey || e.metaKey) && e.key === '=') {
      e.preventDefault();
      setZoom(zoomRef.current * 1.2);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '-') {
      e.preventDefault();
      setZoom(zoomRef.current / 1.2);
    }
  }, [canvasRef, setZoom, setPan]);

  const handleKeyUp = useCallback((e) => {
    if (e.code === 'Space' && canvasRef.current) {
      canvasRef.current.style.cursor = 'crosshair';
    }
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Passive: false is required to call preventDefault() on wheel
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasRef, handleWheel, handleMouseDown, handleMouseMove,
      handleMouseUp, handleKeyDown, handleKeyUp]);
}