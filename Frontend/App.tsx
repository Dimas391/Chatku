import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ThemeProvider, useTheme } from '@/app/src/context/ThemeContext';
import { LanguageProvider, useLanguage } from '@/app/src/context/LanguageContext';
import { View, ActivityIndicator, Text, StyleSheet, Modal, TouchableOpacity, BackHandler } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import websocketService from '@/app/src/services/websocketService';

//Import screens 
import IndexScreen           from '@/app/src/pages/index';
import DashboardScreen       from '@/app/src/pages/Dashboard';
import ChatScreen            from '@/app/src/pages/ChatScreen';
import ChatDetailScreen      from '@/app/src/pages/ChatFeature';
import RegisterScreen        from '@/app/src/pages/register';
import VerificationScreen    from '@/app/src/pages/verif';
import ProfileSetupScreen    from '@/app/src/pages/ProfileScreen';
import NewChatScreen         from '@/app/src/pages/NewChatScreen';
import SettingsScreen        from '@/app/src/pages/SettingsScreen';
import ProfileScreen         from '@/app/src/pages/SettigsProfile';
import PrivacySecurityScreen from '@/app/src/pages/PrivacySecurityScreen';
import AboutScreen           from '@/app/src/pages/AboutScreen';
import HelpSupportScreen     from '@/app/src/pages/HelpSupportScreen';
import PrivacyPolicyScreen   from '@/app/src/pages/PrivacyPolicyScreen';
import VoiceCallScreen       from '@/app/src/pages/VoiceCallScreen';
import VideoCallScreen       from '@/app/src/pages/VideoCallScreen';
import CallsScreen           from '@/app/src/pages/CallsScreen';
import BottomTabNavigator    from '@/app/src/Components/navigation/BottomTabNavigator';
import SecurityScreen        from '@/app/src/pages/Securityscreen';
import ContactsScreen        from '@/app/src/pages/ContactsScreen';
import notificationService   from '@/app/src/services/notificationService';
import biometricService      from '@/app/src/services/biometricService';
import storageService        from '@/app/src/services/storageService';
import Profile1              from '@/app/src/pages/Profile';

import { PinVerifyModal } from '@/app/src/Components/Profile/PinVerifyModal';

