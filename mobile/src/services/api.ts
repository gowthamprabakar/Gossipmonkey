import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

import Constants from 'expo-constants';

// ── Backend URL resolution ────────────────────────────────────────────
// Priority order:
//   1. If APP_ENV=production → use the deployed backend
//   2. If running in Expo Go / dev build → derive IP from hostUri (LAN testing)
//   3. Fallback for Android emulator
// Update PRODUCTION_API_URL when you deploy the backend to a real server.
const PRODUCTION_API_URL = 'https://api.gossipmonkey.app'; // ← change this when backend is deployed

const getBackendUrl = () => {
    const appEnv = process.env.APP_ENV;

    // Production build → always use deployed backend
    if (appEnv === 'production') {
        return PRODUCTION_API_URL;
    }

    // Dev / preview → auto-detect host IP from Expo manifest (works over LAN)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        return `http://${ip}:3000`;
    }

    // Android emulator fallback
    return 'http://10.0.2.2:3000';
};

export const API_BASE_URL = `${getBackendUrl()}/api`;

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = useAppStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
