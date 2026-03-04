/**
 * SessionManagementScreen.tsx
 *
 * Shows all active sessions for the current persona.
 * User can terminate individual sessions or all others at once.
 */

import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

interface Session {
    id: string;
    created_at: string;
    expires_at: string;
}

function SessionRow({
    session, onTerminate, isCurrent,
}: { session: Session; onTerminate: (id: string) => void; isCurrent: boolean }) {
    const created = new Date(session.created_at);
    const expires = new Date(session.expires_at);
    const daysLeft = Math.ceil((expires.getTime() - Date.now()) / (86400 * 1000));

    return (
        <View style={[styles.row, isCurrent && styles.rowCurrent]}>
            <View style={[styles.rowIcon, isCurrent && { backgroundColor: 'rgba(129,140,248,0.15)' }]}>
                <MaterialIcons name={isCurrent ? 'phone-iphone' : 'devices'} size={20} color={isCurrent ? '#818CF8' : 'rgba(255,255,255,0.4)'} />
            </View>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.rowTitle}>{isCurrent ? 'This device' : 'Other device'}</Text>
                    {isCurrent && (
                        <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>CURRENT</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.rowSub}>
                    Signed in {created.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} · {daysLeft}d remaining
                </Text>
            </View>
            {!isCurrent && (
                <TouchableOpacity
                    onPress={() => onTerminate(session.id)}
                    style={styles.terminateBtn}
                >
                    <MaterialIcons name="logout" size={16} color="#EF4444" />
                </TouchableOpacity>
            )}
        </View>
    );
}

export default function SessionManagementScreen({ navigation }: any) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [terminating, setTerminating] = useState<string | null>(null);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/identity/sessions');
            setSessions(res.data.data.sessions ?? []);
        } catch (err: any) {
            console.error('Failed to load sessions', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSessions(); }, []);

    const terminate = async (id: string) => {
        Alert.alert(
            'Terminate Session',
            'This will sign out the other device. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out', style: 'destructive',
                    onPress: async () => {
                        setTerminating(id);
                        try {
                            await api.delete(`/identity/sessions/${id}`);
                            setSessions(s => s.filter(x => x.id !== id));
                        } catch { /* */ } finally {
                            setTerminating(null);
                        }
                    },
                },
            ]
        );
    };

    const terminateAll = () => {
        Alert.alert(
            'Sign Out All Other Devices',
            'All sessions except this one will be terminated.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out All', style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await api.delete('/identity/sessions');
                            loadSessions();
                        } catch { setLoading(false); }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.root}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <MaterialIcons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Active Sessions</Text>
                        <Text style={styles.subtitle}>Devices where you're logged in</Text>
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator color="#818CF8" style={{ marginTop: 60 }} />
                ) : (
                    <FlatList
                        data={sessions}
                        keyExtractor={s => s.id}
                        contentContainerStyle={{ padding: 16, gap: 10 }}
                        ListHeaderComponent={sessions.length > 1 ? (
                            <TouchableOpacity onPress={terminateAll} style={styles.killAllBtn}>
                                <LinearGradient
                                    colors={['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)']}
                                    style={styles.killAllGrad}
                                >
                                    <MaterialIcons name="logout" size={18} color="#EF4444" />
                                    <Text style={styles.killAllText}>Sign out all other devices</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : null}
                        renderItem={({ item, index }) => (
                            <SessionRow
                                session={item}
                                isCurrent={index === 0}
                                onTerminate={terminate}
                            />
                        )}
                        ListEmptyComponent={
                            <View style={styles.empty}>
                                <Text style={{ fontSize: 32 }}>🔐</Text>
                                <Text style={styles.emptyText}>No other active sessions</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#06020E' },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    title: { color: 'white', fontSize: 18, fontWeight: '800' },
    subtitle: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 },
    killAllBtn: { marginBottom: 8, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
    killAllGrad: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
    killAllText: { color: '#EF4444', fontSize: 14, fontWeight: '700', flex: 1 },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14,
    },
    rowCurrent: { borderColor: 'rgba(129,140,248,0.25)', backgroundColor: 'rgba(129,140,248,0.06)' },
    rowIcon: {
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center', justifyContent: 'center',
    },
    rowTitle: { color: 'white', fontSize: 14, fontWeight: '700' },
    rowSub: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },
    currentBadge: {
        backgroundColor: 'rgba(129,140,248,0.2)', borderRadius: 4,
        paddingHorizontal: 6, paddingVertical: 2,
    },
    currentBadgeText: { color: '#818CF8', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
    terminateBtn: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },
});
