// Cursors.jsx
// Renders other users' cursors as floating elements above the canvas.
//
// KEY INSIGHT: We receive world coords, but CSS `translate` needs screen coords.
// So we convert: screenX = worldX * zoom + panX
//
// We use CSS transitions for smooth movement between position updates.
// This is called "interpolation" — the browser smoothly animates
// between the last known position and the new one.
// Without it, cursors would teleport jerkily between positions.

import useRoomStore from '../../store/roomStore';
import useCanvasStore from '../../store/canvasStore';
import { getUserColor } from '../../utils/colorUtils';
import { memo } from 'react';
// Each user gets a unique color based on their userId
// This makes it easy to tell cursors apart

// Individual cursor component
// Cursors.jsx — optimize with selector
export default function Cursors() {
  // Only re-render when cursors object changes
  const cursors = useRoomStore(state => state.cursors);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none"
         style={{ zIndex: 10 }}>
      {Object.entries(cursors).map(([userId, cursor]) => (
        <RemoteCursor
          key={userId}
          userId={userId}
          x={cursor.x}
          y={cursor.y}
          username={cursor.username}
        />
      ))}
    </div>
  );
}

// Memoize individual cursor — only re-renders when ITS position changes
const RemoteCursor = memo(function RemoteCursor({ userId, x, y, username }) {
  const zoom = useCanvasStore(state => state.zoom);
  const panX = useCanvasStore(state => state.panX);
  const panY = useCanvasStore(state => state.panY);

  const screenX = x * zoom + panX;
  const screenY = y * zoom + panY;
  const color = getUserColor(userId);

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        transform: `translate(${screenX}px, ${screenY}px)`,
        transition: 'transform 80ms linear',
        zIndex: 10,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
           style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>
        <path d="M3 2L17 9L10 11L7 18L3 2Z"
              fill={color} stroke="white" strokeWidth="1" />
      </svg>
      <div
        className="absolute top-5 left-1 text-xs font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap"
        style={{ backgroundColor: color, color: 'white', fontSize: 11 }}
      >
        {username}
      </div>
    </div>
  );
});