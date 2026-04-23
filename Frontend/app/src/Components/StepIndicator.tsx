import React from 'react';
import { View, StyleSheet } from 'react-native';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator = ({ currentStep, totalSteps }: StepIndicatorProps) => {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            index + 1 === currentStep && styles.stepDotActive,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  stepDotActive: {
    width: 20,
    backgroundColor: '#FF6B35',
  },
});

export default StepIndicator;