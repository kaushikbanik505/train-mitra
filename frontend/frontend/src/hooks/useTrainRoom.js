import { useEffect } from 'react';
import socket from '../socket';

export default function useTrainRoom(trainNumber, journeyDate) {
  useEffect(() => {
    if (!trainNumber || !journeyDate) return undefined;
    socket.emit('join_train_room', { trainNumber, journeyDate });
    return () => {
      socket.emit('leave_train_room', { trainNumber, journeyDate });
    };
  }, [trainNumber, journeyDate]);
}
