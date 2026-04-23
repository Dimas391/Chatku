import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RegisterIllustrationProps {
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  title?: string;
  subtitle?: string;
}

const RegisterIllustration = ({ 
  iconName = 'cellphone-message',
  subtitle = 'Masukkan nomor telepon atau email Anda\nuntuk memulai'
}: RegisterIllustrationProps) => {
  return (
    <View style={styles.illustrationContainer}>
      <LinearGradient
        colors={['#FF6B35', '#FF8C5A']}
        style={styles.illustrationCircle}
      >
        <MaterialCommunityIcons name={iconName} size={60} color="#FFFFFF" />
      </LinearGradient>
      <Text style={styles.illustrationText}>
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  illustrationText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RegisterIllustration;