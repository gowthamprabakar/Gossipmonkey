import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {
    auth: { token }
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = undefined;
};

export const onSocket = (event, handler) => {
  if (!socket) return;
  socket.on(event, handler);
};

export const offSocket = (event, handler) => {
  if (!socket) return;
  socket.off(event, handler);
};

export const emitSocket = (event, payload) => {
  if (!socket) return;
  socket.emit(event, payload);
};

export const joinRoom = (roomId) => emitSocket('join_room', { roomId });
export const leaveRoom = (roomId) => emitSocket('leave_room', { roomId });
export const sendMessage = (roomId, payload) => {
  if (typeof payload === 'string') {
    emitSocket('send_message', { roomId, text: payload });
    return;
  }
  emitSocket('send_message', {
    roomId,
    text: payload?.text || '',
    imageUrl: payload?.imageUrl || ''
  });
};
export const reactMessage = (roomId, messageId, reaction) => emitSocket('react_message', { roomId, messageId, reaction });
export const tipUser = (roomId, toUserId, amount) => emitSocket('tip_user', { roomId, toUserId, amount });
export const flagMessage = (roomId, messageId) => emitSocket('flag_message', { roomId, messageId });
export const deleteMessage = (roomId, messageId) => emitSocket('delete_message', { roomId, messageId });
export const kickUser = (roomId, targetUserId) => emitSocket('kick_user', { roomId, targetUserId });
export const approveEntry = (socketId, roomId, approved) => emitSocket('approve_entry', { socketId, roomId, approved });
export const deleteRoom = (roomId) => emitSocket('delete_room', { roomId });
export const updateRoomSettingsSocket = (roomId, settings) => emitSocket('update_room_settings', { roomId, settings });
export const requestRoomAdminData = (roomId) => emitSocket('request_room_admin_data', { roomId });
export const resolveFlag = (roomId, flagId) => emitSocket('resolve_flag', { roomId, flagId });
export const unbanUser = (roomId, targetUserId) => emitSocket('unban_user', { roomId, targetUserId });
export const topUpMonkeyBank = (roomId, amount) => emitSocket('top_up_monkey_bank', { roomId, amount });
export const resetMonkeyMemory = (roomId) => emitSocket('reset_monkey_memory', { roomId });
