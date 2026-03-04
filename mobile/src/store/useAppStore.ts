import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { socketManager } from '../services/socket';

interface Persona {
    id: string;
    name: string;
    avatar: string;
    score: number;
    accountCode?: string;
}

interface AppState {
    token: string | null;
    persona: Persona | null;
    biometricEnabled: boolean;
    appLockTimeout: number; // minutes — 0 = never
    setToken: (token: string | null) => void;
    setPersona: (persona: Persona | null) => void;
    setBiometricEnabled: (enabled: boolean) => void;
    setAppLockTimeout: (minutes: number) => void;
    loadSession: () => Promise<void>;
    logout: (navigationRef?: any) => Promise<void>;
}

const ALL_STORAGE_KEYS = [
    'sessionToken', 'personaData', 'biometricEnabled',
    'appLockTimeout', 'loginAttempts', 'lastBackground',
];

export const useAppStore = create<AppState>((set, get) => ({
    token: null,
    persona: null,
    biometricEnabled: false,
    appLockTimeout: 5,

    setToken: async (token) => {
        if (token) await AsyncStorage.setItem('sessionToken', token);
        else await AsyncStorage.removeItem('sessionToken');
        set({ token });
    },

    setPersona: async (persona) => {
        if (persona) await AsyncStorage.setItem('personaData', JSON.stringify(persona));
        else await AsyncStorage.removeItem('personaData');
        set({ persona });
    },

    setBiometricEnabled: async (enabled) => {
        await AsyncStorage.setItem('biometricEnabled', enabled ? 'true' : 'false');
        set({ biometricEnabled: enabled });
    },

    setAppLockTimeout: async (minutes) => {
        await AsyncStorage.setItem('appLockTimeout', String(minutes));
        set({ appLockTimeout: minutes });
    },

    loadSession: async () => {
        try {
            const [token, personaData, bioEnabled, lockTimeout] = await Promise.all([
                AsyncStorage.getItem('sessionToken'),
                AsyncStorage.getItem('personaData'),
                AsyncStorage.getItem('biometricEnabled'),
                AsyncStorage.getItem('appLockTimeout'),
            ]);
            set({
                token,
                persona: personaData ? JSON.parse(personaData) : null,
                biometricEnabled: bioEnabled === 'true',
                appLockTimeout: lockTimeout ? Number(lockTimeout) : 5,
            });
        } catch (e) {
            console.error('Failed to load session', e);
        }
    },

    // ── Full 12-step logout wipe ──────────────────────────────────
    logout: async (navigationRef?) => {
        const { token } = get();

        // 1. Remove push token from backend
        try { if (token) await api.patch('/identity/me', { expoPushToken: null }); } catch { /* */ }

        // 2. Revoke server session
        try { if (token) await api.post('/identity/panic-reset'); } catch { /* */ }

        // 3. Disconnect socket — stops all real-time events
        try { socketManager.disconnect(); } catch { /* */ }

        // 4. Reset chat state
        try {
            const { useChatStore } = await import('./useChatStore');
            useChatStore.getState().reset();
        } catch { /* */ }

        // 5. Reset room list state
        try {
            const { useRoomStore } = await import('./useRoomStore');
            useRoomStore.getState().reset();
        } catch { /* */ }

        // 6. Clear zustand state
        set({ token: null, persona: null, biometricEnabled: false });

        // 7. Wipe all AsyncStorage keys
        try { await AsyncStorage.multiRemove(ALL_STORAGE_KEYS); } catch { /* */ }

        // 8. Clear notification badge
        try {
            const Notifs = await import('expo-notifications');
            await Notifs.setBadgeCountAsync(0);
        } catch { /* */ }

        // 9. Reset navigation → Onboarding (no back button possible)
        if (navigationRef?.current?.isReady?.()) {
            navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
            });
        }
    },
}));
