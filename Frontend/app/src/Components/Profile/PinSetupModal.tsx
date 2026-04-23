import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import biometricService from '@/app/src/services/biometricService';

interface PinSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pinInputRef = useRef<TextInput>(null);
  const confirmPinRef = useRef<TextInput>(null);

  const handlePinChange = (text: string) => {
    if (/^\d*$/.test(text) && text.length <= 6) {
      setPin(text);
      setError('');
    }
  };

  const handleConfirmChange = (text: string) => {
    if (/^\d*$/.test(text) && text.length <= 6) {
      setConfirmPin(text);
      setError('');
    }
  };

  // Pindah ke step confirm
  const goToConfirm = () => {
    if (pin.length !== 6) {
      setError('PIN harus 6 digit angka');
      return;
    }
    setStep('confirm');
    setConfirmPin('');
    setError('');
    setTimeout(() => confirmPinRef.current?.focus(), 100);
  };

  const handleSubmit = async () => {
    if (pin !== confirmPin) {
      setError('PIN tidak cocok');
      setConfirmPin('');
      return;
    }
    
    setLoading(true);
    try {
      const success = await biometricService.savePin(pin);
      
      if (success) {
        onSuccess();
        handleReset();
        onClose();
      } else {
        setError('Gagal menyimpan PIN');
      }
    } catch (error) {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('create');
    setPin('');
    setConfirmPin('');
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {step === 'create' ? 'Buat PIN Keamanan' : 'Konfirmasi PIN'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#FF6B3520' }]}>
              <MaterialCommunityIcons name="shield-lock" size={40} color="#FF6B35" />
            </View>
          </View>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {step === 'create' 
              ? 'Buat PIN 6 digit untuk mengamankan aplikasi Anda'
              : 'Masukkan kembali PIN Anda untuk konfirmasi'
            }
          </Text>

          <View style={styles.pinContainer}>
            {[...Array(6)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  {
                    backgroundColor: (step === 'create' ? pin.length > i : confirmPin.length > i)
                      ? '#FF6B35'
                      : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          <TextInput
            ref={step === 'create' ? pinInputRef : confirmPinRef}
            style={styles.hiddenInput}
            value={step === 'create' ? pin : confirmPin}
            onChangeText={step === 'create' ? handlePinChange : handleConfirmChange}
            keyboardType="numeric"
            maxLength={6}
            secureTextEntry
            autoFocus
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Batal</Text>
            </TouchableOpacity>
            
            {step === 'create' ? (
              <TouchableOpacity
                style={[styles.button, styles.nextButton, { backgroundColor: '#FF6B35' }]}
                onPress={goToConfirm}
                disabled={pin.length !== 6}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>Lanjut</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.nextButton, { backgroundColor: '#FF6B35' }]}
                onPress={handleSubmit}
                disabled={loading || confirmPin.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Selesai</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
  },
  errorText: {
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  nextButton: {
    backgroundColor: '#FF6B35',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});