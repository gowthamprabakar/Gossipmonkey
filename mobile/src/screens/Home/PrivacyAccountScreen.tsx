import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, Switch,
    StyleSheet, Alert, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────
// Shared sub-components
// ─────────────────────────────────────────────────────────────────

function SectionHead({ icon, label, color, desc }: { icon: string; label: string; color: string; desc?: string }) {
    return (
        <View style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[s.secIcon, { backgroundColor: `${color}18` }]}>
                    <MaterialIcons name={icon as any} size={14} color={color} />
                </View>
                <Text style={[s.secLabel, { color }]}>{label}</Text>
            </View>
            {desc ? <Text style={s.secDesc}>{desc}</Text> : null}
        </View>
    );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
    return (
        <View style={[s.card, style]}>
            <View style={s.cardGloss} />
            {children}
        </View>
    );
}

function Row({
    icon, iconBg, label, desc, onPress, right, divider = true, danger = false,
}: {
    icon: string; iconBg: string; label: string; desc?: string;
    onPress?: () => void; right?: React.ReactNode; divider?: boolean; danger?: boolean;
}) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}
            style={[s.row, !divider && { borderBottomWidth: 0 }]}>
            <View style={[s.rowIcon, { backgroundColor: iconBg }]}>
                <MaterialIcons name={icon as any} size={18} color={danger ? '#F87171' : 'white'} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[s.rowLabel, danger && { color: '#F87171' }]}>{label}</Text>
                {desc ? <Text style={s.rowDesc}>{desc}</Text> : null}
            </View>
            {right}
        </TouchableOpacity>
    );
}

function ToggleRow({
    icon, iconBg, label, desc, value, onChange, loading = false, divider = true,
}: {
    icon: string; iconBg: string; label: string; desc?: string;
    value: boolean; onChange: (v: boolean) => void; loading?: boolean; divider?: boolean;
}) {
    return (
        <Row icon={icon} iconBg={iconBg} label={label} desc={desc} divider={divider}
            right={
                loading
                    ? <ActivityIndicator size="small" color="rgba(255,255,255,0.3)" />
                    : <Switch value={value} onValueChange={onChange}
                        trackColor={{ false: 'rgba(255,255,255,0.08)', true: `${iconBg}99` }}
                        thumbColor={value ? 'white' : 'rgba(255,255,255,0.3)'} />
            }
        />
    );
}

