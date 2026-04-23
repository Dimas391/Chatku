import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';

interface LoadingStateProps {
  text?: string;
}

const LoadingState = ({ text = 'Memuat...' }: LoadingStateProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textTertiary }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
});

export default LoadingState;