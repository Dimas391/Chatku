import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { ForensicLog } from '@/app/src/hooks/Secuirty';
import { styles } from '@/app/src/utils/Security';

const severityColor = (s: ForensicLog['severity']) => {
  if (s === 'critical') return '#FF4444';
  if (s === 'warning') return '#FFA500';
  return '#4CAF50';
};

const formatRelativeTime = (ts: number): string => {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
  return `${Math.floor(diff / 86400000)} hari lalu`;
};

interface ThreatItemProps {
  log: ForensicLog;
  onPress: (log: ForensicLog) => void;
}

export const ThreatItem: React.FC<ThreatItemProps> = ({ log, onPress }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.threatRow, { backgroundColor: colors.card }]}
      onPress={() => onPress(log)}
    >
      <View style={[styles.threatDot, { backgroundColor: severityColor(log.severity) }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.threatEvent, { color: colors.text }]}>{log.event}</Text>
        <Text style={[styles.threatTime, { color: colors.textSecondary }]}>
          {formatRelativeTime(log.timestamp)}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
};