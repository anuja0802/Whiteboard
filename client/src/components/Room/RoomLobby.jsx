import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useRoomStore from '../../store/roomStore';
import { useSocket } from '../../hooks/useSocket';
import WhiteboardIcon from "../../assets/brush2.svg";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function RoomLobby() {
  const [username, setUsername] = useState(
    localStorage.getItem('wb_username') || ''
  );
  const [roomInput, setRoomInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const { setUsername: saveUsername, setRoom } = useRoomStore();
  const { joinRoom } = useSocket();
  const navigate = useNavigate();

  const handleJoin = async (roomId) => {
    if (!username.trim()) {
      setError('Please enter your name first');
      return;
    }
    if (!roomId.trim()) {
      setError('Please enter a room code');
      return;
    }
    setError('');
    setIsJoining(true);
    localStorage.setItem('wb_username', username);
    saveUsername(username);
    setRoom(roomId);
    joinRoom(roomId, username);
    await new Promise(r => setTimeout(r, 600)); // smooth transition
    navigate(`/board/${roomId}`);
  };

  const handleCreate = () => handleJoin(generateRoomId());
  const handleJoinExisting = () => {
    if (!roomInput.trim()) { setError('Enter a room code to join'); return; }
    handleJoin(roomInput.toUpperCase());
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at top left, rgba(77,168,199,0.10), transparent 30%),
          radial-gradient(circle at bottom right, rgba(199,106,106,0.08), transparent 25%),
          linear-gradient(145deg, #050816 0%, #09111F 45%, #0B1324 100%)
        `
      }}
    >

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.035,
          backgroundImage:
            'url("https://grainy-gradients.vercel.app/noise.svg")',
          mixBlendMode: 'soft-light'
        }}
      />
      {/* Animated background grid */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ opacity: 0.16 }}>
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40"
                     patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="rgba(148,163,184,0.045)"
                    strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Glow orbs */}
      <div className="absolute pointer-events-none"
           style={{
             top: '20%', left: '15%',
             width: 400, height: 400,
             background: 'radial-gradient(circle, rgba(77,168,199,0.08) 0%, transparent 70%)',
           }} />
      <div className="absolute pointer-events-none"
           style={{
             bottom: '20%', right: '15%',
             width: 400, height: 400,
             background: 'radial-gradient(circle, rgba(199,106,106,0.06) 0%, transparent 70%)',
           }} />


      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(77,168,199,0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md mx-4"
      >
        <div
          className="glass rounded-3xl p-8"
          style={{
            border: '1px solid rgba(77,168,199,0.14)',
            background: 'rgba(17,24,39,0.72)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.35)'
          }}
        >
          {/* Logo + Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: 'var(--bg-elevated)',
                        border: '1px solid rgba(153, 78, 78, 0.22)',
                        boxShadow: `
                          0 10px 40px rgba(0,0,0,0.45),
                          inset 0 1px 0 rgba(255,255,255,0.03)
                        `
                        }}
              >
                <img src={WhiteboardIcon} alt="CollabBoard" className="w-8 h-8" />
              </div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{
                  color: '#b81f1f',
                  letterSpacing: '-0.03em',
                  WebkitTextStroke: "0.8px #000000"
                }}
              >
                CollabBoard
              </h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Real-time collaborative whiteboard
            </p>
          </motion.div>

          {/* Name input */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <label
              className="block text-xs font-medium mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              Your Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Enter your name..."
              maxLength={20}
              className="neon-input w-full rounded-xl px-4 py-3 text-sm"
            />
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs mb-4 px-3 py-2 rounded-lg"
                style={{
                  color: 'var(--neon-red)',
                  background: 'rgba(255,45,120,0.1)',
                  border: '1px solid rgba(255,45,120,0.2)'
                }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Create button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleCreate}
            disabled={isJoining}
            className="btn-neon w-full rounded-xl py-3 text-sm mb-4"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {isJoining ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-4 h-4 rounded-full"
                  style={{
                    border: '2px solid transparent',
                    borderTopColor: 'var(--neon-cyan)'
                  }}
                />
                Joining...
              </span>
            ) : '+ Create New Room'}
          </motion.button>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="flex-1 h-px"
                 style={{ background: 'var(--border-subtle)' }} />
            <span className="text-xs"
                  style={{ color: 'var(--text-dim)' }}>
              or join existing
            </span>
            <div className="flex-1 h-px"
                 style={{ background: 'var(--border-subtle)' }} />
          </motion.div>

          {/* Join existing */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinExisting()}
              placeholder="Room code (e.g. AB1234)"
              maxLength={6}
              className="neon-input flex-1 rounded-xl px-4 py-3 text-sm font-mono"
            />
            <button
              onClick={handleJoinExisting}
              disabled={isJoining}
              className="rounded-xl px-5 py-3 text-sm font-semibold transition-all"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(77,168,199,0.28)';
                e.currentTarget.style.color = '#DCE7F3';
                e.currentTarget.style.background = 'rgba(77,168,199,0.06)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              Join
            </button>
          </motion.div>

          {/* Feature hints */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex justify-center gap-4"
          >
            {['● Draw', '● Notes', '● Realtime sync', '● Infinite canvas'].map((f, i) => (
              <span
                key={i}
                className="text-xs"
                style={{ color: 'var(--text-dim)' }}
              >
                {f}
              </span>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}