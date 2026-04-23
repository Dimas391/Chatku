import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from '@/app/src/utils/Profile';

interface ActionButtonsProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onLogout, onDeleteAccount }) => {
  return (
    <View>
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: '#FF6B3510', borderColor: '#FF6B3530' }]}
        onPress={onLogout}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons name="logout" size={20} color="#FF6B35" />
        <Text style={styles.logoutText}>Keluar dari Akun</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: '#FF444408', borderColor: '#FF444425' }]}
        onPress={onDeleteAccount}
        activeOpacity={0.75}
      >
        <MaterialCommunityIcons name="delete-forever" size={20} color="#FF4444" />
        <Text style={styles.deleteText}>Hapus Akun</Text>
      </TouchableOpacity>
    </View>
  );
};