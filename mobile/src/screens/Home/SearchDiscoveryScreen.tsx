import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, TextInput, ScrollView, TouchableOpacity,
    Image, Dimensions, StyleSheet, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withRepeat, withSequence, withTiming, withSpring,
    withDelay, interpolate, Easing,
} from 'react-native-reanimated';
import { useRoomStore } from '../../store/useRoomStore';

const { width: W } = Dimensions.get('window');
const CARD_W = W * 0.62;

// ── Static discovery data ─────────────────────────────────────────
const TRENDING_CARDS = [
    { id: '1', title: 'The Tea Room ☕️', tag: 'POP CULTURE', gradient: ['#7C3AED', '#EC4899', '#9333EA'] as [string, string, string], emoji: '☕️', heat: 92 },
    { id: '2', title: 'Silicon Valley Gossip', tag: 'TECH & AI', gradient: ['#1D4ED8', '#06B6D4', '#0EA5E9'] as [string, string, string], emoji: '💻', heat: 78 },
    { id: '3', title: 'MidnightVibes 🌙', tag: 'CHILL', gradient: ['#059669', '#10B981', '#34D399'] as [string, string, string], emoji: '🌙', heat: 55 },
    { id: '4', title: 'Drama HQ 🔥', tag: 'CHAOS', gradient: ['#B91C1C', '#F97316', '#EF4444'] as [string, string, string], emoji: '🔥', heat: 88 },
];

const CATEGORIES = [
    { key: 'all', label: 'All', emoji: '✨' },
    { key: 'hottest', label: 'Hottest', emoji: '🔥' },
    { key: 'newest', label: 'Newest', emoji: '🆕' },
    { key: 'local', label: 'Local', emoji: '📍' },
    { key: 'ai', label: 'AI-Only', emoji: '🤖' },
    { key: 'chill', label: 'Chill', emoji: '🌿' },
];

const MONKEY_TYPES = [
    { id: '1', name: 'The Roaster', desc: 'No ego is safe. Brutally honest, high-octane wit.', icon: 'local-fire-department', gradient: ['#7F1D1D', '#DC2626'] as [string, string], accent: '#F87171' },
    { id: '2', name: 'The Wise One', desc: 'Philosophical depths and cryptic life advice.', icon: 'psychology', gradient: ['#0C4A6E', '#0EA5E9'] as [string, string], accent: '#38BDF8' },
    { id: '3', name: 'Chaos Agent', desc: 'Random facts, unexpected turns, pure energy.', icon: 'cyclone', gradient: ['#3B0764', '#9333EA'] as [string, string], accent: '#C084FC' },
    { id: '4', name: 'Hype Machine', desc: 'Main character energy. Your biggest supporter.', icon: 'celebration', gradient: ['#78350F', '#F59E0B'] as [string, string], accent: '#FCD34D' },
];

const VIBES = [
    { label: '#DramaAlert', color: '#F97316', rooms: '2.1k' },
    { label: '#UrbanVibe', color: '#818CF8', rooms: '1.4k' },
    { label: '#ZenCorner', color: '#34D399', rooms: '980' },
    { label: '#LateNight', color: '#A78BFA', rooms: '742' },
    { label: '#TechTalk', color: '#38BDF8', rooms: '633' },
    { label: '#BananaGang', color: '#FBBF24', rooms: '521' },
];

// ── Pulse dot ─────────────────────────────────────────────────────
function PulseDot({ color = '#22c55e' }: { color?: string }) {
    const s = useSharedValue(1);
    useEffect(() => {
        s.value = withRepeat(withSequence(withTiming(1.8, { duration: 900 }), withTiming(1, { duration: 900 })), -1, true);
    }, []);
    const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: 0.3 }));
    return (
        <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: color }, a]} />
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
        </View>
    );
}

