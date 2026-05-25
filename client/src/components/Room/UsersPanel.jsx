import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useRoomStore from '../../store/roomStore';
import { getUserColor } from '../../utils/colorUtils';

function UserAvatar({ username, userId, isYou }) {
  const color = getUserColor(userId || username);
  const initial = username?.[0]?.toUpperCase() || '?';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 8,
        cursor: 'default',
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={e =>
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      onMouseLeave={e =>
        e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar circle */}
      <div style={{
        width: 26, height: 26,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
        position: 'relative',
      }}>
        {initial}
        {/* Online dot */}
        <div
          className="pulse-dot"
          style={{
            position: 'absolute',
            bottom: -1, right: -1,
            width: 8, height: 8,
            borderRadius: '50%',
            background: '#22c55e',
            border: '1.5px solid var(--bg-elevated)',
          }}
        />
      </div>

      <span style={{
        fontSize: 13,
        color: 'var(--text-primary)',
        maxWidth: 100,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {username}
      </span>

      {isYou && (
        <span style={{
          marginLeft: 'auto',
          fontSize: 10,
          color: 'var(--neon-cyan)',
          background: 'rgba(77,168,199,0.1)',
          border: '1px solid rgba(77,168,199,0.2)',
          borderRadius: 4,
          padding: '1px 5px',
        }}>
          you
        </span>
      )}
    </motion.div>
  );
}

export default function UsersPanel() {
  const { users, username, isConnected } = useRoomStore();
  const [collapsed, setCollapsed] = useState(false);
  const totalUsers = users.length + 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      style={{
        position: 'absolute',
        top: 80,
        left: 16,
        zIndex: 20,
      }}
    >
      <div
        className="glass"
        style={{
          minWidth: 176,
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e =>
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          onMouseLeave={e =>
            e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Connection dot */}
            <div style={{
              width: 7, height: 7,
              borderRadius: '50%',
              background: isConnected ? '#22c55e' : 'var(--text-dim)',
              boxShadow: isConnected ? '0 0 6px rgba(34,197,94,0.5)' : 'none',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}>
              {totalUsers} online
            </span>
          </div>
          <motion.span
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: 'var(--text-dim)', fontSize: 11 }}
          >
            ▾
          </motion.span>
        </button>

        {/* User list */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                padding: '4px 4px 6px',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <UserAvatar
                  username={username || 'You'}
                  userId="self"
                  isYou={true}
                />
                <AnimatePresence>
                  {users.map((user) => (
                    <UserAvatar
                      key={user.userId}
                      username={user.username}
                      userId={user.userId}
                      isYou={false}
                    />
                  ))}
                </AnimatePresence>
                {users.length === 0 && (
                  <p style={{
                    fontSize: 11,
                    color: 'var(--text-dim)',
                    padding: '4px 8px',
                  }}>
                    Share link to invite others
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}