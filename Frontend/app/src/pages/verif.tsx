import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import komponen
import BackgroundDecor from '@/app/src/Components/BackgroundDecor';
import VerificationHeader from '@/app/src/Components/VerificationHeader';
import VerificationIllustration from '@/app/src/Components/VerificationIllustration';
import VerificationInfo from '@/app/src/Components/VerificationInfo';
import OTPInput from '@/app/src/Components/verif/OTPInput';
import ResendTimer from '@/app/src/Components/verif/ResendTimer';
import RegisterButton from '@/app/src/Components/Button';
import HelpLink from '@/app/src/Components/verif/HelpLink';

// Import custom hook
import { useVerification } from '@/app/src/hooks/useVerification';

const VerificationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    type,
    value,
    countryCode,
    otp,
    timer,
    canResend,
    isVerifying,
    isResending,
    inputRefs,
    handleOtpChange,
    handleKeyPress,
    handleVerify,
    handleResend,
    handleEdit,
  } = useVerification();

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
            <VerificationHeader onBackPress={() => navigation.goBack()} />

            <VerificationIllustration />

            <VerificationInfo 
              type={type}
              value={value}
              countryCode={countryCode}
              onEdit={handleEdit}
            />

            <OTPInput 
              otp={otp}
              onChange={handleOtpChange}
              onKeyPress={handleKeyPress}
              editable={!isVerifying && !isResending}
              inputRefs={inputRefs}
            />

            <ResendTimer 
              timer={timer}
              canResend={canResend}
              onResend={handleResend}
            />

            <RegisterButton 
              onPress={() => handleVerify()}
              title={isVerifying ? "Memverifikasi..." : "Verifikasi"}
              loading={isVerifying}
            />

            <HelpLink />

            {/* Security info section */}
            <View style={styles.securitySection}>
              <View style={styles.securityItem}>
                <View style={styles.securityIconWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={18} color="#FF6B35" />
                </View>
                <View style={styles.securityTextWrapper}>
                  <Text style={styles.securityTitle}>Kode Rahasia</Text>
                  <Text style={styles.securityDesc}>Jangan bagikan kode OTP kepada siapapun</Text>
                </View>
              </View>
              <View style={styles.securityItem}>
                <View style={styles.securityIconWrapper}>
                  <MaterialCommunityIcons name="timer-outline" size={18} color="#FF6B35" />
                </View>
                <View style={styles.securityTextWrapper}>
                  <Text style={styles.securityTitle}>Berlaku Terbatas</Text>
                  <Text style={styles.securityDesc}>Kode akan kedaluwarsa dalam 5 menit</Text>
                </View>
              </View>
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
  securitySection: {
    marginTop: 24,
    gap: 14,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  securityIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF3ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  securityTextWrapper: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  securityDesc: {
    fontSize: 12,
    color: '#999999',
    lineHeight: 16,
  },
});

export default VerificationScreen;