import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { ForensicLog } from '@/app/src/services/securityService';
import { styles } from '@/app/src/utils/Security';

const severityColor = (s: ForensicLog['severity']) => {
  if (s === 'critical') return '#FF4444';
  if (s === 'warning') return '#FFA500';
  return '#4CAF50';
};

const categoryIcon = (c: ForensicLog['category']): string => {
  const map: Record<ForensicLog['category'], string> = {
    auth: 'account-lock',
    crypto: 'lock-outline',
    network: 'wifi-lock',
    integrity: 'shield-check',
    access: 'shield-alert',
  };
  return map[c];
};

const formatRelativeTime = (ts: number): string => {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Baru saja';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
  return `${Math.floor(diff / 86400000)} hari lalu`;
};

interface LogItemProps {
  log: ForensicLog;
  onPress: (log: ForensicLog) => void;
}

export const LogItem: React.FC<LogItemProps> = ({ log, onPress }) => {
  const { colors } = useTheme();
  const color = severityColor(log.severity);

  return (
    <TouchableOpacity
      style={[styles.logRow]}
      onPress={() => onPress(log)}
      activeOpacity={0.75}
    >
      <View style={[styles.logBar, { backgroundColor: color }]} />
      <View style={[styles.logIcon, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={categoryIcon(log.category) as any} size={18} color={color} />
      </View>
      <View style={styles.logContent}>
        <Text style={[styles.logEvent, { color: colors.text }]}>{log.event}</Text>
        <Text style={[styles.logDetail, { color: colors.textSecondary }]} numberOfLines={1}>
          {log.detail}
        </Text>
        <Text style={[styles.logHash, { color: '#555' }]} numberOfLines={1}>
          {log.hash}
        </Text>
      </View>
      <Text style={[styles.logTime, { color: colors.textSecondary }]}>
        {formatRelativeTime(log.timestamp)}
      </Text>
    </TouchableOpacity>
  );
};