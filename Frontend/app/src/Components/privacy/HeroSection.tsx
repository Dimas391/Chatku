import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/privacy';

export const HeroSection: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.hero, { backgroundColor: '#FF6B350F' }]}>
      <View style={styles.heroIcon}>
        <MaterialCommunityIcons name="shield-check" size={40} color="#FF6B35" />
      </View>
      <Text style={[styles.heroTitle, { color: colors.text }]}>Kebijakan Privasi</Text>
      <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
        Kami berkomitmen melindungi privasi dan keamanan data Anda.
      </Text>
      <View style={[styles.heroBadge, { backgroundColor: '#FF6B3520' }]}>
        <MaterialCommunityIcons name="calendar-check" size={13} color="#FF6B35" />
        <Text style={styles.heroBadgeText}>Berlaku sejak 1 Januari 2025</Text>
      </View>
    </View>
  );
};