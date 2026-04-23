import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';

interface PrivacyParagraphProps {
  children: React.ReactNode;
}

const PrivacyParagraph: React.FC<PrivacyParagraphProps> = ({ children }) => {
  const { colors } = useTheme();

  return <Text style={[styles.text, { color: colors.textSecondary }]}>{children}</Text>;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
});

export default PrivacyParagraph;