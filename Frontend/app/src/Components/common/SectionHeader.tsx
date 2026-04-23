import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';

interface SectionHeaderProps {
  title: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.textTertiary }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default SectionHeader;