import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface EmptyStateProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
}

const EmptyState = ({ icon, title, subtitle }: EmptyStateProps) => {
  const { colors, isDarkMode } = useTheme();

  // Warna icon yang lebih soft untuk dark mode
  const iconColor = isDarkMode ? '#2C2C2C' : '#FFE4D6';

  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name={icon} size={60} color={iconColor} />
      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{title}</Text>
      <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EmptyState;