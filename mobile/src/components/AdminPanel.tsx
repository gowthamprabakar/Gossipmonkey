import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, Modal, StyleSheet,
    FlatList, Image, Pressable,
} from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatStore, KnockRequest } from '../store/useChatStore';
import { socketManager } from '../services/socket';

interface AdminPanelProps {
    visible: boolean;
    onClose: () => void;
    roomId: string;
    isPrivate?: boolean;
}

type TabKey = 'knocks' | 'flags' | 'bans';

interface FlagItem {
    id: string;
    messageId: string;
    messageText: string;
    flaggerName: string;
    createdAt: string;
}

interface BanItem {
    id: string;
    name: string;
    avatar: string;
    bannedAt: string;
}

export function AdminPanel({ visible, onClose, roomId, isPrivate = false }: AdminPanelProps) {
    const [tab, setTab] = useState<TabKey>('knocks');
    const [flags, setFlags] = useState<FlagItem[]>([]);
    const [bans, setBans] = useState<BanItem[]>([]);
    const { knockQueue, approveKnock } = useChatStore();

    const slideY = useSharedValue(600);

    useEffect(() => {
        if (visible) {
            slideY.value = withSpring(0, { damping: 18 });
            // Request admin data from backend
            const socket = socketManager.socket;
            if (socket) {
                socket.emit('request_room_admin_data', { roomId });
                socket.on('flags_updated', (data: { flags: FlagItem[] }) => setFlags(data.flags ?? []));
                socket.on('banned_users_updated', (data: { users: BanItem[] }) => setBans(data.users ?? []));
            }
        } else {
            slideY.value = withTiming(600, { duration: 280 });
            const socket = socketManager.socket;
            if (socket) {
                socket.off('flags_updated');
                socket.off('banned_users_updated');
            }
        }
    }, [visible, roomId]);

    const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));

    const handleResolveFlag = (flagId: string) => {
        socketManager.socket?.emit('resolve_flag', { roomId, flagId });
    };
    const handleDeleteFromFlag = (messageId: string) => {
        socketManager.socket?.emit('delete_message', { roomId, messageId });
    };
    const handleUnban = (userId: string) => {
        socketManager.socket?.emit('unban_user', { roomId, targetUserId: userId });
    };

    const TABS: { key: TabKey; icon: string; label: string; count?: number }[] = [
        { key: 'knocks', icon: 'door-front', label: 'Knocks', count: knockQueue.length },
        { key: 'flags', icon: 'flag', label: 'Flags', count: flags.length },
        { key: 'bans', icon: 'block', label: 'Bans', count: bans.length },
    ];

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />
            <Animated.View style={[styles.sheet, sheetStyle]}>
                {/* Handle */}
                <View style={styles.handle} />

                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.shieldIcon}>
                            <Text style={{ fontSize: 14 }}>🛡️</Text>
                        </View>
                        <Text style={styles.title}>Admin Panel</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                </View>

                {/* Tab bar */}
                <View style={styles.tabBar}>
                    {TABS.map(t => {
                        const active = tab === t.key;
                        return (
                            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
                                style={[styles.tabBtn, active && styles.tabBtnActive]}>
                                <MaterialIcons name={t.icon as any} size={16}
                                    color={active ? 'white' : 'rgba(255,255,255,0.35)'} />
                                <Text style={[styles.tabLabel, active && { color: 'white' }]}>
                                    {t.label}
                                </Text>
                                {(t.count ?? 0) > 0 && (
                                    <View style={[styles.badge, active && styles.badgeActive]}>
                                        <Text style={{ color: 'white', fontSize: 9, fontWeight: '800' }}>
                                            {t.count}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                    {tab === 'knocks' && (
                        <KnocksTab knocks={knockQueue} onApprove={(k) => approveKnock(k.socketId, k.roomId, true)}
                            onDeny={(k) => approveKnock(k.socketId, k.roomId, false)} />
                    )}
                    {tab === 'flags' && (
                        <FlagsTab flags={flags}
                            onResolve={(id) => handleResolveFlag(id)}
                            onDelete={(msgId) => handleDeleteFromFlag(msgId)} />
                    )}
                    {tab === 'bans' && (
                        <BansTab bans={bans} onUnban={(id) => handleUnban(id)} />
                    )}
                </View>
            </Animated.View>
        </Modal>
    );
}

// ── Knocks tab ────────────────────────────────────────────────────
function KnocksTab({ knocks, onApprove, onDeny }: {
    knocks: KnockRequest[];
    onApprove: (k: KnockRequest) => void;
    onDeny: (k: KnockRequest) => void;
}) {
    if (knocks.length === 0) return <EmptyState icon="door-front" text="No pending knocks 🚪" />;
    return (
        <FlatList data={knocks} keyExtractor={k => k.socketId}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }) => (
                <View style={styles.rowCard}>
                    <Image
                        source={{ uri: `https://api.dicebear.com/9.x/notionists/png?seed=${item.persona.name}` }}
                        style={styles.rowAvatar} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowName}>{item.persona.name}</Text>
                        <Text style={styles.rowSub}>🍌 {item.persona.score ?? 0} bananas</Text>
                    </View>
                    <TouchableOpacity onPress={() => onDeny(item)} style={styles.denyBtn}>
                        <MaterialIcons name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onApprove(item)} style={styles.approveBtn}>
                        <LinearGradient colors={['#059669', '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.approveBtnInner}>
                            <MaterialIcons name="check" size={16} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )} />
    );
}

// ── Flags tab ─────────────────────────────────────────────────────
function FlagsTab({ flags, onResolve, onDelete }: {
    flags: FlagItem[];
    onResolve: (id: string) => void;
    onDelete: (msgId: string) => void;
}) {
    if (flags.length === 0) return <EmptyState icon="flag" text="No active flags 🎉" />;
    return (
        <FlatList data={flags} keyExtractor={f => f.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }) => (
                <View style={styles.flagCard}>
                    <View style={styles.flagAccent} />
                    <Text style={styles.flagText} numberOfLines={2}>{item.messageText}</Text>
                    <Text style={styles.flagMeta}>Flagged by <Text style={{ color: '#F87171' }}>{item.flaggerName}</Text></Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        <TouchableOpacity onPress={() => onResolve(item.id)} style={styles.resolveBtn}>
                            <Text style={{ color: '#34D399', fontSize: 12, fontWeight: '700' }}>Resolve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onDelete(item.messageId)} style={styles.deleteBtn}>
                            <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '700' }}>Delete msg</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )} />
    );
}

