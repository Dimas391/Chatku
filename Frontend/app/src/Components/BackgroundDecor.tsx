import React from 'react';
import { View, StyleSheet } from 'react-native';

const BackgroundDecor = () => {
  return (
    <View style={styles.backgroundContainer}>
      <View style={[styles.decorCircle, styles.decorCircle1]} />
      <View style={[styles.decorCircle, styles.decorCircle2]} />
      <View style={[styles.decorCircle, styles.decorCircle3]} />
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 500,
    backgroundColor: '#FF6B35',
    opacity: 0.05,
  },
  decorCircle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  decorCircle2: {
    width: 200,
    height: 200,
    bottom: 50,
    left: -50,
  },
  decorCircle3: {
    width: 150,
    height: 150,
    bottom: 200,
    right: 20,
  },
});

export default BackgroundDecor;