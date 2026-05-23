// StickyNote.jsx — full rewrite
import { useState, useRef, useCallback, useEffect } from 'react';
import useCanvasStore from '../../store/canvasStore';
import useObjectsStore from '../../store/objectsStore';

const STICKY_COLORS = [
  '#fbbf24', '#f87171', '#4ade80',
  '#60a5fa', '#c084fc', '#fb923c',
];

export default function StickyNote({ obj, onUpdate, onRemove, currentTool }) {
  const { zoom, panX, panY } = useCanvasStore();
  const { selectedId, setSelected } = useObjectsStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);
  const textRef = useRef(null);
  const isSelected = selectedId === obj.id;

  // Can interact if select tool OR clicking the note directly
  const canInteract = currentTool === 'select' || currentTool === 'sticky';

  const screenX = obj.x * zoom + panX;
  const screenY = obj.y * zoom + panY;
  const screenW = obj.width * zoom;
  const screenH = obj.height * zoom;

  const handleMouseDown = useCallback((e) => {
    if (e.target.tagName === 'TEXTAREA') return;
    if (e.target.tagName === 'BUTTON') return;
    if (!canInteract) return;
    e.stopPropagation();
    setSelected(obj.id);
    setIsDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      objX: obj.x,
      objY: obj.y,
    };
  }, [obj.id, obj.x, obj.y, setSelected, canInteract]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e) => {
      const dx = (e.clientX - dragStart.current.mouseX) / zoom;
      const dy = (e.clientY - dragStart.current.mouseY) / zoom;
      onUpdate(obj.id, {
        x: dragStart.current.objX + dx,
        y: dragStart.current.objY + dy,
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, zoom, obj.id, onUpdate]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (canInteract) setSelected(obj.id);
      }}
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        width: screenW,
        height: screenH,
        backgroundColor: obj.bgColor || '#fbbf24',
        borderRadius: 8,
        outline: isSelected ? '2px solid #60a5fa' : 'none',
        outlineOffset: 2,
        cursor: isDragging ? 'grabbing' : canInteract ? 'grab' : 'default',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        userSelect: 'none',
        zIndex: isSelected ? 21 : 20,
        transition: isDragging ? 'none' : 'left 50ms, top 50ms',
        // KEY FIX: always receive pointer events
        pointerEvents: 'all',
      }}
    >
      {/* Header */}
      <div style={{
        height: 28,
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 6px',
        flexShrink: 0,
        cursor: canInteract ? 'grab' : 'default',
      }}>
        {/* Color swatches */}
        <div style={{ display: 'flex', gap: 3 }}>
          {STICKY_COLORS.map((c) => (
            <button
              key={c}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(obj.id, { bgColor: c });
              }}
              style={{
                width: 12, height: 12,
                borderRadius: '50%',
                backgroundColor: c,
                border: obj.bgColor === c ? '2px solid white' : '1px solid rgba(0,0,0,0.2)',
                cursor: 'pointer',
                flexShrink: 0,
                pointerEvents: 'all',
              }}
            />
          ))}
        </div>

        {/* Delete — always works regardless of tool */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(obj.id);
          }}
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: 'none',
            color: 'rgba(0,0,0,0.6)',
            cursor: 'pointer',
            fontSize: 14,
            width: 18,
            height: 18,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'all',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Text area */}
      <textarea
        ref={textRef}
        value={obj.text}
        onChange={(e) => onUpdate(obj.id, { text: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        placeholder="Type here..."
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          padding: 8,
          fontSize: Math.max(13 * zoom, 11),
          color: '#1a1a1a',
          fontFamily: 'inherit',
          cursor: 'text',
          pointerEvents: 'all',
        }}
      />
    </div>
  );
}