/**
 * notificationManager.ts
 *
 * Handles all 3 notification layers:
 *   1. Register device for push notifications → PATCH /identity/me
 *   2. Handle notification tap (background/killed) → navigate to correct screen
 *   3. Emit in-app overlay events for foreground notifications
 */

import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { api } from './api';

// ── How to show notifications when app is in foreground ──────────
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: false,  // suppress OS alert; we use our own overlay
        shouldShowBanner: false, // iOS 14+
        shouldShowList: true,    // still appears in Notification Center
        shouldPlaySound: false,
        shouldSetBadge: true,
    }),
});

// ── EventEmitter for in-app overlay ─────────────────────────────
type OverlayListener = (notif: InAppNotif) => void;
const overlayListeners = new Set<OverlayListener>();

export interface InAppNotif {
    id: string;
    type: string;
    title: string;
    body: string;
    roomId?: string;
    roomName?: string;
    data?: Record<string, any>;
}

export const notifEmitter = {
    emit(notif: InAppNotif) {
        overlayListeners.forEach(fn => fn(notif));
    },
    subscribe(fn: OverlayListener) {
        overlayListeners.add(fn);
        return () => overlayListeners.delete(fn);
    },
};

// ── Navigation helper ─────────────────────────────────────────────
// Called both on notification tap and on deep link open.
// `navigation` is the RootNavigator ref.
export function navigateFromNotification(
    data: Record<string, any>,
    navigation: any,
) {
    const { type, roomId, roomName = 'Room' } = data ?? {};
    if (!navigation || !type) return;

    switch (type) {
        // All chat-related: open the room
        case 'chat_message':
        case 'reaction':
        case 'mention':
        case 'tip':
        case 'knock':
        case 'flagged_message':
        case 'entry_granted':
            if (roomId) {
                navigation.navigate('Chat', { roomId, roomName });
            }
            break;

        // Reward goes to Profile
        case 'reward':
            navigation.navigate('Profile');
            break;

        // Entry denied → back to Home
        case 'entry_denied':
            navigation.navigate('Home');
            break;

        default:
            navigation.navigate('Notifications');
            break;
    }
}

// ── Register device for Expo push notifications ──────────────────
export async function registerForPushNotifications(): Promise<string | null> {
    // Android: create notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('gossip-monkey', {
            name: 'Gossip Monkey',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#7C3AED',
            sound: 'default',
        });
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        console.log('[Push] Permission not granted');
        return null;
    }

    // Get Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'gossip-monkey', // matches app.json slug
    });
    const token = tokenData.data;

    // Save to backend so server can push to this device
    try {
        await api.patch('/identity/me', { expoPushToken: token });
        console.log('[Push] Token registered:', token.slice(0, 30), '...');
    } catch (err) {
        console.warn('[Push] Failed to register token with backend:', err);
    }

    return token;
}

// ── Setup all notification listeners ────────────────────────────
// Call once in RootNavigator on mount.
export function setupNotificationListeners(navigationRef: any): () => void {
    // Tap on notification while app is BACKGROUNDED or KILLED
    const tapSub = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data as Record<string, any>;
        navigateFromNotification(data, navigationRef.current);
    });

    // Notification received while app is FOREGROUNDED → show in-app overlay
    const fgSub = Notifications.addNotificationReceivedListener(notification => {
        const content = notification.request.content;
        const data = content.data as Record<string, any>;
        notifEmitter.emit({
            id: notification.request.identifier,
            type: data?.type ?? 'system',
            title: content.title ?? 'Gossip Monkey',
            body: content.body ?? '',
            roomId: data?.roomId,
            roomName: data?.roomName,
            data,
        });
    });

    // Deep link handler (gossipmonkey://chat?roomId=xxx)
    const linkingSub = Linking.addEventListener('url', ({ url }) => {
        const parsed = Linking.parse(url);
        const path = parsed.path ?? '';
        const params = parsed.queryParams ?? {};
        if (path === 'chat' && params.roomId) {
            navigationRef.current?.navigate('Chat', {
                roomId: params.roomId as string,
                roomName: params.roomName as string ?? 'Room',
            });
        } else if (path === 'join' && params.roomId) {
            navigationRef.current?.navigate('JoinPrivateRoom', {
                roomId: params.roomId as string,
                roomName: params.roomName as string ?? 'Room',
            });
        } else if (path === 'notifications') {
            navigationRef.current?.navigate('Notifications');
        } else if (path === 'profile') {
            navigationRef.current?.navigate('Profile');
        }
    });

    return () => {
        tapSub.remove();
        fgSub.remove();
        linkingSub.remove();
    };
}