// ── Trending card ─────────────────────────────────────────────────
function TrendingCard({ item, idx, onPress }: { item: typeof TRENDING_CARDS[0]; idx: number; onPress: () => void }) {
    const s = useSharedValue(0);
    useEffect(() => { s.value = withDelay(idx * 80, withSpring(1, { damping: 13 })); }, []);
    const style = useAnimatedStyle(() => ({
        opacity: s.value, transform: [{ scale: interpolate(s.value, [0, 1], [0.88, 1]) }],
    }));
    return (
        <Animated.View style={[{ width: CARD_W, marginRight: 14, borderRadius: 26, overflow: 'hidden' }, style]}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
                <LinearGradient colors={item.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ padding: 20, height: 180 }}>
                    {/* Active badge */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 5,
                        backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 99,
                        paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start'
                    }}>
                        <PulseDot color="#fff" />
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>
                            LIVE
                        </Text>
                    </View>

                    {/* Big emoji */}
                    <Text style={{ fontSize: 42, position: 'absolute', right: 16, top: 12 }}>{item.emoji}</Text>

                    {/* Bottom content */}
                    <View style={{ position: 'absolute', bottom: 18, left: 18, right: 18 }}>
                        <View style={{
                            backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 99,
                            paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6
                        }}>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>
                                {item.tag}
                            </Text>
                        </View>
                        <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 17, lineHeight: 22 }}>
                            {item.title}
                        </Text>
                        {/* Heat bar */}
                        <View style={{ marginTop: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: '700', letterSpacing: 1.5 }}>HEAT</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '800' }}>{item.heat}%</Text>
                            </View>
                            <View style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99 }}>
                                <View style={{ width: `${item.heat}%` as any, height: 2, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 99 }} />
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Monkey personality card ───────────────────────────────────────
function MonkeyCard({ item, idx }: { item: typeof MONKEY_TYPES[0]; idx: number }) {
    const s = useSharedValue(0);
    useEffect(() => { s.value = withDelay(idx * 100, withSpring(1, { damping: 14 })); }, []);
    const style = useAnimatedStyle(() => ({
        opacity: s.value, transform: [{ translateY: interpolate(s.value, [0, 1], [20, 0]) }],
    }));
    return (
        <Animated.View style={[{ width: (W - 52) / 2, borderRadius: 22, overflow: 'hidden' }, style]}>
            <TouchableOpacity activeOpacity={0.8}>
                <LinearGradient colors={[`${item.gradient[0]}CC`, `${item.gradient[1]}88`]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ padding: 16, borderWidth: 1, borderColor: `${item.accent}25`, borderRadius: 22 }}>
                    {/* Top gloss */}
                    <View style={{
                        position: 'absolute', top: 0, left: 12, right: 12, height: 1,
                        backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99
                    }} />
                    <View style={{
                        width: 42, height: 42, borderRadius: 14,
                        backgroundColor: `${item.accent}20`, borderWidth: 1, borderColor: `${item.accent}40`,
                        alignItems: 'center', justifyContent: 'center', marginBottom: 12
                    }}>
                        <MaterialIcons name={item.icon as any} size={22} color={item.accent} />
                    </View>
                    <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 14, marginBottom: 5 }}>
                        {item.name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 16 }}>
                        {item.desc}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 }}>
                        <Text style={{ color: item.accent, fontSize: 10, fontWeight: '700' }}>Explore →</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Vibe tag pill ─────────────────────────────────────────────────
