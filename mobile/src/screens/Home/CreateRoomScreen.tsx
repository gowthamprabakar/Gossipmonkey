import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    Switch, StyleSheet, ActivityIndicator, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { useRoomStore } from '../../store/useRoomStore';
import { useAppStore } from '../../store/useAppStore';

// ── Personality options ───────────────────────────────────────────
const PERSONALITIES = [
    { id: 'roaster', emoji: '🔥', label: 'The Roaster', desc: 'Savage wit', gradient: ['#7F1D1D', '#DC2626'] as [string, string], accent: '#F87171' },
    { id: 'wise', emoji: '🧠', label: 'The Wise One', desc: 'Deep thoughts', gradient: ['#0C4A6E', '#0EA5E9'] as [string, string], accent: '#38BDF8' },
    { id: 'chaos', emoji: '🌀', label: 'Chaos Agent', desc: 'Pure entropy', gradient: ['#3B0764', '#9333EA'] as [string, string], accent: '#C084FC' },
    { id: 'hype', emoji: '🎉', label: 'Hype Machine', desc: 'Main character', gradient: ['#78350F', '#F59E0B'] as [string, string], accent: '#FCD34D' },
    { id: 'detective', emoji: '🕵️', label: 'Detective', desc: 'Truth seeker', gradient: ['#1E3A5F', '#2563EB'] as [string, string], accent: '#93C5FD' },
    { id: 'philosopher', emoji: '🌌', label: 'Philosopher', desc: 'Why we exist', gradient: ['#1A0F3C', '#7C3AED'] as [string, string], accent: '#A78BFA' },
];

// ── Vibe tags ─────────────────────────────────────────────────────
const VIBES = ['🔥 Hot Takes', '💬 Deep Talk', '🎭 Drama', '😂 Comedy', '🎵 Music', '🎮 Gaming', '💡 Ideas', '🌙 Late Night'];

// ── Section header ────────────────────────────────────────────────
function SectionHead({ icon, label, color = '#818CF8' }: { icon: string; label: string; color?: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View style={[styles.secIcon, { backgroundColor: `${color}15` }]}>
                <MaterialIcons name={icon as any} size={14} color={color} />
            </View>
            <Text style={[styles.secLabel, { color }]}>{label}</Text>
        </View>
    );
}

// ── Toggle row ────────────────────────────────────────────────────
function ToggleRow({ icon, label, desc, value, onChange, color = '#818CF8' }: any) {
    return (
        <View style={styles.toggleRow}>
            <MaterialIcons name={icon} size={16} color={`${color}80`} />
            <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.toggleLabel}>{label}</Text>
                {desc ? <Text style={styles.toggleDesc}>{desc}</Text> : null}
            </View>
            <Switch value={value} onValueChange={onChange}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: `${color}55` }}
                thumbColor={value ? color : 'rgba(255,255,255,0.25)'} />
        </View>
    );
}

