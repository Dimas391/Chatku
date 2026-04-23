import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

interface AnimatedRingProps {
  score: number;
  size: number;
  color: string;
  label: string;
}

export const AnimatedRing: React.FC<AnimatedRingProps> = ({ score, size, color, label }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animValue, { toValue: score, duration: 1200, useNativeDriver: false }).start();
  }, [score]);

  return (
    <View style={{ alignItems: 'center', width: size + 24 }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 4, borderColor: color + '30',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: color + '10',
      }}>
        <View style={{
          width: size - 16, height: size - 16, borderRadius: (size - 16) / 2,
          borderWidth: 3, borderColor: color,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={{ fontSize: size * 0.22, fontWeight: '800', color }}>{score}</Text>
        </View>
      </View>
      <Text style={{ color: '#999', fontSize: 10, marginTop: 6, textAlign: 'center' }}>{label}</Text>
    </View>
  );
};