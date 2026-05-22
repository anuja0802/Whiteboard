import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCanvas } from '../../hooks/useCanvas';
import { useSocket } from '../../hooks/useSocket';
import { usePanZoom } from '../../hooks/usePanZoom';
import { useCursor } from '../../hooks/useCursor';
import useRoomStore from '../../store/roomStore';
import useCanvasStore from '../../store/canvasStore';
import Toolbar from './Toolbar';
import Cursors from './Cursors';
import UsersPanel from '../Room/UsersPanel';

export default function Canvas() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { username, setUsername } = useRoomStore();
  const { joinRoom } = useSocket();
  const { zoom } = useCanvasStore();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const { canvasRef, startDrawing, draw, stopDrawing, clearCanvas } = useCanvas();
  usePanZoom(canvasRef);
  useCursor(canvasRef);

  useEffect(() => {
    // Try to get username from store first, then localStorage
    const savedName = username || localStorage.getItem('wb_username');

    if (!savedName) {
      // No username at all — show inline name prompt
      setShowNamePrompt(true);
      return;
    }

    // Have a username — make sure it's in the store
    if (!username && savedName) {
      setUsername(savedName);
    }

    // Join the room
    if (roomId && savedName) {
      joinRoom(roomId, savedName);
    }
  }, [roomId]);

  const handleNameSubmit = () => {
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    localStorage.setItem('wb_username', name);
    setUsername(name);
    setShowNamePrompt(false);
    joinRoom(roomId, name);
  };

  // Show name prompt if no username (direct link access)
  if (showNamePrompt) {
    return (
      <div className="w-screen h-screen bg-gray-950 flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold text-white mb-1">Join Room</h2>
          <p className="text-gray-400 text-sm mb-6">
            Enter your name to join <span className="text-white font-mono">{roomId}</span>
          </p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            placeholder="Your name..."
            autoFocus
            maxLength={20}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-4"
          />
          <button
            onClick={handleNameSubmit}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Join Board
          </button>
        </div>
      </div>
    );
  }

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

      <Cursors />
      <Toolbar onClear={clearCanvas} />
      <UsersPanel />

      <div className="absolute bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400 font-mono select-none">
        {Math.round(zoom * 100)}%
      </div>

      <RoomLink roomId={roomId} />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-700 select-none">
        Scroll to pan · Ctrl+Scroll to zoom · Middle drag to pan
      </div>
    </div>
  );
}

function RoomLink({ roomId }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2">
      <span className="text-xs text-gray-500">Room:</span>
      <span className="text-xs text-white font-mono">{roomId}</span>
      <button
        onClick={handleCopy}
        className="text-xs transition-colors ml-1"
        style={{ color: copied ? '#4ade80' : '#60a5fa' }}
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}