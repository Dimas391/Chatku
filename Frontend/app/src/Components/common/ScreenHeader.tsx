import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/app/src/context/ThemeContext';
// 1. Import hook untuk area aman
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  // 2. Ambil data insets (top, bottom, left, right)
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[
      styles.header, 
      { 
        backgroundColor: colors.header,
        borderBottomColor: colors.border,
        // 3. Gunakan insets.top sebagai padding atas
        paddingTop: insets.top, 
      }
    ]}>
      {/* Container tambahan agar konten tetap di tengah setelah dipadding atas */}
      <View style={styles.contentContainer}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        
        {/* Spacer agar title tetap di tengah secara visual */}
        <View style={{ width: 24 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    elevation: 2, // shadow untuk android
    shadowColor: '#000', // shadow untuk ios
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1, 
  },
  backButton: {
    padding: 4,
  }
});

export default ScreenHeader;