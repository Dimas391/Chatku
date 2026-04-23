import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface VerificationIllustrationProps {
  type?: 'phone' | 'email';
}

const VerificationIllustration = ({ type = 'phone' }: VerificationIllustrationProps) => {
  return (
    <View style={styles.illustrationContainer}>
      <LinearGradient
        colors={['#FF6B35', '#FF8C5A']}
        style={styles.illustrationCircle}
      >
        <MaterialCommunityIcons 
          name={type === 'phone' ? "cellphone-message" : "email-check"} 
          size={50} 
          color="#FFFFFF" 
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  illustrationCircle: {
    width: 90,
    height: 90,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default VerificationIllustration;