import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';
import verificationService from '@/app/src/services/verificationService';
import storageService from '@/app/src/services/storageService';

type VerificationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Verification'>;
type VerificationScreenRouteProp = RouteProp<RootStackParamList, 'Verification'>;

interface UseVerificationProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  autoVerify?: boolean; // Auto verify when all digits are filled
}

export const useVerification = ({ 
  onSuccess, 
  onError,
  autoVerify = true
}: UseVerificationProps = {}) => {
  
  const navigation = useNavigation<VerificationScreenNavigationProp>();
  const route = useRoute<VerificationScreenRouteProp>();
  
  // Get params from route
  const { type = 'phone', value = '', countryCode = '+62' } = route.params || {};
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && !canResend) {
      setCanResend(true);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer, canResend]);

  // Auto focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  const handleOtpChange = useCallback((text: string, index: number) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    
    setOtp((prev) => {
      const newOtp = [...prev];
      newOtp[index] = numericText;
      
      // Auto move ke next input
      if (numericText && index < 5) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 50);
      }

      // Auto verify jika semua digit terisi dan autoVerify true
      if (autoVerify) {
        const fullOtp = [...newOtp].join('');
        if (fullOtp.length === 6 && !isVerifying) {
          handleVerifyWithCode(fullOtp);
        }
      }

      return newOtp;
    });
  }, [isVerifying, autoVerify]);

  const handleKeyPress = useCallback((
    e: any, 
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleVerifyWithCode = useCallback(async (otpCode: string) => {
  if (otpCode.length < 6) return;

  setIsVerifying(true);

  try {

    const response = await verificationService.verifyOTP({
      type,
      value,
      otp_code: otpCode,
      country_code: type === 'phone' ? countryCode : undefined,
    });

    if (response.success && response.data) {
      // Simpan token ke storage
      await storageService.saveTokens(
        response.data.access_token, 
        response.data.refresh_token
      );
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigation.replace('ProfileSetup');
      }
      resetOTP();
      
    } else {
      throw new Error(response.error || 'Kode verifikasi salah');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Verifikasi gagal';
    
    Alert.alert('Error', errorMessage);
    if (onError) onError(errorMessage);
    
    // Reset OTP
    setOtp(['', '', '', '', '', '']);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  } finally {
    setIsVerifying(false);
  }
  }, [type, value, countryCode, onSuccess, onError, navigation]);

  const handleVerify = useCallback(async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length < 6) {
      Alert.alert('Error', 'Masukkan kode verifikasi 6 digit');
      return;
    }

    await handleVerifyWithCode(otpCode);
  }, [otp, handleVerifyWithCode]);

  const handleResend = useCallback(async () => {
    setIsResending(true);

    try {

      const response = await verificationService.resendOTP({
        type,
        value,
        country_code: type === 'phone' ? countryCode : undefined,
      });

      if (response.success) {
        setCanResend(false);
        setTimer(60);
        setOtp(['', '', '', '', '', '']);
        
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
        
        Alert.alert(
          'Sukses',
          response.message || `Kode verifikasi baru telah dikirim ke ${type === 'phone' ? 'nomor' : 'email'} Anda`
        );
      } else {
        throw new Error(response.error || 'Gagal mengirim ulang kode');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengirim ulang kode';
      
      Alert.alert('Error', errorMessage);
      setCanResend(true); // Reset timer jika gagal
    } finally {
      setIsResending(false);
    }
  }, [type, value, countryCode]);

  const resetOTP = useCallback(() => {
    setOtp(['', '', '', '', '', '']);
  }, []);

  const handleEdit = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    // Data from route
    type,
    value,
    countryCode,
    
    // State
    otp,
    timer,
    canResend,
    isVerifying,
    isResending,
    inputRefs,
    
    // Functions
    handleOtpChange,
    handleKeyPress,
    handleVerify,
    handleResend,
    resetOTP,
    handleEdit,
  };
};