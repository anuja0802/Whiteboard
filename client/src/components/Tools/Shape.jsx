// Shape.jsx — full rewrite with resize handles
import { useState, useRef, useCallback, useEffect } from 'react';
import useCanvasStore from '../../store/canvasStore';
import useObjectsStore from '../../store/objectsStore';

// 8 resize handle positions
const HANDLES = [
  { id: 'nw', cursor: 'nw-resize', x: 0,   y: 0   },
  { id: 'n',  cursor: 'n-resize',  x: 0.5, y: 0   },
  { id: 'ne', cursor: 'ne-resize', x: 1,   y: 0   },
  { id: 'e',  cursor: 'e-resize',  x: 1,   y: 0.5 },
  { id: 'se', cursor: 'se-resize', x: 1,   y: 1   },
  { id: 's',  cursor: 's-resize',  x: 0.5, y: 1   },
  { id: 'sw', cursor: 'sw-resize', x: 0,   y: 1   },
  { id: 'w',  cursor: 'w-resize',  x: 0,   y: 0.5 },
];

export default function Shape({ obj, onUpdate, onRemove, currentTool }) {
  const { zoom, panX, panY } = useCanvasStore();
  const { selectedId, setSelected } = useObjectsStore();
  const [interaction, setInteraction] = useState(null); // null | 'drag' | handle id
  const startRef = useRef(null);
  const isSelected = selectedId === obj.id;
  const canInteract = currentTool === 'select' || currentTool === 'rect' || currentTool === 'circle';

  const sx = obj.x * zoom + panX;
  const sy = obj.y * zoom + panY;
  const sw = obj.width * zoom;
  const sh = obj.height * zoom;

  // Start drag or resize
  const handleMouseDown = useCallback((e, type) => {
    if (e.target.tagName === 'BUTTON') return;
    e.stopPropagation();
    setSelected(obj.id);
    setInteraction(type);
    startRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x: obj.x, y: obj.y,
      width: obj.width, height: obj.height,
    };
  }, [obj, setSelected]);

  useEffect(() => {
    if (!interaction) return;

    const handleMouseMove = (e) => {
      const s = startRef.current;
      const dx = (e.clientX - s.mouseX) / zoom;
      const dy = (e.clientY - s.mouseY) / zoom;

      if (interaction === 'drag') {
        onUpdate(obj.id, { x: s.x + dx, y: s.y + dy });
        return;
      }

      // Resize logic based on which handle
      let newX = s.x, newY = s.y;
      let newW = s.width, newH = s.height;
      const MIN = 40; // minimum size in world units

      if (interaction.includes('e')) newW = Math.max(s.width + dx, MIN);
      if (interaction.includes('s')) newH = Math.max(s.height + dy, MIN);
      if (interaction.includes('w')) {
        newW = Math.max(s.width - dx, MIN);
        newX = s.x + s.width - newW;
      }
      if (interaction.includes('n')) {
        newH = Math.max(s.height - dy, MIN);
        newY = s.y + s.height - newH;
      }

      onUpdate(obj.id, { x: newX, y: newY, width: newW, height: newH });
    };

    const handleMouseUp = () => setInteraction(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interaction, zoom, obj.id, onUpdate]);

  return (
    <div
      onMouseDown={(e) => canInteract && handleMouseDown(e, 'drag')}
      onClick={(e) => { e.stopPropagation(); if (canInteract) setSelected(obj.id); }}
      style={{
        position: 'absolute',
        left: sx, top: sy,
        width: sw, height: sh,
        cursor: interaction === 'drag' ? 'grabbing' : canInteract ? 'grab' : 'default',
        zIndex: isSelected ? 21 : 20,
        transition: interaction ? 'none' : 'left 50ms, top 50ms, width 50ms, height 50ms',
        // Always receive pointer events
        pointerEvents: 'all',
      }}
    >
      <svg
        width={sw} height={sh}
        style={{ overflow: 'visible', display: 'block', pointerEvents: 'none' }}
      >
        {obj.type === 'rect' ? (
          <rect
            x={1} y={1}
            width={sw - 2} height={sh - 2}
            rx={6}
            fill={obj.fillColor || 'rgba(96,165,250,0.1)'}
            stroke={isSelected ? '#60a5fa' : (obj.strokeColor || '#60a5fa')}
            strokeWidth={isSelected ? 2.5 : 1.5}
          />
        ) : (
          <ellipse
            cx={sw / 2} cy={sh / 2}
            rx={sw / 2 - 1} ry={sh / 2 - 1}
            fill={obj.fillColor || 'rgba(96,165,250,0.1)'}
            stroke={isSelected ? '#60a5fa' : (obj.strokeColor || '#60a5fa')}
            strokeWidth={isSelected ? 2.5 : 1.5}
          />
        )}
      </svg>

      {/* Label */}
      <input
        value={obj.label || ''}
        onChange={(e) => onUpdate(obj.id, { label: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="Label..."
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'transparent',
          border: 'none', outline: 'none',
          color: 'white',
          fontSize: Math.max(13 * zoom, 10),
          textAlign: 'center',
          width: '85%',
          cursor: 'text',
          pointerEvents: 'all',
        }}
      />

      {/* Delete — always visible, always works */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onRemove(obj.id); }}
        style={{
          position: 'absolute',
          top: -10, right: -10,
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
        }}
      >
        ×
      </button>

      {/* Resize handles — only when selected */}
      {isSelected && HANDLES.map((h) => (
        <div
          key={h.id}
          onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, h.id); }}
          style={{
            position: 'absolute',
            left: `${h.x * 100}%`,
            top: `${h.y * 100}%`,
            width: 10, height: 10,
            background: 'white',
            border: '2px solid #60a5fa',
            borderRadius: 2,
            transform: 'translate(-50%, -50%)',
            cursor: h.cursor,
            zIndex: 23,
            pointerEvents: 'all',
          }}
        />
      ))}
    </div>
  );
}