// useSocket.js - Updated
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket/socket';
import useRoomStore from '../store/roomStore';

export function useSocket() {
  const { roomId } = useParams(); // Get roomId from URL
  const { addUser, removeUser, setUsers, setConnected, username } = useRoomStore();

  useEffect(() => {
    // Connect socket
    if (!socket.connected) {
      socket.connect();
    }

    socket.on('user-joined', (user) => addUser(user));
    socket.on('user-left', ({ userId }) => removeUser(userId));
    socket.on('room-users', (users) => setUsers(users));
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-users');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const joinRoom = (rid, uname) => {
    socket.emit('join-room', { roomId: rid, username: uname });
  };

  return { socket, joinRoom };
}