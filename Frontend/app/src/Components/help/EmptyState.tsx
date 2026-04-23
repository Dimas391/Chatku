import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/StyleHelp';

export const EmptyState: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="help-circle-outline" size={40} color={colors.textSecondary} />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Pertanyaan tidak ditemukan
      </Text>
    </View>
  );
};