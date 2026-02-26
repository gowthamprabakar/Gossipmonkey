import { apiClient } from './apiClient.js';

export const getRooms = async () => apiClient('/rooms');

export const createRoom = async ({
  name,
  type = 'public',
  rulesText = 'No rules. Go wild.',
  settings = {},
  channelMeta = {}
}) => {
  return apiClient('/rooms', {
    method: 'POST',
    body: JSON.stringify({ name, type, rulesText, settings, channelMeta })
  });
};

export const getRoomById = async (roomId) => apiClient(`/rooms/${roomId}`);

export const updateRoomSettings = async (roomId, patch) => {
  return apiClient(`/rooms/${roomId}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
};

export const getRoomNotifications = async (roomId) => apiClient(`/rooms/${roomId}/notifications`);
