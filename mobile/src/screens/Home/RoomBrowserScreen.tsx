import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, TextInput,
    ScrollView, Image, RefreshControl, Dimensions, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue, useAnimatedStyle,
    withRepeat, withSequence, withTiming, withSpring,
} from 'react-native-reanimated';
import { api } from '../../services/api';
import { useRoomStore, Room } from '../../store/useRoomStore';
import { useAppStore } from '../../store/useAppStore';

const { width: W } = Dimensions.get('window');

// ── Rotating vibrant gradient palette ────────────────────────────
// Each card in the list gets a unique gradient based on its index
const CARD_PALETTES: Array<{
    g: [string, string, string];
    accent: string;
    badge: string;
}> = [
        // 0 — deep violet → hot pink
        { g: ['#2D1B69', '#9333EA', '#EC4899'], accent: '#F472B6', badge: 'TRENDING' },
        // 1 — dark teal → bright emerald
        { g: ['#022C22', '#059669', '#34D399'], accent: '#6EE7B7', badge: 'CHILLED' },
        // 2 — midnight blue → cyan
        { g: ['#0C1445', '#1D4ED8', '#22D3EE'], accent: '#67E8F9', badge: 'HYPE' },
        // 3 — deep rose → amber
        { g: ['#450A0A', '#B91C1C', '#F97316'], accent: '#FB923C', badge: 'CHAOTIC' },
        // 4 — dark plum → fuchsia
        { g: ['#2E1065', '#7C3AED', '#F0ABFC'], accent: '#E879F9', badge: 'VIBING' },
        // 5 — forest → lime
        { g: ['#052E16', '#15803D', '#86EFAC'], accent: '#4ADE80', badge: 'CHILL' },
        // 6 — indigo → sky
        { g: ['#1E1B4B', '#4338CA', '#38BDF8'], accent: '#7DD3FC', badge: 'LIVE' },
        // 7 — crimson → rose
        { g: ['#3B0764', '#BE185D', '#FB7185'], accent: '#FCA5A5', badge: 'FIRE' },
    ];

const palette = (idx: number) => CARD_PALETTES[idx % CARD_PALETTES.length];

// ── HOT SPOTS ────────────────────────────────────────────────────
const HOT_SPOTS = [
    { tag: 'UrbanVibe', emoji: '#', color: '#818CF8' },
    { tag: 'DramaAlert', emoji: '🔥', color: '#F97316' },
    { tag: 'ZenCorner', emoji: '🌿', color: '#34D399' },
    { tag: 'MidnightTea', emoji: '🍵', color: '#60A5FA' },
    { tag: 'ChaosModes', emoji: '🌀', color: '#F472B6' },
    { tag: 'BananaGang', emoji: '🍌', color: '#FBBF24' },
    { tag: 'LateNight', emoji: '🌙', color: '#A78BFA' },
];

// ── Fake room heat (deterministic) ───────────────────────────────
const roomHeat = (name: string) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xFFFF;
    return 20 + (h % 75);
};

const heatLabel = (pct: number) =>
    pct > 75 ? 'FIRE 🔥' : pct > 50 ? 'HYPE ⚡' : pct > 30 ? 'COZY 🌿' : 'MELLOW 🌊';

// ── Pulse dot ────────────────────────────────────────────────────
function PulseDot({ color = '#22c55e' }: { color?: string }) {
    const s = useSharedValue(1);
    useEffect(() => {
        s.value = withRepeat(withSequence(withTiming(1.7, { duration: 800 }), withTiming(1, { duration: 800 })), -1, true);
    }, []);
    const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: 0.35 }));
    return (
        <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: color }, a]} />
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />
        </View>
    );
}

// ── Preview fetcher ──────────────────────────────────────────────
interface ChatMsg { sender: string; text: string; }
function useRoomPreview(roomId: string) {
    const [msgs, setMsgs] = useState<ChatMsg[]>([]);
    useEffect(() => {
        api.get(`/rooms/${roomId}/preview`)
            .then((res: any) => setMsgs(res.data?.data ?? []))
            .catch(() => { });
    }, [roomId]);
    return msgs;
}

// ── Avatar stack ─────────────────────────────────────────────────
function AvatarStack({ count, accent }: { count: number; accent: string }) {
    if (count === 0) return (
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600' }}>
            No one yet — be first!
        </Text>
    );
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                <View key={i} style={{
                    width: 24, height: 24, borderRadius: 12,
                    backgroundColor: `${accent}40`,
                    borderWidth: 2, borderColor: 'rgba(0,0,0,0.3)',
                    marginLeft: i > 0 ? -10 : 0,
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <Text style={{ fontSize: 10 }}>🐒</Text>
                </View>
            ))}
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
                +{count} vibes
            </Text>
        </View>
    );
}

