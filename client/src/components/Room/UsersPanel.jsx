// UsersPanel.jsx
// Shows who's currently in the room.
// Displays as a floating panel — collapsible to save space.

import { useState } from 'react';
import useRoomStore from '../../store/roomStore';
import { getUserColor } from '../../utils/colorUtils';

// Avatar component for each user
function UserAvatar({ username, userId, isYou }) {
  const color = getUserColor(userId || username);
  const initial = username ? username[0].toUpperCase() : '?';

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors">
      {/* Colored circle avatar with initial */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {initial}
      </div>
      <span className="text-sm text-gray-300 truncate max-w-[100px]">
        {username}
      </span>
      {isYou && (
        <span className="text-xs text-gray-500 ml-auto">(you)</span>
      )}
    </div>
  );
}

export default function UsersPanel() {
  const { users, username, isConnected } = useRoomStore();
  const [collapsed, setCollapsed] = useState(false);

  // Total count includes current user
  const totalUsers = users.length + 1;

  return (
    <div className="absolute top-20 left-4 z-20">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
           style={{ minWidth: '180px' }}>

        {/* Header — click to collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            {/* Green dot = connected, gray = disconnected */}
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium text-white">
              {totalUsers} online
            </span>
          </div>
          {/* Collapse arrow */}
          <span className="text-gray-500 text-xs transition-transform duration-200"
                style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
            ▾
          </span>
        </button>

        {/* User list */}
        {!collapsed && (
          <div className="px-1 pb-1 border-t border-gray-800">
            {/* Current user — always first */}
            <UserAvatar
              username={username || 'You'}
              userId="self"
              isYou={true}
            />

            {/* Other users */}
            {users.map((user) => (
              <UserAvatar
                key={user.userId}
                username={user.username}
                userId={user.userId}
                isYou={false}
              />
            ))}

            {/* Empty state */}
            {users.length === 0 && (
              <p className="text-xs text-gray-600 px-2 py-1">
                Share the room link to invite others
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}