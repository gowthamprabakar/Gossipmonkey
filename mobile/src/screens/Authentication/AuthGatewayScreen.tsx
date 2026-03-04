/**
 * AuthGatewayScreen.tsx
 *
 * Animated choice screen — presented when there is no session.
 * Two paths: create new account OR log into existing account.
 */

import React, { useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Reanimated, {
    useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming, withRepeat, withSequence,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

// Floating particle blob — pointerEvents none so it never blocks touches
function Blob({ size, color, top, left, delay }: any) {
    const s = useSharedValue(0);
    const y = useSharedValue(0);
    useEffect(() => {
        s.value = withDelay(delay, withSpring(1, { damping: 12 }));
        y.value = withDelay(delay, withRepeat(withSequence(
            withTiming(-18, { duration: 3200 }),
            withTiming(18, { duration: 3200 }),
        ), -1, true));
    }, []);
    const style = useAnimatedStyle(() => ({
        opacity: s.value * 0.18,
        transform: [{ scale: s.value }, { translateY: y.value }],
    }));
    return (
        <Reanimated.View
            pointerEvents="none"
            style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color, top, left }, style]}
        />
    );
}

export default function AuthGatewayScreen({ navigation }: any) {
    const logoAnim = useRef(new Animated.Value(0)).current;
    const ctaAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(logoAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(ctaAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <View style={styles.root}>
            {/* Ambient blobs — all non-interactive */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Blob size={360} color="#7C3AED" top={-100} left={-80} delay={0} />
                <Blob size={280} color="#2563EB" top={H * 0.5} left={W * 0.5} delay={200} />
                <Blob size={200} color="#EC4899" top={H * 0.7} left={-60} delay={400} />
            </View>

            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                {/* Logo + tagline */}
                <Animated.View style={[styles.logoSection, { opacity: logoAnim, transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }]}>
                    <View style={styles.monkeyIconWrap}>
                        <LinearGradient colors={['#7C3AED', '#2563EB']} style={styles.monkeyIcon}>
                            <Text style={{ fontSize: 44 }}>🐒</Text>
                        </LinearGradient>
                    </View>
                    <Text style={styles.appName}>Gossip Monkey</Text>
                    <Text style={styles.tagline}>Your identity. Your rules. Zero judgment.</Text>

                    {/* Trust badges */}
                    <View style={styles.badges}>
                        {[
                            { icon: 'visibility-off', label: 'Anonymous' },
                            { icon: 'shield', label: 'Encrypted' },
                            { icon: 'bolt', label: 'Real-time' },
                        ].map(b => (
                            <View key={b.label} style={styles.badge}>
                                <MaterialIcons name={b.icon as any} size={12} color="#818CF8" />
                                <Text style={styles.badgeText}>{b.label}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* CTAs */}
                <Animated.View style={[styles.ctaSection, { opacity: ctaAnim }]}>
                    {/* Primary: new account */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Auth')}
                        style={styles.primaryBtnWrap}
                        activeOpacity={0.88}
                    >
                        <LinearGradient
                            colors={['#7C3AED', '#2563EB']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.primaryBtn}
                        >
                            <Text style={{ fontSize: 22 }}>🌴</Text>
                            <View>
                                <Text style={styles.primaryBtnTitle}>Enter the Jungle</Text>
                                <Text style={styles.primaryBtnSub}>Create a new anonymous account</Text>
                            </View>
                            <MaterialIcons name="arrow-forward" size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Secondary: existing account */}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        style={styles.secondaryBtn}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="login" size={20} color="#A78BFA" />
                        <Text style={styles.secondaryBtnText}>I already have an account</Text>
                        <MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.25)" />
                    </TouchableOpacity>

                    <Text style={styles.privacyNote}>
                        No email. No phone. Just a code.
                    </Text>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#06020E' },
    logoSection: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    monkeyIconWrap: { marginBottom: 20 },
    monkeyIcon: {
        width: 100, height: 100, borderRadius: 30,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#7C3AED', shadowRadius: 30, shadowOpacity: 0.6,
        shadowOffset: { width: 0, height: 0 }, elevation: 20,
    },
    appName: { color: 'white', fontSize: 34, fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
    tagline: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
    badges: { flexDirection: 'row', gap: 16, marginTop: 20 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    badgeText: { color: '#818CF8', fontSize: 11, fontWeight: '700' },
    ctaSection: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
    primaryBtnWrap: {
        borderRadius: 20, overflow: 'hidden',
        shadowColor: '#7C3AED', shadowRadius: 20, shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 6 }, elevation: 15,
    },
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingVertical: 20, paddingHorizontal: 24,
    },
    primaryBtnTitle: { color: 'white', fontSize: 17, fontWeight: '800' },
    primaryBtnSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
    dividerText: { color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '700' },
    secondaryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center',
        backgroundColor: 'rgba(167,139,250,0.08)',
        borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)',
        borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    },
    secondaryBtnText: { color: '#A78BFA', fontSize: 15, fontWeight: '700', flex: 1 },
    privacyNote: { color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', marginTop: 4 },
});
