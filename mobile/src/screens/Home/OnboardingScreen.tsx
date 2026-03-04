import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, Image, ScrollView,
    Dimensions, Animated as RNAnimated,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

const { width: W } = Dimensions.get('window');

// ── Slide definitions ────────────────────────────────────────────
interface SlideData {
    id: number;
    accentColor: string;
    secondaryColor: string;
    gradient: [string, string];
    emoji: string;
    tag: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    card: 'chat' | 'bananas' | 'chaos' | 'anon';
}

const SLIDES: SlideData[] = [
    {
        id: 0,
        accentColor: '#8b5cf6',
        secondaryColor: '#22d3ee',
        gradient: ['#8b5cf6', '#22d3ee'],
        emoji: '🤖',
        tag: 'LIVING AI INSIDE',
        title: 'Rooms with ',
        titleHighlight: 'Living AIs',
        subtitle: 'Every room has a personality. The AI roasts, hypes, and chills right alongside you.',
        card: 'chat',
    },
    {
        id: 1,
        accentColor: '#f59e0b',
        secondaryColor: '#ec5b13',
        gradient: ['#f59e0b', '#ec5b13'],
        emoji: '🍌',
        tag: 'EARN & FLEX',
        title: 'Stack Your ',
        titleHighlight: 'Banana Score',
        subtitle: 'Spill tea, get reactions, unlock features. The more you vibe – the more bananas you bag. 💸',
        card: 'bananas',
    },
    {
        id: 2,
        accentColor: '#ef4444',
        secondaryColor: '#f97316',
        gradient: ['#ef4444', '#f97316'],
        emoji: '🌀',
        tag: 'PURE CHAOS',
        title: 'Chaos Mode ',
        titleHighlight: 'Activated',
        subtitle: 'Open a Chaos room, pick a wildcard AI, and watch the drama write itself. No filter. No rules. 🔥',
        card: 'chaos',
    },
    {
        id: 3,
        accentColor: '#22c55e',
        secondaryColor: '#06b6d4',
        gradient: ['#22c55e', '#06b6d4'],
        emoji: '🕵️',
        tag: '100% ANONYMOUS',
        title: 'Stay Masked, ',
        titleHighlight: 'Spill Facts',
        subtitle: 'Your persona is your shield. Drop the gossip, keep the mystery. Nobody knows you — unless you choose. 👀',
        card: 'anon',
    },
];

// ── Animated typing dots ────────────────────────────────────────
function TypingDots({ color }: { color: string }) {
    const d1 = useSharedValue(0.3);
    const d2 = useSharedValue(0.3);
    const d3 = useSharedValue(0.3);
    useEffect(() => {
        d1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1);
        d2.value = withDelay(160, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1));
        d3.value = withDelay(320, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1));
    }, []);
    const s1 = useAnimatedStyle(() => ({ opacity: d1.value }));
    const s2 = useAnimatedStyle(() => ({ opacity: d2.value }));
    const s3 = useAnimatedStyle(() => ({ opacity: d3.value }));
    return (
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            {[s1, s2, s3].map((s, i) => (
                <Animated.View key={i} style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }, s]} />
            ))}
        </View>
    );
}

