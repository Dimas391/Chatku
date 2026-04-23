import React, { useEffect } from 'react';
import { View, TextInput, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface OTPInputProps {
  otp: string[];
  onChange: (text: string, index: number) => void;
  onKeyPress: (e: any, index: number) => void;
  editable?: boolean;
  inputRefs: React.MutableRefObject<(TextInput | null)[]>; // Tambahkan ini
}

const OTPInput = ({ 
  otp, 
  onChange, 
  onKeyPress, 
  editable = true,
  inputRefs  // Terima refs dari parent
}: OTPInputProps) => {

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  return (
    <View style={styles.otpContainer}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          style={[
            styles.otpInput,
            digit && styles.otpInputFilled
          ]}
          value={digit}
          onChangeText={(text) => onChange(text, index)}
          onKeyPress={(e) => onKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          editable={editable}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: (width - 68) / 6,
    height: 55,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  otpInputFilled: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF3E0',
  },
});

export default OTPInput;