import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    RefreshControl, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue, useAnimatedStyle, withDelay, withTiming, interpolate,
} from 'react-native-reanimated';
import { api } from '../../services/api';

// ── Types ─────────────────────────────────────────────────────────
interface Notif {
    id: string;
    type: string;
    payload_json: string;
    read_at: string | null;
    created_at: string;
    room_id?: string;
}

// ── Helpers ───────────────────────────────────────────────────────
const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diffMs / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return 'just now';
};

const META: Record<string, { icon: string; color: string; label: string }> = {
    flagged_message: { icon: 'flag', color: '#F97316', label: 'Message Flagged' },
    room_joined: { icon: 'group-add', color: '#22D3EE', label: 'New Villain Joined' },
    reaction: { icon: 'sentiment-very-satisfied', color: '#EC4899', label: 'Reaction Received' },
    tip: { icon: 'payments', color: '#FBBF24', label: 'Banana Tip 🍌' },
    knock: { icon: 'door-front', color: '#6366F1', label: 'Someone Knocked' },
    system: { icon: 'notifications', color: '#818CF8', label: 'System Update' },
};

const notifMeta = (type: string) => META[type] ?? META.system;

const parsePayload = (raw: string): any => {
    try { return JSON.parse(raw); } catch { return {}; }
};

const notifBody = (n: Notif): string => {
    const p = parsePayload(n.payload_json ?? '{}');
    if (n.type === 'chat_message') return p.senderName ? `${p.senderName}: ${p.preview ?? 'sent a message'}` : 'New message in the jungle';
    if (n.type === 'reaction') return `You got a ${p.reaction ?? '🍌'} reaction on your message!`;
    if (n.type === 'mention') return `${p.senderName ?? 'Someone'} mentioned you in chat`;
    if (n.type === 'flagged_message') return `A message was flagged for review in ${p.roomName ?? 'your room'}.`;
    if (n.type === 'room_joined') return `${p.name ?? 'Someone'} joined your jungle.`;
    if (n.type === 'tip') return `You received ${p.amount ?? '?'} bananas 🍌 from ${p.fromName ?? 'a monkey'}`;
    if (n.type === 'reward') return `You earned ${p.amount ?? '?'} bananas 🍌 — ${p.reason ?? 'keep it up!'}`;
    if (n.type === 'knock') return `${p.name ?? 'Someone'} is knocking on your private room.`;
    if (n.type === 'entry_granted') return `You\'ve been let into ${p.roomName ?? 'the room'}!`;
    if (n.type === 'entry_denied') return `Entry denied for ${p.roomName ?? 'the room'}.`;
    return p.message ?? 'Something happened in the jungle.';
};

// Navigate from a notification row tap
const handleNotifTap = (notif: Notif, navigation: any) => {
    const p = parsePayload(notif.payload_json ?? '{}');
    const roomId = notif.room_id ?? p.roomId;
    const roomName = p.roomName ?? 'Room';

    switch (notif.type) {
        case 'chat_message':
        case 'reaction':
        case 'mention':
        case 'tip':
        case 'knock':
        case 'flagged_message':
        case 'entry_granted':
            if (roomId) navigation.navigate('Chat', { roomId, roomName });
            break;
        case 'reward':
            navigation.navigate('Profile');
            break;
        case 'entry_denied':
            navigation.navigate('Home');
            break;
        default:
            break; // stay on notifications
    }
};

// ── Animated notification row ─────────────────────────────────────
function NotifRow({ notif, idx, onRead, navigation }: { notif: Notif; idx: number; onRead: (id: string) => void; navigation: any }) {
    const t = useSharedValue(0);
    useEffect(() => { t.value = withDelay(idx * 50, withTiming(1, { duration: 350 })); }, []);
    const s = useAnimatedStyle(() => ({
        opacity: t.value,
        transform: [{ translateX: interpolate(t.value, [0, 1], [-20, 0]) }],
    }));

    const meta = notifMeta(notif.type);
    const isUnread = !notif.read_at;

    return (
        <Animated.View style={s}>
            <TouchableOpacity
                onPress={() => {
                    if (isUnread) onRead(notif.id);
                    handleNotifTap(notif, navigation);
                }}
                style={[styles.row, isUnread && styles.rowUnread]}
                activeOpacity={0.7}
            >
                {/* Unread indicator */}
                {isUnread && (
                    <View style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                        backgroundColor: meta.color, borderRadius: 3
                    }} />
                )}

                {/* Icon */}
                <View style={[styles.iconBox, { backgroundColor: `${meta.color}18`, borderColor: `${meta.color}30` }]}>
                    <MaterialIcons name={meta.icon as any} size={20} color={meta.color} />
                </View>

                {/* Content */}
                <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
                        <Text style={styles.time}>{timeAgo(notif.created_at)}</Text>
                    </View>
                    <Text style={[styles.body, { opacity: isUnread ? 0.85 : 0.45 }]} numberOfLines={2}>
                        {notifBody(notif)}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Empty state ───────────────────────────────────────────────────
