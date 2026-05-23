// Arrow.jsx — full rewrite with thick invisible hit area
import { useState, useRef, useCallback, useEffect } from 'react';
import useCanvasStore from '../../store/canvasStore';
import useObjectsStore from '../../store/objectsStore';

export default function Arrow({ obj, onUpdate, onRemove, currentTool }) {
  const { zoom, panX, panY } = useCanvasStore();
  const { selectedId, setSelected } = useObjectsStore();
  const [dragging, setDragging] = useState(null); // null | 'body' | 'start' | 'end'
  const startRef = useRef(null);
  const isSelected = selectedId === obj.id;

  const sx1 = obj.x * zoom + panX;
  const sy1 = obj.y * zoom + panY;
  const sx2 = obj.x2 * zoom + panX;
  const sy2 = obj.y2 * zoom + panY;

  const pad = 30;
  const minX = Math.min(sx1, sx2) - pad;
  const minY = Math.min(sy1, sy2) - pad;
  const maxX = Math.max(sx1, sx2) + pad;
  const maxY = Math.max(sy1, sy2) + pad;
  const W = maxX - minX;
  const H = maxY - minY;

  const lx1 = sx1 - minX;
  const ly1 = sy1 - minY;
  const lx2 = sx2 - minX;
  const ly2 = sy2 - minY;

  // Midpoint for delete button placement
  const midX = (lx1 + lx2) / 2;
  const midY = (ly1 + ly2) / 2;

  const startDrag = useCallback((e, type) => {
    e.stopPropagation();
    setSelected(obj.id);
    setDragging(type);
    startRef.current = {
      mouseX: e.clientX, mouseY: e.clientY,
      x: obj.x, y: obj.y,
      x2: obj.x2, y2: obj.y2,
    };
  }, [obj, setSelected]);

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e) => {
      const s = startRef.current;
      const dx = (e.clientX - s.mouseX) / zoom;
      const dy = (e.clientY - s.mouseY) / zoom;
      if (dragging === 'body') {
        onUpdate(obj.id, {
          x: s.x + dx, y: s.y + dy,
          x2: s.x2 + dx, y2: s.y2 + dy,
        });
      } else if (dragging === 'start') {
        onUpdate(obj.id, { x: s.x + dx, y: s.y + dy });
      } else if (dragging === 'end') {
        onUpdate(obj.id, { x2: s.x2 + dx, y2: s.y2 + dy });
      }
    };
    const handleMouseUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, zoom, obj.id, onUpdate]);

  const color = obj.strokeColor || '#f87171';

  return (
    <div style={{
      position: 'absolute',
      left: minX, top: minY,
      width: W, height: H,
      zIndex: isSelected ? 21 : 20,
      pointerEvents: 'none', // container is passthrough
    }}>
      <svg
        width={W} height={H}
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <marker
            id={`ah-${obj.id}`}
            markerWidth="10" markerHeight="7"
            refX="9" refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={color} />
          </marker>
        </defs>

        {/* INVISIBLE FAT HIT AREA — 20px wide, transparent */}
        {/* This is the secret to easy arrow selection */}
        <line
          x1={lx1} y1={ly1} x2={lx2} y2={ly2}
          stroke="transparent"
          strokeWidth={20}
          style={{ cursor: 'grab', pointerEvents: 'stroke' }}
          onMouseDown={(e) => startDrag(e, 'body')}
          onClick={(e) => { e.stopPropagation(); setSelected(obj.id); }}
        />

        {/* Visible arrow line */}
        <line
          x1={lx1} y1={ly1} x2={lx2} y2={ly2}
          stroke={color}
          strokeWidth={isSelected ? 2.5 : 2}
          markerEnd={`url(#ah-${obj.id})`}
          style={{ pointerEvents: 'none' }}
        />

        {/* Selection highlight */}
        {isSelected && (
          <line
            x1={lx1} y1={ly1} x2={lx2} y2={ly2}
            stroke="#60a5fa"
            strokeWidth={4}
            strokeOpacity={0.3}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Endpoint handles — large, easy to grab */}
        {isSelected && (
          <>
            <circle
              cx={lx1} cy={ly1} r={10}
              fill="transparent"
              stroke={color}
              strokeWidth={2}
              style={{ cursor: 'crosshair', pointerEvents: 'all' }}
              onMouseDown={(e) => startDrag(e, 'start')}
            />
            <circle
              cx={lx1} cy={ly1} r={5}
              fill={color}
              style={{ pointerEvents: 'none' }}
            />
            <circle
              cx={lx2} cy={ly2} r={10}
              fill="transparent"
              stroke={color}
              strokeWidth={2}
              style={{ cursor: 'crosshair', pointerEvents: 'all' }}
              onMouseDown={(e) => startDrag(e, 'end')}
            />
            <circle
              cx={lx2} cy={ly2} r={5}
              fill={color}
              style={{ pointerEvents: 'none' }}
            />
          </>
        )}
      </svg>

      {/* Delete button — always visible at midpoint */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onRemove(obj.id); }}
        style={{
          position: 'absolute',
          left: midX - 10,
          top: midY - 10,
          width: 20, height: 20,
          borderRadius: '50%',
          background: '#ef4444',
          border: '1.5px solid white',
          color: 'white',
          fontSize: 13,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 22,
          pointerEvents: 'all',
          lineHeight: 1,
          // Only show when selected to avoid clutter
          opacity: isSelected ? 1 : 0,
          transition: 'opacity 150ms',
        }}
      >
        ×
      </button>
    </div>
  );
}