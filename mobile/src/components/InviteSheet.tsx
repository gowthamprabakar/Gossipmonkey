import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, TouchableOpacity, Modal, StyleSheet,
    Share, Clipboard, Animated, Pressable, Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W } = Dimensions.get('window');

const APP_SCHEME = 'gossipmonkey'; // deep-link scheme

interface InviteSheetProps {
    visible: boolean;
    onClose: () => void;
    roomId: string;
    roomName: string;
    roomType: 'public' | 'private';
    /** PIN shown only if admin knowingly passes it (e.g. stored from creation) */
    roomPin?: string;
    /** if true the room uses knock/approval flow */
    requiresApproval?: boolean;
}

function buildDeepLink(roomId: string) {
    return `${APP_SCHEME}://join?roomId=${roomId}`;
}

function buildShareText(roomName: string, roomId: string, roomPin?: string, requiresApproval?: boolean) {
    const link = buildDeepLink(roomId);
    let body = `🐒 Join my private jungle on Gossip Monkey!\n\n`;
    body += `🏠 Room: ${roomName}\n`;
    if (roomPin) {
        body += `🔑 PIN: ${roomPin}\n`;
    } else if (requiresApproval) {
        body += `🚪 Entry: Knock-to-join (admin approves)\n`;
    }
    body += `\n👉 Tap to join: ${link}\n\n`;
    body += `Don't have the app? Download Gossip Monkey 🔗`;
    return body;
}

/** Single PIN digit box */
function PinDigit({ d }: { d: string }) {
    return (
        <View style={s.pinDigit}>
            <Text style={s.pinDigitText}>{d}</Text>
        </View>
    );
}

