import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/app/src/context/ThemeContext';
// 1. Import useSafeAreaInsets
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsHeaderProps {
  title?: string;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({ title = 'Pengaturan' }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  // 2. Ambil data insets
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.header, 
          borderBottomColor: colors.border,
          // 3. Tambahkan padding atas sesuai tinggi status bar
          paddingTop: insets.top 
        }
      ]}
    >
      <View style={styles.contentContainer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        
        {/* Spacer agar judul tetap di tengah */}
        <View style={{ width: 40 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    // Kita hapus paddingVertical manual agar dikontrol oleh insets dan contentContainer
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56, // Tinggi standar area konten header
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  }
});

export default SettingsHeader;