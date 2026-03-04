import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    Image, Dimensions, StyleSheet, Modal, TextInput, Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withRepeat, withSequence, withTiming, withSpring,
    withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import { useAppStore } from '../../store/useAppStore';

const { width: W, height: H } = Dimensions.get('window');
const HERO_H = H * 0.46;

// ── Design tokens ─────────────────────────────────────────────────
const PURPLE = '#7C3AED';
const PINK = '#EC4899';
const CYAN = '#22D3EE';
const AMBER = '#F59E0B';
const GREEN = '#10B981';

// ── Utility: deterministic hue from name ─────────────────────────
const nameToColor = (name = 'X') => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xFFFF;
    const hues: [string, string, string][] = [
        ['#7C3AED', '#EC4899', '#4F46E5'],
        ['#059669', '#22D3EE', '#0D9488'],
        ['#B91C1C', '#F97316', '#9333EA'],
        ['#1D4ED8', '#38BDF8', '#6366F1'],
        ['#BE185D', '#F472B6', '#9D174D'],
    ];
    return hues[h % hues.length];
};

// ── Spinning orbit ring ───────────────────────────────────────────
function OrbitRing({ size, color, duration, delay = 0, reverse = false, dash = false }: any) {
    const rotate = useSharedValue(0);
    useEffect(() => {
        rotate.value = withDelay(delay, withRepeat(
            withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }), -1, false
        ));
    }, []);
    const style = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotate.value}deg` }],
    }));
    return (
        <Animated.View style={[{
            position: 'absolute',
            width: size, height: size,
            borderRadius: size / 2,
            borderWidth: dash ? 1 : 1.5,
            borderColor: `${color}55`,
            borderStyle: dash ? 'dashed' : 'solid',
            alignSelf: 'center',
            top: (HERO_H * 0.35) - size / 2 + 60,
        }, style]} />
    );
}

// ── Floating emoji particles ──────────────────────────────────────
const FLOATERS = ['🍌', '🔥', '👀', '💬', '🐒', '⚡', '🎭', '✨'];
function FloatingEmoji({ emoji, x, delay }: { emoji: string; x: number; delay: number }) {
    const y = useSharedValue(0);
    const op = useSharedValue(0);
    useEffect(() => {
        y.value = withDelay(delay, withRepeat(
            withSequence(withTiming(-60, { duration: 3000 }), withTiming(0, { duration: 0 })), -1, false
        ));
        op.value = withDelay(delay, withRepeat(
            withSequence(withTiming(1, { duration: 400 }), withTiming(0.7, { duration: 2200 }), withTiming(0, { duration: 400 })), -1, false
        ));
    }, []);
    const s = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: op.value }));
    return (
        <Animated.Text style={[{ position: 'absolute', fontSize: 18, left: x, top: HERO_H * 0.55 }, s]}>
            {emoji}
        </Animated.Text>
    );
}

// ── Pulsing halo ─────────────────────────────────────────────────
function Halo({ color, size, delay = 0 }: any) {
    const s = useSharedValue(0.7);
    const op = useSharedValue(0);
    useEffect(() => {
        s.value = withDelay(delay, withRepeat(withTiming(1.3, { duration: 2000 }), -1, true));
        op.value = withDelay(delay, withRepeat(withSequence(withTiming(0.2, { duration: 1000 }), withTiming(0, { duration: 1000 })), -1, true));
    }, []);
    const style = useAnimatedStyle(() => ({
        transform: [{ scale: s.value }],
        opacity: op.value,
    }));
    return (
        <Animated.View style={[{
            position: 'absolute', width: size, height: size, borderRadius: size / 2,
            backgroundColor: color, alignSelf: 'center',
            top: (HERO_H * 0.35) - size / 2 + 60,
        }, style]} />
    );
}

// ── Score arc (simulated with rotated gradient slices) ────────────
function ScoreRing({ pct, color }: { pct: number; color: string }) {
    const prog = useSharedValue(0);
    useEffect(() => {
        prog.value = withTiming(pct, { duration: 1600, easing: Easing.out(Easing.cubic) });
    }, []);
    const arcStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${(prog.value / 100) * 360}deg` }],
    }));
    return (
        <View style={{ width: 168, height: 168, alignItems: 'center', justifyContent: 'center' }}>
            {/* Track */}
            <View style={{
                position: 'absolute', width: 168, height: 168, borderRadius: 84,
                borderWidth: 5, borderColor: 'rgba(255,255,255,0.07)'
            }} />
            {/* Fill — rotating gradient line */}
            <Animated.View style={[{ position: 'absolute', width: 168, height: 168 }, arcStyle]}>
                <View style={{
                    position: 'absolute', top: 0, left: 84 - 2.5, width: 5, height: 84,
                    backgroundColor: color, borderRadius: 3
                }} />
            </Animated.View>
            {/* Inner circle avatar hole */}
            <View style={{
                width: 136, height: 136, borderRadius: 68, overflow: 'hidden',
                borderWidth: 3, borderColor: `${color}50`
            }} />
        </View>
    );
}

