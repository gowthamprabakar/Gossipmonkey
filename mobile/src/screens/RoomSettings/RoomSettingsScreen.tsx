import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Switch,
    TextInput, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
    useSharedValue, useAnimatedStyle, withSpring, withSequence,
    withTiming, withDelay, interpolate, Easing,
} from 'react-native-reanimated';
import { socketManager } from '../../services/socket';

const { width: W } = Dimensions.get('window');

// ── Personality config ────────────────────────────────────────────
const PERSONALITIES = [
    {
        key: 'roaster', emoji: '🔥', name: 'The Roaster', tagline: 'Brutally honest wit',
        gradient: ['#7F1D1D', '#DC2626', '#F97316'] as [string, string, string],
        accent: '#F97316', power: 92, fun: 88, chaos: 45,
        rarity: 'LEGENDARY', rarityColor: '#FBBF24',
    },
    {
        key: 'wise', emoji: '🧠', name: 'The Wise One', tagline: 'Philosophical depths',
        gradient: ['#0C4A6E', '#0369A1', '#38BDF8'] as [string, string, string],
        accent: '#38BDF8', power: 85, fun: 72, chaos: 20,
        rarity: 'EPIC', rarityColor: '#A78BFA',
    },
    {
        key: 'chaos', emoji: '🌀', name: 'Chaos Agent', tagline: 'Pure unpredictable entropy',
        gradient: ['#3B0764', '#7C3AED', '#C084FC'] as [string, string, string],
        accent: '#C084FC', power: 75, fun: 95, chaos: 99,
        rarity: 'MYTHIC', rarityColor: '#EC4899',
    },
    {
        key: 'hype', emoji: '🎉', name: 'Hype Machine', tagline: 'Main character energy',
        gradient: ['#78350F', '#B45309', '#FCD34D'] as [string, string, string],
        accent: '#FCD34D', power: 80, fun: 97, chaos: 60,
        rarity: 'RARE', rarityColor: '#34D399',
    },
    {
        key: 'detective', emoji: '🕵️', name: 'Detective', tagline: 'Finds every truth',
        gradient: ['#1E3A5F', '#1D4ED8', '#93C5FD'] as [string, string, string],
        accent: '#93C5FD', power: 88, fun: 65, chaos: 30,
        rarity: 'EPIC', rarityColor: '#A78BFA',
    },
    {
        key: 'philosopher', emoji: '🌌', name: 'Philosopher', tagline: 'Why do we even exist',
        gradient: ['#1A0F3C', '#4C1D95', '#A78BFA'] as [string, string, string],
        accent: '#A78BFA', power: 70, fun: 78, chaos: 55,
        rarity: 'RARE', rarityColor: '#34D399',
    },
];

// ── Banana score tiers ────────────────────────────────────────────
const TIERS = [
    { label: 'Anyone', value: 0, icon: '🐣', color: '#6B7280', desc: 'Absolute noobs welcome' },
    { label: 'Hustler', value: 100, icon: '🐒', color: '#34D399', desc: 'Tried at least once' },
    { label: 'Gorilla', value: 500, icon: '🦍', color: '#F97316', desc: 'Decent reputation' },
    { label: 'Elite', value: 1000, icon: '👑', color: '#FBBF24', desc: 'Top monkeys only' },
    { label: 'God', value: 2000, icon: '🌌', color: '#EC4899', desc: 'Legends only, sorry' },
];

// ── Animated stat bar ─────────────────────────────────────────────
function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
    const width = useSharedValue(0);
    useEffect(() => {
        width.value = withDelay(200, withSpring(value, { damping: 14 }));
    }, [value]);
    const barStyle = useAnimatedStyle(() => ({
        width: `${width.value}%` as any,
    }));
    return (
        <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={stl.statLabel}>{label}</Text>
                <Text style={[stl.statLabel, { color }]}>{value}</Text>
            </View>
            <View style={stl.statTrack}>
                <Reanimated.View style={[stl.statFill, { backgroundColor: color }, barStyle]} />
            </View>
        </View>
    );
}

