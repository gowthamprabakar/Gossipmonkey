import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

import Constants from 'expo-constants';

// Determine the correct IP automatically based on the Expo environment
// When testing on a physical device using Expo Go, it uses your local network IP
// When using iOS Simulator, localhost works.
// When using Android Emulator, 10.0.2.2 represents localhost.
const getBackendUrl = () => {
    // Default to the computer's IP where Expo is running (best for Physical devices & Expo Go)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        return `http://${ip}:3000`;
    }

    // Fallback for Android Emulators if hostUri isn't defined
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
