import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StepIndicator from '@/app/src/Components/StepIndicator';

interface HeaderProps {
  onBackPress?: () => void;
  currentStep?: number;
  totalSteps?: number;
  title?: string;
}

const Header = ({ onBackPress, currentStep = 1, totalSteps = 3 }: HeaderProps) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <MaterialCommunityIcons name="chevron-left" size={28} color="#FF6B35" />
      </TouchableOpacity>
      <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Header;