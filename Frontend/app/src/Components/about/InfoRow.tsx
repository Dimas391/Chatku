import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';

interface InfoRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, isLast = false }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 14,
    flex: 1,
    backgroundColor: 'transparent',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
});

export default InfoRow;