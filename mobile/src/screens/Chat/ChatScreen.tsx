import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View, Text, FlatList, KeyboardAvoidingView, Platform,
    TouchableOpacity, Image, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useChatStore, MessageData } from '../../store/useChatStore';
import { useAppStore } from '../../store/useAppStore';
import { MessageBubble } from '../../components/MessageBubble';
import { MessageActionSheet } from '../../components/MessageActionSheet';
import { InputBar } from '../../components/InputBar';
import { AdminPanel } from '../../components/AdminPanel';
import { InviteSheet } from '../../components/InviteSheet';
import { socketManager } from '../../services/socket';
import Reanimated, {
    useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay,
} from 'react-native-reanimated';

// ── System toast types ────────────────────────────────────────────
interface SystemToast {
    text: string;
    type: 'info' | 'alert' | 'success';
    id: number;
}

const TOAST_COLORS = {
    info: ['#1D4ED8', '#2563EB'] as [string, string],
    alert: ['#B91C1C', '#DC2626'] as [string, string],
    success: ['#065F46', '#059669'] as [string, string],
};

// ── Participant card (name + avatar + role badge) ─────────────────
function ParticipantCard({
    name, idx, isCreator, isMe, onPress,
}: { name: string; idx: number; isCreator?: boolean; isMe?: boolean; onPress?: () => void }) {
    const s = useSharedValue(0);
    useEffect(() => { s.value = withDelay(idx * 50, withSpring(1, { damping: 14 })); }, []);
    const animStyle = useAnimatedStyle(() => ({
        opacity: s.value,
        transform: [{ scale: s.value }],
    }));

    const badge = isMe ? { label: 'YOU', color: '#818CF8' } :
        isCreator ? { label: 'ADMIN', color: '#F97316' } :
            { label: null, color: '' };

    return (
        <Reanimated.View style={animStyle}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.75}
                style={{
                    alignItems: 'center', marginRight: 12, width: 52,
                }}
            >
                {/* Avatar with optional glow for admins */}
                <View style={[
                    {
                        width: 42, height: 42, borderRadius: 13, overflow: 'hidden',
                        borderWidth: 1.5,
                        borderColor: isMe ? '#818CF888' : isCreator ? '#F9731688' : 'rgba(255,255,255,0.1)',
                    },
                    isMe && { shadowColor: '#818CF8', shadowRadius: 8, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 } },
                    isCreator && !isMe && { shadowColor: '#F97316', shadowRadius: 6, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 0 } },
                ]}>
                    <Image
                        source={{ uri: `https://api.dicebear.com/9.x/notionists/png?seed=${name}&backgroundColor=0a0a15` }}
                        style={{ width: '100%', height: '100%' }}
                    />
                </View>
                {/* Name */}
                <Text numberOfLines={1} style={{
                    color: isMe ? '#A78BFA' : 'rgba(255,255,255,0.55)',
                    fontSize: 9, fontWeight: '700', marginTop: 3, textAlign: 'center', maxWidth: 50,
                }}>{name}</Text>
                {/* Role badge */}
                {badge.label && (
                    <View style={{
                        backgroundColor: `${badge.color}22`,
                        borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginTop: 2,
                        borderWidth: 0.5, borderColor: `${badge.color}44`,
                    }}>
                        <Text style={{ color: badge.color, fontSize: 7, fontWeight: '900', letterSpacing: 0.3 }}>
                            {badge.label}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Reanimated.View>
    );
}

