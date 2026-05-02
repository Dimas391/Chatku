import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

interface RegisterIllustrationProps {
  subtitle?: string;
}

const RegisterIllustration = ({ 
  subtitle = 'Masukkan email kamu untuk memulai\npercakapan yang aman dan terenkripsi'
}: RegisterIllustrationProps) => {
  return (
    <View style={styles.illustrationContainer}>
      <Image
        source={require('@/assets/register.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.illustrationText}>
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  image: {
    width: '85%',
    height: height * 0.25,
    marginBottom: 14,
  },
  illustrationText: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default RegisterIllustration;