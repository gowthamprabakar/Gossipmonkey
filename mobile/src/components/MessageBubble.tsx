import React, { useEffect, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
    PanResponder, Animated as RNAnimated,
} from 'react-native';
import Animated, {
    FadeInDown, FadeOutDown, useSharedValue,
    withSequence, withTiming, useAnimatedStyle,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useChatStore } from '../store/useChatStore';

const { width: W } = Dimensions.get('window');

export type MessageType = 'user' | 'monkey_action' | 'system' | 'image';

export interface MessageProps {
    message: {
        id: string;
        text: string;
        type: MessageType;
        imageUrl?: string | null;
        timestamp: string;
        sender: { id: string; name: string; avatar: string; };
        replyTo?: { id: string; text: string; senderName: string; };
        reactions?: Record<string, string>;
    };
    isOwnMessage: boolean;
    currentUserId?: string;
    onLongPress?: (msg: MessageProps['message']) => void;
    onReact?: (messageId: string, emoji: string) => void;
}

// ── Quick reactions ───────────────────────────────────────────────
const QUICK_REACTIONS = ['😂', '🔥', '💯', '🐒', '👀', '❤️', '💀'];

// ── Format timestamp ─────────────────────────────────────────────
const formatTime = (iso: string) => {
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
};

// ── System pill ───────────────────────────────────────────────────
function SystemPill({ text }: { text: string }) {
    return (
        <View style={styles.sysPill}>
            <Text style={styles.sysText}>{text}</Text>
        </View>
    );
}

