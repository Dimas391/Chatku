import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/Profile';

interface SectionHeaderProps {
  title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  const { colors } = useTheme();
  return <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title}</Text>;
};