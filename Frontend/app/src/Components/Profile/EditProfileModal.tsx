import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/Profile';

interface EditProfileModalProps {
  visible: boolean;
  field: 'name' | 'username' | 'bio' | 'phone' | null; 
  value: string;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  field,
  value,
  onChangeText,
  onSave,
  onClose,
}) => {
  const { colors, isDarkMode } = useTheme();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateY = new Animated.Value(0);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        Animated.timing(translateY, {
          toValue: -e.endCoordinates.height / 2,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const getTitle = () => {
    if (field === 'name') return 'Edit Nama';
    if (field === 'username') return 'Edit Username';
    if (field === 'bio') return 'Edit Bio';
    if (field === 'phone') return 'Edit Telepon';
    return 'Edit';
  };

  const getPlaceholder = () => {
    if (field === 'name') return 'Masukkan nama';
    if (field === 'username') return 'Masukkan username (tanpa spasi)';
    if (field === 'bio') return 'Masukkan bio';
    return 'Masukkan nomor telepon';
  };

  const getMaxLength = () => {
    if (field === 'name') return 50;
    if (field === 'username') return 30;
    if (field === 'bio') return 150;
    return 15;
  };

  const getInputProps = () => {
    if (field === 'username') {
      return {
        autoCapitalize: 'none' as const,
        autoCorrect: false,
      };
    }
    return {};
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.modalCard, 
                { 
                  backgroundColor: colors.card,
                  transform: [{ translateY }]
                }
              ]}
            >
              <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
              
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {getTitle()}
              </Text>
              
              <TextInput
                style={[styles.modalInput, {
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                  color: colors.text,
                  borderColor: colors.border,
                }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={getPlaceholder()}
                placeholderTextColor={colors.textSecondary}
                multiline={field === 'bio'}
                numberOfLines={field === 'bio' ? 3 : 1}
                autoFocus
                maxLength={getMaxLength()}
                returnKeyType={field === 'bio' ? 'default' : 'done'}
                blurOnSubmit={true}
                {...getInputProps()}
              />
              
              {field === 'bio' && (
                <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                  {value.length}/{getMaxLength()}
                </Text>
              )}
              
              {field === 'username' && (
                <Text style={[styles.helperText, { color: colors.textTertiary }]}>
                  Username harus unik dan tidak mengandung spasi
                </Text>
              )}
              
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0' }]}
                  onPress={onClose}
                >
                  <Text style={[styles.modalBtnText, { color: colors.text }]}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: '#FF6B35' }]} 
                  onPress={onSave}
                >
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Simpan</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};