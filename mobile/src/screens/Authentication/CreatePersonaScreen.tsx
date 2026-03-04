import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, Image, StyleSheet, ScrollView,
    Platform, KeyboardAvoidingView, Keyboard, Dimensions, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withTiming, withRepeat, withSequence, withSpring, withDelay,
    Easing, interpolate,
} from 'react-native-reanimated';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { generateJungleName, generateMultipleNames } from '../../utils/nameGenerator';

const { width: W } = Dimensions.get('window');

// ── Avatar styles (vibes) ───────────────────────────────────────
const VIBES = [
    { label: 'Notionist', style: 'notionists', color: '#8b5cf6', emoji: '🤖' },
    { label: 'Pixel', style: 'pixel-art', color: '#ec4899', emoji: '👾' },
    { label: 'Bot', style: 'bottts', color: '#22d3ee', emoji: '🤖' },
    { label: 'Fun', style: 'fun-emoji', color: '#f59e0b', emoji: '😜' },
    { label: 'Glass', style: 'glass', color: '#22c55e', emoji: '💎' },
];

// ── One orbit ring ──────────────────────────────────────────────
function Ring({ size, color, dur, delay = 0, cw = true, width = 1.5 }: any) {
    const r = useSharedValue(cw ? 0 : 360);
    useEffect(() => {
        r.value = withDelay(delay, withRepeat(
            withTiming(cw ? 360 : 0, { duration: dur, easing: Easing.linear }), -1, false,
        ));
    }, []);
    const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
    return (
        <Animated.View style={[{
            position: 'absolute', width: size, height: size,
            borderRadius: size / 2, borderWidth: width,
            borderColor: color, borderTopColor: 'transparent',
        }, style]} />
    );
}

// ── Pulsing halo ────────────────────────────────────────────────
function Halo({ size, color, delay = 0 }: any) {
    const s = useSharedValue(1);
    const o = useSharedValue(0.3);
    useEffect(() => {
        s.value = withDelay(delay, withRepeat(
            withSequence(withTiming(1.25, { duration: 2200 }), withTiming(1, { duration: 2200 })), -1, true,
        ));
        o.value = withDelay(delay, withRepeat(
            withSequence(withTiming(0.6, { duration: 2200 }), withTiming(0.15, { duration: 2200 })), -1, true,
        ));
    }, []);
    const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: o.value }));
    return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