// ── Monkey AI card ────────────────────────────────────────────────
function MonkeyBubble({ message, onLongPress }: Pick<MessageProps, 'message' | 'onLongPress'>) {
    return (
        <Animated.View entering={FadeInDown.springify().damping(14)} style={styles.monkeyCard}>
            {/* Orange left accent */}
            <View style={styles.monkeyAccent} />

            {/* Header */}
            <View style={styles.monkeyHeader}>
                <View style={styles.monkeyAvatarBox}>
                    <Image
                        source={{ uri: `https://api.dicebear.com/9.x/notionists/png?seed=${message.sender.name}&backgroundColor=0a0010` }}
                        style={{ width: '100%', height: '100%' }}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.monkeyName}>{message.sender.name}</Text>
                    <Text style={styles.monkeyTime}>{formatTime(message.timestamp)}</Text>
                </View>
                <View style={styles.hypeTag}>
                    <Text style={styles.hypeText}>🤖 AI</Text>
                </View>
            </View>

            {/* Body */}
            <TouchableOpacity onLongPress={() => onLongPress?.(message)} activeOpacity={0.85}>
                {message.text ? (
                    <Text style={styles.monkeyText}>{message.text}</Text>
                ) : null}
                {message.imageUrl && (
                    <Image source={{ uri: message.imageUrl }}
                        style={styles.inlineImage} resizeMode="cover" />
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Reaction pills ────────────────────────────────────────────────
function ReactionRow({ reactions, messageId, currentUserId, onReact, onAddReact }: {
    reactions: Record<string, string>; // Expected from backend: Record<userId, emoji>
    messageId: string;
    currentUserId?: string;
    onReact?: (messageId: string, emoji: string) => void;
    onAddReact?: () => void;
}) {
    // Transform backend { userId: emoji } to { emoji: userId[] } for rendering
    const aggregated = Object.entries(reactions || {}).reduce((acc, [userId, emoji]) => {
        if (!acc[emoji]) acc[emoji] = [];
        acc[emoji].push(userId);
        return acc;
    }, {} as Record<string, string[]>);

    return (
        <View style={styles.reactionRow}>
            {Object.entries(aggregated).map(([emoji, users]) => {
                const mine = currentUserId ? users.includes(currentUserId) : false;
                return (
                    <TouchableOpacity key={emoji} onPress={() => onReact?.(messageId, emoji)}
                        style={[styles.reactionPill, mine && styles.reactionPillMine]}>
                        <Text style={{ fontSize: 12 }}>{emoji}</Text>
                        <Text style={[styles.reactionCount, mine && { color: 'white' }]}>
                            {users.length}
                        </Text>
                    </TouchableOpacity>
                );
            })}
            <TouchableOpacity onPress={onAddReact} style={styles.addReactBtn}>
                <MaterialIcons name="add-reaction" size={14} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
        </View>
    );
}

// ── Main bubble ───────────────────────────────────────────────────
export function MessageBubble({
    message, isOwnMessage, currentUserId, onLongPress, onReact,
}: MessageProps) {
    // ── System message ──
    if (message.type === 'system') return <SystemPill text={message.text} />;

    // ── Monkey AI message ──
    if (message.type === 'monkey_action') {
        return <MonkeyBubble message={message} onLongPress={onLongPress} />;
    }

    // ── User / own message ──
    const { setReplyingTo } = useChatStore();

    // ── Swipe to reply logic ──
    const pan = useRef(new RNAnimated.Value(0)).current;
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // only respond to clear horizontal rightward swipes
                return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 20 && gestureState.dx > 0;
            },
            onPanResponderMove: (_, gestureState) => {
                // cap the swipe distance
                const tension = gestureState.dx > 0 ? Math.min(gestureState.dx / 2, 60) : 0;
                pan.setValue(tension);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx > 50) {
                    setReplyingTo(message);
                }
                RNAnimated.spring(pan, {
                    toValue: 0,
                    useNativeDriver: true,
                    bounciness: 12,
                }).start();
            },
            onPanResponderTerminate: () => {
                RNAnimated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
            }
        })
    ).current;

    return (
        <Animated.View
            entering={FadeInDown.duration(250).springify()}
            style={[styles.row, isOwnMessage ? styles.rowRight : styles.rowLeft]}
        >
            {/* Avatar (other user only) */}
            {!isOwnMessage && (
                <View style={styles.avatarWrapper}>
                    <Image
                        source={{ uri: message.sender?.avatar || `https://api.dicebear.com/9.x/notionists/png?seed=${message.sender?.name || 'unknown'}` }}
                        style={styles.avatar}
                    />
                </View>
            )}

            <View style={[styles.bubbleCol, isOwnMessage ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                {/* Sender label + time */}
                <View style={[styles.labelRow, isOwnMessage && { flexDirection: 'row-reverse' }]}>
                    <Text style={[styles.senderName, isOwnMessage && { color: 'rgba(255,255,255,0.35)' }]}>
                        {isOwnMessage ? 'YOU' : message.sender?.name || 'Unknown User'}
                    </Text>
                    <Text style={styles.timeText}>{formatTime(message.timestamp)}</Text>
                </View>

                {/* Bubble Wrapper with Swipe */}
                <RNAnimated.View
                    {...panResponder.panHandlers}
                    style={{ transform: [{ translateX: pan }] }}
                >
                    <TouchableOpacity
                        onPress={() => onLongPress?.(message)}
                        onLongPress={() => onLongPress?.(message)}
                        activeOpacity={0.85}
                        style={[
                            styles.bubble,
                            isOwnMessage ? styles.bubbleOwn : styles.bubbleOther,
                        ]}
                    >
                        {isOwnMessage ? (
                            <LinearGradient
                                colors={['#7C3AED', '#EC4899']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.ownGrad}
                            >
                                {message.replyTo && (
                                    <View style={styles.replyInnerOwn}>
                                        <Text style={styles.replyNameOwn}>{message.replyTo.senderName}</Text>
                                        <Text style={styles.replyTextOwn} numberOfLines={1}>{message.replyTo.text || '📷 Image'}</Text>
                                    </View>
                                )}
                                {message.text ? <Text style={styles.ownText}>{message.text}</Text> : null}
                                {message.imageUrl && (
                                    <Image source={{ uri: message.imageUrl }}
                                        style={[styles.inlineImage, { marginTop: message.text ? 8 : 0 }]}
                                        resizeMode="cover" />
                                )}
                            </LinearGradient>
                        ) : (
                            <View style={styles.otherInner}>
                                {/* Top gloss */}
                                <View style={styles.otherGloss} />
                                {message.replyTo && (
                                    <View style={styles.replyInnerOther}>
                                        <View style={styles.replyAccentOther} />
                                        <View>
                                            <Text style={styles.replyNameOther}>{message.replyTo.senderName}</Text>
                                            <Text style={styles.replyTextOther} numberOfLines={1}>{message.replyTo.text || '📷 Image'}</Text>
                                        </View>
                                    </View>
                                )}
                                {message.text ? <Text style={styles.otherText}>{message.text}</Text> : null}
                                {message.imageUrl && (
                                    <Image source={{ uri: message.imageUrl }}
                                        style={[styles.inlineImage, { marginTop: message.text ? 8 : 0 }]}
                                        resizeMode="cover" />
                                )}
                            </View>
                        )}
                    </TouchableOpacity>
                </RNAnimated.View>

                {/* Reactions */}
                <ReactionRow
                    reactions={message.reactions || {}}
                    messageId={message.id}
                    currentUserId={currentUserId}
                    onReact={onReact}
                    onAddReact={() => onLongPress?.(message)}
                />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    // ── System ──
    sysPill: {
        alignSelf: 'center', marginVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5,
    },
    sysText: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '600' },

    // ── Monkey ──
    monkeyCard: {
        marginHorizontal: 16, marginVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 20, padding: 14,
        borderWidth: 1, borderColor: 'rgba(251,146,60,0.18)',
        overflow: 'hidden',
    },
    monkeyAccent: {
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, backgroundColor: '#F97316', borderRadius: 3,
    },
    monkeyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    monkeyAvatarBox: {
        width: 32, height: 32, borderRadius: 10, overflow: 'hidden',
        borderWidth: 1.5, borderColor: 'rgba(251,146,60,0.4)',
    },
    monkeyName: { color: '#FB923C', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
    monkeyTime: { color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 1 },
    hypeTag: {
        backgroundColor: 'rgba(251,146,60,0.12)',
        borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
        borderWidth: 1, borderColor: 'rgba(251,146,60,0.25)',
    },
    hypeText: { color: '#FB923C', fontSize: 9, fontWeight: '800' },
    monkeyText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 22 },

    // ── Row layout ──
    row: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 16 },
    rowLeft: { justifyContent: 'flex-start' },
    rowRight: { justifyContent: 'flex-end' },

    // ── Replies ──
    replyInnerOwn: {
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
        marginBottom: 6, borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.8)',
    },
    replyNameOwn: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '800' },
    replyTextOwn: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
    replyInnerOther: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
        marginBottom: 6, flexDirection: 'row', gap: 8,
    },
    replyAccentOther: { width: 3, backgroundColor: '#818CF8', borderRadius: 3 },
    replyNameOther: { color: '#818CF8', fontSize: 11, fontWeight: '800' },
    replyTextOther: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },

    // ── Avatar ──
    avatarWrapper: { alignSelf: 'flex-end', marginRight: 8 },
    avatar: {
        width: 32, height: 32, borderRadius: 10,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },

    // ── Bubble ──
    bubbleCol: { maxWidth: W * 0.72, gap: 4 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, marginBottom: 2 },
    senderName: { color: '#818CF8', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    timeText: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '600' },

    bubble: { borderRadius: 18, overflow: 'hidden' },
    bubbleOwn: { borderTopRightRadius: 4 },
    bubbleOther: { borderTopLeftRadius: 4 },

    ownGrad: { paddingHorizontal: 14, paddingVertical: 11 },
    ownText: { color: 'white', fontSize: 14, lineHeight: 21, fontWeight: '500' },

    otherInner: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        paddingHorizontal: 14, paddingVertical: 11,
        overflow: 'hidden',
    },
    otherGloss: {
        position: 'absolute', top: 0, left: 10, right: 10,
        height: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99,
    },
    otherText: { color: 'rgba(255,255,255,0.88)', fontSize: 14, lineHeight: 21 },

    inlineImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12 },

    // ── Reactions ──
    reactionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 3 },
    reactionPill: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    reactionPillMine: {
        backgroundColor: 'rgba(124,58,237,0.2)',
        borderColor: 'rgba(124,58,237,0.4)',
    },
    reactionCount: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
    addReactBtn: {
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
});
