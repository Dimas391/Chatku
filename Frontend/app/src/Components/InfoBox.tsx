import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface InfoBoxProps {
  message?: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

const InfoBox = ({ 
  message = 'Dengan mendaftar, Anda akan mendapatkan kode OTP untuk verifikasi akun Anda.',
  iconName = 'information-outline'
}: InfoBoxProps) => {
  return (
    <View style={styles.infoBox}>
      <MaterialCommunityIcons name={iconName} size={18} color="#FF6B35" />
      <Text style={styles.infoText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3ED',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
});

export default InfoBox;