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
// Each user gets a unique color based on their userId
// This makes it easy to tell cursors apart

// Individual cursor component
function RemoteCursor({ userId, x, y, username }) {
  const { zoom, panX, panY } = useCanvasStore();

  // Convert world coordinates to screen coordinates
  const screenX = x * zoom + panX;
  const screenY = y * zoom + panY;

  const color = getUserColor(userId);

  return (
    // pointer-events: none so the cursor overlay doesn't block mouse events
    // on the canvas below
    <div
      className="absolute top-0 left-0 pointer-events-none"
      style={{
        // Use transform instead of left/top for GPU-accelerated movement
        // This is a performance best practice — transform doesn't trigger layout
        transform: `translate(${screenX}px, ${screenY}px)`,
        // CSS transition smooths cursor movement between socket updates
        // 80ms matches roughly 2-3 frames at 30fps emit rate
        transition: 'transform 80ms linear',
        zIndex: 10,
      }}
    >
      {/* Cursor SVG arrow */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
      >
        <path
          d="M3 2L17 9L10 11L7 18L3 2Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* Username label */}
      <div
        className="absolute top-5 left-1 text-xs font-medium px-1.5 py-0.5 rounded-md whitespace-nowrap"
        style={{
          backgroundColor: color,
          color: 'white',
          fontSize: '11px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}
      >
        {username}
      </div>
    </div>
  );
}

// Container that renders all remote cursors
export default function Cursors() {
  const { cursors } = useRoomStore();

  return (
    // Full screen overlay, pointer-events: none so it doesn't block canvas
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 10 }}>
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