// ── Bans tab ──────────────────────────────────────────────────────
function BansTab({ bans, onUnban }: { bans: BanItem[]; onUnban: (id: string) => void }) {
    if (bans.length === 0) return <EmptyState icon="block" text="Everyone behaved 🐒" />;
    return (
        <FlatList data={bans} keyExtractor={b => b.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }) => (
                <View style={styles.rowCard}>
                    <Image source={{ uri: `https://api.dicebear.com/9.x/notionists/png?seed=${item.name}` }}
                        style={styles.rowAvatar} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rowName}>{item.name}</Text>
                        <Text style={styles.rowSub}>Banned</Text>
                    </View>
                    <TouchableOpacity onPress={() => onUnban(item.id)} style={styles.unbanBtn}>
                        <Text style={{ color: '#34D399', fontSize: 12, fontWeight: '700' }}>Unban</Text>
                    </TouchableOpacity>
                </View>
            )} />
    );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.5, gap: 12 }}>
            <MaterialIcons name={icon as any} size={42} color="rgba(255,255,255,0.3)" />
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: 14 }}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: '#0A0818', height: '75%',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    },
    handle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignSelf: 'center', marginTop: 10, marginBottom: 4,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 12,
    },
    shieldIcon: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    title: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 16 },
    closeBtn: {
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center', justifyContent: 'center',
    },
    tabBar: {
        flexDirection: 'row', gap: 8,
        paddingHorizontal: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    tabBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    tabBtnActive: {
        backgroundColor: 'rgba(124,58,237,0.15)',
        borderColor: 'rgba(124,58,237,0.35)',
    },
    tabLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '700' },
    badge: {
        backgroundColor: 'rgba(239,68,68,0.5)', borderRadius: 99,
        paddingHorizontal: 5, paddingVertical: 1, minWidth: 16, alignItems: 'center',
    },
    badgeActive: { backgroundColor: '#7C3AED' },
    // ── Row card ──
    rowCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 16, padding: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    rowAvatar: { width: 40, height: 40, borderRadius: 12 },
    rowName: { color: 'white', fontWeight: '700', fontSize: 14 },
    rowSub: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },
    denyBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    approveBtn: { width: 36, height: 36, borderRadius: 10, overflow: 'hidden' },
    approveBtnInner: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    unbanBtn: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
        backgroundColor: 'rgba(52,211,153,0.1)',
        borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)',
    },
    // ── Flag card ──
    flagCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: 'rgba(248,113,113,0.15)',
        overflow: 'hidden',
    },
    flagAccent: {
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, backgroundColor: '#F87171',
    },
    flagText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 19 },
    flagMeta: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 },
    resolveBtn: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
        backgroundColor: 'rgba(52,211,153,0.1)',
        borderWidth: 1, borderColor: 'rgba(52,211,153,0.25)',
    },
    deleteBtn: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
        backgroundColor: 'rgba(248,113,113,0.08)',
        borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
    },
});
