import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ResendTimerProps {
  timer: number;
  canResend: boolean;
  onResend: () => void;
}

const ResendTimer = ({ timer, canResend, onResend }: ResendTimerProps) => {
  return (
    <View style={styles.timerContainer}>
      {!canResend ? (
        <Text style={styles.timerText}>
          Kirim ulang kode dalam {String(Math.floor(timer / 60)).padStart(2, '0')}:
          {String(timer % 60).padStart(2, '0')}
        </Text>
      ) : (
        <TouchableOpacity onPress={onResend}>
          <Text style={styles.resendText}>Kirim ulang kode</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 14,
    color: '#999999',
  },
  resendText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default ResendTimer;