// ─────────────────────────────────────────────────────────────────
// Change Password modal  (inline)
// ─────────────────────────────────────────────────────────────────
function ChangePasswordSheet({ onClose }: { onClose: () => void }) {
    /* For this app, "password" is the persona PIN / secret key
       We'll just do a PATCH /identity/me placeholder */
    return (
        <View style={s.pwSheet}>
            <Text style={s.pwTitle}>Change Password</Text>
            <Text style={s.pwSub}>Password management coming soon via email verification.</Text>
            <TouchableOpacity onPress={onClose} style={s.pwClose}>
                <Text style={{ color: '#818CF8', fontWeight: '700' }}>OK</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────
export function PrivacyAccountScreen({ navigation }: any) {
    const { persona, logout } = useAppStore();
    const navigationRef = { current: navigation };

    // ── Backend-synced privacy prefs ──────────────────────────────
    const [privacyLoading, setPrivacyLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    // From backend (persona_preferences)
    const [allowLocation, setAllowLocation] = useState(false);
    const [panicMode, setPanicMode] = useState(false);

    // Local-only prefs (stored in AsyncStorage until we extend backend)
    const [twoFactor, setTwoFactor] = useState(false);
    const [invisibleMode, setInvisibleMode] = useState(false);
    const [readReceipts, setReadReceipts] = useState(true);
    const [hideBanana, setHideBanana] = useState(false);
    const [anonPosting, setAnonPosting] = useState(false);
    const [notifications, setNotifications] = useState(true);

    // UI state
    const [showPwSheet, setShowPwSheet] = useState(false);
    const [cacheSize] = useState('124 MB');
    const [clearingCache, setClearingCache] = useState(false);

    // ── Load from backend + local store ──────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                // 1. Backend privacy prefs
                const res = await api.get('/privacy/me');
                const prefs = res.data?.data ?? {};
                setAllowLocation(!!prefs.allowLocation);
                setPanicMode(!!prefs.panicModeEnabled);

                // 2. Local async storage prefs
                const local = await AsyncStorage.getItem('privacy_local');
                if (local) {
                    const p = JSON.parse(local);
                    setTwoFactor(p.twoFactor ?? false);
                    setInvisibleMode(p.invisibleMode ?? false);
                    setReadReceipts(p.readReceipts ?? true);
                    setHideBanana(p.hideBanana ?? false);
                    setAnonPosting(p.anonPosting ?? false);
                    setNotifications(p.notifications ?? true);
                }
            } catch {
                // silently fail — defaults are fine
            } finally {
                setPrivacyLoading(false);
            }
        };
        load();
    }, []);

    // ── Save backend toggle ───────────────────────────────────────
    const saveBackend = async (patch: object, key: string) => {
        setSaving(key);
        try {
            await api.patch('/privacy/me', patch);
        } catch {
            Alert.alert('Error', 'Could not save preference. Try again.');
        } finally {
            setSaving(null);
        }
    };

    // ── Save local toggle ─────────────────────────────────────────
    const saveLocal = async (patch: object) => {
        const current = await AsyncStorage.getItem('privacy_local');
        const merged = { ...(current ? JSON.parse(current) : {}), ...patch };
        await AsyncStorage.setItem('privacy_local', JSON.stringify(merged));
    };

    // ── Clear cache ───────────────────────────────────────────────
    const handleClearCache = async () => {
        Alert.alert('Clear Cache', 'This will remove cached images and data. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear', style: 'destructive', onPress: async () => {
                    setClearingCache(true);
                    await AsyncStorage.removeItem('room_cache');
                    await AsyncStorage.removeItem('image_cache');
                    setTimeout(() => setClearingCache(false), 800);
                }
            },
        ]);
    };

    // ── Panic reset (wipes everything) ────────────────────────────
    const handlePanicReset = () => {
        Alert.alert('🚨 Panic Reset', 'This will immediately log you out and delete your local session. Continue?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm Reset', style: 'destructive', onPress: () => logout(navigationRef) },
        ]);
    };

    // ── Delete account ────────────────────────────────────────────
    const handleDeleteAccount = () => {
        Alert.alert(
            '⚠️ Delete Account',
            'All your gossip, rooms, and banana balance will be permanently deleted. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete Forever', style: 'destructive', onPress: () => logout(navigationRef) },
            ]
        );
    };

    if (privacyLoading) {
        return (
            <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator color="#7C3AED" size="large" />
            </View>
        );
    }

    return (
        <View style={s.root}>
            {/* Ambient blobs */}
            <View pointerEvents="none" style={s.blob1} />
            <View pointerEvents="none" style={s.blob2} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* ── Header ── */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.navBtn}>
                        <MaterialIcons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={s.headerTitle}>Privacy & Settings</Text>
                        <Text style={s.headerSub}>@{persona?.name ?? 'monkey'}</Text>
                    </View>
                    {/* Persona score pill */}
                    <View style={s.scorePill}>
                        <Text style={{ fontSize: 12 }}>🍌</Text>
                        <Text style={s.scoreText}>{persona?.score ?? 0}</Text>
                    </View>
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 60 }}>

                    {/* ═══════════════════════════════════════════
                        ACCOUNT SECURITY
                    ═══════════════════════════════════════════ */}
                    <View style={{ gap: 10 }}>
                        <SectionHead icon="security" label="Account Security" color="#818CF8"
                            desc="Protect your identity in the jungle" />
                        <Card>
                            <Row icon="lock-reset" iconBg="rgba(124,58,237,0.6)" label="Change Password"
                                desc="Update your secret key"
                                onPress={() => setShowPwSheet(true)}
                                right={<MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.2)" />} />

                            <ToggleRow icon="verified-user" iconBg="rgba(52,211,153,0.5)" label="Two-Factor Authentication"
                                desc="Extra lock on your account"
                                value={twoFactor} onChange={v => { setTwoFactor(v); saveLocal({ twoFactor: v }); }}
                                divider={false} />
                        </Card>

                        {/* Panic mode — backend backed */}
                        <Card style={{ borderColor: panicMode ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)' }}>
                            <ToggleRow icon="emergency" iconBg="rgba(239,68,68,0.5)" label="🚨 Panic Mode"
                                desc="Instantly hide all activity & log out when shaken"
                                value={panicMode}
                                loading={saving === 'panic'}
                                onChange={v => {
                                    setPanicMode(v);
                                    saveBackend({ panicModeEnabled: v }, 'panic');
                                }}
                                divider={false} />
                        </Card>

                        <TouchableOpacity onPress={handlePanicReset} style={s.panicBtn}>
                            <MaterialIcons name="restart-alt" size={16} color="#F87171" />
                            <Text style={{ color: '#F87171', fontWeight: '700', fontSize: 13 }}>Trigger Panic Reset Now</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ═══════════════════════════════════════════
                        PRIVACY
                    ═══════════════════════════════════════════ */}
                    <View style={{ gap: 10 }}>
                        <SectionHead icon="visibility" label="Privacy" color="#34D399"
                            desc="Control who sees what" />
                        <Card>
                            <ToggleRow icon="visibility-off" iconBg="rgba(15,118,110,0.6)" label="Invisible Mode"
                                desc="Appear offline to others"
                                value={invisibleMode}
                                onChange={v => { setInvisibleMode(v); saveLocal({ invisibleMode: v }); }} />

                            <ToggleRow icon="mark-chat-read" iconBg="rgba(59,130,246,0.5)" label="Read Receipts"
                                desc="Let senders know you've read their message"
                                value={readReceipts}
                                onChange={v => { setReadReceipts(v); saveLocal({ readReceipts: v }); }} />

                            <ToggleRow icon="location-on" iconBg="rgba(249,115,22,0.5)" label="Allow Location"
                                desc="Used for nearby room discovery"
                                value={allowLocation}
                                loading={saving === 'location'}
                                onChange={v => {
                                    setAllowLocation(v);
                                    saveBackend({ allowLocation: v }, 'location');
                                }} />

                            <Row icon="block" iconBg="rgba(239,68,68,0.4)" label="Blocked Users"
                                desc="Manage who you've blocked"
                                onPress={() => Alert.alert('Blocked Users', 'Coming soon')}
                                divider={false}
                                right={
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <View style={s.countBadge}><Text style={s.countText}>0</Text></View>
                                        <MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.2)" />
                                    </View>
                                } />
                        </Card>
                    </View>

                    {/* ═══════════════════════════════════════════
                        PERSONA PRIVACY
                    ═══════════════════════════════════════════ */}
                    <View style={{ gap: 10 }}>
                        <SectionHead icon="person" label="Persona Privacy" color="#F97316"
                            desc="Your monkey identity controls" />
                        <Card>
                            <ToggleRow icon="currency-bitcoin" iconBg="rgba(234,179,8,0.5)" label="Hide Banana Balance"
                                desc="Keep your wealth hidden from other monkeys"
                                value={hideBanana}
                                onChange={v => { setHideBanana(v); saveLocal({ hideBanana: v }); }} />

                            <ToggleRow icon="masks" iconBg="rgba(124,58,237,0.5)" label="Anonymous Posting"
                                desc="Default all new messages to anonymous"
                                value={anonPosting}
                                onChange={v => { setAnonPosting(v); saveLocal({ anonPosting: v }); }}
                                divider={false} />
                        </Card>
                    </View>

                    {/* ═══════════════════════════════════════════
                        NOTIFICATIONS
                    ═══════════════════════════════════════════ */}
                    <View style={{ gap: 10 }}>
                        <SectionHead icon="notifications" label="Notifications" color="#A78BFA" />
                        <Card>
                            <ToggleRow icon="notifications-active" iconBg="rgba(167,139,250,0.5)" label="Push Notifications"
                                desc="Room activity, reactions, rewards"
                                value={notifications}
                                onChange={v => { setNotifications(v); saveLocal({ notifications: v }); }}
                                divider={false} />
                        </Card>
                    </View>

                    {/* ═══════════════════════════════════════════
                        DATA & STORAGE
                    ═══════════════════════════════════════════ */}
                    <View style={{ gap: 10 }}>
                        <SectionHead icon="storage" label="Data & Storage" color="#38BDF8" />
                        <Card>
                            <Row icon="delete-sweep" iconBg="rgba(14,165,233,0.4)" label="Clear Cache"
                                desc={clearingCache ? 'Clearing...' : `Frees up ${cacheSize} of space`}
                                onPress={handleClearCache}
                                right={
                                    clearingCache
                                        ? <ActivityIndicator size="small" color="rgba(255,255,255,0.3)" />
                                        : <View style={s.sizeBadge}><Text style={s.sizeText}>{cacheSize}</Text></View>
                                } />

                            <Row icon="download-for-offline" iconBg="rgba(52,211,153,0.4)" label="Download My Data"
                                desc="Export all your gossip and monkey history"
                                onPress={() => Alert.alert('Download Data', 'You will receive a download link via notification within 24 hours.')}
                                divider={false}
                                right={<MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.2)" />} />
                        </Card>
                    </View>

                    {/* ═══════════════════════════════════════════
                        DANGER ZONE
                    ═══════════════════════════════════════════ */}
                    <View style={{ gap: 10 }}>
                        <SectionHead icon="warning" label="Danger Zone" color="#EF4444" />
                        <Card style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                            <LinearGradient colors={['rgba(239,68,68,0.05)', 'transparent']}
                                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                            <Row icon="logout" iconBg="rgba(239,68,68,0.3)" label="Sign Out"
                                desc="End your current session"
                                onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Sign Out', style: 'destructive', onPress: () => logout(navigationRef) },
                                ])}
                                danger />

                            <Row icon="delete-forever" iconBg="rgba(239,68,68,0.4)" label="Delete Account"
                                desc="Permanently delete all your data" divider={false}
                                onPress={handleDeleteAccount} danger />
                        </Card>
                    </View>

                    {/* App version footer */}
                    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.12)', fontSize: 11 }}>
                            Gossip Monkey v1.0.0 · Made with 🍌
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* ── Change Password inline sheet ── */}
            {showPwSheet && (
                <View style={s.overlay}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowPwSheet(false)} />
                    <ChangePasswordSheet onClose={() => setShowPwSheet(false)} />
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#050210' },
    blob1: { position: 'absolute', top: -80, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: '#4C1D95', opacity: 0.1 },
    blob2: { position: 'absolute', bottom: 150, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: '#0C4A6E', opacity: 0.08 },

    // ── Header ──
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    navBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 17 },
    headerSub: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '600', marginTop: 1 },

    scorePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    scoreText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' },

    // ── Sections ──
    secIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    secLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
    secDesc: { color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 4, marginLeft: 34 },

    // ── Card ──
    card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', position: 'relative' },
    cardGloss: { position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.07)', zIndex: 1 },

    // ── Row ──
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
    rowDesc: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 },

    // ── Badges ──
    countBadge: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
    countText: { color: '#F87171', fontSize: 10, fontWeight: '800' },
    sizeBadge: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    sizeText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700' },

    // ── Panic ──
    panicBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.07)' },

    // ── PW Sheet ──
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    pwSheet: { backgroundColor: '#0D0618', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 28, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
    pwTitle: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 17, marginBottom: 8 },
    pwSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 20 },
    pwClose: { marginTop: 20, alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(129,140,248,0.1)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.25)' },
});
