import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';

interface AboutSectionProps {
  title: string;
  children: React.ReactNode;
}

const AboutSection: React.FC<AboutSectionProps> = ({ title, children }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={[styles.accent, { backgroundColor: colors.primary }]} />
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          {title.toUpperCase()}
        </Text>
      </View>

      {/* Content - Langsung, tanpa card background */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    marginLeft: 16,
  },
  accent: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  content: {
    backgroundColor: 'transparent', 
  },
});

export default AboutSection;