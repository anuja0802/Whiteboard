import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket/socket';
import useRoomStore from '../store/roomStore';

export function useSocket() {
  const { addUser, removeUser, setUsers, setConnected, username } = useRoomStore();
  const hasJoined = useRef(false); // guard against double join

  useEffect(() => {
    if (!socket.connected) socket.connect();

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
      hasJoined.current = false; // reset on unmount
    };
  }, []);

  const joinRoom = (roomId, uname) => {
    // Prevent joining the same room multiple times
    if (hasJoined.current) return;
    hasJoined.current = true;
    socket.emit('join-room', { roomId, username: uname });
  };

  return { socket, joinRoom };
}