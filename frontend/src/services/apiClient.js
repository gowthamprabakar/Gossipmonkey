const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('chat_monkey_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiClient = async (path, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));
    if (!response.ok) {
      return { success: false, message: data.message || 'Request failed', data: data.data || null };
    }

    return data;
  } catch {
    return {
      success: false,
      message: 'API unavailable. Start backend server on port 3000.',
      data: null
    };
  }
};

export { API_URL };
