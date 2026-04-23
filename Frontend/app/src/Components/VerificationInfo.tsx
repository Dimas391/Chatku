import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface VerificationInfoProps {
  type: 'phone' | 'email';
  value: string;
  countryCode?: string;
  onEdit: () => void;
}

const VerificationInfo = ({ type, value, countryCode, onEdit }: VerificationInfoProps) => {
  const displayValue = type === 'phone' && countryCode
    ? `${countryCode} ${value}` 
    : value;

  return (
    <View style={styles.infoContainer}>
      <Text style={styles.infoTitle}>Masukkan Kode Verifikasi</Text>
      <Text style={styles.infoText}>
        Kami telah mengirimkan kode 6 digit ke
      </Text>
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{displayValue}</Text>
        <TouchableOpacity onPress={onEdit}>
          <MaterialCommunityIcons name="pencil" size={16} color="#FF6B35" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
});

export default VerificationInfo;