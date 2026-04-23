import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

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

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <VerificationHeader onBackPress={() => {}} />
            
            <VerificationIllustration type={type} />
            
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
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
});

export default VerificationScreen;