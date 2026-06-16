import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectSocket, getSocket } from '../lib/socket';

export function useSocketEvent(eventMap) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const socket = connectSocket(user.id);
    const entries = Object.entries(eventMap);
    entries.forEach(([event, handler]) => socket.on(event, handler));
    return () => entries.forEach(([event, handler]) => socket.off(event, handler));
  }, [user?.id]);
}
