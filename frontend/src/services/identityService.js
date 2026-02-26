import { apiClient } from './apiClient.js';

export const createSession = async ({ alias, avatar }) => {
  return apiClient('/identity/session', {
    method: 'POST',
    body: JSON.stringify({ alias, avatar })
  });
};

export const getMe = async () => {
  return apiClient('/identity/me');
};

export const panicResetSession = async () => apiClient('/identity/panic-reset', {
  method: 'POST'
});
