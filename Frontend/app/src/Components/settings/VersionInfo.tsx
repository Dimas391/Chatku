import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';

interface VersionInfoProps {
  version?: string;
}

const VersionInfo: React.FC<VersionInfoProps> = ({ version = '1.0.0' }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.textTertiary }]}>Versi {version}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  text: {
    fontSize: 12,
  },
});

export default VersionInfo;