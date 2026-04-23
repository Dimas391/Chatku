import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '@/app/src/utils/Security';

export const StatusBanner: React.FC = () => {
  return (
    <View style={[styles.statusBanner, { backgroundColor: '#0d2818' }]}>
      <View style={styles.statusLeft}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' }} />
          <Text style={styles.statusLabel}>SISTEM AMAN</Text>
        </View>
        <Text style={styles.statusTitle}>Enkripsi Aktif</Text>
        <Text style={styles.statusSub}>End-to-End AES-256 + RSA-4096</Text>
      </View>
      <MaterialCommunityIcons name="shield-check" size={52} color="#4CAF50" style={{ opacity: 0.9 }} />
    </View>
  );
};