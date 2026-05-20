// useSocket.js
// A custom hook that:
// 1. Connects the socket
// 2. Listens for room events
// 3. Updates Zustand store
// 
// WHY a custom hook? So any component can call useSocket()
// and get socket functionality without caring about the implementation.

import { useEffect } from 'react';
import socket from '../socket/socket';
import useRoomStore from '../store/roomStore';

export function useSocket() {
  const { addUser, removeUser, setUsers, setConnected } = useRoomStore();

  useEffect(() => {
    // Connect when this hook mounts
    socket.connect();
    
    // Listen for room events from the server
    socket.on('user-joined', (user) => {
      addUser(user);
      console.log(`${user.username} joined`);
    });

    socket.on('user-left', ({ userId, username }) => {
      removeUser(userId);
      console.log(`${username} left`);
    });

    // Server sends list of existing users when we first join
    socket.on('room-users', (users) => {
      setUsers(users);
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    // Cleanup: remove listeners when component unmounts
    // Without this, listeners stack up on hot-reload — a common bug!
    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-users');
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, []); // Empty dep array = run once on mount

  // Expose the join function so components can trigger it
  const joinRoom = (roomId, username) => {
    socket.emit('join-room', { roomId, username });
  };

  return { socket, joinRoom };
}