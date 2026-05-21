// Canvas.jsx - Updated with socket join
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCanvas } from '../../hooks/useCanvas';
import { useSocket } from '../../hooks/useSocket';
import useRoomStore from '../../store/roomStore';
import Toolbar from './Toolbar';

export default function Canvas() {
  const { roomId } = useParams();
  const { username } = useRoomStore();
  const { joinRoom } = useSocket();
  const {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
  } = useCanvas();

  // Join the room when board mounts
  useEffect(() => {
    if (roomId && username) {
      joinRoom(roomId, username);
    }
  }, [roomId, username]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="absolute top-0 left-0 cursor-crosshair"
        onContextMenu={(e) => e.preventDefault()}
      />
      <Toolbar onClear={clearCanvas} />

      {/* Room info badge */}
      <div className="absolute bottom-4 left-4 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400">
        Room: <span className="text-white font-mono">{roomId}</span>
      </div>
    </div>
  );
}