/** Link copy row */
function CopyRow({ label, value, icon, color = '#818CF8' }: { label: string; value: string; icon: string; color?: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        Clipboard.setString(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <TouchableOpacity onPress={handleCopy} style={s.copyRow} activeOpacity={0.8}>
            <View style={[s.copyIcon, { backgroundColor: `${color}15` }]}>
                <MaterialIcons name={icon as any} size={16} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.copyLabel}>{label}</Text>
                <Text style={s.copyValue} numberOfLines={1}>{value}</Text>
            </View>
            <View style={[s.copyBtn, copied && { backgroundColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.4)' }]}>
                <MaterialIcons name={copied ? 'check' : 'content-copy'} size={14} color={copied ? '#34D399' : 'rgba(255,255,255,0.4)'} />
                <Text style={[s.copyBtnText, copied && { color: '#34D399' }]}>{copied ? 'Copied!' : 'Copy'}</Text>
            </View>
        </TouchableOpacity>
    );
}

export function InviteSheet({
    visible, onClose, roomId, roomName, roomType,
    roomPin, requiresApproval,
}: InviteSheetProps) {
    const slideAnim = useRef(new Animated.Value(500)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, { toValue: 0, damping: 16, stiffness: 200, useNativeDriver: true }).start();
        } else {
            Animated.timing(slideAnim, { toValue: 500, duration: 240, useNativeDriver: true }).start();
        }
    }, [visible]);

    const deepLink = buildDeepLink(roomId);
    const shareText = buildShareText(roomName, roomId, roomPin, requiresApproval);

    const handleNativeShare = async () => {
        try {
            await Share.share({ message: shareText, title: `Join ${roomName} on Gossip Monkey` });
        } catch (e) { /* user cancelled */ }
    };

    const entryMode = roomPin
        ? 'PIN'
        : requiresApproval
            ? 'Approval'
            : 'Open';

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <Pressable style={s.overlay} onPress={onClose} />

            <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
                {/* Handle */}
                <View style={s.handle} />

                {/* Room invite card */}
                <LinearGradient
                    colors={['#1A0533', '#0D0520', '#050210']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.inviteCard}>
                    {/* Gloss */}
                    <View style={s.cardGloss} />

                    {/* Decorative orbs */}
                    <View style={s.orb1} />
                    <View style={s.orb2} />

                    {/* Header row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <View style={s.roomIconBox}>
                            <Text style={{ fontSize: 28 }}>🐒</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.cardTitle}>{roomName}</Text>
                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                                <View style={[s.badge, { backgroundColor: 'rgba(236,72,153,0.15)', borderColor: 'rgba(236,72,153,0.3)' }]}>
                                    <MaterialIcons name="lock" size={9} color="#EC4899" />
                                    <Text style={[s.badgeText, { color: '#EC4899' }]}>PRIVATE</Text>
                                </View>
                                <View style={[s.badge, { backgroundColor: 'rgba(129,140,248,0.12)', borderColor: 'rgba(129,140,248,0.25)' }]}>
                                    <Text style={[s.badgeText, { color: '#818CF8' }]}>
                                        {entryMode === 'PIN' ? '🔑 PIN' : entryMode === 'Approval' ? '🚪 Knock' : '🌐 Open'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        {/* App brand */}
                        <Text style={s.brand}>🐒 Gossip{'\n'}Monkey</Text>
                    </View>

                    {/* Room ID */}
                    <View style={s.roomIdRow}>
                        <Text style={s.roomIdLabel}>ROOM ID</Text>
                        <Text style={s.roomIdValue} numberOfLines={1}>{roomId.slice(0, 8).toUpperCase()}</Text>
                    </View>

                    {/* QR placeholder (visual decoration) */}
                    <View style={s.qrMock}>
                        <View style={s.qrGrid}>
                            {Array.from({ length: 25 }).map((_, i) => (
                                <View key={i} style={[s.qrCell, (i % 3 === 0 || i % 7 === 0) && s.qrCellFilled]} />
                            ))}
                        </View>
                        <Text style={s.qrLabel}>SCAN TO JOIN</Text>
                    </View>
                </LinearGradient>

                {/* PIN section */}
                {roomPin ? (
                    <View style={s.pinSection}>
                        <Text style={s.sectionTitle}>🔑 Secret PIN</Text>
                        <Text style={s.pinHint}>Share this PIN with people you want to invite</Text>
                        <View style={s.pinRow}>
                            {roomPin.split('').map((d, i) => <PinDigit key={i} d={d} />)}
                        </View>
                        <TouchableOpacity onPress={() => {
                            Clipboard.setString(roomPin);
                        }} style={s.copyPinBtn}>
                            <MaterialIcons name="content-copy" size={14} color="#818CF8" />
                            <Text style={{ color: '#818CF8', fontSize: 12, fontWeight: '700' }}>Copy PIN</Text>
                        </TouchableOpacity>
                    </View>
                ) : requiresApproval ? (
                    <View style={s.knockInfo}>
                        <MaterialIcons name="front-hand" size={18} color="#F59E0B" />
                        <Text style={{ color: 'rgba(245,158,11,0.8)', fontSize: 12, flex: 1, lineHeight: 18 }}>
                            This room uses <Text style={{ color: '#F59E0B', fontWeight: '700' }}>knock-to-join</Text>. Invitees will tap the link and you'll see their request in the Admin Panel.
                        </Text>
                    </View>
                ) : null}

                {/* Copy rows */}
                <View style={s.copySection}>
                    <Text style={s.sectionTitle}>📋 Invite Details</Text>
                    <CopyRow label="Deep Link" value={deepLink} icon="link" color="#818CF8" />
                    <CopyRow label="Full Invite Message" value={shareText} icon="chat" color="#34D399" />
                </View>

                {/* Native share CTA */}
                <TouchableOpacity onPress={handleNativeShare} style={s.shareBtn} activeOpacity={0.85}>
                    <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.shareBtnGrad}>
                        <MaterialIcons name="share" size={20} color="white" />
                        <Text style={s.shareBtnText}>Share Invite</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={s.disclaimer}>
                    Only share with people you trust. Room rules apply.
                </Text>
            </Animated.View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
    sheet: {
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: '#0A0615',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
        paddingBottom: 40,
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginTop: 10, marginBottom: 16 },

    // ── invite card ──
    inviteCard: { marginHorizontal: 16, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' },
    cardGloss: { position: 'absolute', top: 0, left: 20, right: 20, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
    orb1: { position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: '#7C3AED', opacity: 0.15 },
    orb2: { position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: '#EC4899', opacity: 0.1 },

    roomIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 16 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
    badgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
    brand: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: '800', textAlign: 'right', lineHeight: 13 },

    roomIdRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10 },
    roomIdLabel: { color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
    roomIdValue: { flex: 1, color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins-Bold', fontSize: 13, letterSpacing: 2 },

    // ── QR mock ──
    qrMock: { alignItems: 'center', marginTop: 10 },
    qrGrid: { flexDirection: 'row', flexWrap: 'wrap', width: 72, gap: 2 },
    qrCell: { width: 10, height: 10, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
    qrCellFilled: { backgroundColor: 'rgba(124,58,237,0.6)' },
    qrLabel: { color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: '800', letterSpacing: 2, marginTop: 6 },

    // ── PIN ──
    pinSection: { paddingHorizontal: 20, paddingTop: 16 },
    sectionTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
    pinHint: { color: 'rgba(255,255,255,0.25)', fontSize: 11, marginBottom: 10 },
    pinRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 10 },
    pinDigit: { width: 42, height: 52, borderRadius: 12, backgroundColor: 'rgba(124,58,237,0.12)', borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.4)', alignItems: 'center', justifyContent: 'center' },
    pinDigitText: { color: '#A78BFA', fontSize: 22, fontFamily: 'Poppins-Bold' },
    copyPinBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(129,140,248,0.1)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.25)' },

    knockInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(245,158,11,0.07)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },

    // ── Copy rows ──
    copySection: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
    copyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    copyIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    copyLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    copyValue: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '500', marginTop: 2 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    copyBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700' },

    // ── Share CTA ──
    shareBtn: { marginHorizontal: 20, marginTop: 14, borderRadius: 18, overflow: 'hidden' },
    shareBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
    shareBtnText: { color: 'white', fontFamily: 'Poppins-Bold', fontSize: 16 },

    disclaimer: { color: 'rgba(255,255,255,0.15)', fontSize: 10, textAlign: 'center', marginTop: 10 },
});
