import React from 'react';
import { Text, StyleSheet } from 'react-native';

export type CallStatusType = 'ringing' | 'connecting' | 'connected' | 'ended';

interface CallStatusProps {
  status: CallStatusType;
  duration?: number;
}

const CallStatus: React.FC<CallStatusProps> = ({ status, duration }) => {
  const getStatusText = () => {
    switch (status) {
      case 'ringing':
        return 'Menelepon...';
      case 'connecting':
        return 'Menghubungkan...';
      case 'connected':
        return `Durasi: ${formatDuration(duration || 0)}`;
      case 'ended':
        return 'Panggilan berakhir';
      default:
        return '';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return <Text style={styles.text}>{getStatusText()}</Text>;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 48,
  },
});

export default CallStatus;