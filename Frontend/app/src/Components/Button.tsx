import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RegisterButtonProps {
  onPress: () => void;
  title?: string;
  loading?: boolean;
}

const RegisterButton = ({ onPress, title = 'Kirim Kode Verifikasi', loading = false }: RegisterButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.registerButtonWrapper}
      disabled={loading}
    >
      <LinearGradient
        colors={loading ? ['#CCCCCC', '#DDDDDD'] : ['#FF6B35', '#FF8C5A']}
        style={styles.registerButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.registerButtonText}>{title}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  registerButtonWrapper: {
    width: '100%',
    marginBottom: 20,
    shadowColor: '#FF6B35',
    shadowOpacity: 0.3,
    elevation: 5,
  },
  registerButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default RegisterButton;