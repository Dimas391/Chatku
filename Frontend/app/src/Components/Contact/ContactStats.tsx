import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/contact';

interface ContactStatsProps {
  count: number;
}

export const ContactStats: React.FC<ContactStatsProps> = ({ count }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.statsContainer}>
      <Text style={[styles.statsText, { color: colors.textSecondary }]}>
        {count} Kontak
      </Text>
    </View>
  );
};