// components/profile/InfoDetailRow.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface InfoDetailRowProps {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
  isVerified?: boolean;
}

const InfoDetailRow: React.FC<InfoDetailRowProps> = ({
  icon,
  label,
  value,
  valueColor,
  isVerified = false,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name={icon as any} 
        size={20} 
        color={isVerified ? '#4CAF50' : colors.icon} 
      />
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: valueColor || colors.text }]}>
        {value || '-'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  value: {
    fontSize: 14,
  },
});

export default InfoDetailRow;