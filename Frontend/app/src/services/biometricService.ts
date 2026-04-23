import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_KEY = '@ChatKu:biometric_enabled';
const PIN_KEY = '@ChatKu:user_pin';
const PIN_ATTEMPTS_KEY = '@ChatKu:pin_attempts';

class BiometricService {
  
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  }

  async getBiometricType(): Promise<string> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Sidik Jari';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      }
      return 'Biometrik';
    } catch {
      return 'Biometrik';
    }
  }

  // ==================== PIN ====================
  
  // Simpan PIN - Gunakan AsyncStorage (lebih reliable)
  async savePin(pin: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem(PIN_KEY, pin);
      // Verifikasi setelah save
      const saved = await AsyncStorage.getItem(PIN_KEY);
      return saved === pin;
    } catch (error) {
      return false;
    }
  }

  // Verifikasi PIN
  async verifyPin(inputPin: string): Promise<boolean> {
    try {
      const savedPin = await AsyncStorage.getItem(PIN_KEY);
      
      if (!savedPin) {
        return false;
      }
      
      const isValid = savedPin === inputPin;
      return isValid;
    } catch (error) {
      return false;
    }
  }

  // Cek apakah PIN sudah diset
  async isPinSet(): Promise<boolean> {
    try {
      const pin = await AsyncStorage.getItem(PIN_KEY);
      return pin !== null;
    } catch {
      return false;
    }
  }

  // Hapus PIN
  async deletePin(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PIN_KEY);
      await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
    } catch (error) {
    }
  }

  // METODE KEAMANAN 
  
  async getActiveSecurityMethod(): Promise<'biometric' | 'pin' | 'none'> {
    const isBiometricEnabled = await AsyncStorage.getItem(BIOMETRIC_KEY) === 'true';
    const isBiometricAvailable = await this.isBiometricAvailable();
    
    if (isBiometricEnabled && isBiometricAvailable) {
      return 'biometric';
    }
    
    const hasPin = await this.isPinSet();
    if (hasPin) {
      return 'pin';
    }
    
    return 'none';
  }

  // BIOMETRIK 
  
  async enableBiometric(): Promise<boolean> {
    try {
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) return false;
      
      const verified = await this.verifyBiometric();
      if (!verified) return false;
      
      await AsyncStorage.setItem(BIOMETRIC_KEY, 'true');
      return true;
    } catch {
      return false;
    }
  }

  async disableBiometric(): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIC_KEY, 'false');
  }

  async verifyBiometric(): Promise<boolean> {
    try {
      const biometricType = await this.getBiometricType();
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Verifikasi ${biometricType} untuk membuka aplikasi`,
        fallbackLabel: 'Gunakan PIN',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch (error) {
      return false;
    }
  }

  //  VERIFIKASI UNTUK BUKA APLIKASI
  
  async verifyForAppOpen(): Promise<boolean> {
    const method = await this.getActiveSecurityMethod();
    
    if (method === 'biometric') {
      return await this.verifyBiometric();
    }
    if (method === 'pin') {
      return true; // PIN akan diverifikasi di modal terpisah
    }
    return true;
  }

  // Fungsi khusus untuk verifikasi PIN dari modal
  async verifyPinOnly(pin: string): Promise<boolean> {
    return await this.verifyPin(pin);
  }
}

export default new BiometricService();