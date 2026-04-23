// components/settings/SettingGroup.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';

interface SettingGroupProps {
  title: string;
  children: React.ReactNode;
}

const SettingGroup = ({ title, children }: SettingGroupProps) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={styles.groupContainer}>
      <Text style={[styles.groupTitle, { color: isDarkMode ? '#FFFFFF' : colors.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  groupContainer: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default SettingGroup;