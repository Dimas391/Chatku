import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { KeyVerification } from '@/app/src/services/securityService';
import { styles } from '@/app/src/utils/Security';

interface KeyCardProps {
  keyItem: KeyVerification;
  isDarkMode: boolean;
  onVerify: (id: string) => void;
}

export const KeyCard: React.FC<KeyCardProps> = ({ keyItem, isDarkMode, onVerify }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.keyCard, { backgroundColor: colors.card }]}>
      <View style={styles.keyHeader}>
        <View style={[styles.keyAvatar, { backgroundColor: '#FF6B3520' }]}>
          <Text style={styles.keyAvatarText}>{keyItem.contactName.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.keyName, { color: colors.text }]}>{keyItem.contactName}</Text>
          <Text style={[styles.keyAlgo, { color: colors.textSecondary }]}>{keyItem.algorithm}</Text>
        </View>
        <View style={[styles.keyStatus, {
          backgroundColor: keyItem.verified ? '#4CAF5020' : '#FFA50020'
        }]}>
          <MaterialCommunityIcons
            name={keyItem.verified ? 'check-decagram' : 'alert-decagram'}
            size={14}
            color={keyItem.verified ? '#4CAF50' : '#FFA500'}
          />
          <Text style={{ color: keyItem.verified ? '#4CAF50' : '#FFA500', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>
            {keyItem.verified ? 'TERVERIFIKASI' : 'BELUM VERIFIED'}
          </Text>
        </View>
      </View>

      <View style={[styles.fingerprintBox, { backgroundColor: isDarkMode ? '#0a0a0a' : '#f5f5f5' }]}>
        <Text style={styles.fingerprintLabel}>FINGERPRINT</Text>
        <Text style={styles.fingerprintValue}>{keyItem.fingerprint}</Text>
      </View>

      {keyItem.verified ? (
        <View style={styles.keyFooter}>
          <MaterialCommunityIcons name="clock-check-outline" size={12} color="#4CAF50" />
          <Text style={styles.keyVerifiedAt}>Diverifikasi: {keyItem.verifiedAt}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.verifyButton} onPress={() => onVerify(keyItem.id)}>
          <MaterialCommunityIcons name="qrcode-scan" size={16} color="#fff" />
          <Text style={styles.verifyButtonText}>Verifikasi via QR Code</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};