import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PhoneInputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  hint?: string;
}

const PhoneInputField = ({ 
  value, 
  onChangeText, 
  countryCode = '+62',
  onCountryCodeChange,
  hint = 'Kami akan mengirimkan kode verifikasi via WhatsApp/SMS'
}: PhoneInputFieldProps) => {
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>Nomor Telepon</Text>
      <View style={styles.phoneInputContainer}>
        <TouchableOpacity 
          style={styles.countryCodePicker}
          onPress={() => setShowCountryPicker(true)}
        >
          <Text style={styles.countryCodeText}>{countryCode}</Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color="#FF6B35" />
        </TouchableOpacity>
        <TextInput
          style={styles.phoneInput}
          placeholder="812 3456 7890"
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          maxLength={15}
        />
      </View>
      <Text style={styles.inputHint}>{hint}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 6,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    height: 50,
  },
  countryCodePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    height: '100%',
  },
  countryCodeText: {
    fontSize: 14,
    color: '#333333',
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  inputHint: {
    fontSize: 11,
    color: '#999999',
    marginTop: 6,
    marginLeft: 4,
  },
});

export default PhoneInputField;