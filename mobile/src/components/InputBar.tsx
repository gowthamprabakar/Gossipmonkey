import React, { useState, useRef } from 'react';
import {
    View, TextInput, TouchableOpacity, Animated,
    StyleSheet, Platform, Text,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatStore } from '../store/useChatStore';

interface InputBarProps {
    onSend: (text: string, imageUrl?: string) => void;
    onImagePick?: () => void;
    onPaintCommand?: () => void;
    onAdminPanel?: () => void;
    isAdmin?: boolean;
    placeholder?: string;
}

export function InputBar({
    onSend, onImagePick, onPaintCommand, onAdminPanel,
    isAdmin = false, placeholder = 'Type something wild...',
}: InputBarProps) {
    const [text, setText] = useState('');
    const [trayOpen, setTrayOpen] = useState(false);
    const trayAnim = useRef(new Animated.Value(0)).current;

    const toggleTray = () => {
        const open = !trayOpen;
        setTrayOpen(open);
        Animated.spring(trayAnim, {
            toValue: open ? 1 : 0,
            useNativeDriver: false,
            damping: 15,
        }).start();
    };

    const trayHeight = trayAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 56],
    });
    const trayOpacity = trayAnim;

    const handleSend = () => {
        if (text.trim()) {
            onSend(text.trim());
            setText('');
            if (trayOpen) toggleTray();
        }
    };

    const handlePaint = () => {
        setText('/paint ');
        setTrayOpen(false);
        trayAnim.setValue(0);
        onPaintCommand?.();
    };

    const { replyingTo, clearReplyingTo } = useChatStore();

    const canSend = text.trim().length > 0;

    return (
        <View style={styles.root}>
            {/* ── Active Reply Context ── */}
            {replyingTo && (
                <View style={[styles.replyBanner, { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }]}>
                    <View style={{ width: 3, height: '100%', backgroundColor: '#A78BFA', borderRadius: 3, marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: '700', marginBottom: 2 }}>
                            Replying to {replyingTo.sender.name}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }} numberOfLines={1}>
                            {replyingTo.type === 'image' || replyingTo.imageUrl ? '📷 Image' : replyingTo.text}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={clearReplyingTo} style={{ padding: 4 }}>
                        <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Expanding tray ── */}
            <Animated.View style={[styles.tray, { height: trayHeight, opacity: trayOpacity }]}>
                <View style={styles.trayInner}>
                    <TrayBtn icon="palette" label="Paint" color="#A78BFA" onPress={handlePaint} />
                    <TrayBtn icon="image" label="Image" color="#34D399"
                        onPress={() => { toggleTray(); onImagePick?.(); }} />
                    {isAdmin && (
                        <TrayBtn icon="shield" label="Admin" color="#F97316"
                            onPress={() => { toggleTray(); onAdminPanel?.(); }} />
                    )}
                </View>
            </Animated.View>

            {/* ── Main row ── */}
            <View style={styles.row}>
                {/* Attach button */}
                <TouchableOpacity onPress={toggleTray} style={[styles.iconBtn, trayOpen && styles.iconBtnActive]}>
                    <MaterialIcons name={trayOpen ? 'close' : 'add'} size={22} color={trayOpen ? '#7C3AED' : 'rgba(255,255,255,0.6)'} />
                </TouchableOpacity>

                {/* Text input */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={text}
                        onChangeText={setText}
                        multiline
                        maxLength={1000}
                        returnKeyType="default"
                        blurOnSubmit={false}
                    />
                    {/* Paint shortcut inside input */}
                    {!text && (
                        <TouchableOpacity onPress={handlePaint} style={styles.paintHint}>
                            <MaterialIcons name="palette" size={16} color="rgba(255,255,255,0.15)" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Send button */}
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!canSend}
                    style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                    activeOpacity={0.8}
                >
                    {canSend ? (
                        <LinearGradient
                            colors={['#7C3AED', '#EC4899']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.sendGrad}
                        >
                            <MaterialIcons name="send" size={18} color="white" />
                        </LinearGradient>
                    ) : (
                        <View style={styles.sendGrad}>
                            <MaterialIcons name="send" size={18} color="rgba(255,255,255,0.2)" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

function TrayBtn({ icon, label, color, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.trayBtn}>
            <View style={[styles.trayIcon, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
                <MaterialIcons name={icon} size={18} color={color} />
            </View>
            <Text style={[styles.trayLabel, { color }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: 'rgba(5,2,16,0.97)',
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
        paddingBottom: Platform.OS === 'ios' ? 0 : 8,
    },
    replyBanner: {
        // defined inline, just adding key to satisfy TS
    },
    tray: {
        overflow: 'hidden',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    trayInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap: 20,
    },
    trayBtn: { alignItems: 'center', gap: 4 },
    trayIcon: {
        width: 44, height: 44, borderRadius: 14,
        borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    trayLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    row: {
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 14, paddingVertical: 10, gap: 10,
    },
    iconBtn: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    iconBtnActive: {
        backgroundColor: 'rgba(124,58,237,0.12)',
        borderColor: 'rgba(124,58,237,0.3)',
    },
    inputWrapper: {
        flex: 1, minHeight: 44, maxHeight: 120,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center', paddingRight: 36,
    },
    input: {
        color: 'white', fontSize: 14, paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 11 : 8,
        maxHeight: 120,
    },
    paintHint: {
        position: 'absolute', right: 10,
        top: 0, bottom: 0, justifyContent: 'center',
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 14, overflow: 'hidden',
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendGrad: {
        width: '100%', height: '100%',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
});