// ── Main screen ───────────────────────────────────────────────────
export function CreateRoomScreen({ navigation }: any) {
    const { persona } = useAppStore();
    const { fetchRooms } = useRoomStore();

    // Core fields
    const [roomType, setRoomType] = useState<'public' | 'private'>('public');
    const [roomName, setRoomName] = useState('');
    const [description, setDescription] = useState('');
    const [personality, setPersonality] = useState('chaos');
    const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

    // Advanced
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [slowMode, setSlowMode] = useState(false);
    const [approvalRequired, setApprovalRequired] = useState(false);
    const [minBanana, setMinBanana] = useState(0);
    const [roomPin, setRoomPin] = useState('');

    const [loading, setLoading] = useState(false);

    const advAnim = useRef(new Animated.Value(0)).current;

    const toggleAdvanced = () => {
        const open = !advancedOpen;
        setAdvancedOpen(open);
        Animated.spring(advAnim, {
            toValue: open ? 1 : 0,
            useNativeDriver: false,
            damping: 16,
        }).start();
    };

    const advHeight = advAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 220] });

    // ── Toggle vibe tag ──────────────────────────────────────────
    const toggleVibe = (v: string) => {
        setSelectedVibes(prev =>
            prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v].slice(0, 3)
        );
    };

    // ── Submit ───────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!roomName.trim()) {
            Alert.alert('Missing name', 'Give your jungle a name first!');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                name: roomName.trim(),
                description: description.trim(),
                type: roomType,
                monkeyConfig: { personality },
                settings: {
                    slowMode,
                    approvalRequired,
                    minBananaScore: minBanana,
                    password: roomPin.length === 6 ? roomPin : undefined,
                    vibeMode: selectedVibes.join(', '),
                },
            };
            const res = await api.post('/rooms', payload);
            const newRoom = res.data?.data ?? res.data;
            await fetchRooms(); // refresh room list
            // Navigate straight into the new room as admin
            navigation.replace('Chat', {
                roomId: newRoom.id,
                roomName: newRoom.name,
                roomType: newRoom.type,
                creatorId: newRoom.creatorId ?? persona?.id,
                // Pass PIN so InviteSheet can show it (only exists in memory here, not re-exposed via API)
                roomPin: roomType === 'private' && roomPin.length === 6 ? roomPin : undefined,
                requiresApproval: approvalRequired,
            });
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message ?? 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    const selectedPersona = PERSONALITIES.find(p => p.id === personality) ?? PERSONALITIES[2];
    const canCreate = roomName.trim().length > 0;

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
                    <Text style={styles.headerTitle}>Create Jungle</Text>
                    <View style={{ width: 38 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 60 }}>

                    {/* ── Room type toggle ── */}
                    <View style={styles.typeRow}>
                        {(['public', 'private'] as const).map(t => {
                            const on = roomType === t;
                            return (
                                <TouchableOpacity key={t} onPress={() => {
                                    setRoomType(t);
                                    if (t === 'private') setApprovalRequired(true);
                                    else setApprovalRequired(false);
                                }}
                                    style={[styles.typeBtn, on && styles.typeBtnActive]}>
                                    {on ? (
                                        <LinearGradient colors={t === 'public' ? ['#7C3AED', '#818CF8'] : ['#EC4899', '#BE185D']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={styles.typeBtnGrad}>
                                            <MaterialIcons name={t === 'public' ? 'public' : 'lock'} size={15} color="white" />
                                            <Text style={[styles.typeLabel, { color: 'white' }]}>
                                                {t === 'public' ? 'Public' : 'Private'}
                                            </Text>
                                        </LinearGradient>
                                    ) : (
                                        <View style={styles.typeBtnInner}>
                                            <MaterialIcons name={t === 'public' ? 'public' : 'lock'} size={15} color="rgba(255,255,255,0.35)" />
                                            <Text style={styles.typeLabel}>{t === 'public' ? 'Public' : 'Private'}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Private room info card */}
                    {roomType === 'private' && (
                        <View style={styles.infoCard}>
                            <MaterialIcons name="info" size={14} color="#A78BFA" />
                            <Text style={{ color: 'rgba(167,139,250,0.8)', fontSize: 12, flex: 1 }}>
                                Private jungles require a PIN or admin approval for users to enter. You become the admin.
                            </Text>
                        </View>
                    )}

                    {/* ── Room Name ── */}
                    <View>
                        <SectionHead icon="drive-file-rename-outline" label="Room Name" color="#818CF8" />
                        <View style={[styles.inputBox, roomName.length > 0 && styles.inputBoxFocused]}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. The Tea Room ☕️"
                                placeholderTextColor="rgba(255,255,255,0.2)"
                                value={roomName}
                                onChangeText={setRoomName}
                                maxLength={40}
                            />
                            <Text style={styles.charCount}>{roomName.length}/40</Text>
                        </View>
                    </View>

                    {/* ── Description ── */}
                    <View>
                        <SectionHead icon="notes" label="Description" color="#34D399" />
                        <TextInput
                            style={[styles.inputBox, styles.input, { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' }]}
                            placeholder="What's the vibe? Spill it..."
                            placeholderTextColor="rgba(255,255,255,0.2)"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            maxLength={120}
                        />
                    </View>

                    {/* ── Vibe tags ── */}
                    <View>
                        <SectionHead icon="tag" label="Vibe Tags (pick up to 3)" color="#F97316" />
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {VIBES.map(v => {
                                const on = selectedVibes.includes(v);
                                return (
                                    <TouchableOpacity key={v} onPress={() => toggleVibe(v)}
                                        style={[styles.vibePill, on && styles.vibePillOn]}>
                                        <Text style={[styles.vibeText, on && { color: 'white' }]}>{v}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── Personality picker ── */}
                    <View>
                        <SectionHead icon="smart-toy" label="Monkey Personality" color="#A78BFA" />
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {PERSONALITIES.map(p => {
                                const on = personality === p.id;
                                return (
                                    <TouchableOpacity key={p.id} onPress={() => setPersonality(p.id)}
                                        style={[styles.persCard, { borderColor: on ? p.accent : 'rgba(255,255,255,0.07)' }]}>
                                        {on ? (
                                            <LinearGradient colors={p.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                                style={styles.persGrad}>
                                                <Text style={{ fontSize: 22 }}>{p.emoji}</Text>
                                                <Text style={styles.persName}>{p.label}</Text>
                                                <Text style={styles.persDesc}>{p.desc}</Text>
                                                <View style={styles.persCheck}>
                                                    <MaterialIcons name="check" size={10} color="white" />
                                                </View>
                                            </LinearGradient>
                                        ) : (
                                            <View style={styles.persGrad}>
                                                <Text style={{ fontSize: 22, opacity: 0.5 }}>{p.emoji}</Text>
                                                <Text style={[styles.persName, { color: 'rgba(255,255,255,0.45)' }]}>{p.label}</Text>
                                                <Text style={[styles.persDesc, { color: 'rgba(255,255,255,0.2)' }]}>{p.desc}</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── Advanced settings ── */}
                    <View style={styles.advancedCard}>
                        <TouchableOpacity onPress={toggleAdvanced} style={styles.advancedHeader} activeOpacity={0.8}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={[styles.secIcon, { backgroundColor: 'rgba(249,115,22,0.12)' }]}>
                                    <MaterialIcons name="tune" size={14} color="#F97316" />
                                </View>
                                <Text style={styles.secLabel}>Advanced Settings</Text>
                            </View>
                            <MaterialIcons name={advancedOpen ? 'expand-less' : 'expand-more'} size={20} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>

                        <Animated.View style={{ height: advHeight, overflow: 'hidden' }}>
                            <View style={{ paddingTop: 16, gap: 4 }}>
                                <ToggleRow icon="timer" label="Slow Mode"
                                    desc="30s cooldown between messages"
                                    value={slowMode} onChange={setSlowMode} color="#F97316" />
                                <View style={styles.divLine} />
                                <ToggleRow icon="verified-user" label="Approval Required"
                                    desc="Admin approves each entry"
                                    value={approvalRequired} onChange={setApprovalRequired} color="#A78BFA" />
                                <View style={styles.divLine} />

                                {/* PIN field — only for private */}
                                {roomType === 'private' && (
                                    <View style={{ marginTop: 8, gap: 6 }}>
                                        <Text style={styles.toggleLabel}>6-Digit Entry PIN</Text>
                                        <TextInput
                                            style={[styles.inputBox, styles.input, { letterSpacing: 6, textAlign: 'center', height: 48 }]}
                                            placeholder="••••••"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={roomPin}
                                            onChangeText={t => setRoomPin(t.replace(/[^0-9]/g, '').slice(0, 6))}
                                            keyboardType="numeric"
                                            secureTextEntry
                                            maxLength={6}
                                        />
                                        <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, textAlign: 'center' }}>
                                            Leave blank to use approval-only entry
                                        </Text>
                                    </View>
                                )}

                                {/* Min banana */}
                                <View style={{ marginTop: 8 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={styles.toggleLabel}>Min 🍌 Score</Text>
                                        <Text style={[styles.toggleLabel, { color: '#FBBF24' }]}>{minBanana}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        {[0, 100, 500, 1000].map(v => (
                                            <TouchableOpacity key={v} onPress={() => setMinBanana(v)}
                                                style={[styles.minBtn, minBanana === v && styles.minBtnOn]}>
                                                <Text style={[styles.minBtnText, minBanana === v && { color: 'white' }]}>{v}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </Animated.View>
                    </View>

                    {/* ── Create button ── */}
                    <TouchableOpacity onPress={handleCreate} disabled={!canCreate || loading}
                        style={[styles.createBtn, (!canCreate || loading) && { opacity: 0.5 }]}
                        activeOpacity={0.85}>
                        <LinearGradient
                            colors={['#7C3AED', '#EC4899']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.createGrad}>
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <MaterialIcons name="rocket-launch" size={20} color="white" />
                                    <Text style={styles.createText}>LAUNCH JUNGLE</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        By creating a room you agree to the Jungle Laws & Community Guidelines.
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050210' },
    blob1: { position: 'absolute', top: -80, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: '#4C1D95', opacity: 0.13 },
    blob2: { position: 'absolute', bottom: 100, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: '#BE185D', opacity: 0.08 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    headerTitle: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 17 },
    navBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },

    // ── Type toggle ──
    typeRow: { flexDirection: 'row', gap: 10 },
    typeBtn: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    typeBtnActive: { borderColor: 'transparent' },
    typeBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13 },
    typeBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, backgroundColor: 'rgba(255,255,255,0.04)' },
    typeLabel: { color: 'rgba(255,255,255,0.35)', fontWeight: '700', fontSize: 14 },

    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(167,139,250,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(167,139,250,0.15)', marginTop: -8 },

    // ── Sections ──
    secIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    secLabel: { color: 'rgba(255,255,255,0.5)', fontWeight: '800', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },

    // ── Inputs ──
    inputBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 16, paddingVertical: 12 },
    inputBoxFocused: { borderColor: 'rgba(129,140,248,0.4)', backgroundColor: 'rgba(129,140,248,0.06)' },
    input: { color: 'white', fontSize: 14, fontWeight: '500' },
    charCount: { color: 'rgba(255,255,255,0.2)', fontSize: 10, textAlign: 'right', marginTop: 6 },

    // ── Vibe pills ──
    vibePill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
    vibePillOn: { backgroundColor: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.4)' },
    vibeText: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' },

    // ── Personality ──
    persCard: { width: '30%', flexGrow: 1, borderRadius: 18, overflow: 'hidden', borderWidth: 1.5, minWidth: 100 },
    persGrad: { padding: 14, gap: 4, alignItems: 'flex-start', position: 'relative', minHeight: 100 },
    persName: { color: 'white', fontWeight: '700', fontSize: 12, marginTop: 4 },
    persDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
    persCheck: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },

    // ── Advanced ──
    advancedCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
    advancedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    toggleLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
    toggleDesc: { color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 2 },
    divLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 2 },
    minBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    minBtnOn: { backgroundColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.35)' },
    minBtnText: { color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '700' },

    // ── Create ──
    createBtn: { borderRadius: 20, overflow: 'hidden' },
    createGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
    createText: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 16, letterSpacing: 1.5 },
    disclaimer: { color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
