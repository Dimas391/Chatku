import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import biometricService from '@/app/src/services/biometricService';
import storageService from '@/app/src/services/storageService';

interface PinVerifyModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

// Angka pad — null = slot kosong (kiri bawah)
const PAD_KEYS = ['1','2','3','4','5','6','7','8','9', null,'0','del'] as const;
type PadKey = typeof PAD_KEYS[number];

export const PinVerifyModal: React.FC<PinVerifyModalProps> = ({
  visible,
  onSuccess,
  onCancel,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const shakeAnim = new Animated.Value(0);

  // ─── Animasi shake saat PIN salah ────────────────────────────
  const shake = () => {
    Vibration.vibrate(300);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ─── Verifikasi PIN ───────────────────────────────────────────
  const handleVerify = useCallback(async (pinValue: string) => {
    if (verifying) return;
    setVerifying(true);
    try {
      const isValid = await biometricService.verifyPin(pinValue);
      if (isValid) {
        setPin('');
        setError('');
        onSuccess();
      } else {
        shake();
        setError('PIN salah. Coba lagi.');
        setPin('');
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
      setPin('');
    } finally {
      setVerifying(false);
    }
  }, [verifying, onSuccess]);

  // ─── Tekan tombol pad ─────────────────────────────────────────
  const handleKeyPress = (key: PadKey) => {
    if (key === null || verifying) return;

    if (key === 'del') {
      setError('');
      setPin(prev => prev.slice(0, -1));
      return;
    }

    if (pin.length >= 6) return;
    const newPin = pin + key;
    setPin(newPin);
    setError('');

    if (newPin.length === 6) {
      handleVerify(newPin);
    }
  };

  const handleCancel = async () => {
    setPin('');
    setError('');
    try {
      await storageService.clearTokens();
    } catch {
      // Lanjutkan meski clearTokens gagal
    }
    onCancel();
    // Reset stack navigasi ke Login agar user tidak bisa back ke app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      // Nonaktifkan back button Android — user harus tekan Batal
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>

          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: '#FF6B3520' }]}>
            <MaterialCommunityIcons name="shield-lock" size={44} color="#FF6B35" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Verifikasi PIN</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Masukkan PIN 6 digit Anda
          </Text>

          {/* PIN dots dengan animasi shake */}
          <Animated.View
            style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: pin.length > i
                      ? '#FF6B35'
                      : error
                      ? '#E24B4A'
                      : colors.border,
                    // Dot yang sedang diisi sedikit lebih besar
                    transform: [{ scale: pin.length === i ? 1.2 : 1 }],
                  },
                ]}
              />
            ))}
          </Animated.View>

          {/* Pesan error */}
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.errorPlaceholder} />
          )}

          <View style={styles.pad}>
            {PAD_KEYS.map((key, idx) => {
              if (key === null) {
                return <View key={`empty-${idx}`} style={styles.padKey} />;
              }
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key="del"
                    style={styles.padKey}
                    onPress={() => handleKeyPress('del')}
                    activeOpacity={0.6}
                  >
                    <MaterialCommunityIcons
                      name="backspace-outline"
                      size={26}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.padKey, styles.padKeyBg, { backgroundColor: colors.background }]}
                  onPress={() => handleKeyPress(key)}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.padKeyText, { color: colors.text }]}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tombol batal */}
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Batal &amp; Keluar
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },

  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#E24B4A',
    fontSize: 13,
    marginBottom: 16,
    minHeight: 18,
    textAlign: 'center',
  },
  errorPlaceholder: {
    minHeight: 18,
    marginBottom: 16,
  },

  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  padKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  padKeyBg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  padKeyText: {
    fontSize: 26,
    fontWeight: '400',
  },

  cancelBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 0.5,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '500',
  },
});