// ── Main screen ───────────────────────────────────────────────────
export function ChatScreen({ route, navigation }: any) {
    const { roomId, roomName, roomType = 'public', creatorId, roomPin } = route.params ?? {};
    const {
        messages, participants, participantsCount, aiAvailable,
        knockQueue, joinRoom, leaveRoom, sendMessage,
    } = useChatStore();
    const { persona } = useAppStore();

    const flatListRef = useRef<FlatList>(null);
    const [selectedMsg, setSelectedMsg] = useState<MessageData | null>(null);
    const [adminOpen, setAdminOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [toasts, setToasts] = useState<SystemToast[]>([]);
    const toastAnim = useRef(new Animated.Value(0)).current;

    const isAdmin = persona?.id === creatorId;
    const isPrivate = roomType === 'private';

    // ── Join / leave ──
    useEffect(() => {
        joinRoom(roomId);
        return () => leaveRoom(roomId);
    }, [roomId]);

    // ── System toast listener ─────────────────────────────────────
    useEffect(() => {
        const socket = socketManager.socket;
        if (!socket) return;
        const handler = (msg: any) => {
            const toast: SystemToast = {
                text: msg.text ?? '',
                type: msg.type ?? 'info',
                id: Date.now(),
            };
            setToasts(prev => [toast, ...prev].slice(0, 2));
            // auto dismiss
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 3500);
        };
        socket.on('system_message', handler);
        return () => { socket.off('system_message', handler); };
    }, []);

    // ── Knock badge pulse ─────────────────────────────────────────
    const knockBadge = knockQueue.length;

    // ── Handle send ───────────────────────────────────────────────
    const handleSend = (text: string, imageUrl?: string) => {
        sendMessage(roomId, text, imageUrl);
    };

    // ── Handle react ──────────────────────────────────────────────
    const handleReact = (messageId: string, emoji: string) => {
        socketManager.socket?.emit('react_message', { roomId, messageId, reaction: emoji });
    };

    // ── Handle tip ────────────────────────────────────────────────
    const handleTip = (targetUserId: string, amount: number) => {
        socketManager.socket?.emit('tip_user', {
            roomId, toUserId: targetUserId, amount,
        });
    };

    // ── Handle flag ───────────────────────────────────────────────
    const handleFlag = (messageId: string) => {
        socketManager.socket?.emit('flag_message', { roomId, messageId });
    };

    // ── Admin: delete ─────────────────────────────────────────────
    const handleDelete = (messageId: string) => {
        socketManager.socket?.emit('delete_message', { roomId, messageId });
    };

    // ── Admin: kick ───────────────────────────────────────────────
    const handleKick = (targetUserId: string) => {
        socketManager.socket?.emit('kick_user', { roomId, targetUserId });
    };

    // ── Render bubble ─────────────────────────────────────────────
    const renderBubble = useCallback(({ item }: { item: MessageData }) => (
        <MessageBubble
            message={item}
            isOwnMessage={item.sender?.id === persona?.id}
            currentUserId={persona?.id}
            onLongPress={setSelectedMsg}
            onReact={handleReact}
        />
    ), [persona?.id]);

    return (
        <View style={styles.root}>
            {/* ── Ambient background ── */}
            <View pointerEvents="none" style={styles.blob1} />
            <View pointerEvents="none" style={styles.blob2} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                >
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                            <MaterialIcons name="arrow-back" size={22} color="white" />
                        </TouchableOpacity>

                        <View style={{ flex: 1, paddingHorizontal: 12 }}>
                            <Text style={styles.roomName} numberOfLines={1}>{roomName}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
                                <View style={[styles.aiDot, { backgroundColor: aiAvailable ? '#22C55E' : '#EF4444' }]} />
                                <Text style={styles.aiStatus}>
                                    {aiAvailable ? 'MONKEY LIVE' : 'MONKEY OFFLINE'}
                                </Text>
                                <Text style={styles.separator}>·</Text>
                                <Text style={styles.aiStatus}>{participantsCount} online</Text>
                                {isPrivate && (
                                    <>
                                        <Text style={styles.separator}>·</Text>
                                        <MaterialIcons name="lock" size={9} color="rgba(255,255,255,0.3)" />
                                        <Text style={styles.aiStatus}>PRIVATE</Text>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Right buttons */}
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {/* Share/invite button — only for private room creator */}
                            {isPrivate && isAdmin && (
                                <TouchableOpacity onPress={() => setInviteOpen(true)} style={styles.navBtn}>
                                    <MaterialIcons name="share" size={20} color="#A78BFA" />
                                </TouchableOpacity>
                            )}
                            {/* Admin shield — admin only */}
                            {isAdmin && (
                                <TouchableOpacity onPress={() => setAdminOpen(true)} style={styles.navBtn}>
                                    <View>
                                        <MaterialIcons name="shield" size={20} color="#F97316" />
                                        {knockBadge > 0 && (
                                            <View style={styles.knockBadge}>
                                                <Text style={{ color: 'white', fontSize: 7, fontWeight: '800' }}>
                                                    {knockBadge}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            )}
                            {/* Settings: admin → full edit; member → info/view only */}
                            {isAdmin ? (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('RoomSettings', { roomId, isAdmin: true })}
                                    style={styles.navBtn}>
                                    <MaterialIcons name="settings" size={20} color="rgba(255,255,255,0.6)" />
                                </TouchableOpacity>
                            ) : (
                                // Non-admin: info icon → read-only room info (no editing)
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('RoomSettings', { roomId, isAdmin: false })}
                                    style={styles.navBtn}>
                                    <MaterialIcons name="info-outline" size={20} color="rgba(255,255,255,0.3)" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* ── Participants strip (always visible, scrollable) ── */}
                    <View style={styles.strip}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={styles.stripLabel}>
                                👥 {participantsCount > 0 ? participantsCount : participants.length} online
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Text style={{ fontSize: 10 }}>🍌</Text>
                                <Text style={styles.scoreText}>{persona?.score ?? 0}</Text>
                            </View>
                        </View>
                        {participants.length > 0 ? (
                            <View>
                                {/* Horizontal scroll of member cards */}
                                <View style={{ flexDirection: 'row' }}>
                                    {participants.slice(0, 12).map((p, i) => (
                                        <ParticipantCard
                                            key={p.id}
                                            name={p.name}
                                            idx={i}
                                            isCreator={p.id === creatorId}
                                            isMe={p.id === persona?.id}
                                            onPress={() => {
                                                // Mini profile alert — tap any participant
                                                // (future: open mini profile sheet)
                                            }}
                                        />
                                    ))}
                                    {participants.length > 12 && (
                                        <View style={styles.moreCard}>
                                            <Text style={styles.moreText}>+{participants.length - 12}</Text>
                                            <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 7, marginTop: 1 }}>more</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ) : (
                            // Skeleton placeholders while participants load
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {[0, 1, 2, 3].map(i => (
                                    <View key={i} style={styles.skeleton} />
                                ))}
                            </View>
                        )}
                    </View>

                    {/* ── System toasts ── */}
                    <View style={styles.toastStack} pointerEvents="none">
                        {toasts.map(t => (
                            <LinearGradient key={t.id} colors={TOAST_COLORS[t.type]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.toast}>
                                <MaterialIcons
                                    name={t.type === 'alert' ? 'error' : t.type === 'success' ? 'check-circle' : 'info'}
                                    size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.toastText} numberOfLines={2}>{t.text}</Text>
                            </LinearGradient>
                        ))}
                    </View>

                    {/* ── Messages ── */}
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={item => item.id}
                        inverted
                        renderItem={renderBubble}
                        contentContainerStyle={{ paddingVertical: 12 }}
                        showsVerticalScrollIndicator={false}
                        keyboardDismissMode="interactive"
                    />

                    {/* ── Input bar ── */}
                    <InputBar
                        onSend={handleSend}
                        onPaintCommand={() => { }}
                        isAdmin={isAdmin}
                        onAdminPanel={() => setAdminOpen(true)}
                    />

                    {/* ── Safe area bottom ── */}
                    <View style={{ height: Platform.OS === 'ios' ? 34 : 0 }} />
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* ── Message action sheet ── */}
            <MessageActionSheet
                visible={!!selectedMsg}
                message={selectedMsg}
                isAdmin={isAdmin}
                isOwnMessage={selectedMsg?.sender.id === persona?.id}
                onClose={() => setSelectedMsg(null)}
                onReact={(emoji) => selectedMsg && handleReact(selectedMsg.id, emoji)}
                onTip={(amount) => selectedMsg && handleTip(selectedMsg.sender.id, amount)}
                onFlag={() => selectedMsg && handleFlag(selectedMsg.id)}
                onDelete={isAdmin ? () => selectedMsg && handleDelete(selectedMsg.id) : undefined}
                onKick={isAdmin ? () => selectedMsg && handleKick(selectedMsg.sender.id) : undefined}
            />

            {/* ── Admin panel ── */}
            {isAdmin && (
                <AdminPanel
                    visible={adminOpen}
                    onClose={() => setAdminOpen(false)}
                    roomId={roomId}
                    isPrivate={isPrivate}
                />
            )}

            {/* ── Invite sheet ── only for private room creator ── */}
            {isPrivate && isAdmin && (
                <InviteSheet
                    visible={inviteOpen}
                    onClose={() => setInviteOpen(false)}
                    roomId={roomId}
                    roomName={roomName}
                    roomType={roomType}
                    roomPin={roomPin}
                    requiresApproval={route.params?.requiresApproval}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050210' },
    blob1: {
        position: 'absolute', top: -60, right: -40,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: '#4C1D95', opacity: 0.1,
    },
    blob2: {
        position: 'absolute', bottom: 100, left: -60,
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: '#0C4A6E', opacity: 0.1,
    },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    navBtn: {
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    roomName: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 15 },
    aiDot: { width: 5, height: 5, borderRadius: 3 },
    aiStatus: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
    separator: { color: 'rgba(255,255,255,0.15)', fontSize: 9 },
    knockBadge: {
        position: 'absolute', top: -3, right: -3,
        width: 14, height: 14, borderRadius: 7,
        backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
    },
    // ── Participants strip ──
    strip: {
        paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    stripLabel: {
        color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700', letterSpacing: 0.3,
    },
    moreCard: {
        width: 42, height: 42, borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
    },
    moreText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800' },
    skeleton: {
        width: 42, height: 42, borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        marginRight: 12,
    },
    overflowBubble: {
        width: 28, height: 28, borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
    },
    scoreText: { color: '#FBBF24', fontSize: 11, fontWeight: '800' },
    // ── Toasts ──
    toastStack: {
        position: 'absolute', top: 90, left: 16, right: 16, zIndex: 100, gap: 6,
    },
    toast: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    },
    toastText: { flex: 1, color: 'white', fontSize: 12, fontWeight: '600' },
});
