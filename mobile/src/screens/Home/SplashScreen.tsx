import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    withSpring,
    Easing,
    interpolate,
    interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');

// ── Cycling loading messages ────────────────────────────────────
const LOADING_MSGS = [
    { icon: '🍌', text: 'Peeling bananas...' },
    { icon: '🐒', text: 'Warming up the monkeys...' },
    { icon: '🔥', text: 'Loading hot tea...' },
    { icon: '👀', text: 'Calibrating the gossip engine...' },
    { icon: '🎭', text: 'Spawning your personas...' },
    { icon: '💬', text: 'Connecting to the jungle...' },
    { icon: '⚡', text: 'Charging the vibe meter...' },
    { icon: '🌀', text: 'Activating chaos mode...' },
    { icon: '🤫', text: 'Shh... spilling tea...' },
    { icon: '🚀', text: 'Almost ready. Hold tight.' },
];

// ── One spinning ring ───────────────────────────────────────────
function OrbitRing({
    size, borderColor, duration, delay = 0, clockwise = true, borderWidth = 1.5, dashed = false,
}: {
    size: number; borderColor: string; duration: number; delay?: number; clockwise?: boolean; borderWidth?: number; dashed?: boolean;
}) {
    const rotate = useSharedValue(clockwise ? 0 : 360);
    useEffect(() => {
        rotate.value = withDelay(delay, withRepeat(
            withTiming(clockwise ? 360 : 0, { duration, easing: Easing.linear }),
            -1, false,
        ));
    }, []);
    const style = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotate.value}deg` }],
    }));
    return (
        <Animated.View
            style={[{
                position: 'absolute',
                width: size, height: size,
                borderRadius: size / 2,
                borderWidth,
                borderColor,
                borderStyle: dashed ? 'dashed' : 'solid',
                borderTopColor: 'transparent',
            }, style]}
        />
    );
}

// ── Floating emoji particle ─────────────────────────────────────
function EmojiParticle({ emoji, x, startY, duration, delay, size = 18 }: {
    emoji: string; x: string; startY: number; duration: number; delay: number; size?: number;
}) {
    const y = useSharedValue(startY);
    const op = useSharedValue(0);
    const scale = useSharedValue(0.5);
    const wobble = useSharedValue(0);
    useEffect(() => {
        y.value = withDelay(delay, withRepeat(
            withTiming(startY - H * 0.7, { duration, easing: Easing.linear }), -1,
        ));
        op.value = withDelay(delay, withRepeat(
            withSequence(
                withTiming(0, { duration: 0 }),
                withTiming(0.9, { duration: 500 }),
                withTiming(0.9, { duration: duration - 1000 }),
                withTiming(0, { duration: 500 }),
            ), -1,
        ));
        scale.value = withDelay(delay, withRepeat(
            withSequence(withTiming(1.2, { duration: duration / 2 }), withTiming(0.8, { duration: duration / 2 })), -1, true,
        ));
        wobble.value = withDelay(delay, withRepeat(
            withSequence(withTiming(10, { duration: 1200 }), withTiming(-10, { duration: 1200 })), -1, true,
        ));
    }, []);
    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: y.value }, { translateX: wobble.value }, { scale: scale.value }],
        opacity: op.value,
        position: 'absolute',
        left: x as any,
    }));
    return <Animated.Text style={[style, { fontSize: size }]}>{emoji}</Animated.Text>;
}

// ── Pulsing glow circle ─────────────────────────────────────────
function GlowCircle({ color, size, delay = 0 }: { color: string; size: number; delay?: number }) {
    const s = useSharedValue(1);
    const o = useSharedValue(0.4);
    useEffect(() => {
        s.value = withDelay(delay, withRepeat(
            withSequence(withTiming(1.3, { duration: 2000 }), withTiming(1, { duration: 2000 })), -1, true,
        ));
        o.value = withDelay(delay, withRepeat(
            withSequence(withTiming(0.7, { duration: 2000 }), withTiming(0.2, { duration: 2000 })), -1, true,
        ));
    }, []);
    const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: o.value }));
    return (
        <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />
    );
}

// ── Main SplashScreen ───────────────────────────────────────────
export default function SplashScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [msgIndex, setMsgIndex] = useState(0);
    const [pct, setPct] = useState(0);
    const [msgVisible, setMsgVisible] = useState(true);

    // ── Shared values
    const logoScale = useSharedValue(0);
    const logoOpacity = useSharedValue(0);
    const logoRotate = useSharedValue(-15);
    const titleOp = useSharedValue(0);
    const titleX = useSharedValue(-30);
    const subtitleOp = useSharedValue(0);
    const progressW = useSharedValue(0);
    const bgShift = useSharedValue(0);
    const msgOp = useSharedValue(1);
    const shimmerX = useSharedValue(-W);

    useEffect(() => {
        // Logo explosive spring entrance
        logoScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 120 }));
        logoOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
        logoRotate.value = withDelay(200, withSpring(0, { damping: 6, stiffness: 80 }));

        // Title slides in
        titleOp.value = withDelay(700, withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }));
        titleX.value = withDelay(700, withTiming(0, { duration: 700, easing: Easing.out(Easing.back(1.5)) }));

        // Subtitle fades in
        subtitleOp.value = withDelay(1200, withTiming(1, { duration: 700 }));

        // Background hue drift
        bgShift.value = withRepeat(
            withSequence(withTiming(1, { duration: 5000 }), withTiming(0, { duration: 5000 })), -1, true,
        );

        // Progress bar (0 → 100 over ~3.8 s)
        progressW.value = withDelay(800, withTiming(100, { duration: 3800, easing: Easing.out(Easing.exp) }));

        // Shimmer sweep on progress bar
        shimmerX.value = withDelay(800, withRepeat(
            withTiming(W, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, false,
        ));

        // Counter
        let c = 0;
        const countInterval = setInterval(() => {
            c = Math.min(c + 1, 100);
            setPct(c);
            if (c >= 100) clearInterval(countInterval);
        }, 40);

        // Cycle loading messages with fade
        let mi = 0;
        const msgInterval = setInterval(() => {
            // fade out
            msgOp.value = withTiming(0, { duration: 200 }, () => { });
            setTimeout(() => {
                mi = (mi + 1) % LOADING_MSGS.length;
                setMsgIndex(mi);
                msgOp.value = withTiming(1, { duration: 300 });
            }, 220);
        }, 450);

        // Navigate
        const navTimer = setTimeout(() => navigation.replace('Onboarding'), 5000);

        return () => {
            clearInterval(countInterval);
            clearInterval(msgInterval);
            clearTimeout(navTimer);
        };
    }, []);

    // ── Animated Styles
    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }, { rotate: `${logoRotate.value}deg` }],
        opacity: logoOpacity.value,
    }));
    const titleStyle = useAnimatedStyle(() => ({
        opacity: titleOp.value,
        transform: [{ translateX: titleX.value }],
    }));
    const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOp.value }));
    const progressStyle = useAnimatedStyle(() => ({ width: `${progressW.value}%` }));
    const msgStyle = useAnimatedStyle(() => ({ opacity: msgOp.value }));
    const bgStyle = useAnimatedStyle(() => ({
        opacity: interpolate(bgShift.value, [0, 1], [0.15, 0.35]),
        transform: [
            { translateX: interpolate(bgShift.value, [0, 1], [0, W * 0.08]) },
            { translateY: interpolate(bgShift.value, [0, 1], [0, H * 0.06]) },
            { scale: interpolate(bgShift.value, [0, 1], [1, 1.25]) },
        ],
    }));
    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shimmerX.value }],
    }));

    const msg = LOADING_MSGS[msgIndex];

    return (
        <View style={{ flex: 1, backgroundColor: '#06020E', overflow: 'hidden' }}>

            {/* ── Deep nebula blobs ────────────────────── */}
            <Animated.View pointerEvents="none" style={[{
                position: 'absolute', top: -120, left: -120,
                width: W + 240, height: W + 240, borderRadius: (W + 240) / 2,
                backgroundColor: '#7c3aed',
            }, bgStyle]} />
            <View pointerEvents="none" style={{
                position: 'absolute', bottom: -150, right: -80,
                width: 380, height: 380, borderRadius: 190,
                backgroundColor: '#0891b2', opacity: 0.08,
            }} />
            <View pointerEvents="none" style={{
                position: 'absolute', top: '35%', left: -100,
                width: 280, height: 280, borderRadius: 140,
                backgroundColor: '#ec4899', opacity: 0.05,
            }} />

            {/* ── Emoji particles ──────────────────────── */}
            <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
                <EmojiParticle emoji="🍌" x="8%" startY={H * 0.9} duration={7000} delay={0} size={16} />
                <EmojiParticle emoji="🔥" x="22%" startY={H * 0.95} duration={9000} delay={1200} size={14} />
                <EmojiParticle emoji="👀" x="40%" startY={H * 0.88} duration={8000} delay={500} size={15} />
                <EmojiParticle emoji="💬" x="60%" startY={H * 0.93} duration={10000} delay={2000} size={13} />
                <EmojiParticle emoji="🐒" x="75%" startY={H * 0.91} duration={7500} delay={800} size={17} />
                <EmojiParticle emoji="⚡" x="88%" startY={H * 0.96} duration={6500} delay={3000} size={12} />
                <EmojiParticle emoji="🌀" x="30%" startY={H * 0.97} duration={11000} delay={4000} size={14} />
                <EmojiParticle emoji="🤫" x="52%" startY={H * 0.90} duration={8500} delay={2500} size={16} />
            </View>

            {/* ── Logo section ─────────────────────────── */}
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

                {/* Orbit rings stack */}
                <View style={{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }}>

                    {/* Pulsing glow layers */}
                    <GlowCircle color="#7c3aed" size={180} delay={0} />
                    <GlowCircle color="#0891b2" size={120} delay={700} />
                    <GlowCircle color="#7c3aed" size={90} delay={350} />

                    {/* Spinning rings */}
                    <OrbitRing size={220} borderColor="rgba(124,58,237,0.5)" duration={6000} delay={0} clockwise={true} borderWidth={1.5} />
                    <OrbitRing size={190} borderColor="rgba(8,145,178,0.6)" duration={4500} delay={200} clockwise={false} borderWidth={2} />
                    <OrbitRing size={155} borderColor="rgba(236,72,153,0.4)" duration={8000} delay={400} clockwise={true} borderWidth={1} dashed />
                    <OrbitRing size={130} borderColor="rgba(124,58,237,0.8)" duration={3000} delay={0} clockwise={false} borderWidth={2.5} />
                    <OrbitRing size={105} borderColor="rgba(8,145,178,0.3)" duration={12000} delay={600} clockwise={true} borderWidth={1} dashed />

                    {/* Logo card */}
                    <Animated.View style={[{ zIndex: 20, alignItems: 'center', justifyContent: 'center' }, logoStyle]}>
                        <LinearGradient
                            colors={['#7c3aed', '#0891b2']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={{ borderRadius: 28, padding: 3 }}
                        >
                            <View style={{
                                width: 88, height: 88, borderRadius: 26,
                                backgroundColor: '#06020E',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <MaterialIcons name="smart-toy" size={52} color="#22d3ee" />
                            </View>
                        </LinearGradient>
                    </Animated.View>
                </View>

                {/* Branding text */}
                <View style={{ alignItems: 'center', marginTop: 32 }}>
                    <Animated.Text
                        style={[{
                            color: '#f8fafc',
                            fontFamily: 'Poppins-Bold',
                            fontSize: 42,
                            letterSpacing: -1.5,
                            textShadowColor: 'rgba(124,58,237,0.6)',
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 24,
                        }, titleStyle]}
                    >
                        Gossip Monkey
                    </Animated.Text>

                    {/* Orange divider */}
                    <View style={{ height: 3, width: 52, backgroundColor: '#ec5b13', borderRadius: 4, marginTop: 4 }} />

                    <Animated.View
                        style={[{
                            backgroundColor: 'rgba(8,145,178,0.15)',
                            borderRadius: 99,
                            paddingHorizontal: 16,
                            paddingVertical: 5,
                            marginTop: 10,
                            borderWidth: 1,
                            borderColor: 'rgba(8,145,178,0.3)',
                        }, subtitleStyle]}
                    >
                        <Text style={{
                            color: '#22d3ee',
                            fontFamily: 'SpaceMono',
                            fontSize: 11,
                            letterSpacing: 4,
                            textTransform: 'uppercase',
                        }}>
                            WHERE VIBES HAVE LIFE
                        </Text>
                    </Animated.View>
                </View>
            </View>

            {/* ── Loading section ───────────────────────── */}
            <View style={{
                paddingHorizontal: 32,
                paddingBottom: insets.bottom + 40,
                alignItems: 'center',
                gap: 14,
            }}>
                {/* Cycling message */}
                <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, msgStyle]}>
                    <Text style={{ fontSize: 16 }}>{msg.icon}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'Poppins-Medium', letterSpacing: 0.5 }}>
                        {msg.text}
                    </Text>
                </Animated.View>

                {/* Progress container */}
                <View style={{ width: '100%' }}>
                    {/* Label row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#64748b', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: '700' }}>
                            Initializing Vibe Engine
                        </Text>
                        <Text style={{ color: '#7c3aed', fontSize: 11, fontWeight: '800' }}>
                            {pct}%
                        </Text>
                    </View>

                    {/* Bar track */}
                    <View style={{
                        height: 6, width: '100%',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 99,
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
                        overflow: 'hidden',
                    }}>
                        <Animated.View style={[{ height: '100%', borderRadius: 99, overflow: 'hidden' }, progressStyle]}>
                            <LinearGradient
                                colors={['#7c3aed', '#ec4899', '#22d3ee']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={{ flex: 1, borderRadius: 99 }}
                            />
                            {/* Shimmer sweep */}
                            <Animated.View style={[{
                                position: 'absolute', top: 0, bottom: 0,
                                width: 60,
                                backgroundColor: 'rgba(255,255,255,0.25)',
                                transform: [{ skewX: '-20deg' }],
                            }, shimmerStyle]} />
                        </Animated.View>
                    </View>
                </View>

                {/* Footer */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.5 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#22c55e', shadowColor: '#22c55e', shadowOpacity: 1, shadowRadius: 4 }} />
                    <Text style={{ color: '#64748b', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700' }}>
                        Secure Connection Established
                    </Text>
                </View>
            </View>
        </View>
    );
}
