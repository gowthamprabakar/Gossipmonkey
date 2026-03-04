/**
 * LoginScreen.tsx
 *
 * Returning user login screen:
 * - Account code (MNKY-XXXX) + password
 * - Shake animation on wrong credentials
 * - Rate limit countdown (response from backend)
 * - Biometric login if previously enabled
 * - "I don't have an account" link → CreatePersona
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Dimensions, Keyboard, Platform, KeyboardAvoidingView, ScrollView,
    ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

const { width: W } = Dimensions.get('window');

// ── Auto-format MNKY-XXXX as user types ──────────────────────────
const formatCode = (raw: string): string => {
    const clean = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8);
    if (clean.length <= 4) return clean;
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
};

export default function LoginScreen({ navigation }: any) {
    const { setToken, setPersona, biometricEnabled } = useAppStore();

    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lockCountdown, setLockCountdown] = useState(0);

    // Shake animation on wrong credentials
    const shakeX = useRef(new Animated.Value(0)).current;
    const shake = () => {
        Animated.sequence([
            ...[0, 1, 0, -1, 0, 1, 0, -1, 0].map(v =>
                Animated.timing(shakeX, { toValue: v * 10, duration: 60, useNativeDriver: true })
            ),
        ]).start();
    };

    // Countdown timer when locked
    useEffect(() => {
        if (lockCountdown <= 0) return;
        const t = setTimeout(() => setLockCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [lockCountdown]);

    // Biometric login handler
    const handleBiometric = useCallback(async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !enrolled) {
            setError('Biometrics not available on this device.');
            return;
        }
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Verify your identity',
            fallbackLabel: 'Use password',
        });
        if (result.success) {
            setError('Biometric success — auto-login not yet wired (needs stored token hint).');
        } else {
            setError('Biometric verification failed.');
        }
    }, []);

    const handleLogin = async () => {
        const cleanCode = code.replace(/-/g, '');
        if (cleanCode.length < 8) { setError('Enter your full 8-character account code.'); shake(); return; }
        if (!password) { setError('Enter your password.'); shake(); return; }
        if (lockCountdown > 0) return;

        setLoading(true);
        setError('');
        Keyboard.dismiss();

        try {
            const res = await api.post('/identity/login', { code: code.replace(/-/g, ''), password });
            const { persona, token } = res.data.data;
            await setPersona({ id: persona.id, name: persona.alias, avatar: persona.avatar, score: persona.score });
            await setToken(token);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Login failed';
            setError(msg);
            shake();
            // Parse lock countdown from message like "Try again in 14 minute(s)"
            const match = msg.match(/(\d+)\s*minute/);
            if (match) setLockCountdown(Number(match[1]) * 60);
        } finally {
            setLoading(false);
        }
    };

    const isLocked = lockCountdown > 0;
    const lockDisplay = `${Math.floor(lockCountdown / 60)}:${String(lockCountdown % 60).padStart(2, '0')}`;

    return (
        <View style={styles.root}>
            {/* Ambient */}
            <View style={styles.blob1} />
            <View style={styles.blob2} />

            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
                    >
                        {/* Back */}
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <MaterialIcons name="arrow-back" size={22} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.iconWrap}>
                                <LinearGradient colors={['#4C1D95', '#7C3AED']} style={styles.icon}>
                                    <MaterialIcons name="login" size={28} color="white" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.title}>Welcome back, Monkey</Text>
                            <Text style={styles.subtitle}>Enter your account code and password to rejoin the jungle.</Text>
                        </View>

                        {/* Biometric CTA */}
                        {biometricEnabled && (
                            <TouchableOpacity onPress={handleBiometric} style={styles.bioBtn}>
                                <MaterialIcons name="fingerprint" size={22} color="#818CF8" />
                                <Text style={styles.bioBtnText}>Use Face ID / Touch ID</Text>
                            </TouchableOpacity>
                        )}

                        {/* Account Code field */}
                        <Animated.View style={[styles.fieldWrap, { transform: [{ translateX: shakeX }] }]}>
                            <View style={styles.fieldSection}>
                                <Text style={styles.fieldLabel}>ACCOUNT CODE</Text>
                                <View style={styles.inputRow}>
                                    <Text style={{ fontSize: 18, marginRight: 10 }}>🎫</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. MNKY-X4BZ"
                                        placeholderTextColor="#334155"
                                        value={code}
                                        onChangeText={(t) => setCode(formatCode(t))}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        autoComplete="off"
                                        maxLength={9}
                                        keyboardType="default"
                                    />
                                    {code.length > 0 && (
                                        <TouchableOpacity onPress={() => setCode('')}>
                                            <MaterialIcons name="cancel" size={18} color="#475569" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Password field */}
                            <View style={[styles.fieldSection, { marginTop: 12 }]}>
                                <Text style={styles.fieldLabel}>PASSWORD</Text>
                                <View style={styles.inputRow}>
                                    <MaterialIcons name="lock" size={18} color="#475569" style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Your secret password"
                                        placeholderTextColor="#334155"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPwd}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="off"
                                    />
                                    <TouchableOpacity onPress={() => setShowPwd(v => !v)}>
                                        <MaterialIcons
                                            name={showPwd ? 'visibility-off' : 'visibility'}
                                            size={18} color="#475569"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Animated.View>

                        {/* Error */}
                        {error !== '' && (
                            <View style={styles.errorWrap}>
                                <MaterialIcons name="error-outline" size={15} color="#EF4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Lock countdown */}
                        {isLocked && (
                            <View style={styles.lockWrap}>
                                <MaterialIcons name="timer" size={16} color="#F97316" />
                                <Text style={styles.lockText}>Account locked — try again in {lockDisplay}</Text>
                            </View>
                        )}

                        {/* Login CTA */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading || isLocked}
                            style={[styles.loginBtnWrap, (loading || isLocked) && { opacity: 0.5 }]}
                            activeOpacity={0.88}
                        >
                            <LinearGradient
                                colors={['#7C3AED', '#2563EB']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.loginBtn}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text style={styles.loginBtnText}>Enter the Jungle 🌴</Text>
                                        <MaterialIcons name="arrow-forward" size={20} color="white" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* No recovery info */}
                        <TouchableOpacity
                            style={styles.forgotWrap}
                            onPress={() => {
                                // Show info — anonymous app, no email recovery
                                setError('This is an anonymous app. If you lost your code, create a new account.');
                            }}
                        >
                            <Text style={styles.forgotText}>Forgot your code?</Text>
                        </TouchableOpacity>

                        {/* Go to create account */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Auth')}
                            style={styles.createLink}
                        >
                            <Text style={styles.createLinkText}>New here? Create an account →</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#06020E' },
    blob1: {
        position: 'absolute', width: 320, height: 320, borderRadius: 160,
        backgroundColor: '#4C1D95', opacity: 0.12, top: -80, right: -80,
    },
    blob2: {
        position: 'absolute', width: 250, height: 250, borderRadius: 125,
        backgroundColor: '#1E3A5F', opacity: 0.15, bottom: 0, left: -60,
    },
    backBtn: { paddingTop: 8, paddingBottom: 4, alignSelf: 'flex-start' },
    header: { alignItems: 'center', paddingVertical: 28 },
    iconWrap: { marginBottom: 16 },
    icon: {
        width: 72, height: 72, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#7C3AED', shadowRadius: 20, shadowOpacity: 0.5, shadowOffset: { width: 0, height: 0 },
    },
    title: { color: 'white', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center' },
    subtitle: { color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
    bioBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: 'rgba(129,140,248,0.1)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.25)',
        borderRadius: 14, paddingVertical: 14, marginBottom: 20,
    },
    bioBtnText: { color: '#818CF8', fontSize: 15, fontWeight: '700' },
    fieldWrap: {
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        padding: 16, marginBottom: 16,
    },
    fieldSection: {},
    fieldLabel: { color: '#475569', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 13,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    },
    input: { flex: 1, color: 'white', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    errorWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    },
    errorText: { color: '#FCA5A5', fontSize: 12, flex: 1, lineHeight: 16 },
    lockWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(249,115,22,0.1)', borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
        borderWidth: 1, borderColor: 'rgba(249,115,22,0.25)',
    },
    lockText: { color: '#FED7AA', fontSize: 12, flex: 1 },
    loginBtnWrap: {
        borderRadius: 18, overflow: 'hidden',
        shadowColor: '#7C3AED', shadowRadius: 16, shadowOpacity: 0.45, shadowOffset: { width: 0, height: 4 },
        elevation: 12, marginTop: 4,
    },
    loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
    loginBtnText: { color: 'white', fontSize: 17, fontWeight: '800' },
    forgotWrap: { alignItems: 'center', paddingVertical: 14 },
    forgotText: { color: 'rgba(255,255,255,0.25)', fontSize: 12, textDecorationLine: 'underline' },
    createLink: { alignItems: 'center', paddingTop: 4 },
    createLinkText: { color: '#A78BFA', fontSize: 13, fontWeight: '700' },
});