// ── Room card ────────────────────────────────────────────────────
function RoomCard({ room, idx, onJoin, isCreator }: {
    room: Room; idx: number; onJoin: () => void; isCreator: boolean;
}) {
    const pal = palette(idx);
    const msgs = useRoomPreview(room.id);
    const heat = roomHeat(room.name);
    const press = useSharedValue(1);
    const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

    const handlePress = () => {
        press.value = withSequence(withTiming(0.97, { duration: 60 }), withSpring(1, { damping: 14 }));
        onJoin();
    };

    const isPrivate = room.type === 'private';

    return (
        <Animated.View style={[{ marginBottom: 18, borderRadius: 26, overflow: 'hidden' }, pressStyle]}>
            <TouchableOpacity onPress={handlePress} activeOpacity={1}>
                <LinearGradient colors={pal.g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 22 }}>

                    {/* Row 1: badge + icon box */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <View style={{
                            backgroundColor: `${pal.accent}30`,
                            borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5,
                            borderWidth: 1, borderColor: `${pal.accent}50`,
                        }}>
                            <Text style={{ color: pal.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>
                                {isCreator ? '⭐ YOURS' : pal.badge}
                            </Text>
                        </View>

                        <View style={{
                            width: 50, height: 50, borderRadius: 17,
                            backgroundColor: 'rgba(0,0,0,0.22)',
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <MaterialIcons
                                name={isPrivate ? 'lock' : 'smart-toy'}
                                size={24} color="rgba(255,255,255,0.8)"
                            />
                        </View>
                    </View>

                    {/* Room name */}
                    <Text style={{
                        color: '#FFFFFF', fontFamily: 'Poppins-Bold',
                        fontSize: 28, letterSpacing: -0.5, marginBottom: 8, lineHeight: 34,
                    }} numberOfLines={1}>
                        {room.name}
                    </Text>

                    {/* AI monkey name */}
                    {room.monkeyConfig?.name && (
                        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 10 }}>
                            🤖 {room.monkeyConfig.name}
                        </Text>
                    )}

                    {/* Avatar stack */}
                    <AvatarStack count={room.participantsCount ?? 0} accent={pal.accent} />

                    {/* Live message bubbles */}
                    {msgs.length > 0 && (
                        <View style={{ marginTop: 16, gap: 8 }}>
                            {msgs.slice(-2).map((m, i) => (
                                <View key={i} style={{
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    borderRadius: 14, padding: 12,
                                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                                }}>
                                    <Text style={{ color: pal.accent, fontSize: 11, fontWeight: '700', marginBottom: 3 }}>
                                        {m.sender}
                                    </Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                                        {m.text}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Heat bar */}
                    <View style={{ marginTop: 18 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>ROOMHEAT</Text>
                            <Text style={{ color: pal.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }}>
                                {heat}% {heatLabel(heat)}
                            </Text>
                        </View>
                        <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                            <LinearGradient
                                colors={[pal.g[1], pal.accent]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={{ width: `${heat}%`, height: '100%', borderRadius: 99 }}
                            />
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <PulseDot color={pal.accent} />
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' }}>LIVE NOW</Text>
                        </View>
                        <TouchableOpacity onPress={handlePress} style={{
                            backgroundColor: 'rgba(0,0,0,0.32)',
                            borderRadius: 99, paddingHorizontal: 20, paddingVertical: 9,
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                        }}>
                            <MaterialIcons name={isPrivate ? 'lock' : 'arrow-forward'} size={13} color="white" />
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>
                                {isPrivate ? 'KNOCK' : 'JOIN'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── Empty state ──────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
    const f = useSharedValue(0);
    useEffect(() => {
        f.value = withRepeat(withSequence(withTiming(-12, { duration: 2400 }), withTiming(0, { duration: 2400 })), -1, true);
    }, []);
    const fs = useAnimatedStyle(() => ({ transform: [{ translateY: f.value }] }));
    return (
        <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 }}>
            <Animated.Text style={[{ fontSize: 64, marginBottom: 16 }, fs]}>🌴</Animated.Text>
            <Text style={{ color: '#FFFFFF', fontFamily: 'Poppins-Bold', fontSize: 22, textAlign: 'center', marginBottom: 8 }}>
                The Jungle is Quiet...
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 28 }}>
                No rooms yet. Be the first to start the chaos.
            </Text>
            <TouchableOpacity onPress={onCreate} style={{ borderRadius: 16, overflow: 'hidden' }}>
                <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingHorizontal: 28, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialIcons name="add" size={16} color="white" />
                    <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 13 }}>Start a Room</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

// ── Tab bar ──────────────────────────────────────────────────────
const TABS = [
    { key: 'Home', icon: 'home-filled', label: 'JUNGLE' },
    { key: 'SearchDiscovery', icon: 'search', label: 'EXPLORE' },
    { key: 'CreateRoom', icon: 'add', label: '' },
    { key: 'Profile', icon: 'people', label: 'SPACES' },
    { key: 'PrivacyAccount', icon: 'person', label: 'YOU' },
];

function TabBar({ navigation }: { navigation: any }) {
    const insets = useSafeAreaInsets();
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(4,2,14,0.98)',
            borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
            paddingTop: 10, paddingBottom: Math.max(insets.bottom, 8),
        }}>
            {TABS.map((t, i) => {
                const active = i === 0;
                const isCreate = t.key === 'CreateRoom';
                if (isCreate) {
                    return (
                        <View key={t.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate(t.key)}
                                style={{
                                    width: 52, height: 52, borderRadius: 26,
                                    backgroundColor: 'white',
                                    alignItems: 'center', justifyContent: 'center',
                                    shadowColor: '#9333ea', shadowOpacity: 0.35,
                                    shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
                                    elevation: 10, marginTop: -16,
                                }}
                            >
                                <MaterialIcons name="add" size={28} color="#000" />
                            </TouchableOpacity>
                        </View>
                    );
                }
                return (
                    <TouchableOpacity key={t.key} onPress={() => navigation.navigate(t.key)}
                        style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 }}>
                        {active && (
                            <View style={{ position: 'absolute', top: -10, width: 4, height: 4, borderRadius: 2, backgroundColor: 'white' }} />
                        )}
                        <MaterialIcons name={t.icon as any} size={22}
                            color={active ? '#FFFFFF' : 'rgba(255,255,255,0.2)'} />
                        {t.label ? (
                            <Text style={{
                                fontSize: 8, fontWeight: '700', letterSpacing: 1,
                                color: active ? 'white' : 'rgba(255,255,255,0.2)'
                            }}>
                                {t.label}
                            </Text>
                        ) : null}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ── List header ──────────────────────────────────────────────────
function ListHeader({ persona, navigation, search, setSearch, searchFocused, setSearchFocused, activeFilter, setActiveFilter }: any) {
    const FILTER_CHIPS = [
        { key: 'all', label: 'All', emoji: '✨' },
        { key: 'public', label: 'Public', emoji: '🔓' },
        { key: 'private', label: 'Private', emoji: '🔒' },
        { key: 'hype', label: 'Hype', emoji: '🔥' },
    ];

    return (
        <View style={{ paddingTop: 4, paddingBottom: 8 }}>
            {/* Persona row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                        width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
                        borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)'
                    }}>
                        {persona?.avatar
                            ? <Image source={{ uri: persona.avatar }} style={{ width: '100%', height: '100%' }} />
                            : <View style={{ flex: 1, backgroundColor: '#2d1b69', alignItems: 'center', justifyContent: 'center' }}>
                                <MaterialIcons name="person" size={20} color="#a78bfa" />
                            </View>
                        }
                    </View>
                    <View>
                        <Text style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>
                            SPILL THE TEA 🍵
                        </Text>
                        <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 14, letterSpacing: -0.3 }}>
                            {persona?.name ?? 'Monkey Man'}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                        backgroundColor: 'rgba(251,191,36,0.1)', borderRadius: 99,
                        paddingHorizontal: 10, paddingVertical: 5,
                        borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)'
                    }}>
                        <Text style={{ fontSize: 12 }}>🍌</Text>
                        <Text style={{ color: '#FBBF24', fontFamily: 'Poppins-Bold', fontSize: 12 }}>
                            {persona?.score?.toLocaleString() ?? '100'}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('PrivacyAccount')}
                        style={{
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: 'rgba(255,255,255,0.07)',
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'
                        }}>
                        <MaterialIcons name="settings" size={17} color="rgba(255,255,255,0.35)" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: searchFocused ? 'rgba(147,51,234,0.12)' : 'rgba(255,255,255,0.06)',
                borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
                borderWidth: 1, borderColor: searchFocused ? 'rgba(147,51,234,0.45)' : 'rgba(255,255,255,0.08)',
                marginBottom: 16,
            }}>
                <MaterialIcons name="search" size={17} color={searchFocused ? '#a78bfa' : 'rgba(255,255,255,0.28)'} />
                <TextInput
                    style={{ flex: 1, color: 'white', fontFamily: 'Poppins-Medium', fontSize: 14 }}
                    placeholder="Search the jungle..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={search}
                    onChangeText={setSearch}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <MaterialIcons name="cancel" size={15} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
                {FILTER_CHIPS.map(f => {
                    const on = activeFilter === f.key;
                    return (
                        <TouchableOpacity key={f.key} onPress={() => setActiveFilter(f.key)}
                            style={{
                                flexDirection: 'row', alignItems: 'center', gap: 5,
                                marginRight: 8, paddingHorizontal: 14, paddingVertical: 8,
                                borderRadius: 99,
                                backgroundColor: on ? 'white' : 'rgba(255,255,255,0.06)',
                                borderWidth: 1, borderColor: on ? 'white' : 'rgba(255,255,255,0.08)',
                            }}>
                            <Text style={{ fontSize: 12 }}>{f.emoji}</Text>
                            <Text style={{
                                color: on ? '#000' : 'rgba(255,255,255,0.55)',
                                fontFamily: 'Poppins-Bold', fontSize: 12
                            }}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* HOT SPOTS */}
            <Text style={{
                color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700',
                letterSpacing: 2, marginBottom: 10
            }}>HOT SPOTS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {HOT_SPOTS.map(h => (
                    <TouchableOpacity key={h.tag} style={{
                        flexDirection: 'row', alignItems: 'center', gap: 5,
                        marginRight: 8, paddingHorizontal: 12, paddingVertical: 7,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                    }}>
                        <Text style={{ fontSize: 12 }}>{h.emoji}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' }}>
                            {h.tag}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Section label */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 22, letterSpacing: -0.5 }}>
                    Live Jungles
                </Text>
                <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 99,
                    paddingHorizontal: 10, paddingVertical: 4,
                    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)'
                }}>
                    <PulseDot color="#22c55e" />
                    <Text style={{ color: '#22c55e', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>
                        LIVE NOW
                    </Text>
                </View>
            </View>
        </View>
    );
}

// ── Main screen ──────────────────────────────────────────────────
export function RoomBrowserScreen({ navigation }: any) {
    const { rooms, loading, fetchRooms } = useRoomStore();
    const { persona } = useAppStore();
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => { fetchRooms(); }, [fetchRooms]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchRooms();
        setRefreshing(false);
    }, [fetchRooms]);

    const filteredRooms = rooms.filter(r => {
        const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
        if (!matchSearch) return false;
        if (activeFilter === 'all') return true;
        if (activeFilter === 'public') return r.type === 'public';
        if (activeFilter === 'private') return r.type === 'private';
        if (activeFilter === 'hype') return (r.participantsCount ?? 0) > 2;
        return true;
    });

    const handleJoin = (room: Room) => {
        if (room.type === 'private' && room.creatorId !== persona?.id) {
            navigation.navigate('JoinPrivateRoom', {
                roomId: room.id,
                roomName: room.name,
                requiresPin: !!(room.settings as any)?.password,
                requiresApproval: !!(room.settings as any)?.approvalRequired,
            });
        } else {
            navigation.navigate('Chat', {
                roomId: room.id,
                roomName: room.name,
                roomType: room.type,
                creatorId: room.creatorId,
            });
        }
    };

    return (
        // KEY FIX: flex:1 column layout so TabBar sits below FlatList properly
        <View style={styles.root}>
            {/* Ambient glow blobs */}
            <View pointerEvents="none" style={styles.blob1} />
            <View pointerEvents="none" style={styles.blob2} />

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* ✅ FlatList fills all remaining space above TabBar */}
                <FlatList
                    data={filteredRooms}
                    keyExtractor={(item, i) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <ListHeader
                            persona={persona}
                            navigation={navigation}
                            search={search}
                            setSearch={setSearch}
                            searchFocused={searchFocused}
                            setSearchFocused={setSearchFocused}
                            activeFilter={activeFilter}
                            setActiveFilter={setActiveFilter}
                        />
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9333ea" />
                    }
                    renderItem={({ item, index }) => (
                        <RoomCard
                            room={item}
                            idx={index}
                            onJoin={() => handleJoin(item)}
                            isCreator={item.creatorId === persona?.id}
                        />
                    )}
                    ListEmptyComponent={
                        loading ? null : (
                            <EmptyState onCreate={() => navigation.navigate('CreateRoom')} />
                        )
                    }
                />
            </SafeAreaView>

            {/* Tab bar — outside SafeAreaView, anchored at bottom */}
            <TabBar navigation={navigation} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#050210',
        // Column flex so SafeAreaView (flex:1) + TabBar stack vertically
        flexDirection: 'column',
    },
    safeArea: {
        flex: 1, // takes all space ABOVE the TabBar
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    blob1: {
        position: 'absolute', top: -100, left: -100,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: '#4c1d95', opacity: 0.18,
    },
    blob2: {
        position: 'absolute', bottom: 120, right: -80,
        width: 240, height: 240, borderRadius: 120,
        backgroundColor: '#831843', opacity: 0.12,
    },
});