function EmptyNotifs() {
    return (
        <View style={{ alignItems: 'center', paddingVertical: 60, gap: 16 }}>
            <Text style={{ fontSize: 52 }}>🔕</Text>
            <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 18 }}>
                All quiet in the jungle
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 }}>
                No notifications yet. Cause some chaos to get noticed.
            </Text>
        </View>
    );
}

// ── Main screen ───────────────────────────────────────────────────
export function NotificationScreen({ navigation }: any) {
    const [notifs, setNotifs] = useState<Notif[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifs = useCallback(async () => {
        try {
            const res = await api.get('/notifications');
            setNotifs(res.data?.data ?? []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchNotifs();
        setRefreshing(false);
    }, [fetchNotifs]);

    const markRead = async (id: string) => {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        try { await api.patch(`/notifications/${id}/read`); } catch { }
    };

    const markAllRead = async () => {
        setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        try { await api.patch('/notifications/read-all'); } catch { }
    };

    const unreadCount = notifs.filter(n => !n.read_at).length;

    return (
        <View style={styles.root}>
            {/* Ambient glow */}
            <View pointerEvents="none" style={styles.blob} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                        <MaterialIcons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>

                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        <Text style={styles.title}>Notifications</Text>
                        {unreadCount > 0 && (
                            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 1 }}>
                                {unreadCount} unread
                            </Text>
                        )}
                    </View>

                    {unreadCount > 0 && (
                        <TouchableOpacity onPress={markAllRead} style={styles.readAllBtn}>
                            <Text style={{ color: '#818CF8', fontSize: 11, fontWeight: '700' }}>Mark all read</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Unread count badge strip */}
                {unreadCount > 0 && (
                    <View style={styles.unreadStrip}>
                        <LinearGradient
                            colors={['#7C3AED22', '#EC489922']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.unreadGradient}
                        >
                            <View style={styles.unreadDot} />
                            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' }}>
                                {unreadCount} new since you last checked
                            </Text>
                        </LinearGradient>
                    </View>
                )}

                {loading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator color="#818CF8" size="large" />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818CF8" />
                        }
                    >
                        {notifs.length === 0 ? (
                            <EmptyNotifs />
                        ) : (
                            <View style={{ gap: 8, paddingTop: 12 }}>
                                {notifs.map((n, i) => (
                                    <NotifRow key={n.id} notif={n} idx={i} onRead={markRead} navigation={navigation} />
                                ))}
                            </View>
                        )}
                    </ScrollView>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050210' },
    blob: {
        position: 'absolute', top: -80, right: -60,
        width: 240, height: 240, borderRadius: 120,
        backgroundColor: '#4c1d95', opacity: 0.15,
    },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    navBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center', justifyContent: 'center',
    },
    title: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 18 },
    readAllBtn: {
        paddingHorizontal: 12, paddingVertical: 6,
        backgroundColor: 'rgba(129,140,248,0.1)',
        borderRadius: 99, borderWidth: 1, borderColor: 'rgba(129,140,248,0.2)',
    },
    unreadStrip: { paddingHorizontal: 20, paddingTop: 10 },
    unreadGradient: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    unreadDot: {
        width: 7, height: 7, borderRadius: 4, backgroundColor: '#7C3AED',
    },
    row: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18, padding: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    rowUnread: {
        backgroundColor: 'rgba(129,140,248,0.06)',
        borderColor: 'rgba(129,140,248,0.12)',
    },
    iconBox: {
        width: 42, height: 42, borderRadius: 14,
        borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
    body: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 18 },
    time: { color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: '600' },
});
