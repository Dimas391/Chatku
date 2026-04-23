import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/StyleHelp';

export const HeroSection: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.hero, ]}>
      <View style={[styles.heroIcon, { backgroundColor: '#2196F320' }]}>
        <MaterialCommunityIcons name="headset" size={36} color="#FF6B35" />
      </View>
      <Text style={[styles.heroTitle, { color: colors.text }]}>Bantuan & Dukungan</Text>
      <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
        Kami siap membantu Anda 24/7
      </Text>
    </View>
  );
};