// ── Individual card visuals per slide ───────────────────────────
function SlideCard({ type, accentColor, secondaryColor }: { type: SlideData['card']; accentColor: string; secondaryColor: string }) {
    const floatY = useSharedValue(0);
    const glowPulse = useSharedValue(0.4);

    useEffect(() => {
        floatY.value = withRepeat(
            withSequence(
                withTiming(-12, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
            ),
            -1, true,
        );
        glowPulse.value = withRepeat(
            withSequence(withTiming(0.7, { duration: 2000 }), withTiming(0.3, { duration: 2000 })),
            -1, true,
        );
    }, []);

    const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: floatY.value }] }));
    const glowStyle = useAnimatedStyle(() => ({ opacity: glowPulse.value }));

    // ── Card: Chat ──────────────────────────────────────────
    if (type === 'chat') {
        return (
            <Animated.View style={[{ width: W * 0.86, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: `${accentColor}40`, backgroundColor: 'rgba(255,255,255,0.04)' }, floatStyle]}>
                {/* Glow */}
                <Animated.View style={[{ position: 'absolute', top: -40, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: accentColor }, glowStyle]} />

                <View style={{ padding: 20 }}>
                    {/* AI header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: accentColor }}>
                            <Image source={{ uri: 'https://api.dicebear.com/9.x/bottts/png?seed=GossipMonkey&backgroundColor=1a0f0a' }} style={{ width: '100%', height: '100%' }} />
                        </View>
                        <View>
                            <Text style={{ color: '#f8fafc', fontFamily: 'Poppins-Bold', fontSize: 13 }}>Gossip Monkey AI</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: secondaryColor }} />
                                <Text style={{ color: secondaryColor, fontSize: 9, letterSpacing: 2, fontWeight: '700' }}>ONLINE</Text>
                            </View>
                        </View>
                    </View>

                    {/* Chat bubbles */}
                    <View style={{ gap: 10 }}>
                        <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, borderTopLeftRadius: 4, padding: 10, maxWidth: '80%' }}>
                            <Text style={{ color: '#e2e8f0', fontSize: 13 }}>Welcome to the jungle! Which room are we roasting today? 🔥</Text>
                        </View>
                        <View style={{ alignSelf: 'flex-end', backgroundColor: `${accentColor}30`, borderRadius: 16, borderTopRightRadius: 4, padding: 10, maxWidth: '80%', borderWidth: 1, borderColor: `${accentColor}50` }}>
                            <Text style={{ color: '#f1f5f9', fontSize: 13, fontFamily: 'Poppins-Medium' }}>Show me the Living AI rooms!</Text>
                        </View>
                        <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, borderTopLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10 }}>
                            <TypingDots color={secondaryColor} />
                        </View>
                    </View>

                    {/* Status chip */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                        <MaterialIcons name="auto-awesome" size={12} color={secondaryColor} />
                        <Text style={{ color: '#94a3b8', fontSize: 11 }}>Monkey is thinking...</Text>
                    </View>
                </View>
            </Animated.View>
        );
    }

    // ── Card: Bananas ───────────────────────────────────────
    if (type === 'bananas') {
        const bananas = ['🍌', '🍌', '🍌', '🍌', '🍌'];
        return (
            <Animated.View style={[{ width: W * 0.86, borderRadius: 24, borderWidth: 1, borderColor: `${accentColor}40`, backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' }, floatStyle]}>
                <Animated.View style={[{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: accentColor }, glowStyle]} />
                <View style={{ padding: 20 }}>
                    {/* Score header */}
                    <View style={{ alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ color: '#94a3b8', fontSize: 10, letterSpacing: 3, fontWeight: '700' }}>YOUR BANANA SCORE</Text>
                        <Text style={{ color: accentColor, fontSize: 52, fontFamily: 'Poppins-Bold', lineHeight: 62 }}>12,400</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                            <MaterialIcons name="trending-up" size={13} color="#22c55e" />
                            <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '700' }}>+340 today</Text>
                        </View>
                    </View>

                    {/* Banana row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
                        {bananas.map((b, i) => (
                            <View key={i} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${accentColor}25`, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${accentColor}50` }}>
                                <Text style={{ fontSize: 18 }}>{b}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Recent activity */}
                    {[
                        { text: 'Epic Roast landed', pts: '+50 🍌' },
                        { text: 'Room went viral', pts: '+200 🍌' },
                        { text: 'Monkey reacted 😂', pts: '+15 🍌' },
                    ].map((item, i) => (
                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < 2 ? 1 : 0, borderColor: 'rgba(255,255,255,0.05)' }}>
                            <Text style={{ color: '#cbd5e1', fontSize: 12, fontFamily: 'Poppins-Medium' }}>{item.text}</Text>
                            <Text style={{ color: accentColor, fontSize: 12, fontWeight: '700' }}>{item.pts}</Text>
                        </View>
                    ))}
                </View>
            </Animated.View>
        );
    }

    // ── Card: Chaos ─────────────────────────────────────────
    if (type === 'chaos') {
        const chaosItems = ['🔥 Someone spilled MAJOR tea', '💀 The AI just violated everyone', '👁️ Anonymous vote: spicy or mid?', '🌀 Chaos mode enabled – NO FILTER'];
        const itemColors = ['#ef4444', '#f97316', '#eab308', '#8b5cf6'];
        return (
            <Animated.View style={[{ width: W * 0.86, borderRadius: 24, borderWidth: 1, borderColor: `${accentColor}40`, backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' }, floatStyle]}>
                <Animated.View style={[{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: accentColor }, glowStyle]} />
                <View style={{ padding: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <View>
                            <Text style={{ color: '#94a3b8', fontSize: 10, letterSpacing: 3, fontWeight: '700' }}>CHAOS ROOM</Text>
                            <Text style={{ color: '#f1f5f9', fontSize: 16, fontFamily: 'Poppins-Bold' }}>The Roast Pit 🏟️</Text>
                        </View>
                        <View style={{ backgroundColor: `${accentColor}25`, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: `${accentColor}50` }}>
                            <Text style={{ color: accentColor, fontSize: 10, fontWeight: '700' }}>🔴 LIVE</Text>
                        </View>
                    </View>

                    <View style={{ gap: 8 }}>
                        {chaosItems.map((item, i) => (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, borderLeftWidth: 3, borderLeftColor: itemColors[i] }}>
                                <Text style={{ color: '#e2e8f0', fontSize: 12, flex: 1 }}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </Animated.View>
        );
    }

    // ── Card: Anon ──────────────────────────────────────────
    return (
        <Animated.View style={[{ width: W * 0.86, borderRadius: 24, borderWidth: 1, borderColor: `${accentColor}40`, backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' }, floatStyle]}>
            <Animated.View style={[{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: accentColor }, glowStyle]} />
            <View style={{ padding: 20 }}>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: `${accentColor}60`, marginBottom: 10 }}>
                        <Text style={{ fontSize: 36 }}>🕵️</Text>
                    </View>
                    <Text style={{ color: '#f1f5f9', fontFamily: 'Poppins-Bold', fontSize: 15 }}>You are: ???</Text>
                    <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Identity hidden from everyone</Text>
                </View>

                {[
                    { icon: 'visibility-off', label: 'Anonymous by default', on: true },
                    { icon: 'security', label: 'End-to-end invisible', on: true },
                    { icon: 'person-off', label: 'No real name needed', on: true },
                    { icon: 'track-changes', label: 'Activity not tracked', on: false },
                ].map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < 3 ? 1 : 0, borderColor: 'rgba(255,255,255,0.05)' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <MaterialIcons name={item.icon as any} size={16} color={item.on ? accentColor : '#475569'} />
                            <Text style={{ color: item.on ? '#e2e8f0' : '#475569', fontSize: 12, fontFamily: 'Poppins-Medium' }}>{item.label}</Text>
                        </View>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.on ? accentColor : '#334155' }} />
                    </View>
                ))}
            </View>
        </Animated.View>
    );
}

// ── Main OnboardingScreen ───────────────────────────────────────
type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
type Props = { navigation: OnboardingScreenNavigationProp };

export default function OnboardingScreen({ navigation }: Props) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const scrollX = useRef(new RNAnimated.Value(0)).current;

    // Per-slide text fade
    const textOpacity = useSharedValue(0);
    const textY = useSharedValue(20);

    const animateText = useCallback(() => {
        textOpacity.value = 0;
        textY.value = 20;
        textOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
        textY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });
    }, []);

    useEffect(() => {
        animateText();
    }, [activeIndex]);

    // Background glow animation
    const bgGlow = useSharedValue(0);
    useEffect(() => {
        bgGlow.value = withRepeat(
            withSequence(withTiming(1, { duration: 4000 }), withTiming(0, { duration: 4000 })),
            -1, true,
        );
    }, []);
    const bgGlowStyle = useAnimatedStyle(() => ({ opacity: interpolate(bgGlow.value, [0, 1], [0.12, 0.28]) }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textY.value }],
    }));

    const slide = SLIDES[activeIndex];

    const goNext = () => {
        if (activeIndex < SLIDES.length - 1) {
            const next = activeIndex + 1;
            scrollRef.current?.scrollTo({ x: next * W, animated: true });
            setActiveIndex(next);
        } else {
            navigation.replace('AuthGateway');
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
            {/* Dynamic background glow */}
            <Animated.View
                pointerEvents="none"
                style={[{
                    position: 'absolute', top: -100, left: -100,
                    width: W + 200, height: W + 200,
                    borderRadius: (W + 200) / 2,
                    backgroundColor: slide.accentColor,
                }, bgGlowStyle]}
            />
            <View
                pointerEvents="none"
                style={{
                    position: 'absolute', bottom: -150, right: -100,
                    width: 350, height: 350, borderRadius: 175,
                    backgroundColor: slide.secondaryColor,
                    opacity: 0.08,
                }}
            />

            {/* Skip */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 56 }}>
                <TouchableOpacity onPress={() => navigation.replace('Auth')} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 6 }}>
                    <Text style={{ color: '#94a3b8', fontFamily: 'Poppins-Bold', fontSize: 12, letterSpacing: 1 }}>SKIP</Text>
                </TouchableOpacity>
            </View>

            {/* Slide tag */}
            <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 8 }}>
                <LinearGradient
                    colors={slide.gradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 99, paddingHorizontal: 14, paddingVertical: 4 }}
                >
                    <Text style={{ color: 'white', fontSize: 9, fontWeight: '800', letterSpacing: 3 }}>{slide.tag}</Text>
                </LinearGradient>
            </View>

            {/* Cards carousel – horizontal scroll */}
            <View style={{ flex: 1 }}>
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                    onMomentumScrollEnd={(e) => {
                        const newIndex = Math.round(e.nativeEvent.contentOffset.x / W);
                        setActiveIndex(newIndex);
                    }}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ alignItems: 'center' }}
                >
                    {SLIDES.map((s) => (
                        <View key={s.id} style={{ width: W, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
                            <SlideCard type={s.card} accentColor={s.accentColor} secondaryColor={s.secondaryColor} />
                        </View>
                    ))}
                </ScrollView>

                {/* Text content below card */}
                <Animated.View style={[{ alignItems: 'center', paddingHorizontal: 28, marginTop: 16 }, textStyle]}>
                    <Text style={{ color: '#f8fafc', fontFamily: 'Poppins-Bold', fontSize: 30, textAlign: 'center', lineHeight: 38 }}>
                        {slide.title}
                        <Text style={{ color: slide.accentColor }}>{slide.titleHighlight}</Text>
                    </Text>
                    <Text style={{ color: '#94a3b8', fontFamily: 'Poppins-Medium', fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: 8 }}>
                        {slide.subtitle}
                    </Text>
                </Animated.View>
            </View>

            {/* Bottom bar */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16, alignItems: 'center', gap: 20 }}>
                {/* Dot indicators */}
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    {SLIDES.map((_, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => {
                                scrollRef.current?.scrollTo({ x: i * W, animated: true });
                                setActiveIndex(i);
                            }}
                            style={{
                                height: 6,
                                width: i === activeIndex ? 28 : 6,
                                borderRadius: 99,
                                backgroundColor: i === activeIndex ? slide.accentColor : 'rgba(255,255,255,0.2)',
                            }}
                        />
                    ))}
                </View>

                {/* CTA button */}
                <TouchableOpacity onPress={goNext} style={{ width: '100%', borderRadius: 18, overflow: 'hidden' }}>
                    <LinearGradient
                        colors={slide.gradient}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
                    >
                        <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 15, letterSpacing: 2 }}>
                            {activeIndex < SLIDES.length - 1 ? 'NEXT →' : "LET'S GOOO 🚀"}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}
