import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';

// Import komponen
import BackgroundDecor from '@/app/src/Components/BackgroundDecor';
import RegisterHeader from '@/app/src/Components/RegisterHeader';
import RegisterIllustration from '@/app/src/Components/Illustration';
import TabSelector from '@/app/src/Components/TabSelector';
import PhoneInputField from '@/app/src/Components/PhoneInputField';
import EmailInputField from '@/app/src/Components/EmailInputField';
import InfoBox from '@/app/src/Components/InfoBox';
import TermsCheckbox from '@/app/src/Components/TermsCheckbox';
import RegisterButton from '@/app/src/Components/Button';

// Import service
import authService from '@/app/src/services/authService';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RegisterScreen'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  
  // State untuk form
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+62');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fungsi untuk handle registrasi
  const handleRegister = async () => {
    // Validasi
    if (activeTab === 'email') {
      if (!email) {
        Alert.alert('Error', 'Email harus diisi');
        return;
      }
      if (!email.includes('@') || !email.includes('.')) {
        Alert.alert('Error', 'Email tidak valid');
        return;
      }
    } else {
      if (!phone) {
        Alert.alert('Error', 'Nomor telepon harus diisi');
        return;
      }
      if (phone.length < 10) {
        Alert.alert('Error', 'Nomor telepon tidak valid');
        return;
      }
    }

    if (!agreeTerms) {
      Alert.alert('Error', 'Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    setLoading(true);

    try {
      
      const response = await authService.sendOTP({
        type: activeTab,
        value: activeTab === 'email' ? email : phone,
        country_code: activeTab === 'phone' ? countryCode : undefined,
      });

      if (response.success) {
        // Siapkan params untuk navigasi
        const params = {
          type: activeTab,
          value: activeTab === 'email' ? email : phone,
          countryCode: activeTab === 'phone' ? countryCode : undefined,
        };
        
        // LANGSUNG NAVIGASI TANPA ALERT
        navigation.navigate('Verification', params);
        
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
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.content}>
              <RegisterHeader onBackPress={() => navigation.goBack()} />
              <RegisterIllustration />
    
              <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />
              
              <View style={styles.formContainer}>
                {activeTab === 'phone' ? (
                  <PhoneInputField 
                    value={phone}
                    onChangeText={setPhone}
                    countryCode={countryCode}
                    onCountryCodeChange={setCountryCode}
                  />
                ) : (
                  <EmailInputField 
                    value={email}
                    onChangeText={setEmail}
                  />
                )}

                <InfoBox />
                <TermsCheckbox checked={agreeTerms} onToggle={() => setAgreeTerms(!agreeTerms)} />
                <RegisterButton onPress={handleRegister} loading={loading} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
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
    paddingTop: 20,
    paddingBottom: 30,
  },
  formContainer: {
    width: '100%',
  },
});

export default RegisterScreen;