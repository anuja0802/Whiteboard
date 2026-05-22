import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCanvas } from '../../hooks/useCanvas';
import { useSocket } from '../../hooks/useSocket';
import { usePanZoom } from '../../hooks/usePanZoom';
import useRoomStore from '../../store/roomStore';
import useCanvasStore from '../../store/canvasStore';
import Toolbar from './Toolbar';

export default function Canvas() {
  const { roomId } = useParams();
  const { username } = useRoomStore();
  const { joinRoom } = useSocket();
  const { zoom } = useCanvasStore();

  const {
    canvasRef,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
  } = useCanvas();

  // Attach pan/zoom handlers to the canvas
  usePanZoom(canvasRef);

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

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400 font-mono">
        {Math.round(zoom * 100)}%
      </div>

      {/* Room info */}
      <div className="absolute bottom-4 left-4 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400">
        Room: <span className="text-white font-mono">{roomId}</span>
      </div>

      {/* Pan/zoom hints */}
      <div className="absolute top-20 right-4 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-500 leading-5">
        <div>Scroll → pan</div>
        <div>Ctrl+Scroll → zoom</div>
        <div>Middle drag → pan</div>
        <div>Ctrl+0 → reset</div>
      </div>
    </div>
  );
}