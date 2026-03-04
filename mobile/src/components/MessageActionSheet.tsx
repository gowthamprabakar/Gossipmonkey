import React, { useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Modal, Animated,
    StyleSheet, PanResponder, Dimensions, Clipboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageData } from '../store/useChatStore';

const { height: H } = Dimensions.get('window');
const SHEET_H = 320;

const EMOJIS = ['😂', '🔥', '💯', '🐒', '👀', '❤️', '💀', '🌶️'];

interface ActionSheetProps {
    visible: boolean;
    message: MessageData | null;
    isAdmin?: boolean;
    isOwnMessage?: boolean;
    onClose: () => void;
    onReact: (emoji: string) => void;
    onTip: (amount: number) => void;
    onFlag: () => void;
    onDelete?: () => void;
    onKick?: () => void;
}

export function MessageActionSheet({
    visible, message, isAdmin = false, isOwnMessage = false,
    onClose, onReact, onTip, onFlag, onDelete, onKick,
}: ActionSheetProps) {
    const slideAnim = useRef(new Animated.Value(SHEET_H)).current;

    // ── Pan-to-dismiss ──
    const pan = useRef(new Animated.Value(0)).current;
    const panResponder = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
        onPanResponderMove: (_, g) => { if (g.dy > 0) pan.setValue(g.dy); },
        onPanResponderRelease: (_, g) => {
            if (g.dy > 80) {
                Animated.timing(pan, { toValue: SHEET_H, duration: 180, useNativeDriver: true }).start(onClose);
            } else {
                Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
            }
        },
    })).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0, damping: 16, stiffness: 200,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SHEET_H, duration: 200, useNativeDriver: true,
            }).start();
        }
    }, [visible, slideAnim]);

    if (!message) return null;

    const combinedY = Animated.add(slideAnim, pan);

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            {/* Dim overlay */}
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

            {/* Sheet */}
            <Animated.View
                style={[styles.sheet, { transform: [{ translateY: combinedY }] }]}
                {...panResponder.panHandlers}
            >
                {/* Drag handle */}
                <View style={styles.handle} />

                {/* Message preview */}
                {message.text ? (
                    <Text style={styles.preview} numberOfLines={2}>{message.text}</Text>
                ) : null}

                {/* Emoji reaction row */}
                <View style={styles.emojiRow}>
                    {EMOJIS.map(emoji => (
                        <TouchableOpacity key={emoji}
                            onPress={() => { onReact(emoji); onClose(); }}
                            style={styles.emojiBtn}>
                            <Text style={styles.emoji}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.divider} />

                {/* Action list */}
                <ActionRow icon="content-copy" label="Copy text" color="#818CF8"
                    onPress={() => { Clipboard.setString(message.text ?? ''); onClose(); }} />
                {!isOwnMessage && (
                    <>
                        <ActionRow icon="payments" label="Tip 5 🍌" color="#FBBF24"
                            onPress={() => { onTip(5); onClose(); }} />
                        <ActionRow icon="payments" label="Tip 10 🍌" color="#F59E0B"
                            onPress={() => { onTip(10); onClose(); }} />
                        <ActionRow icon="flag" label="Flag message" color="#F87171"
                            onPress={() => { onFlag(); onClose(); }} />
                    </>
                )}

                {/* Admin-only zone */}
                {isAdmin && (
                    <>
                        <View style={styles.adminDivider}>
                            <Text style={styles.adminLabel}>ADMIN ACTIONS</Text>
                        </View>
                        <ActionRow icon="delete" label="Delete message" color="#EF4444" danger
                            onPress={() => { onDelete?.(); onClose(); }} />
                        {!isOwnMessage && (
                            <ActionRow icon="person-off" label="Kick user" color="#EF4444" danger
                                onPress={() => { onKick?.(); onClose(); }} />
                        )}
                    </>
                )}
            </Animated.View>
        </Modal>
    );
}

function ActionRow({ icon, label, color, danger = false, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.actionRow} activeOpacity={0.7}>
            <View style={[styles.actionIcon, { backgroundColor: `${color}12` }]}>
                <MaterialIcons name={icon} size={18} color={color} />
            </View>
            <Text style={[styles.actionLabel, danger && { color: '#EF4444' }]}>{label}</Text>
            <MaterialIcons name="chevron-right" size={16} color="rgba(255,255,255,0.15)" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: '#0E0A1E',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingBottom: 36, paddingTop: 8,
        borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    },
    handle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignSelf: 'center', marginBottom: 16,
    },
    preview: {
        color: 'rgba(255,255,255,0.35)', fontSize: 12,
        paddingHorizontal: 20, marginBottom: 14, lineHeight: 18,
        fontStyle: 'italic',
    },
    emojiRow: {
        flexDirection: 'row', justifyContent: 'space-around',
        paddingHorizontal: 12, marginBottom: 12,
    },
    emojiBtn: {
        width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
        borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)',
    },
    emoji: { fontSize: 22 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 20, marginBottom: 8 },
    actionRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 20, paddingVertical: 12,
    },
    actionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
    adminDivider: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, marginVertical: 8,
    },
    adminLabel: {
        color: '#EF4444', fontSize: 9, fontWeight: '800', letterSpacing: 1.5,
        backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    },
});
