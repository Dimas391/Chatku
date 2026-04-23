import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TermsCheckboxProps {
  checked: boolean;
  onToggle: () => void;
}

const TermsCheckbox = ({ checked, onToggle }: TermsCheckboxProps) => {
  return (
    <TouchableOpacity 
      style={styles.termsContainer}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
      </View>
      <Text style={styles.termsText}>
        Saya setuju dengan{' '}
        <Text style={styles.termsLink}>Syarat & Ketentuan</Text> dan{' '}
        <Text style={styles.termsLink}>Kebijakan Privasi</Text>
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FF6B35',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#FF6B35',
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    color: '#666666',
    lineHeight: 16,
  },
  termsLink: {
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default TermsCheckbox;