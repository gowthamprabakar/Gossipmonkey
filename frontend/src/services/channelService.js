import { apiClient } from './apiClient.js';

export const getChannels = async ({ scope = 'nearby', geohash = '', q = '' } = {}) => {
  const params = new URLSearchParams();
  if (scope) params.set('scope', scope);
  if (geohash) params.set('geohash', geohash);
  if (q) params.set('q', q);
  const query = params.toString();
  return apiClient(`/channels${query ? `?${query}` : ''}`);
};

export const bookmarkChannel = async (roomId) => apiClient(`/channels/${roomId}/bookmark`, {
  method: 'POST'
});

export const unbookmarkChannel = async (roomId) => apiClient(`/channels/${roomId}/bookmark`, {
  method: 'DELETE'
});
