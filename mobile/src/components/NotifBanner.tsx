/**
 * NotifBanner.tsx
 *
 * Global in-app notification overlay that slides down from the top
 * over ANY screen whenever a socket or push event fires while the
 * user is inside the app.
 *
 * Usage: mount once inside RootNavigator above all stacks.
 * It subscribes to notifEmitter and also to the socket 'notification' event.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Animated, Dimensions, PanResponder, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { notifEmitter, InAppNotif, navigateFromNotification } from '../services/notificationManager';
import { socketManager } from '../services/socket';

const { width: W } = Dimensions.get('window');
const BANNER_HEIGHT = 80;
const AUTO_DISMISS_MS = 4500;

// ── Icon + colour per notification type ──────────────────────────
const TYPE_META: Record<string, { icon: string; colors: [string, string]; label: string }> = {
    chat_message: { icon: 'chat-bubble', colors: ['#4338CA', '#6366F1'], label: 'New Message' },
    reaction: { icon: 'mood', colors: ['#BE185D', '#EC4899'], label: 'Reaction' },
    mention: { icon: 'alternate-email', colors: ['#0369A1', '#38BDF8'], label: 'Mentioned You' },
    tip: { icon: 'payments', colors: ['#92400E', '#FBBF24'], label: 'Banana Tip 🍌' },
    reward: { icon: 'emoji-events', colors: ['#854D0E', '#FCD34D'], label: 'Reward!' },
    knock: { icon: 'door-front', colors: ['#4C1D95', '#7C3AED'], label: 'Knock Knock' },
    entry_granted: { icon: 'check-circle', colors: ['#065F46', '#34D399'], label: 'Entry Granted' },
    entry_denied: { icon: 'cancel', colors: ['#7F1D1D', '#EF4444'], label: 'Entry Denied' },
    flagged_message: { icon: 'flag', colors: ['#7C2D12', '#F97316'], label: 'Message Flagged' },
    system: { icon: 'notifications', colors: ['#1E3A5F', '#818CF8'], label: 'Gossip Monkey' },
};

const getMeta = (type: string) => TYPE_META[type] ?? TYPE_META.system;

// ── Single banner ─────────────────────────────────────────────────
function Banner({
    notif,
    onDismiss,
    navigationRef,
}: {
    notif: InAppNotif;
    onDismiss: () => void;
    navigationRef: any;
}) {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-(BANNER_HEIGHT + insets.top + 20))).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const dismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const meta = getMeta(notif.type);

    const dismiss = useCallback(() => {
        clearTimeout(dismissTimer.current);
        Animated.parallel([
            Animated.timing(translateY, { toValue: -(BANNER_HEIGHT + insets.top + 20), duration: 280, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
        ]).start(() => onDismiss());
    }, []);

    useEffect(() => {
        // Slide in
        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, damping: 16, stiffness: 220, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();

        // Auto dismiss
        dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
        return () => clearTimeout(dismissTimer.current);
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
            onPanResponderMove: (_, g) => {
                if (g.dy < 0) translateY.setValue(g.dy);
            },
            onPanResponderRelease: (_, g) => {
                if (g.dy < -20) { dismiss(); } else {
                    Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
                }
            },
        })
    ).current;

    const handleTap = () => {
        dismiss();
        navigateFromNotification(
            { type: notif.type, roomId: notif.roomId, roomName: notif.roomName, ...notif.data },
            navigationRef?.current,
        );
    };

    return (
        <Animated.View
            style={[
                styles.banner,
                { top: insets.top + 10, opacity, transform: [{ translateY }] },
            ]}
            {...panResponder.panHandlers}
        >
            <TouchableOpacity onPress={handleTap} activeOpacity={0.92} style={{ flex: 1 }}>
                <LinearGradient colors={['#0D0619EE', '#0A0415EE']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bannerInner}>
                    {/* Left accent line */}
                    <LinearGradient colors={meta.colors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                        style={styles.accentLine} />

                    {/* Icon */}
                    <LinearGradient colors={meta.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.iconBox}>
                        <MaterialIcons name={meta.icon as any} size={18} color="white" />
                    </LinearGradient>

                    {/* Text */}
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.bannerLabel} numberOfLines={1}>{meta.label}</Text>
                        <Text style={styles.bannerBody} numberOfLines={1}>{notif.body}</Text>
                        {notif.roomName ? (
                            <Text style={styles.bannerRoom} numberOfLines={1}>in {notif.roomName}</Text>
                        ) : null}
                    </View>

                    {/* Dismiss */}
                    <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <MaterialIcons name="close" size={14} color="rgba(255,255,255,0.35)" />
                    </TouchableOpacity>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Banner manager (mounted once in RootNavigator) ────────────────
export function NotifBannerManager({ navigationRef }: { navigationRef: any }) {
    const [queue, setQueue] = useState<InAppNotif[]>([]);
    const idCounter = useRef(0);

    const push = useCallback((notif: InAppNotif) => {
        // Deduplicate by type+roomId (avoid spamming the same room)
        const id = `${++idCounter.current}-${notif.type}-${notif.roomId ?? 'x'}`;
        setQueue(q => [...q.slice(-2), { ...notif, id }]); // max 3 visible
    }, []);

    // Subscribe to notifEmitter (from push foreground handler)
    useEffect(() => {
        const unsub = notifEmitter.subscribe(push);
        return () => { unsub(); };
    }, [push]);

    // Also subscribe to socket 'notification' events (in-app real-time)
    useEffect(() => {
        const socket = socketManager.socket;
        if (!socket) return;

        const handler = (data: any) => {
            push({
                id: `socket-${Date.now()}`,
                type: data.type ?? 'system',
                title: data.title ?? 'Gossip Monkey',
                body: data.body ?? data.message ?? '',
                roomId: data.roomId,
                roomName: data.roomName,
                data,
            });
        };

        socket.on('notification', handler);
        return () => { socket.off('notification', handler); };
    }, [push]);

    const remove = useCallback((id: string) => {
        setQueue(q => q.filter(n => n.id !== id));
    }, []);

    return (
        <>
            {queue.map(notif => (
                <Banner key={notif.id} notif={notif} onDismiss={() => remove(notif.id)} navigationRef={navigationRef} />
            ))}
        </>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: 'absolute', left: 12, right: 12, zIndex: 9999,
        borderRadius: 18, overflow: 'hidden',
        // iOS shadow
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4, shadowRadius: 20,
        // Android shadow
        elevation: 20,
    },
    bannerInner: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, paddingRight: 14,
        borderRadius: 18, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    accentLine: {
        width: 3, alignSelf: 'stretch', borderRadius: 2, marginRight: 12, marginLeft: 14,
    },
    iconBox: {
        width: 36, height: 36, borderRadius: 11,
        alignItems: 'center', justifyContent: 'center',
    },
    bannerLabel: { color: 'white', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
    bannerBody: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500', marginTop: 1 },
    bannerRoom: { color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 },
    closeBtn: { padding: 4, marginLeft: 8 },
});
