import { useEffect, useState } from 'react';
import socket from '../socket';

export default function useLiveStats() {
  const [online, setOnline] = useState(null);
  const [registered, setRegistered] = useState(null);

  useEffect(() => {
    function handleOnline(count) {
      setOnline(count);
    }
    function handleRegistered(count) {
      setRegistered(count);
    }
    socket.on('stats:online', handleOnline);
    socket.on('stats:registered', handleRegistered);

    // The server also pushes these at connect time, but that push can happen
    // before this listener is attached (e.g. the socket already connected
    // before this component mounted) and Socket.IO doesn't replay missed
    // events - so explicitly ask for current values too, both right away and
    // on every future reconnect.
    function requestStats() {
      socket.emit('stats:request');
    }
    if (socket.connected) requestStats();
    socket.on('connect', requestStats);

    return () => {
      socket.off('stats:online', handleOnline);
      socket.off('stats:registered', handleRegistered);
      socket.off('connect', requestStats);
    };
  }, []);

  return { online, registered };
}
