import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { socketManager } from '../../services/socket';
import Reanimated, {
    useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

type Phase = 'choose' | 'pin' | 'waiting' | 'denied';

export function JoinPrivateRoomScreen({ route, navigation }: any) {
    const { roomId, roomName, requiresPin, requiresApproval } = route.params ?? {};

    const [phase, setPhase] = useState<Phase>(() => {
        if (requiresPin) return 'pin';
        if (requiresApproval) return 'waiting'; // go straight to knock
        return 'pin';
    });
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    // ── Pulse rings for waiting screen ──
    const ring1 = useSharedValue(1);
    const ring2 = useSharedValue(1);
    const ring3 = useSharedValue(1);
    useEffect(() => {
        ring1.value = withRepeat(withSequence(withTiming(1.5, { duration: 900 }), withTiming(1, { duration: 900 })), -1);
        ring2.value = withRepeat(withSequence(withTiming(1, { duration: 300 }), withTiming(1.5, { duration: 900 }), withTiming(1, { duration: 900 })), -1);
        ring3.value = withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(1.5, { duration: 900 }), withTiming(1, { duration: 900 })), -1);
    }, []);
    const r1s = useAnimatedStyle(() => ({ transform: [{ scale: ring1.value }], opacity: 0.15 }));
    const r2s = useAnimatedStyle(() => ({ transform: [{ scale: ring2.value }], opacity: 0.08 }));
    const r3s = useAnimatedStyle(() => ({ transform: [{ scale: ring3.value }], opacity: 0.05 }));

    // ── Socket listeners for entry_granted / entry_denied ──
    useEffect(() => {
        const socket = socketManager.socket;
        if (!socket) return;
        const onGranted = () => {
            navigation.replace('Chat', { roomId, roomName });
        };
        const onDenied = (data: { message?: string }) => {
            setError(data?.message ?? 'The admin denied your entry.');
            setPhase('denied');
        };
        const onPending = () => setPhase('waiting');
        socket.on('entry_granted', onGranted);
        socket.on('entry_denied', onDenied);
        socket.on('knock_pending', onPending);
        return () => {
            socket.off('entry_granted', onGranted);
            socket.off('entry_denied', onDenied);
            socket.off('knock_pending', onPending);
        };
    }, [roomId, navigation]);

    // ── Send knock ────────────────────────────────────────────────
    const handleKnock = () => {
        socketManager.connect();
        socketManager.socket?.emit('join_room', { roomId });
        // backend will emit knock_pending → setPhase('waiting')
    };

    // ── Submit PIN ────────────────────────────────────────────────
    const handlePin = () => {
        if (pin.length !== 6) return;
        // PIN validation — backend handles via join_room with passcode
        socketManager.connect();
        socketManager.socket?.emit('join_room', { roomId, passcode: pin });
    };

    // ── Keypad ────────────────────────────────────────────────────
    const addDigit = (d: string) => { if (pin.length < 6) setPin(p => p + d); };
    const removeDigit = () => setPin(p => p.slice(0, -1));

    return (
        <View style={styles.root}>
            {/* Blobs */}
            <View pointerEvents="none" style={styles.blob1} />
            <View pointerEvents="none" style={styles.blob2} />

            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                        <MaterialIcons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {phase === 'waiting' ? 'Waiting Room' :
                            phase === 'denied' ? 'Entry Denied' :
                                'Private Jungle'}
                    </Text>
                    <View style={{ width: 38 }} />
                </View>

                {/* ── PIN Phase ── */}
                {phase === 'pin' && (
                    <View style={styles.body}>
                        {/* Icon */}
                        <View style={styles.iconRing}>
                            <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={styles.iconGrad}>
                                <MaterialIcons name="lock" size={34} color="white" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.subtitle}>Enter the 6-digit secret key</Text>
                        <Text style={styles.roomLabel}>{roomName}</Text>

                        {/* PIN dots */}
                        <View style={styles.dots}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]}>
                                    {i < pin.length && <View style={styles.dotInner} />}
                                </View>
                            ))}
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        {/* Unlock button */}
                        <TouchableOpacity
                            onPress={handlePin}
                            disabled={pin.length !== 6}
                            style={[styles.unlockBtn, pin.length !== 6 && { opacity: 0.4 }]}
                        >
                            <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.unlockGrad}>
                                <MaterialIcons name="lock-open" size={18} color="white" />
                                <Text style={styles.unlockText}>Unlock Jungle</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Keypad */}
                        <View style={styles.keypad}>
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map((k, i) => {
                                if (k === '') return <View key={i} style={styles.keyEmpty} />;
                                if (k === 'DEL') return (
                                    <TouchableOpacity key={i} onPress={removeDigit} style={styles.key}>
                                        <MaterialIcons name="backspace" size={22} color="rgba(255,255,255,0.6)" />
                                    </TouchableOpacity>
                                );
                                return (
                                    <TouchableOpacity key={i} onPress={() => addDigit(k)} style={styles.key}>
                                        <Text style={styles.keyText}>{k}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* ── Waiting Phase ── */}
                {phase === 'waiting' && (
                    <View style={styles.waitingBody}>
                        {/* Pulsing rings */}
                        <View style={styles.ringsContainer}>
                            <Reanimated.View style={[styles.ring, styles.ring3, r3s]} />
                            <Reanimated.View style={[styles.ring, styles.ring2, r2s]} />
                            <Reanimated.View style={[styles.ring, styles.ring1, r1s]} />
                            <View style={styles.doorIcon}>
                                <Text style={{ fontSize: 42 }}>🚪</Text>
                            </View>
                        </View>

                        <Text style={styles.waitTitle}>Knock knock...</Text>
                        <Text style={styles.waitSub}>
                            Your request is with the room admin.{'\n'}Hang tight, they'll let you in soon.
                        </Text>

                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: 14 }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── Denied Phase ── */}
                {phase === 'denied' && (
                    <View style={styles.waitingBody}>
                        <View style={[styles.doorIcon, { backgroundColor: 'rgba(239,68,68,0.1)', width: 96, height: 96, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' }]}>
                            <Text style={{ fontSize: 42 }}>🚫</Text>
                        </View>
                        <Text style={[styles.waitTitle, { color: '#F87171', marginTop: 28 }]}>Entry Denied</Text>
                        <Text style={styles.waitSub}>{error || 'The admin denied your request.'}</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.unlockBtn}>
                            <LinearGradient colors={['#7F1D1D', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.unlockGrad}>
                                <Text style={styles.unlockText}>Go Back</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const DOT_W = 42;
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050210' },
    blob1: { position: 'absolute', top: -80, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: '#4C1D95', opacity: 0.12 },
    blob2: { position: 'absolute', bottom: 160, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: '#BE185D', opacity: 0.08 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    headerTitle: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 17 },
    navBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },

    body: { flex: 1, alignItems: 'center', paddingTop: 24, paddingHorizontal: 24 },
    iconRing: { width: 90, height: 90, borderRadius: 26, overflow: 'hidden', marginBottom: 20 },
    iconGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    subtitle: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
    roomLabel: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 20, marginTop: 4, marginBottom: 28 },
    dots: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    dot: { width: DOT_W, height: DOT_W, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    dotFilled: { backgroundColor: 'rgba(124,58,237,0.15)', borderColor: 'rgba(124,58,237,0.5)' },
    dotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#7C3AED' },
    errorText: { color: '#F87171', fontSize: 12, fontWeight: '600', marginBottom: 12 },
    unlockBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 28, marginTop: 8 },
    unlockGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    unlockText: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 15 },
    keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%', maxWidth: 280 },
    key: { width: 72, height: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
    keyEmpty: { width: 72, height: 54 },
    keyText: { color: 'white', fontSize: 22, fontFamily: 'Poppins-Bold' },

    // ── Waiting / denied ──
    waitingBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    ringsContainer: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
    ring: { position: 'absolute', borderRadius: 999, backgroundColor: '#7C3AED' },
    ring1: { width: 90, height: 90 },
    ring2: { width: 120, height: 120 },
    ring3: { width: 160, height: 160 },
    doorIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    waitTitle: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 22, marginTop: 24, marginBottom: 12 },
    waitSub: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    cancelBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
});
