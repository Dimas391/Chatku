import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmailInputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  hint?: string;
}

const EmailInputField = ({ 
  value, 
  onChangeText,
  hint = 'Kami akan mengirimkan kode verifikasi ke email Anda'
}: EmailInputFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>Alamat Email</Text>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
      ]}>
        <MaterialCommunityIcons 
          name="email-outline" 
          size={20} 
          color={isFocused ? '#FF6B35' : '#AAAAAA'} 
          style={styles.inputIcon} 
        />
        <TextInput
          style={styles.input}
          placeholder="contoh@email.com"
          placeholderTextColor="#BBBBBB"
          value={value}
          onChangeText={onChangeText}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
  },
  inputContainerFocused: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    paddingVertical: 0,
  },
  inputHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
    marginLeft: 4,
  },
});

export default EmailInputField;