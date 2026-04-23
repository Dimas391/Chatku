import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface InfoBoxProps {
  message?: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

const InfoBox = ({ 
  message = 'Dengan mendaftar, Anda akan mendapatkan kode OTP untuk verifikasi',
  iconName = 'information'
}: InfoBoxProps) => {
  return (
    <View style={styles.infoBox}>
      <MaterialCommunityIcons name={iconName} size={16} color="#FF6B35" />
      <Text style={styles.infoText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
});

export default InfoBox;