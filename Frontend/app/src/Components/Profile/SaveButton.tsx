import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SaveButtonProps {
  onPress: () => void;
  loading?: boolean;
  title?: string;
}

const SaveButton = ({ 
  onPress, 
  loading = false, 
  title = 'Simpan & Lanjutkan' 
}: SaveButtonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.saveButtonWrapper}
      disabled={loading}
    >
      <LinearGradient
        colors={loading ? ['#CCCCCC', '#DDDDDD'] : ['#FF6B35', '#FF8C5A']}
        style={styles.saveButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <Text style={styles.saveButtonText}>Menyimpan...</Text>
        ) : (
          <>
            <Text style={styles.saveButtonText}>{title}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  saveButtonWrapper: {
    width: '100%',
    marginBottom: 8,
    shadowColor: '#FF6B35',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default SaveButton;