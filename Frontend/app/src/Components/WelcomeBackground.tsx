import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const WelcomeBackground = () => {
  // Helper function untuk konversi persen ke pixel
  const getPosition = (value: string | undefined, dimension: 'width' | 'height'): number | undefined => {
    if (!value) return undefined;
    if (value.includes('%')) {
      const percent = parseFloat(value) / 100;
      return dimension === 'width' ? width * percent : height * percent;
    }
    return undefined;
  };

  // Generate bubble chat positions dengan nilai absolut
  const bubbles = [
    { size: 60, top: height * 0.1, left: width * 0.05 },
    { size: 40, top: height * 0.2, right: width * 0.08 },
    { size: 80, bottom: height * 0.15, left: width * 0.1 },
    { size: 50, bottom: height * 0.25, right: width * 0.12 },
    { size: 100, top: height * 0.4, right: width * 0.15 },
    { size: 45, bottom: height * 0.4, left: width * 0.15 },
    { size: 70, top: height * 0.6, left: width * 0.08 },
    { size: 55, bottom: height * 0.1, right: width * 0.05 },
  ];

  return (
    <View style={styles.container}>
      {bubbles.map((bubble, index) => (
        <View
          key={index}
          style={[
            styles.bubble,
            {
              width: bubble.size,
              height: bubble.size,
              borderRadius: bubble.size / 2,
              ...(bubble.top !== undefined && { top: bubble.top }),
              ...(bubble.left !== undefined && { left: bubble.left }),
              ...(bubble.right !== undefined && { right: bubble.right }),
              ...(bubble.bottom !== undefined && { bottom: bubble.bottom }),
              opacity: 0.1,
            },
          ]}
        />
      ))}
      
      {/* Bubble chat kecil-kecil dengan posisi random */}
      {[...Array(12)].map((_, i) => {
        const size = 15 + (i % 3) * 5;
        return (
          <View
            key={`small-${i}`}
            style={[
              styles.smallBubble,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                top: Math.random() * height,
                left: Math.random() * width,
                opacity: 0.05,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  smallBubble: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});

export default WelcomeBackground;