function VibePill({ item, idx }: { item: typeof VIBES[0]; idx: number }) {
    const s = useSharedValue(0);
    useEffect(() => { s.value = withDelay(idx * 60, withSpring(1, { damping: 14 })); }, []);
    const style = useAnimatedStyle(() => ({
        opacity: s.value, transform: [{ scale: interpolate(s.value, [0, 1], [0.8, 1]) }],
    }));
    return (
        <Animated.View style={style}>
            <TouchableOpacity style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                marginBottom: 10,
            }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: 14, flex: 1 }}>
                    {item.label}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '600' }}>
                    {item.rooms} rooms
                </Text>
                <MaterialIcons name="chevron-right" size={16} color="rgba(255,255,255,0.15)" />
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Main screen ───────────────────────────────────────────────────
export function SearchDiscoveryScreen({ navigation }: any) {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const { rooms } = useRoomStore();

    // Real rooms filtered (fallback to mock trending if empty)
    const displayRooms = rooms.length > 0
        ? rooms.slice(0, 6)
        : [];

    return (
        <View style={styles.root}>
            {/* Ambient glows */}
            <View pointerEvents="none" style={styles.blob1} />
            <View pointerEvents="none" style={styles.blob2} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                        <MaterialIcons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        <Text style={styles.headerTitle}>Explore</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 1 }}>
                            Find your tribe in the jungle
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.navBtn}>
                        <MaterialIcons name="notifications-none" size={22} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* ── Search bar ── */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 18, marginTop: 4 }}>
                        <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
                            <MaterialIcons name="search" size={20}
                                color={focused ? '#818CF8' : 'rgba(255,255,255,0.28)'} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search jungles & monkeys..."
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                value={query}
                                onChangeText={setQuery}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                            />
                            {query.length > 0
                                ? <TouchableOpacity onPress={() => setQuery('')}>
                                    <MaterialIcons name="cancel" size={16} color="rgba(255,255,255,0.3)" />
                                </TouchableOpacity>
                                : <MaterialIcons name="mic" size={18} color="rgba(255,255,255,0.2)" />
                            }
                        </View>
                    </View>

                    {/* ── Category pills ── */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: 24 }}
                        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, flexDirection: 'row' }}>
                        {CATEGORIES.map(c => {
                            const on = activeCategory === c.key;
                            return (
                                <TouchableOpacity key={c.key} onPress={() => setActiveCategory(c.key)} style={[
                                    styles.catPill, on && styles.catPillActive,
                                ]}>
                                    <Text style={{ fontSize: 12 }}>{c.emoji}</Text>
                                    <Text style={[styles.catLabel, on && { color: '#000' }]}>{c.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* ── Trending Jungles ── */}
                    <View style={{ marginBottom: 28 }}>
                        <View style={styles.sectionRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MaterialIcons name="local-fire-department" size={18} color="#F97316" />
                                <Text style={styles.sectionTitle}>Trending Jungles</Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={{ color: '#818CF8', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
                                    VIEW ALL
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 20 }}>
                            {TRENDING_CARDS.map((item, i) => (
                                <TrendingCard key={item.id} item={item} idx={i}
                                    onPress={() => navigation.navigate('Home')} />
                            ))}
                        </ScrollView>
                    </View>

                    {/* ── Live rooms from backend ── */}
                    {displayRooms.length > 0 && (
                        <View style={{ marginBottom: 28, paddingHorizontal: 20 }}>
                            <View style={styles.sectionRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <PulseDot color="#22C55E" />
                                    <Text style={styles.sectionTitle}>Live Right Now</Text>
                                </View>
                            </View>
                            <View style={{ gap: 8 }}>
                                {displayRooms.map((room, i) => (
                                    <TouchableOpacity key={room.id}
                                        onPress={() => navigation.navigate('Chat', { roomId: room.id, roomName: room.name })}
                                        style={styles.liveRow}>
                                        <View style={styles.liveIconBox}>
                                            <MaterialIcons name="smart-toy" size={18} color="#818CF8" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                                                {room.name}
                                            </Text>
                                            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>
                                                {room.type === 'private' ? '🔒 Private' : '🔓 Public'} · {room.participantsCount ?? 0} online
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => navigation.navigate('Chat', { roomId: room.id, roomName: room.name })}
                                            style={styles.joinBtn}>
                                            <Text style={{ color: 'white', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>
                                                JOIN
                                            </Text>
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ── Meet the AI Monkeys ── */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
                        <View style={styles.sectionRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <MaterialIcons name="smart-toy" size={18} color="#A78BFA" />
                                <Text style={styles.sectionTitle}>Meet the Monkeys</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                            {MONKEY_TYPES.map((m, i) => (
                                <MonkeyCard key={m.id} item={m} idx={i} />
                            ))}
                        </View>
                    </View>

                    {/* ── Hot vibe tags ── */}
                    <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                        <View style={styles.sectionRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 16 }}>🏷️</Text>
                                <Text style={styles.sectionTitle}>Hot Vibes</Text>
                            </View>
                        </View>
                        {VIBES.map((v, i) => (
                            <VibePill key={v.label} item={v} idx={i} />
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050210' },
    blob1: {
        position: 'absolute', top: -80, left: -80,
        width: 260, height: 260, borderRadius: 130,
        backgroundColor: '#4c1d95', opacity: 0.14,
    },
    blob2: {
        position: 'absolute', bottom: 200, right: -60,
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: '#0c4a6e', opacity: 0.12,
    },
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 18 },
    navBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 18, paddingHorizontal: 14, paddingVertical: 13,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    searchBoxFocused: {
        backgroundColor: 'rgba(129,140,248,0.08)',
        borderColor: 'rgba(129,140,248,0.4)',
    },
    searchInput: { flex: 1, color: 'white', fontSize: 14, fontWeight: '500' },
    catPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    catPillActive: { backgroundColor: 'white', borderColor: 'white' },
    catLabel: { color: 'rgba(255,255,255,0.55)', fontWeight: '700', fontSize: 12 },
    sectionRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
    },
    sectionTitle: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 16 },
    liveRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 18, padding: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    liveIconBox: {
        width: 42, height: 42, borderRadius: 14,
        backgroundColor: 'rgba(129,140,248,0.1)',
        borderWidth: 1, borderColor: 'rgba(129,140,248,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    joinBtn: {
        backgroundColor: 'rgba(129,140,248,0.15)',
        borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7,
        borderWidth: 1, borderColor: 'rgba(129,140,248,0.3)',
    },
});