// ── Badge chip ───────────────────────────────────────────────────
function Badge({ icon, label, color, locked = false, delay = 0 }: any) {
    const scale = useSharedValue(0);
    useEffect(() => {
        scale.value = withDelay(delay, withSpring(1, { damping: 12 }));
    }, []);
    const s = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    return (
        <Animated.View style={[{ alignItems: 'center', marginRight: 16, opacity: locked ? 0.4 : 1 }, s]}>
            <View style={{
                width: 58, height: 58, borderRadius: 18,
                backgroundColor: locked ? 'rgba(255,255,255,0.05)' : `${color}20`,
                borderWidth: 1.5, borderColor: locked ? 'rgba(255,255,255,0.08)' : `${color}50`,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: color, shadowOpacity: locked ? 0 : 0.5, shadowRadius: 10,
            }}>
                {locked
                    ? <MaterialIcons name="lock" size={22} color="rgba(255,255,255,0.2)" />
                    : <MaterialIcons name={icon} size={24} color={color} />
                }
            </View>
            <Text style={{
                color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '700',
                letterSpacing: 0.5, marginTop: 6, textTransform: 'uppercase'
            }}>
                {label}
            </Text>
        </Animated.View>
    );
}

// ── Stat card ────────────────────────────────────────────────────
function StatCard({ value, label, icon, color, delay = 0 }: any) {
    const t = useSharedValue(0);
    useEffect(() => {
        t.value = withDelay(delay, withTiming(1, { duration: 600 }));
    }, []);
    const s = useAnimatedStyle(() => ({
        opacity: t.value,
        transform: [{ translateY: interpolate(t.value, [0, 1], [16, 0]) }],
    }));
    return (
        <Animated.View style={[{ flex: 1 }, s]}>
            <View style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 20, padding: 16,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                alignItems: 'center',
                // Gloss top edge
                shadowColor: color, shadowOpacity: 0.1, shadowRadius: 12,
            }}>
                {/* Top gloss */}
                <View style={{
                    position: 'absolute', top: 0, left: 12, right: 12, height: 1,
                    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99
                }} />
                <View style={{
                    width: 34, height: 34, borderRadius: 12,
                    backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}30`,
                    alignItems: 'center', justifyContent: 'center', marginBottom: 8
                }}>
                    <MaterialIcons name={icon} size={18} color={color} />
                </View>
                <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 18, letterSpacing: -0.5 }}>
                    {value}
                </Text>
                <Text style={{
                    color: 'rgba(255,255,255,0.32)', fontSize: 9, fontWeight: '700',
                    letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 3
                }}>
                    {label}
                </Text>
            </View>
        </Animated.View>
    );
}

// ── Menu row ─────────────────────────────────────────────────────
function MenuRow({ icon, label, color = 'rgba(255,255,255,0.5)', onPress, danger = false }: any) {
    return (
        <TouchableOpacity onPress={onPress} style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            backgroundColor: danger ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)',
            borderRadius: 18, padding: 16, marginBottom: 10,
            borderWidth: 1, borderColor: danger ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.06)',
        }}>
            <View style={{
                width: 38, height: 38, borderRadius: 13,
                backgroundColor: danger ? 'rgba(239,68,68,0.1)' : `${color}15`,
                alignItems: 'center', justifyContent: 'center'
            }}>
                <MaterialIcons name={icon} size={20} color={danger ? '#EF4444' : color} />
            </View>
            <Text style={{
                flex: 1, color: danger ? '#EF4444' : 'rgba(255,255,255,0.85)',
                fontFamily: 'Poppins-Bold', fontSize: 14
            }}>
                {label}
            </Text>
            {!danger && <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.18)" />}
        </TouchableOpacity>
    );
}

// ── Profile Screen ────────────────────────────────────────────────
export function ProfileScreen({ navigation }: any) {
    const { persona, setPersona, setToken } = useAppStore();
    const insets = useSafeAreaInsets();
    const theme = nameToColor(persona?.name ?? 'Monkey');
    const score = persona?.score ?? 100;
    const scorePct = Math.min((score / 2000) * 100, 100);

    // Edit modal state
    const [editVisible, setEditVisible] = useState(false);
    const [editField, setEditField] = useState<'alias' | 'vibe' | null>(null);
    const [draftAlias, setDraftAlias] = useState(persona?.name ?? '');
    const [draftVibe, setDraftVibe] = useState('');

    // Pulse for avatar glow
    const glow = useSharedValue(0.4);
    useEffect(() => {
        glow.value = withRepeat(withSequence(withTiming(0.85, { duration: 2200 }), withTiming(0.4, { duration: 2200 })), -1, true);
    }, []);
    const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

    // Scale for avatar mount
    const avatarScale = useSharedValue(0.5);
    const avatarOp = useSharedValue(0);
    useEffect(() => {
        avatarScale.value = withDelay(200, withSpring(1, { damping: 10 }));
        avatarOp.value = withDelay(200, withTiming(1, { duration: 500 }));
    }, []);
    const avatarStyle = useAnimatedStyle(() => ({
        transform: [{ scale: avatarScale.value }],
        opacity: avatarOp.value,
    }));

    // Name slide-up
    const nameY = useSharedValue(20);
    const nameOp = useSharedValue(0);
    useEffect(() => {
        nameY.value = withDelay(450, withTiming(0, { duration: 600 }));
        nameOp.value = withDelay(450, withTiming(1, { duration: 600 }));
    }, []);
    const nameStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: nameY.value }],
        opacity: nameOp.value,
    }));

    const handleLogout = () => {
        setPersona(null);
        setToken(null);
    };

    const VIBES = ['🌶️ Chaotic Neutral', '🌿 Chill Mode', '🔥 On Fire', '🎭 Main Character', '🌙 Night Owl'];
    const vibe = draftVibe || VIBES[(persona?.name?.length ?? 0) % VIBES.length];

    const openEdit = (field: 'alias' | 'vibe') => {
        setEditField(field);
        if (field === 'alias') setDraftAlias(persona?.name ?? '');
        else setDraftVibe(vibe);
        setEditVisible(true);
    };
    // Nav row
    return (
        <View style={styles.root}>
            {/* ── Edit Identity Modal ── */}
            <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setEditVisible(false)}>
                    <Pressable onPress={() => { }} style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>
                            {editField === 'alias' ? 'Edit Alias' : 'Pick Your Vibe'}
                        </Text>

                        {editField === 'alias' ? (
                            <View style={{ marginTop: 12 }}>
                                <TextInput
                                    style={styles.modalInput}
                                    value={draftAlias}
                                    onChangeText={setDraftAlias}
                                    placeholder="Your alias..."
                                    placeholderTextColor="rgba(255,255,255,0.25)"
                                    maxLength={24}
                                    autoFocus
                                />
                                <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 6, paddingLeft: 4 }}>
                                    {draftAlias.length}/24 · Changing alias doesn't affect your account
                                </Text>
                            </View>
                        ) : (
                            <View style={{ marginTop: 12, gap: 8 }}>
                                {VIBES.map(v => (
                                    <TouchableOpacity key={v} onPress={() => setDraftVibe(v)}
                                        style={[styles.vibeOption, draftVibe === v && styles.vibeOptionActive]}>
                                        <Text style={{ color: draftVibe === v ? 'white' : 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' }}>{v}</Text>
                                        {draftVibe === v && <MaterialIcons name="check-circle" size={18} color="#7C3AED" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity onPress={() => setEditVisible(false)} style={styles.modalSave}>
                            <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.modalSaveGradient}>
                                <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>Save Changes</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
            {/* ── Full bleed hero gradient ── */}
            <LinearGradient
                colors={[theme[0], theme[1], '#050210']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.heroBg, { height: HERO_H }]}
            />
            {/* Dark vignette over gradient to merge with body */}
            <LinearGradient
                colors={['transparent', '#050210']}
                style={[styles.heroVignette, { height: HERO_H * 0.6, top: HERO_H * 0.4 }]}
            />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* ── Top nav ── */}
                <View style={styles.nav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                        <MaterialIcons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.navTitle}>My Persona</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.navBtn}>
                            <MaterialIcons name="notifications-none" size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('PrivacyAccount')} style={styles.navBtn}>
                            <MaterialIcons name="settings" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* ── Hero with avatar ── */}
                    <View style={{ height: HERO_H, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 32 }}>
                        {/* Orbit rings */}
                        <OrbitRing size={220} color={theme[0]} duration={9000} />
                        <OrbitRing size={180} color={theme[1]} duration={6000} delay={300} reverse />
                        <OrbitRing size={250} color={theme[2]} duration={14000} delay={800} dash />

                        {/* Halos */}
                        <Halo color={theme[0]} size={140} delay={0} />
                        <Halo color={theme[1]} size={110} delay={700} />

                        {/* Floating emojis */}
                        {FLOATERS.map((e, i) => (
                            <FloatingEmoji key={i} emoji={e} x={(i * (W - 40)) / FLOATERS.length + 10}
                                delay={i * 350} />
                        ))}

                        {/* Avatar with glow */}
                        <Animated.View style={[styles.avatarWrapper, avatarStyle]}>
                            <Animated.View style={[{
                                position: 'absolute', inset: -12, borderRadius: 84,
                                backgroundColor: theme[0],
                            }, glowStyle]} />
                            <View style={{
                                position: 'absolute', inset: -6, borderRadius: 78,
                                backgroundColor: theme[1], opacity: 0.3
                            }} />
                            <View style={{
                                width: 120, height: 120, borderRadius: 60, overflow: 'hidden',
                                borderWidth: 3, borderColor: `${theme[0]}80`,
                            }}>
                                <Image
                                    source={{ uri: persona?.avatar ?? `https://api.dicebear.com/9.x/notionists/png?seed=${persona?.name}&backgroundColor=0a0a1a` }}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </View>
                            {/* Active dot */}
                            <View style={{
                                position: 'absolute', bottom: 4, right: 4,
                                width: 18, height: 18, borderRadius: 9,
                                backgroundColor: '#22C55E',
                                borderWidth: 3, borderColor: '#050210',
                            }} />
                        </Animated.View>

                        {/* Name + vibe tag */}
                        <Animated.View style={[{ alignItems: 'center', marginTop: 16 }, nameStyle]}>
                            <Text style={{
                                color: 'white', fontFamily: 'Poppins-Bold',
                                fontSize: 26, letterSpacing: -0.5,
                            }}>
                                @{persona?.name ?? 'GossipApe'}
                            </Text>
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
                                backgroundColor: `${theme[0]}30`,
                                borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5,
                                borderWidth: 1, borderColor: `${theme[0]}50`,
                            }}>
                                <Text style={{ color: theme[1] ?? CYAN, fontSize: 12, fontWeight: '700' }}>
                                    {vibe}
                                </Text>
                            </View>
                        </Animated.View>
                    </View>

                    {/* ── Score banner ── */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                        <View style={{
                            borderRadius: 22, overflow: 'hidden',
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                        }}>
                            <LinearGradient
                                colors={[`${theme[0]}30`, `${theme[1]}10`]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
                            >
                                {/* Top gloss */}
                                <View style={{
                                    position: 'absolute', top: 0, left: 16, right: 16, height: 1,
                                    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99
                                }} />
                                <View style={{
                                    width: 52, height: 52, borderRadius: 18,
                                    backgroundColor: `${AMBER}15`, borderWidth: 1.5, borderColor: `${AMBER}40`,
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Text style={{ fontSize: 26 }}>🍌</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        color: 'rgba(255,255,255,0.4)', fontSize: 10,
                                        fontWeight: '700', letterSpacing: 2, marginBottom: 2
                                    }}>
                                        BANANA SCORE
                                    </Text>
                                    <Text style={{ color: '#FBBF24', fontFamily: 'Poppins-Bold', fontSize: 28, letterSpacing: -1 }}>
                                        {score.toLocaleString()}
                                    </Text>
                                    {/* Progress bar */}
                                    <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                                        <LinearGradient
                                            colors={['#F59E0B', '#EF4444']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={{ width: `${scorePct}%`, height: '100%', borderRadius: 99 }}
                                        />
                                    </View>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={{
                                        backgroundColor: 'rgba(245,158,11,0.15)',
                                        borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4,
                                        borderWidth: 1, borderColor: 'rgba(245,158,11,0.28)',
                                    }}>
                                        <Text style={{ color: '#FBBF24', fontSize: 10, fontWeight: '800' }}>
                                            {scorePct < 30 ? 'NOOB 🐣' : scorePct < 60 ? 'MONKEY 🐒' : 'LEGEND 🔥'}
                                        </Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>

                    {/* ── Stats grid ── */}
                    <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 10, marginBottom: 28 }}>
                        <StatCard value={score.toLocaleString()} label="Bananas" icon="payments" color={AMBER} delay={0} />
                        <StatCard value="21" label="Rooms" icon="groups" color={PURPLE} delay={100} />
                        <StatCard value="1.2k" label="Msgs" icon="forum" color={CYAN} delay={200} />
                    </View>

                    {/* ── Badges ── */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 17 }}>
                                Badges
                            </Text>
                            <Text style={{ color: PURPLE, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                                View All
                            </Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <Badge icon="local-fire-department" label="Top Roaster" color={AMBER} delay={0} />
                            <Badge icon="verified" label="Early Ape" color={CYAN} delay={80} />
                            <Badge icon="celebration" label="Party Animal" color={PINK} delay={160} />
                            <Badge icon="star" label="Jungle King" color={GREEN} delay={240} />
                            <Badge icon="lock" label="???" color="#666" locked delay={320} />
                            <Badge icon="lock" label="???" color="#666" locked delay={400} />
                        </ScrollView>
                    </View>

                    {/* ── My Identity Card (editable) ── */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 17 }}>My Identity Card</Text>
                            <TouchableOpacity onPress={() => openEdit('alias')}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 4,
                                    backgroundColor: `${theme[0]}18`, borderRadius: 99,
                                    paddingHorizontal: 10, paddingVertical: 5,
                                    borderWidth: 1, borderColor: `${theme[0]}30`
                                }}>
                                <MaterialIcons name="edit" size={12} color={theme[0]} />
                                <Text style={{ color: theme[0], fontSize: 11, fontWeight: '700' }}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                            <LinearGradient
                                colors={[`${theme[0]}25`, `${theme[2]}15`, 'rgba(5,2,16,0.9)']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={{ padding: 20, gap: 14 }}
                            >
                                {/* Top gloss */}
                                <View style={{
                                    position: 'absolute', top: 0, left: 16, right: 16, height: 1,
                                    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99
                                }} />

                                {[
                                    { icon: 'badge', label: 'ALIAS', value: `@${persona?.name ?? 'GossipApe'}`, field: 'alias' as const, color: theme[0] },
                                    { icon: 'psychology', label: 'CURRENT VIBE', value: vibe, field: 'vibe' as const, color: theme[1] },
                                    { icon: 'schedule', label: 'MEMBER SINCE', value: 'Feb 2026', field: null, color: CYAN },
                                    { icon: 'privacy-tip', label: 'PERSONA MODE', value: '🙈 Anonymous', field: null, color: PINK },
                                ].map((row, i) => (
                                    <TouchableOpacity key={i}
                                        onPress={() => row.field && openEdit(row.field)}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
                                        activeOpacity={row.field ? 0.6 : 1}
                                    >
                                        <View style={{
                                            width: 36, height: 36, borderRadius: 12,
                                            backgroundColor: `${row.color}15`,
                                            borderWidth: 1, borderColor: `${row.color}30`,
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <MaterialIcons name={row.icon as any} size={18} color={row.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>
                                                {row.label}
                                            </Text>
                                            <Text style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'Poppins-Bold', fontSize: 13 }}>
                                                {row.value}
                                            </Text>
                                        </View>
                                        <MaterialIcons name="chevron-right" size={16} color="rgba(255,255,255,0.15)" />
                                    </TouchableOpacity>
                                ))}
                            </LinearGradient>
                        </View>
                    </View>

                    {/* ── Menu actions ── */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                        <Text style={{
                            color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700',
                            letterSpacing: 2, marginBottom: 12
                        }}>SETTINGS</Text>
                        <MenuRow icon="security" label="Account Privacy" color={PURPLE} onPress={() => navigation.navigate('PrivacyAccount')} />
                        <MenuRow icon="notifications-active" label="Notifications" color={CYAN} onPress={() => navigation.navigate('Notifications')} />
                        <MenuRow icon="share" label="Share Profile" color={GREEN} />
                    </View>

                    <View style={{ paddingHorizontal: 20 }}>
                        <MenuRow icon="logout" label="Log Out Persona" danger onPress={handleLogout} />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050210' },
    heroBg: { position: 'absolute', top: 0, left: 0, right: 0 },
    heroVignette: { position: 'absolute', left: 0, right: 0 },
    nav: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 8,
        justifyContent: 'space-between',
    },
    navBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
    },
    navTitle: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 16 },
    avatarWrapper: { alignItems: 'center', justifyContent: 'center' },
    // ── Edit modal ──
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#0E0A1E',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 44,
        borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignSelf: 'center', marginBottom: 20,
    },
    modalTitle: {
        color: 'white', fontFamily: 'Poppins-Bold', fontSize: 18,
        marginBottom: 4,
    },
    modalInput: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
        color: 'white', fontSize: 16, fontWeight: '600',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    vibeOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 14, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    },
    vibeOptionActive: {
        backgroundColor: 'rgba(124,58,237,0.12)',
        borderColor: 'rgba(124,58,237,0.35)',
    },
    modalSave: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
    modalSaveGradient: {
        paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    },
});