// ── XP progress bar (for reply chance) ───────────────────────────
function XPBar({ value, onChange, label, color = '#818CF8' }: { value: number; onChange: (v: number) => void; label: string; color?: string }) {
    const STEPS = [0, 25, 50, 75, 100];
    return (
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={stl.toggleLabel}>{label}</Text>
                <View style={[stl.xpBadge, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
                    <Text style={[stl.xpBadgeText, { color }]}>{value}%</Text>
                </View>
            </View>
            <View style={stl.xpTrack}>
                <View style={[stl.xpFill, { width: `${value}%`, backgroundColor: color }]} />
                {STEPS.map(s => (
                    <View key={s}
                        style={[stl.xpTick, { left: `${s}%` as any, backgroundColor: value >= s ? color : 'rgba(255,255,255,0.15)' }]} />
                ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                {STEPS.map(s => (
                    <TouchableOpacity key={s} onPress={() => onChange(s)} style={stl.xpStep}>
                        <Text style={[stl.xpStepLabel, value === s && { color }]}>{s}%</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// ── Toggle row ────────────────────────────────────────────────────
function ToggleRow({ icon, label, desc, value, onChange, color = '#818CF8' }: any) {
    const scale = useSharedValue(1);
    const pulse = () => {
        scale.value = withSequence(withTiming(1.08, { duration: 100 }), withTiming(1, { duration: 100 }));
    };
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    return (
        <Reanimated.View style={[stl.toggleRow, animStyle]}>
            <View style={[stl.toggleIcon, { backgroundColor: `${color}15` }]}>
                <MaterialIcons name={icon} size={16} color={color} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={stl.toggleLabel}>{label}</Text>
                {desc ? <Text style={stl.toggleDesc}>{desc}</Text> : null}
            </View>
            <Switch value={value} onValueChange={v => { pulse(); onChange(v); }}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: `${color}55` }}
                thumbColor={value ? color : 'rgba(255,255,255,0.25)'} />
        </Reanimated.View>
    );
}

// ── Tab label icons ───────────────────────────────────────────────
const TABS = [
    { key: 'Info', icon: 'info-outline', label: 'Info', color: '#818CF8' },
    { key: 'Monkey', icon: 'smart-toy', label: 'Monkey', color: '#F97316' },
    { key: 'Moderate', icon: 'security', label: 'Guard', color: '#34D399' },
    { key: 'Advanced', icon: 'tune', label: 'Advanced', color: '#EC4899' },
] as const;

type TabKey = 'Info' | 'Monkey' | 'Moderate' | 'Advanced';

// ─────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────────────────────────
export function RoomSettingsScreen({ navigation, route }: any) {
    const { roomId, isAdmin = false } = route?.params ?? {};
    const [activeTab, setActiveTab] = useState<TabKey>('Monkey');

    // ── Info state ──
    const [roomName, setRoomName] = useState('');
    const [roomDesc, setRoomDesc] = useState('');
    const [isPublic, setIsPublic] = useState(true);

    // ── Monkey state ──
    const [personality, setPersonality] = useState('roaster');
    const [replyChance, setReplyChance] = useState(75);
    const [bananaReward, setBananaReward] = useState('2');
    const [aiHeartbeat, setAiHeartbeat] = useState(true);

    // ── Moderate state ──
    const [slowMode, setSlowMode] = useState(false);
    const [minBanana, setMinBanana] = useState(0);
    const [approvalRequired, setApprovalRequired] = useState(false);

    // ── Advanced state ──
    const [webhookUrl, setWebhookUrl] = useState('');
    const [roomPin, setRoomPin] = useState('');

    const selected = PERSONALITIES.find(p => p.key === personality) ?? PERSONALITIES[0];
    const currentTier = TIERS.slice().reverse().find(t => minBanana >= t.value) ?? TIERS[0];

    const saveSettings = () => {
        const settings: any = {};
        if (activeTab === 'Info') Object.assign(settings, { name: roomName, description: roomDesc, type: isPublic ? 'public' : 'private' });
        if (activeTab === 'Monkey') Object.assign(settings, { monkeyPersonality: personality, replyChance, bananaReward: +bananaReward, aiHeartbeat });
        if (activeTab === 'Moderate') Object.assign(settings, { slowMode, minBananaScore: minBanana, approvalRequired });
        if (activeTab === 'Advanced') Object.assign(settings, { webhookUrl, password: roomPin || undefined });
        socketManager.socket?.emit('update_room_settings', { roomId, settings });

        // Flash save confirmation
        // (toast handled by system_message from backend)
    };

    return (
        <View style={stl.root}>
            <View pointerEvents="none" style={stl.blob1} />
            <View pointerEvents="none" style={stl.blob2} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* ── Header ── */}
                <View style={stl.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={stl.navBtn}>
                        <MaterialIcons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                    <Text style={stl.headerTitle}>Room Settings</Text>
                    <TouchableOpacity onPress={saveSettings}
                        style={[stl.saveBtn, !isAdmin && { opacity: 0.4 }]} disabled={!isAdmin}>
                        <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={stl.saveBtnGrad}>
                            <Text style={stl.saveText}>Save</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* ── Tab bar ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
                    {TABS.map(t => {
                        const on = activeTab === t.key;
                        return (
                            <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)}
                                style={[stl.tabPill, on && { backgroundColor: `${t.color}15`, borderColor: `${t.color}40` }]}>
                                <MaterialIcons name={t.icon as any} size={14} color={on ? t.color : 'rgba(255,255,255,0.3)'} />
                                <Text style={[stl.tabLabel, on && { color: t.color }]}>{t.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 60 }}
                    showsVerticalScrollIndicator={false}>

                    {/* ════════════════════ INFO TAB ════════════════════ */}
                    {activeTab === 'Info' && (
                        <>
                            {/* Room info card */}
                            <View style={stl.glassCard}>
                                <View style={stl.cardGloss} />
                                <Text style={stl.cardSectionLabel}>ROOM IDENTITY</Text>
                                <TextInput style={[stl.fieldInput, { marginBottom: 12 }]}
                                    value={roomName} onChangeText={setRoomName}
                                    placeholder="Room name..." placeholderTextColor="rgba(255,255,255,0.2)"
                                    maxLength={40} />
                                <TextInput style={[stl.fieldInput, { minHeight: 70, textAlignVertical: 'top', paddingTop: 12 }]}
                                    value={roomDesc} onChangeText={setRoomDesc}
                                    placeholder="What's the vibe?" placeholderTextColor="rgba(255,255,255,0.2)"
                                    multiline maxLength={120} />
                            </View>

                            {/* Visibility */}
                            <View style={stl.glassCard}>
                                <View style={stl.cardGloss} />
                                <Text style={stl.cardSectionLabel}>VISIBILITY</Text>
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                                    {[true, false].map(pub => (
                                        <TouchableOpacity key={String(pub)} onPress={() => setIsPublic(pub)}
                                            style={[stl.visBtn, isPublic === pub && { borderColor: pub ? '#818CF8' : '#EC4899', backgroundColor: pub ? 'rgba(129,140,248,0.1)' : 'rgba(236,72,153,0.1)' }]}>
                                            <MaterialIcons name={pub ? 'public' : 'lock'} size={16} color={isPublic === pub ? (pub ? '#818CF8' : '#EC4899') : 'rgba(255,255,255,0.3)'} />
                                            <Text style={[stl.visBtnText, isPublic === pub && { color: pub ? '#818CF8' : '#EC4899' }]}>
                                                {pub ? 'Public' : 'Private'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}

                    {/* ════════════════════ MONKEY TAB ════════════════════ */}
                    {activeTab === 'Monkey' && (
                        <>
                            {/* Active persona hero */}
                            <LinearGradient colors={selected.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={stl.heroCard}>
                                {/* Gloss lines */}
                                <View style={stl.heroGloss1} />
                                <View style={stl.heroGloss2} />

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                    <Text style={{ fontSize: 48 }}>{selected.emoji}</Text>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                            <Text style={stl.heroName}>{selected.name}</Text>
                                            <View style={[stl.rarityBadge, { backgroundColor: `${selected.rarityColor}25`, borderColor: `${selected.rarityColor}50` }]}>
                                                <Text style={[stl.rarityText, { color: selected.rarityColor }]}>{selected.rarity}</Text>
                                            </View>
                                        </View>
                                        <Text style={stl.heroTagline}>{selected.tagline}</Text>
                                    </View>
                                </View>

                                {/* Stat bars */}
                                <View style={{ marginTop: 16, gap: 6 }}>
                                    <StatBar label="⚡ Power" value={selected.power} color="rgba(255,255,255,0.9)" />
                                    <StatBar label="🎉 Fun" value={selected.fun} color={selected.accent} />
                                    <StatBar label="🌀 Chaos" value={selected.chaos} color="#EC4899" />
                                </View>
                            </LinearGradient>

                            {/* Personality grid */}
                            <Text style={stl.gridTitle}>CHOOSE CHARACTER</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                {PERSONALITIES.map((p, idx) => {
                                    const on = personality === p.key;
                                    return (
                                        <TouchableOpacity key={p.key} onPress={() => setPersonality(p.key)}
                                            style={[stl.persCard, { borderColor: on ? p.accent : 'rgba(255,255,255,0.07)', width: (W - 62) / 2 }]}>
                                            {on ? (
                                                <LinearGradient colors={p.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={stl.persInner}>
                                                    <View style={stl.persCardGloss} />
                                                    <View style={[stl.rarityDot, { backgroundColor: p.rarityColor }]} />
                                                    <Text style={{ fontSize: 30 }}>{p.emoji}</Text>
                                                    <Text style={stl.persName}>{p.name}</Text>
                                                    <Text style={stl.persDesc}>{p.tagline}</Text>
                                                    <View style={[stl.rarityPill, { backgroundColor: `${p.rarityColor}20`, borderColor: `${p.rarityColor}40` }]}>
                                                        <Text style={[stl.rarityPillText, { color: p.rarityColor }]}>{p.rarity}</Text>
                                                    </View>
                                                </LinearGradient>
                                            ) : (
                                                <View style={[stl.persInner, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                                                    <Text style={{ fontSize: 28, opacity: 0.45 }}>{p.emoji}</Text>
                                                    <Text style={[stl.persName, { color: 'rgba(255,255,255,0.35)' }]}>{p.name}</Text>
                                                    <Text style={[stl.persDesc, { color: 'rgba(255,255,255,0.2)' }]}>{p.tagline}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Response settings */}
                            <View style={stl.glassCard}>
                                <View style={stl.cardGloss} />
                                <Text style={stl.cardSectionLabel}>🎯 RESPONSE SETTINGS</Text>
                                <View style={{ marginTop: 8, marginBottom: 16 }}>
                                    <XPBar label="Reply Chance" value={replyChance} onChange={setReplyChance} color="#818CF8" />
                                </View>
                                <View style={stl.divLine} />
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 }}>
                                    <Text style={[stl.toggleLabel, { flex: 1 }]}>🍌 Banana Reward</Text>
                                    <View style={stl.rewardRow}>
                                        <TouchableOpacity onPress={() => setBananaReward(v => String(Math.max(0, +v - 1)))} style={stl.rewardBtn}>
                                            <MaterialIcons name="remove" size={16} color="rgba(255,255,255,0.5)" />
                                        </TouchableOpacity>
                                        <Text style={stl.rewardValue}>{bananaReward}</Text>
                                        <TouchableOpacity onPress={() => setBananaReward(v => String(Math.min(50, +v + 1)))} style={stl.rewardBtn}>
                                            <MaterialIcons name="add" size={16} color="rgba(255,255,255,0.5)" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={stl.perMsg}>per msg</Text>
                                </View>
                                <View style={stl.divLine} />
                                <ToggleRow icon="favorite" label="AI Heartbeat"
                                    desc="Monkey stays active during silence"
                                    value={aiHeartbeat} onChange={setAiHeartbeat} color="#F97316" />
                            </View>

                            {/* Danger */}
                            <TouchableOpacity style={stl.dangerBtn}
                                onPress={() => socketManager.socket?.emit('reset_monkey_memory', { roomId })}>
                                <MaterialIcons name="restart-alt" size={18} color="#EF4444" />
                                <View>
                                    <Text style={stl.dangerLabel}>Reset Monkey Memory</Text>
                                    <Text style={stl.dangerDesc}>All learned gossip will be wiped</Text>
                                </View>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* ════════════════════ MODERATE TAB ════════════════════ */}
                    {activeTab === 'Moderate' && (
                        <>
                            {/* Current tier hero */}
                            <View style={[stl.tierHero, { borderColor: `${currentTier.color}30` }]}>
                                <LinearGradient colors={[`${currentTier.color}12`, 'transparent']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                                <Text style={{ fontSize: 38 }}>{currentTier.icon}</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={stl.tierName}>{currentTier.label} Tier</Text>
                                    <Text style={stl.tierDesc}>{currentTier.desc}</Text>
                                    <Text style={[stl.tierScore, { color: currentTier.color }]}>Min {currentTier.value} 🍌</Text>
                                </View>
                            </View>

                            {/* Tier picker */}
                            <Text style={stl.gridTitle}>ENTRY GATE LEVEL</Text>
                            <View style={{ gap: 8 }}>
                                {TIERS.map(t => {
                                    const on = minBanana === t.value;
                                    return (
                                        <TouchableOpacity key={t.value} onPress={() => setMinBanana(t.value)}
                                            style={[stl.tierRow, on && { backgroundColor: `${t.color}10`, borderColor: `${t.color}35` }]}>
                                            <Text style={{ fontSize: 22, width: 36 }}>{t.icon}</Text>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[stl.toggleLabel, on && { color: t.color }]}>{t.label}</Text>
                                                <Text style={stl.toggleDesc}>{t.desc}</Text>
                                            </View>
                                            <Text style={[stl.tierPts, { color: on ? t.color : 'rgba(255,255,255,0.2)' }]}>
                                                {t.value}🍌
                                            </Text>
                                            {on && <MaterialIcons name="check-circle" size={18} color={t.color} style={{ marginLeft: 8 }} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Toggles */}
                            <View style={stl.glassCard}>
                                <View style={stl.cardGloss} />
                                <Text style={stl.cardSectionLabel}>🛡️ ROOM RULES</Text>
                                <View style={{ marginTop: 6, gap: 4 }}>
                                    <ToggleRow icon="timer" label="Slow Mode"
                                        desc="30s cooldown between messages"
                                        value={slowMode} onChange={setSlowMode} color="#34D399" />
                                    <View style={stl.divLine} />
                                    <ToggleRow icon="front-hand" label="Approval Required"
                                        desc="Admin approves each new entry"
                                        value={approvalRequired} onChange={setApprovalRequired} color="#F59E0B" />
                                </View>
                            </View>
                        </>
                    )}

                    {/* ════════════════════ ADVANCED TAB ════════════════════ */}
                    {activeTab === 'Advanced' && (
                        <>
                            <View style={stl.glassCard}>
                                <View style={stl.cardGloss} />
                                <Text style={stl.cardSectionLabel}>🔗 WEBHOOK</Text>
                                <TextInput style={[stl.fieldInput, { marginTop: 4 }]}
                                    value={webhookUrl} onChangeText={setWebhookUrl}
                                    placeholder="https://your-server.com/webhook"
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    autoCapitalize="none" keyboardType="url" />
                                <Text style={stl.helpText}>Receive events when messages are sent or reactions happen.</Text>
                            </View>

                            <View style={stl.glassCard}>
                                <View style={stl.cardGloss} />
                                <Text style={stl.cardSectionLabel}>🔑 ENTRY PIN</Text>
                                <TextInput
                                    style={[stl.fieldInput, { letterSpacing: 8, textAlign: 'center', marginTop: 4, fontSize: 20 }]}
                                    value={roomPin} onChangeText={t => setRoomPin(t.replace(/[^0-9]/g, '').slice(0, 6))}
                                    placeholder="••••••" placeholderTextColor="rgba(255,255,255,0.2)"
                                    keyboardType="numeric" secureTextEntry maxLength={6} />
                                <Text style={stl.helpText}>6-digit PIN. Leave blank to remove PIN protection.</Text>
                            </View>

                            {/* Danger zone */}
                            <View style={[stl.glassCard, { borderColor: 'rgba(239,68,68,0.2)' }]}>
                                <LinearGradient colors={['rgba(239,68,68,0.06)', 'transparent']}
                                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                                <Text style={[stl.cardSectionLabel, { color: '#F87171' }]}>⚠️ DANGER ZONE</Text>
                                <Text style={stl.helpText}>Deleting is permanent. All messages, members and monkey memory will be wiped.</Text>
                                <TouchableOpacity style={stl.deleteBtn}>
                                    <MaterialIcons name="delete-forever" size={18} color="#EF4444" />
                                    <Text style={stl.deleteText}>Delete Room Forever</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const stl = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050210' },
    blob1: { position: 'absolute', top: -80, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: '#4C1D95', opacity: 0.12 },
    blob2: { position: 'absolute', bottom: 120, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#BE185D', opacity: 0.07 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    headerTitle: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 17 },
    navBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    saveBtn: { borderRadius: 12, overflow: 'hidden' },
    saveBtnGrad: { paddingHorizontal: 16, paddingVertical: 8 },
    saveText: { color: 'white', fontWeight: '700', fontSize: 13 },

    tabPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    tabLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '700' },

    glassCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative' },
    cardGloss: { position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
    cardSectionLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },

    fieldInput: { color: 'white', fontSize: 14, fontWeight: '500', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 14, paddingVertical: 11 },

    visBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)' },
    visBtnText: { color: 'rgba(255,255,255,0.35)', fontWeight: '700', fontSize: 13 },

    // ── hero card ──
    heroCard: { borderRadius: 24, padding: 20, overflow: 'hidden' },
    heroGloss1: { position: 'absolute', top: 0, left: 30, right: 30, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
    heroGloss2: { position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)' },
    heroName: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 18 },
    heroTagline: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500', marginTop: 2 },

    rarityBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
    rarityText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },

    // ── stat bars ──
    statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
    statTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 99 },
    statFill: { height: '100%', borderRadius: 99 },

    // ── grid ──
    gridTitle: { color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

    persCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1.5 },
    persInner: { padding: 14, gap: 4, minHeight: 120, position: 'relative' },
    persCardGloss: { position: 'absolute', top: 0, left: 12, right: 12, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    rarityDot: { width: 8, height: 8, borderRadius: 4, position: 'absolute', top: 10, right: 10 },
    persName: { color: 'white', fontWeight: '700', fontSize: 13, marginTop: 4 },
    persDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 10, lineHeight: 14 },
    rarityPill: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
    rarityPillText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },

    // ── XP bar ──
    xpBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
    xpBadgeText: { fontSize: 12, fontWeight: '800' },
    xpTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, position: 'relative' },
    xpFill: { height: '100%', borderRadius: 99, position: 'absolute' },
    xpTick: { position: 'absolute', width: 3, height: 10, top: -2, borderRadius: 2, marginLeft: -1.5 },
    xpStep: { alignItems: 'center' },
    xpStepLabel: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '700' },

    // ── Reward stepper ──
    rewardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    rewardBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    rewardValue: { color: 'white', fontWeight: '800', fontSize: 16, paddingHorizontal: 10, minWidth: 32, textAlign: 'center' },
    perMsg: { color: 'rgba(255,255,255,0.25)', fontSize: 11 },

    toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    toggleIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    toggleLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' },
    toggleDesc: { color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2 },
    divLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 2 },

    // ── Tiers ──
    tierHero: { borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, overflow: 'hidden' },
    tierName: { color: 'white', fontWeight: '800', fontSize: 16 },
    tierDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
    tierScore: { fontWeight: '800', fontSize: 13, marginTop: 4 },
    tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
    tierPts: { fontSize: 12, fontWeight: '700' },

    // ── Danger ──
    dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.07)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
    dangerLabel: { color: '#F87171', fontWeight: '700', fontSize: 14 },
    dangerDesc: { color: 'rgba(248,113,113,0.5)', fontSize: 11, marginTop: 2 },
    helpText: { color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 6, lineHeight: 16 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
    deleteText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
});
