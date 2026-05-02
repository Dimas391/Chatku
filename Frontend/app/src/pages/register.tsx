import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import komponen
import BackgroundDecor from '@/app/src/Components/BackgroundDecor';
import RegisterHeader from '@/app/src/Components/RegisterHeader';
import RegisterIllustration from '@/app/src/Components/Illustration';
import EmailInputField from '@/app/src/Components/EmailInputField';
import InfoBox from '@/app/src/Components/InfoBox';
import TermsCheckbox from '@/app/src/Components/TermsCheckbox';
import RegisterButton from '@/app/src/Components/Button';

// Import service
import authService from '@/app/src/services/authService';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RegisterScreen'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  
  // State untuk form
  const [email, setEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fungsi untuk handle registrasi
  const handleRegister = async () => {
    // Validasi email
    if (!email) {
      Alert.alert('Error', 'Email harus diisi');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Email tidak valid');
      return;
    }

    if (!agreeTerms) {
      Alert.alert('Error', 'Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.sendOTP({
        type: 'email',
        value: email,
      });

      if (response.success) {
        navigation.navigate('Verification', {
          type: 'email',
          value: email,
        });
      } else {
        Alert.alert('Error', response.error || 'Gagal mengirim kode verifikasi');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <BackgroundDecor />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 30 },
          ]}
        >
          <View style={styles.content}>
            <RegisterHeader onBackPress={() => navigation.goBack()} />
            <RegisterIllustration />

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Daftar dengan Email</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.formContainer}>
              <EmailInputField 
                value={email}
                onChangeText={setEmail}
              />
              <InfoBox />
              <TermsCheckbox checked={agreeTerms} onToggle={() => setAgreeTerms(!agreeTerms)} />
              <RegisterButton onPress={handleRegister} loading={loading} />
            </View>

            {/* Security badge */}
            <View style={styles.securityBadge}>
              <MaterialCommunityIcons name="shield-check-outline" size={16} color="#FF6B35" />
              <Text style={styles.securityText}>
                Data kamu dilindungi enkripsi end-to-end
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  dividerText: {
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 12,
  },
  securityText: {
    fontSize: 12,
    color: '#AAAAAA',
  },
});

export default RegisterScreen;