// ── Shimmer ─────────────────────────────────────────────────────
function Shimmer({ color }: { color: string }) {
    const x = useSharedValue(-W);
    useEffect(() => {
        x.value = withRepeat(withTiming(W, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, false);
    }, []);
    const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
    return (
        <Animated.View pointerEvents="none" style={[{
            position: 'absolute', top: 0, bottom: 0, width: W * 0.4,
            backgroundColor: `${color}25`, transform: [{ skewX: '-15deg' }],
        }, style]} />
    );
}

// ────────────────────────────────────────────────────────────────
export function CreatePersonaScreen() {
    // System-assigned anonymous name — user shuffles, never types
    const [alias, setAlias] = useState(() => generateJungleName());
    const [shuffling, setShuffling] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [seedBase, setSeedBase] = useState('GossipMonkey42');
    const [vibeIdx, setVibeIdx] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const { setToken, setPersona } = useAppStore();

    const vibe = VIBES[vibeIdx];
    const avatarUrl = `https://api.dicebear.com/9.x/${vibe.style}/png?seed=${seedBase}&backgroundColor=0a0a0f`;

    // ── animations
    const avatarScale = useSharedValue(1);
    const avatarRotate = useSharedValue(0);
    const ctaGlow = useSharedValue(0.4);
    const headerY = useSharedValue(-30);
    const headerOp = useSharedValue(0);
    const inputBorderOp = useSharedValue(0);
    const cardEntrance = useSharedValue(60);
    const cardOp = useSharedValue(0);
    const bgPulse = useSharedValue(0);

    useEffect(() => {
        // Header slide down
        headerY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.back(1.2)) });
        headerOp.value = withTiming(1, { duration: 500 });

        // Card entrance
        cardEntrance.value = withDelay(150, withSpring(0, { damping: 14, stiffness: 100 }));
        cardOp.value = withDelay(150, withTiming(1, { duration: 400 }));

        // CTA button shimmer/pulse
        ctaGlow.value = withRepeat(
            withSequence(withTiming(1, { duration: 1800 }), withTiming(0.4, { duration: 1800 })),
            -1, true,
        );
        // BG pulse
        bgPulse.value = withRepeat(
            withSequence(withTiming(1, { duration: 5000 }), withTiming(0, { duration: 5000 })),
            -1, true,
        );
    }, []);

    const shuffleAvatar = useCallback(() => {
        avatarRotate.value = withSequence(
            withTiming(360, { duration: 500, easing: Easing.out(Easing.ease) }),
            withTiming(0, { duration: 0 }),
        );
        avatarScale.value = withSequence(
            withTiming(0.85, { duration: 150 }),
            withSpring(1.1, { damping: 8, stiffness: 200 }),
            withTiming(1, { duration: 200 }),
        );
        setSeedBase(Math.random().toString(36).substring(2, 9) + Date.now().toString(36));
    }, []);

    const cycleVibe = useCallback(() => {
        setVibeIdx(prev => (prev + 1) % VIBES.length);
        shuffleAvatar();
    }, [shuffleAvatar]);



    const handleCreate = async () => {
        if (!alias.trim()) { setErrorMsg('Choose a jungle name.'); return; }
        if (password.length < 8) { setErrorMsg('Scroll down to set a password (min 8 chars).'); return; }
        if (password !== confirmPwd) { setErrorMsg('Scroll down: Passwords do not match.'); return; }
        Keyboard.dismiss();
        setLoading(true);
        try {
            const fullAvatarUrl = `https://api.dicebear.com/9.x/${vibe.style}/png?seed=${seedBase}&backgroundColor=0a0a0f`;
            const res = await api.post('/identity/session', {
                alias: alias.trim(),
                avatar: fullAvatarUrl,
                password,
            });
            const { persona, token, accountCode } = res.data.data;
            const avatarUrl = fullAvatarUrl;
            await setPersona({ id: persona.id, name: persona.alias, avatar: avatarUrl, score: persona.score ?? 0 });
            await setToken(token);
            // Show account code one time — user MUST save this
            if (accountCode) {
                Alert.alert(
                    '🎫 Save Your Account Code!',
                    `Your code is:\n\n${accountCode}\n\nThis is the ONLY way to log back in on a new device. Write it down or screenshot this!`,
                    [{ text: 'Got it, saved!' }]
                );
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Network error — is the backend running?';
            console.error('Persona creation failed:', msg);
            setErrorMsg(msg);
            setTimeout(() => setErrorMsg(''), 4000);
        } finally {
            setLoading(false);
        }
    };

    // ── animated styles
    const headerStyle = useAnimatedStyle(() => ({
        opacity: headerOp.value,
        transform: [{ translateY: headerY.value }],
    }));
    const cardStyle = useAnimatedStyle(() => ({
        opacity: cardOp.value,
        transform: [{ translateY: cardEntrance.value }],
    }));
    const avatarStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${avatarRotate.value}deg` }, { scale: avatarScale.value }],
    }));
    const ctaStyle = useAnimatedStyle(() => ({
        shadowOpacity: ctaGlow.value,
    }));
    const bgStyle = useAnimatedStyle(() => ({
        opacity: interpolate(bgPulse.value, [0, 1], [0.12, 0.3]),
        transform: [{ scale: interpolate(bgPulse.value, [0, 1], [1, 1.2]) }],
    }));

    const isReady = alias.trim().length > 0 && password.length >= 8 && confirmPwd === password;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#06020E' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* ── Background nebula ──── */}
                <Animated.View pointerEvents="none" style={[{
                    position: 'absolute', top: -100, left: -100,
                    width: W + 200, height: W + 200, borderRadius: (W + 200) / 2,
                    backgroundColor: vibe.color,
                }, bgStyle]} />
                <View pointerEvents="none" style={{
                    position: 'absolute', bottom: -100, right: -80,
                    width: 300, height: 300, borderRadius: 150,
                    backgroundColor: '#22d3ee', opacity: 0.06,
                }} />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
                >
                    {/* ── Header ─────────────────────────── */}
                    <Animated.View style={[{ alignItems: 'center', paddingTop: 16, marginBottom: 28 }, headerStyle]}>
                        <LinearGradient
                            colors={[vibe.color, '#22d3ee']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{ borderRadius: 99, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 10 }}
                        >
                            <Text style={{ color: 'white', fontSize: 9, fontWeight: '800', letterSpacing: 3 }}>
                                STEP 1 OF 1 · IDENTITY SETUP
                            </Text>
                        </LinearGradient>
                        <Text style={{ color: '#f8fafc', fontFamily: 'Poppins-Bold', fontSize: 30, textAlign: 'center', letterSpacing: -0.5 }}>
                            Create Your{'\n'}
                            <Text style={{ color: vibe.color }}>Persona</Text>
                        </Text>
                        <Text style={{ color: '#64748b', fontFamily: 'Poppins-Medium', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                            Your identity. Your rules. Zero judgment.
                        </Text>
                    </Animated.View>

                    {/* ── Avatar card ─────────────────────── */}
                    <Animated.View style={[{ alignItems: 'center', marginBottom: 24 }, cardStyle]}>
                        {/* Rings + Halos */}
                        <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
                            <Halo size={170} color={vibe.color} delay={0} />
                            <Halo size={120} color="#22d3ee" delay={700} />
                            <Ring size={190} color={`${vibe.color}80`} dur={5000} cw={true} width={1.5} />
                            <Ring size={165} color="rgba(34,211,238,0.5)" dur={3500} cw={false} width={2} delay={300} />
                            <Ring size={140} color={`${vibe.color}60`} dur={7000} cw={true} width={1} delay={500} />

                            {/* Avatar image */}
                            <Animated.View style={[{
                                width: 110, height: 110, borderRadius: 55,
                                overflow: 'hidden', zIndex: 20,
                                borderWidth: 3, borderColor: vibe.color,
                                shadowColor: vibe.color, shadowOpacity: 0.8, shadowRadius: 20,
                                elevation: 20,
                            }, avatarStyle]}>
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            </Animated.View>
                        </View>

                        {/* Regenerate + Vibe cycle buttons */}
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                            <TouchableOpacity onPress={shuffleAvatar} style={{
                                flexDirection: 'row', alignItems: 'center', gap: 6,
                                backgroundColor: 'rgba(255,255,255,0.06)',
                                borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8,
                                borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                            }}>
                                <MaterialIcons name="refresh" size={14} color={vibe.color} />
                                <Text style={{ color: '#e2e8f0', fontSize: 12, fontFamily: 'Poppins-Medium' }}>Shuffle</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={cycleVibe} style={{
                                flexDirection: 'row', alignItems: 'center', gap: 6,
                                backgroundColor: `${vibe.color}20`,
                                borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8,
                                borderWidth: 1, borderColor: `${vibe.color}50`,
                            }}>
                                <Text style={{ fontSize: 14 }}>{vibe.emoji}</Text>
                                <Text style={{ color: vibe.color, fontSize: 12, fontFamily: 'Poppins-Bold' }}>{vibe.label}</Text>
                                <MaterialIcons name="swap-horiz" size={14} color={vibe.color} />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* ── Avatar style chips ──────────────── */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
                        {VIBES.map((v, i) => (
                            <TouchableOpacity
                                key={v.style}
                                onPress={() => { setVibeIdx(i); shuffleAvatar(); }}
                                style={{
                                    paddingHorizontal: 14, paddingVertical: 6,
                                    borderRadius: 99, borderWidth: 1.5,
                                    borderColor: i === vibeIdx ? v.color : 'rgba(255,255,255,0.1)',
                                    backgroundColor: i === vibeIdx ? `${v.color}20` : 'transparent',
                                }}
                            >
                                <Text style={{
                                    color: i === vibeIdx ? v.color : '#64748b',
                                    fontSize: 12, fontFamily: 'Poppins-Bold',
                                }}>
                                    {v.emoji} {v.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── System Generated Name ──────────────────────── */}
                    <Animated.View style={[cardStyle, { alignItems: 'center', marginBottom: 24 }]}>
                        <Text style={{ color: '#475569', fontSize: 10, letterSpacing: 3, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase' }}>
                            Your Assiged Identity
                        </Text>

                        <View style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            paddingHorizontal: 32, paddingVertical: 18,
                            borderRadius: 24, borderWidth: 1.5,
                            borderColor: vibe.color,
                            shadowColor: vibe.color, shadowRadius: 20, shadowOpacity: 0.2,
                            elevation: 10, marginBottom: 16,
                            flexDirection: 'row', alignItems: 'center', gap: 12
                        }}>
                            <Text style={{ fontSize: 24 }}>🌴</Text>
                            <Text style={{ color: 'white', fontSize: 22, fontFamily: 'Poppins-Bold', letterSpacing: -0.5 }}>
                                {alias}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                setAlias(generateJungleName());
                                // Shake button feedback
                                setShuffling(true);
                                setTimeout(() => setShuffling(false), 200);
                            }}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row', alignItems: 'center', gap: 8,
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10,
                                transform: [{ scale: shuffling ? 0.95 : 1 }]
                            }}
                        >
                            <MaterialIcons name="shuffle" size={16} color={vibe.color} />
                            <Text style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'Poppins-Bold' }}>Get New Name</Text>
                        </TouchableOpacity>

                        <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 16, textAlign: 'center', marginHorizontal: 20 }}>
                            To keep everyone 100% anonymous, names are assigned by the jungle.
                        </Text>
                    </Animated.View>

                    {/* ── Password section ─────────────────── */}
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderRadius: 20, borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                        padding: 16, marginBottom: 16,
                    }}>
                        <Text style={{ color: '#475569', fontSize: 10, letterSpacing: 2, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase' }}>
                            🔐 Secret Password
                        </Text>

                        {/* Password input */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                            marginBottom: 10,
                        }}>
                            <MaterialIcons name="lock" size={18} color="#475569" style={{ marginRight: 10 }} />
                            <TextInput
                                style={{ flex: 1, color: 'white', fontSize: 15, fontWeight: '600' }}
                                placeholder="Min 8 characters"
                                placeholderTextColor="#334155"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPwd}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity onPress={() => setShowPwd(v => !v)}>
                                <MaterialIcons name={showPwd ? 'visibility-off' : 'visibility'} size={18} color="#475569" />
                            </TouchableOpacity>
                        </View>

                        {/* Strength bar */}
                        {password.length > 0 && (() => {
                            const strength = password.length < 6 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
                            const labels = ['Too short', 'Weak', 'Strong', 'Very strong'];
                            const colors = ['#ef4444', '#f97316', '#22c55e', '#818cf8'];
                            return (
                                <View style={{ marginBottom: 10 }}>
                                    <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                                        {[0, 1, 2, 3].map(i => (
                                            <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= strength ? colors[strength] : 'rgba(255,255,255,0.08)' }} />
                                        ))}
                                    </View>
                                    <Text style={{ color: colors[strength], fontSize: 10, fontWeight: '700' }}>{labels[strength]}</Text>
                                </View>
                            );
                        })()}

                        {/* Confirm password */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                            borderWidth: 1,
                            borderColor: confirmPwd.length > 0
                                ? (confirmPwd === password ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)')
                                : 'rgba(255,255,255,0.08)',
                        }}>
                            <MaterialIcons name="lock-outline" size={18} color="#475569" style={{ marginRight: 10 }} />
                            <TextInput
                                style={{ flex: 1, color: 'white', fontSize: 15, fontWeight: '600' }}
                                placeholder="Confirm password"
                                placeholderTextColor="#334155"
                                value={confirmPwd}
                                onChangeText={setConfirmPwd}
                                secureTextEntry={!showPwd}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {confirmPwd.length > 0 && (
                                <MaterialIcons
                                    name={confirmPwd === password ? 'check-circle' : 'cancel'}
                                    size={18}
                                    color={confirmPwd === password ? '#22c55e' : '#ef4444'}
                                />
                            )}
                        </View>

                        <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 8, lineHeight: 14 }}>
                            You'll need this code + password to log back in on a new device.
                        </Text>
                    </View>

                </ScrollView>

                {/* ── Error banner (shown above sticky footer) ── */}
                {errorMsg !== '' && (
                    <View style={{
                        marginHorizontal: 20, marginBottom: 8,
                        backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 14,
                        paddingVertical: 10, paddingHorizontal: 14,
                        borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)',
                        flexDirection: 'row', alignItems: 'center', gap: 8,
                    }}>
                        <MaterialIcons name="error-outline" size={16} color="#ef4444" />
                        <Text style={{ color: '#fca5a5', fontSize: 12, fontFamily: 'Poppins-Medium', flex: 1 }}>{errorMsg}</Text>
                    </View>
                )}

                {/* ── Sticky footer with CTA ──────────────── */}
                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                    <Animated.View style={ctaStyle}>
                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={loading}
                            style={{
                                borderRadius: 20, overflow: 'hidden',
                                opacity: 1,
                                shadowColor: vibe.color,
                                shadowOffset: { width: 0, height: 0 },
                                shadowRadius: 24, elevation: 10,
                            }}
                        >
                            <LinearGradient
                                colors={[vibe.color, '#22d3ee']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 17, letterSpacing: 1 }}>
                                            Enter the Jungle 🌴
                                        </Text>
                                        <MaterialIcons name="arrow-forward" size={20} color="white" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Trust badges */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10, opacity: 0.45 }}>
                        {[
                            { icon: 'shield', label: 'SECURE' },
                            { icon: 'visibility-off', label: 'ANON' },
                            { icon: 'bolt', label: 'INSTANT' },
                        ].map((b) => (
                            <View key={b.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <MaterialIcons name={b.icon as any} size={11} color="#64748b" />
                                <Text style={{ color: '#64748b', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>{b.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
