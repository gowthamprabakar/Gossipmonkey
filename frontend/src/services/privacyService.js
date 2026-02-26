import { apiClient } from './apiClient.js';

export const getPrivacyPreferences = async () => apiClient('/privacy/me');

export const updatePrivacyPreferences = async (patch) => apiClient('/privacy/me', {
  method: 'PATCH',
  body: JSON.stringify(patch)
});
