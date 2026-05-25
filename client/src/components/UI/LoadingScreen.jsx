import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WhiteboardIcon from "../../assets/brush2.svg";
export default function LoadingScreen({ message = 'Loading board' }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          zIndex: 9999,
        }}
      >
        {/* Spinning ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 180 }}
          style={{ position: 'relative', width: 64, height: 64, marginBottom: 24 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'var(--neon-cyan)',
              borderRightColor: 'rgba(77,168,199,0.3)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 8,
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            <img src={WhiteboardIcon} alt="CollabBoard" className="w-8 h-8" />
          </div>
        </motion.div>

        {/* App name */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          CollabBoard
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginBottom: 24,
          }}
        >
          {message}{dots}
        </motion.p>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            width: 160,
            height: 2,
            borderRadius: 2,
            background: 'var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              height: '100%',
              width: '50%',
              borderRadius: 2,
              background: 'linear-gradient(90deg, transparent, var(--neon-cyan), transparent)',
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}