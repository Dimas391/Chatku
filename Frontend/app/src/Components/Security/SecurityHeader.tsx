import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/Security';

interface SecurityHeaderProps {
  onMenuPress?: () => void;
}

export const SecurityHeader: React.FC<SecurityHeaderProps> = ({ onMenuPress }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <MaterialCommunityIcons name="shield-lock" size={28} color="#FF6B35" />
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Pusat Keamanan</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Security Center</Text>
        </View>
      </View>
      <View style={[styles.headerBadge, { backgroundColor: '#4CAF5015' }]}>
        <View style={styles.headerDot} />
        <Text style={styles.headerBadgeText}>AMAN</Text>
      </View>
    </View>
  );
};