export type RootStackParamList = {
  MainTabs: undefined;
  Index: undefined;
  Dashboard: undefined;
  Chat: undefined;
  ChatDetailScreen: {
    chatId: string;
    chatName: string;
    chatAvatar: string;
    online?: boolean;
  };
  Calls: undefined;
  SecurityScreen: undefined;
  RegisterScreen: undefined;
  Verification: {
    type: 'phone' | 'email';
    value: string;
    countryCode?: string;
  };
  ProfileSetup: undefined;
  NewChat: undefined;
  Settigs: undefined;
  Profile: undefined;
  Profile1: undefined;
  PrivacySecurity: undefined;
  About: undefined;
  Contacts: undefined;
  HelpSupport: undefined;
  PrivacyPolicy: undefined;
  Login: undefined;
  VoiceCall: {
    callId: string;
    chatId: string;
    callerName: string;
    callerAvatar: string;
    isIncoming: boolean;
    calleeId: string;
    callerId: string;
  };
  VideoCall: {
    callId: string;
    chatId: string;
    callerName: string;
    callerAvatar: string;
    isIncoming: boolean;
    calleeId: string;
    callerId: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function CallListener() {
  const navigation = useNavigation<any>();
  const activeCallId = useRef<string | null>(null);

  useEffect(() => {
    const handleIncomingCall = (data: any) => {
      if (activeCallId.current === data?.call_id) return;
      activeCallId.current = data?.call_id ?? null;
      if (!data?.call_id) return;

      const params = {
        callId:       data.call_id,
        chatId:       data.chat_id ?? '',
        callerId:     data.caller_id ?? '',
        calleeId:     data.callee_id ?? '',
        callerName:   data.caller_name ?? 'Pengguna',
        callerAvatar: data.caller_avatar
          ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(data.caller_name ?? '')}&background=FF6B35&color=fff`,
        isIncoming: true,
      };

      navigation.navigate(data.type === 'video' ? 'VideoCall' : 'VoiceCall', params);
    };

    const handleCallEnded = (data: any) => {
      if (data?.call_id === activeCallId.current) activeCallId.current = null;
    };

    notificationService.initialize();
    websocketService.on('incoming_call', handleIncomingCall);
    websocketService.on('call_ended', handleCallEnded);
    websocketService.on('call_declined', handleCallEnded);
    websocketService.connect();

    return () => {
      websocketService.off('incoming_call', handleIncomingCall);
      websocketService.off('call_ended', handleCallEnded);
      websocketService.off('call_declined', handleCallEnded);
    };
  }, [navigation]);

  return null;
}


function BiometricAuthModal({
  visible,
  onSuccess,
  onCancel,
  onPinFallback,
}: {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  onPinFallback: () => void;
}) {
  const [authenticating, setAuthenticating] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (visible && !authenticating) handleAuthenticate();
  }, [visible]);

  const handleAuthenticate = async () => {
    setAuthenticating(true);
    try {
      const success = await biometricService.verifyBiometric();
      if (success) onSuccess();
    } catch (error) {
    } finally {
      setAuthenticating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.authContainer}>
        <View style={[styles.authCard, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="fingerprint" size={60} color="#FF6B35" style={{ marginBottom: 20 }} />
          <Text style={[styles.authTitle, { color: colors.text }]}>Verifikasi Biometrik</Text>
          <Text style={[styles.authMessage, { color: colors.textSecondary }]}>
            Gunakan sidik jari atau Face ID untuk membuka aplikasi
          </Text>
          {authenticating ? (
            <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 20 }} />
          ) : (
            <>
              <TouchableOpacity style={styles.authButton} onPress={handleAuthenticate}>
                <Text style={styles.authButtonText}>Coba Lagi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.authFallbackButton} onPress={onPinFallback}>
                <Text style={[{ color: colors.textSecondary, fontSize: 14 }]}>Gunakan PIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.authFallbackButton} onPress={onCancel}>
                <Text style={[{ color: '#888', fontSize: 14 }]}>Batal</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function AppNavigator() {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();

  const navigationTheme = {
    dark: isDarkMode,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' as const },
      medium:  { fontFamily: 'System', fontWeight: '500' as const },
      bold:    { fontFamily: 'System', fontWeight: '700' as const },
      heavy:   { fontFamily: 'System', fontWeight: '900' as const },
    },
  };

  // ─── Cek metode keamanan saat app dibuka 
  useEffect(() => {
    const checkSecurity = async () => {
      try {
        const method = await biometricService.getActiveSecurityMethod();
        if (method === 'biometric') {
          setShowBiometricModal(true);
        } else if (method === 'pin') {
          setShowPinModal(true);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(true);
      } finally {
        setIsAuthenticating(false);
      }
    };
    checkSecurity();
  }, []);

  const handleCancel = async () => {
    try {
      await storageService.clearTokens();
    } catch {
      // lanjutkan meski gagal
    }
    // Tutup aplikasi (Android). Di iOS tidak ada "force quit" API.
    BackHandler.exitApp();
  };

  const handleBiometricSuccess = () => {
    setShowBiometricModal(false);
    setIsAuthenticated(true);
  };

  const handleBiometricFallbackToPin = () => {
    setShowBiometricModal(false);
    setShowPinModal(true);
  };

  // PinVerifyModal sudah handle clearTokens + navigation.reset di dalamnya
  // untuk cancel, tapi untuk success cukup set authenticated
  const handlePinSuccess = () => {
    setShowPinModal(false);
    setIsAuthenticated(true);
  };

  // ─── Loading saat cek security
  if (isAuthenticating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // ─── Belum terautentikasi — tampilkan modal
  if (!isAuthenticated) {
    return (
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* Dummy screen sebagai host — tidak pernah terlihat */}
          <Stack.Screen name="Index" component={IndexScreen} />
          <Stack.Screen name="Login" component={IndexScreen} />
        </Stack.Navigator>

        {/* Biometric modal */}
        <BiometricAuthModal
          visible={showBiometricModal}
          onSuccess={handleBiometricSuccess}
          onCancel={handleCancel}
          onPinFallback={handleBiometricFallbackToPin}
        />

        <PinVerifyModal
          visible={showPinModal}
          onSuccess={handlePinSuccess}
          onCancel={handleCancel}
        />
      </NavigationContainer>
    );
  }

  // ─── Sudah terautentikasi — tampilkan app normal
  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        <CallListener />
        <Stack.Navigator initialRouteName="MainTabs">
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="Index" component={IndexScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={IndexScreen} options={{ headerShown: false }} />

          <Stack.Screen name="Dashboard" component={DashboardScreen}
            options={{ headerShown: true, title: t('dashboard') || 'Dashboard',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="RegisterScreen" component={RegisterScreen}
            options={{ headerShown: true, title: t('register') || 'Daftar Akun',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="Verification" component={VerificationScreen}
            options={{ headerShown: true, title: t('verification') || 'Verifikasi',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="Contacts" component={ContactsScreen}
            options={{ headerShown: true, title: t('contacts') || 'Kontak',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="Profile1" component={Profile1}
            options={{ headerShown: true, title: t('profile') || 'Profile',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen}
            options={{ headerShown: true, title: t('profile_setup') || 'Setup Profil',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="ChatDetailScreen" component={ChatDetailScreen}
            options={{ headerShown: false }} />

          <Stack.Screen name="NewChat" component={NewChatScreen}
            options={{ headerShown: true, title: t('new_chat') || 'Chat Baru',
              presentation: 'modal',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="Settigs" component={SettingsScreen}
            options={{ headerShown: true, title: t('settings') || 'Pengaturan',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="Calls" component={CallsScreen}
            options={{ headerShown: true, title: t('calls') || 'Panggilan',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="SecurityScreen" component={SecurityScreen}
            options={{ headerShown: true, title: t('security') || 'Keamanan',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="Profile" component={ProfileScreen}
            options={{ headerShown: false }} />

          <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen}
            options={{ headerShown: true, title: t('privacy_security') || 'Privasi & Keamanan',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="About" component={AboutScreen}
            options={{ headerShown: true, title: t('about') || 'Tentang Aplikasi',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="HelpSupport" component={HelpSupportScreen}
            options={{ headerShown: true, title: t('help_support') || 'Pusat Bantuan',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen}
            options={{ headerShown: true, title: t('privacy_policy') || 'Kebijakan Privasi',
              headerStyle: { backgroundColor: colors.background },
              headerTitleStyle: { color: colors.text, fontWeight: '600' },
              headerTintColor: colors.primary }} />

          <Stack.Screen name="VoiceCall" component={VoiceCallScreen}
            options={{ headerShown: false, gestureEnabled: false,
              animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />

          <Stack.Screen name="VideoCall" component={VideoCallScreen}
            options={{ headerShown: false, gestureEnabled: false,
              animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 20,
  },
  authCard: {
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '85%',
  },
  authTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  authMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  authButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authFallbackButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 6,
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AppNavigator />
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}