// RoomLobby.jsx
// This is what users see first — enter a name, create or join a room.
// Simple, focused, one job.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // we'll add router next
import useRoomStore from '../../store/roomStore';
import { useSocket } from '../../hooks/useSocket';

// Generate a random room ID (in production you'd use nanoid or uuid)
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function RoomLobby() {
  const [username, setUsername] = useState(localStorage.getItem('wb_username') || '');
  const [roomInput, setRoomInput] = useState('');
  const { setUsername: saveUsername, setRoom } = useRoomStore();
  const { joinRoom } = useSocket();
  const navigate = useNavigate();

  const handleJoin = (roomId) => {
    if (!username.trim()) return alert('Please enter your name');
    // Save to localStorage so it persists across page loads
    localStorage.setItem('wb_username', username);
    saveUsername(username);
    setRoom(roomId);
    joinRoom(roomId, username);
    navigate(`/board/${roomId}`); // Navigate to the board
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2">
          🎨 Whiteboard
        </h1>
        <p className="text-gray-400 mb-8">Collaborate in real-time</p>

        {/* Username input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Your Name</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name..."
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            maxLength={20}
          />
        </div>

        {/* Create new room */}
        <button
          onClick={() => handleJoin(generateRoomId())}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg mb-4 transition-colors"
        >
          Create New Room
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-sm">or join existing</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Join existing room */}
        <div className="flex gap-2">
          <input
            type="text"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
            placeholder="Room code (e.g. AB1234)"
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            maxLength={6}
          />
          <button
            onClick={() => handleJoin(roomInput)}
            className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-3 rounded-lg transition-colors"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}