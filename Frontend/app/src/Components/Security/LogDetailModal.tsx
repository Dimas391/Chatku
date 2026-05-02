import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
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

interface LogDetailModalProps {
  visible: boolean;
  log: ForensicLog | null;
  onClose: () => void;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ visible, log, onClose }) => {
  const { colors, isDarkMode } = useTheme();

  if (!log) return null;

  const color = severityColor(log.severity);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

          <View style={styles.modalHeader}>
            <View style={[styles.modalBadge, { backgroundColor: color + '25' }]}>
              <MaterialCommunityIcons name={categoryIcon(log.category) as any} size={20} color={color} />
              <Text style={[styles.modalBadgeText, { color }]}>{log.severity.toUpperCase()}</Text>
            </View>
            <Text style={[styles.modalEvent, { color: colors.text }]}>{log.event}</Text>
            <Text style={[styles.modalTime, { color: colors.textSecondary }]}>
              {new Date(log.timestamp).toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={[styles.modalSection, { backgroundColor: isDarkMode ? '#0a0a0a' : '#f5f5f5' }]}>
            <Text style={styles.modalSectionLabel}>DESKRIPSI</Text>
            <Text style={[styles.modalSectionValue, { color: colors.text }]}>{log.detail}</Text>
          </View>

          <View style={[styles.modalSection, { backgroundColor: isDarkMode ? '#0a0a0a' : '#f5f5f5' }]}>
            <Text style={styles.modalSectionLabel}>KATEGORI</Text>
            <Text style={[styles.modalSectionValue, { color: colors.text }]}>
              {log.category.toUpperCase()}
            </Text>
          </View>

          <View style={[styles.modalSection, { backgroundColor: isDarkMode ? '#0a0a0a' : '#f5f5f5' }]}>
            <Text style={styles.modalSectionLabel}>HASH INTEGRITAS (SHA-256)</Text>
            <Text style={[styles.modalSectionValue, { color: '#9C27B0', fontFamily: 'monospace' }]}>
              {log.hash}
            </Text>
          </View>

          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};