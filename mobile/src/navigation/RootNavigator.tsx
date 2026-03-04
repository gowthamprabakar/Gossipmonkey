import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainerRef } from '@react-navigation/native';
import { useAppStore } from '../store/useAppStore';
import { CreatePersonaScreen } from '../screens/Authentication/CreatePersonaScreen';
import AuthGatewayScreen from '../screens/Authentication/AuthGatewayScreen';
import LoginScreen from '../screens/Authentication/LoginScreen';
import SessionManagementScreen from '../screens/Authentication/SessionManagementScreen';
import { RoomBrowserScreen } from '../screens/Home/RoomBrowserScreen';
import { SearchDiscoveryScreen } from '../screens/Home/SearchDiscoveryScreen';
import { JoinPrivateRoomScreen } from '../screens/Home/JoinPrivateRoomScreen';
import { CreateRoomScreen } from '../screens/Home/CreateRoomScreen';
import { ChatScreen } from '../screens/Chat/ChatScreen';
import { RoomSettingsScreen } from '../screens/RoomSettings/RoomSettingsScreen';
import { ProfileScreen } from '../screens/Home/ProfileScreen';
import { PrivacyAccountScreen } from '../screens/Home/PrivacyAccountScreen';
import { NotificationScreen } from '../screens/Home/NotificationScreen';
import SplashScreen from '../screens/Home/SplashScreen';
import OnboardingScreen from '../screens/Home/OnboardingScreen';
import { NotifBannerManager } from '../components/NotifBanner';
import {
    registerForPushNotifications,
    setupNotificationListeners,
} from '../services/notificationManager';

export type RootStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    AuthGateway: undefined;  // animated choice screen (new vs returning)
    Auth: undefined;          // CreatePersona (new account)
    Login: undefined;         // LoginScreen (returning user)
    SessionManagement: undefined; // active sessions list
    Home: undefined;
    SearchDiscovery: undefined;
    JoinPrivateRoom: { roomId: string; roomName: string; requiresPin?: boolean; requiresApproval?: boolean };
    CreateRoom: undefined;
    Chat: { roomId: string; roomName: string; roomType?: string; creatorId?: string; roomPin?: string; requiresApproval?: boolean };
    RoomSettings: { roomId?: string; isAdmin?: boolean };
    Profile: undefined;
    PrivacyAccount: undefined;
    Notifications: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ── Auth stack (pre-login) ──────────────────────────────────────
function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="AuthGateway" component={AuthGatewayScreen} />
            <Stack.Screen name="Auth" component={CreatePersonaScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
    );
}

// ── App stack (post-login) ──────────────────────────────────────
function AppStack() {
    return (
        <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen name="Home" component={RoomBrowserScreen} />
            <Stack.Screen name="SearchDiscovery" component={SearchDiscoveryScreen} />
            <Stack.Screen name="JoinPrivateRoom" component={JoinPrivateRoomScreen} />
            <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="RoomSettings" component={RoomSettingsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="PrivacyAccount" component={PrivacyAccountScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="SessionManagement" component={SessionManagementScreen} />
        </Stack.Navigator>
    );
}

// ── Root navigator ── switches based on auth state ──────────────
export default function RootNavigator() {
    const { token, loadSession } = useAppStore();
    const [isReady, setIsReady] = React.useState(false);

    // Navigation ref — needed by NotifBannerManager + notification listeners
    const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

    useEffect(() => {
        loadSession().finally(() => setIsReady(true));
    }, [loadSession]);

    // Register push token + wire notification tap listeners after session loads
    useEffect(() => {
        if (!isReady || !token) return;

        registerForPushNotifications().catch(console.warn);
        const cleanup = setupNotificationListeners(navigationRef);
        return cleanup;
    }, [isReady, token]);

    if (!isReady) {
        return (
            <View style={{ flex: 1, backgroundColor: '#06020E', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {token ? <AppStack /> : <AuthStack />}
            {/* Global in-app notification banner — rendered above all screens */}
            {token && <NotifBannerManager navigationRef={navigationRef} />}
        </View>
    );
}
