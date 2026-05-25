import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useCanvas } from '../../hooks/useCanvas';
import { useSocket } from '../../hooks/useSocket';
import { usePanZoom } from '../../hooks/usePanZoom';
import { useCursor } from '../../hooks/useCursor';
import { useObjects } from '../../hooks/useObjects';
import { useHistory } from '../../hooks/useHistory';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '../UI/LoadingScreen';
import useRoomStore from '../../store/roomStore';
import useCanvasStore from '../../store/canvasStore';
import useObjectsStore from '../../store/objectsStore';
import Toolbar from './Toolbar';
import Cursors from './Cursors';
import ObjectsLayer from '../Tools/ObjectsLayer';
import UsersPanel from '../Room/UsersPanel';
import socket from '../../socket/socket';

export default function Canvas() {
  const { roomId } = useParams();
  const { username, setUsername } = useRoomStore();
  const { joinRoom } = useSocket();
  const zoom = useCanvasStore(state => state.zoom);
  const tool = useCanvasStore(state => state.tool);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { undo, redo, canUndo, canRedo } = useHistory();
  const { canvasRef, startDrawing, draw, stopDrawing, clearCanvas } = useCanvas();

  usePanZoom(canvasRef);
  useCursor(canvasRef);

  const { createStickyNote, createShape, createArrow } = useObjects();
  const { clearObjects } = useObjectsStore();

  useEffect(() => {
    const savedName = username || localStorage.getItem('wb_username');
    if (!savedName) { setShowNamePrompt(true); return; }
    if (!username && savedName) setUsername(savedName);
    if (roomId && savedName) {
      joinRoom(roomId, savedName);
      setTimeout(() => socket.emit('request-objects'), 500);
      setTimeout(() => setIsLoading(false), 1500);
    }
  }, [roomId]);

  const handleNameSubmit = () => {
    if (!nameInput.trim()) return;
    const name = nameInput.trim();
    localStorage.setItem('wb_username', name);
    setUsername(name);
    setShowNamePrompt(false);
    joinRoom(roomId, name);
    setTimeout(() => socket.emit('request-objects'), 500);
  };

  // FIX: only create objects when clicking directly on canvas
  // not when clicking toolbar buttons
const handleCanvasClick = useCallback((e) => {
    // Don't create objects if clicking on an existing object
    // (textarea, button, input inside a sticky note or shape)
    const tag = e.target.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'BUTTON') return;
    if (e.target !== e.currentTarget) return;

    if (tool === 'sticky') {
      createStickyNote(e.clientX, e.clientY);
    } else if (tool === 'rect' || tool === 'circle') {
      createShape(tool, e.clientX, e.clientY);
    } else if (tool === 'arrow') {
      createArrow(e.clientX, e.clientY);
    }
  }, [tool, createStickyNote, createShape, createArrow]);

  const handleClearAll = useCallback(() => {
    clearCanvas();
    clearObjects();
    socket.emit('clear-canvas');
    socket.emit('clear-objects');
  }, [clearCanvas, clearObjects]);

  if (showNamePrompt) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', maxWidth: 380, padding: '1rem' }}
          >
            <div className="glass" style={{ borderRadius: 16, padding: '1.75rem' }}>
              <h2 style={{
                fontSize: 18, fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}>
                Join Room
              </h2>
              <p style={{
                fontSize: 13, color: 'var(--text-muted)',
                marginBottom: 20,
              }}>
                Enter your name to join{' '}
                <span style={{
                  fontFamily: 'monospace',
                  color: 'var(--neon-cyan)',
                  background: 'rgba(77,168,199,0.1)',
                  padding: '1px 6px',
                  borderRadius: 4,
                }}>
                  {roomId}
                </span>
              </p>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                placeholder="Your name..."
                autoFocus
                maxLength={20}
                className="neon-input"
                style={{
                  width: '100%',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 14,
                  marginBottom: 12,
                }}
              />
              <button
                onClick={handleNameSubmit}
                className="btn-neon"
                style={{
                  width: '100%',
                  borderRadius: 10,
                  padding: '11px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Join Board
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at top left, rgba(77,168,199,0.07), transparent 30%),
          radial-gradient(circle at bottom right, rgba(199,106,106,0.05), transparent 24%),
          linear-gradient(
            145deg,
            #040816 0%,
            #07101D 45%,
            #0B1324 100%
          )
        `
      }}
    >


      <div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.14 }}
    >
      <svg width="100%" height="100%">
        <defs>
          <pattern
            id="grid"
            width="42"
            height="42"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 42 0 L 0 0 0 42"
              fill="none"
              stroke="rgba(148,163,184,0.05)"
              strokeWidth="0.7"
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>

    {/* STEP 3 → Grain Texture */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: 0.018,
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.4) 0.5px, transparent 0.5px)',
        backgroundSize: '3px 3px',
      }}
    />

      {/* Layer 1: Canvas — onClick only fires when clicking the canvas itself */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onClick={handleCanvasClick}
        className="absolute top-0 left-0"
        style={{
          cursor: tool === 'pen' ? 'crosshair'
            : tool === 'eraser' ? 'cell'
            : tool === 'select' ? 'default'
            : 'copy',
        }}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Layer 2: Objects */}
      <ObjectsLayer />

      {/* Layer 3: Cursors */}
      <Cursors />

      {/* Layer 4: UI */}
      <Toolbar
        onClear={handleClearAll}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <UsersPanel />

      {/* Zoom indicator */}
      <div style={{
        position: 'absolute',
        bottom: 16, right: 16,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: '6px 12px',
        fontSize: 12,
        color: 'var(--text-muted)',
        fontFamily: 'monospace',
        userSelect: 'none',
      }}>
        {Math.round(zoom * 100)}%
      </div>

      <RoomLink roomId={roomId} />

      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 11,
        color: 'var(--text-dim)',
        userSelect: 'none',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}>
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
    <div style={{
      position: 'absolute',
      bottom: 16, left: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 10,
      padding: '6px 12px',
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Room</span>
      <span style={{
        fontSize: 12,
        color: 'var(--text-primary)',
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
      }}>
        {roomId}
      </span>
      <button
        onClick={handleCopy}
        style={{
          fontSize: 11,
          color: copied ? '#22c55e' : 'var(--neon-cyan)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'color 0.2s',
        }}
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}