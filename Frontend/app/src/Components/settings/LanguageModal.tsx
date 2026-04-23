import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useLanguage } from '@/app/src/context/LanguageContext';

const { width } = Dimensions.get('window');

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
}

const LanguageModal: React.FC<LanguageModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const handleSelectLanguage = (lang: 'id' | 'en') => {
    setLanguage(lang);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>{t('select_language')}</Text>
                <TouchableOpacity onPress={onClose}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.option,
                  language === 'id' && styles.selectedOption,
                  { borderBottomColor: colors.border }
                ]}
                onPress={() => handleSelectLanguage('id')}
              >
                <View style={styles.optionLeft}>
                  <MaterialCommunityIcons 
                    name="translate" 
                    size={24} 
                    color={language === 'id' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {t('indonesian')}
                  </Text>
                </View>
                {language === 'id' && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.option,
                  language === 'en' && styles.selectedOption,
                  { borderBottomColor: colors.border }
                ]}
                onPress={() => handleSelectLanguage('en')}
              >
                <View style={styles.optionLeft}>
                  <MaterialCommunityIcons 
                    name="translate" 
                    size={24} 
                    color={language === 'en' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {t('english')}
                  </Text>
                </View>
                {language === 'en' && (
                  <MaterialCommunityIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
  },
});

export default LanguageModal;