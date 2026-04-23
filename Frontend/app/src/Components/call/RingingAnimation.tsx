import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface RingingAnimationProps {
  children: React.ReactNode;
  isRinging: boolean;
}

const RingingAnimation: React.FC<RingingAnimationProps> = ({ children, isRinging }) => {
  const animationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRinging) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      animationValue.stopAnimation();
      animationValue.setValue(0);
    }

    return () => {
      animationValue.stopAnimation();
    };
  }, [isRinging, animationValue]);

  const ringScale = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <Animated.View style={[styles.container, isRinging && { transform: [{ scale: ringScale }] }]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
});

export default RingingAnimation;