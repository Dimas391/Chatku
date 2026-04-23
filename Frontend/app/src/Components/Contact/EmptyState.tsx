import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/contact';

interface EmptyStateProps {
  searchQuery: string;
  onAddContact: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery, onAddContact }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons name="account-group" size={50} color="#666" />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {searchQuery ? 'Kontak Tidak Ditemukan' : 'Belum Ada Kontak'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery 
          ? 'Tidak ada kontak yang sesuai dengan pencarian Anda'
          : 'Tambahkan kontak atau undang teman untuk memulai chat'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.emptyButton} onPress={onAddContact}>
          <Text style={styles.emptyButtonText}>Tambah Kontak Baru</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};