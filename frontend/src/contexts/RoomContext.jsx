import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getRooms } from '../services/roomService';

const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);

  const refreshRooms = useCallback(async () => {
    setRoomsLoading(true);
    const result = await getRooms();
    if (result.success) {
      setRooms(result.data);
    }
    setRoomsLoading(false);
    return result;
  }, []);

  const joinRoom = useCallback((roomId) => setCurrentRoom(roomId), []);
  const leaveRoom = useCallback(() => setCurrentRoom(null), []);

  const value = useMemo(() => ({
    rooms,
    roomsLoading,
    currentRoom,
    setCurrentRoom,
    refreshRooms,
    joinRoom,
    leaveRoom
  }), [rooms, roomsLoading, currentRoom, refreshRooms, joinRoom, leaveRoom]);

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within RoomProvider');
  return ctx;
};
