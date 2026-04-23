// app/src/Components/call/EmptyState.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface EmptyStateProps {
  onStartCall: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onStartCall }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons name="phone-off" size={64} color="#666" />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Belum Ada Riwayat Panggilan
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Panggilan suara atau video akan muncul di sini
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={onStartCall}>
        <Text style={styles.emptyButtonText}>Mulai Panggilan</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -50,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});