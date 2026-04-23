import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WelcomeTagline = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.tagline}>
        Chat cepat, aman, dan simpel
      </Text>
      <Text style={styles.taglineSub}>
        hanya dengan teks
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tagline: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.95,
    letterSpacing: 0.3,
    fontWeight: '500',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  taglineSub: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.85,
    fontWeight: '400',
  },
});

export default WelcomeTagline;