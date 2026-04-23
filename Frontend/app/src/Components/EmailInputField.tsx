import React from 'react';
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
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>Alamat Email</Text>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="email-outline" size={20} color="#FF6B35" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="contoh@email.com"
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    paddingVertical: 0,
  },
  inputHint: {
    fontSize: 11,
    color: '#999999',
    marginTop: 6,
    marginLeft: 4,
  },
});

export default EmailInputField;