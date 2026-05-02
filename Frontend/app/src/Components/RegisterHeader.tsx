import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RegisterHeaderProps {
  title?: string;
  onBackPress: () => void;
}

const RegisterHeader = ({ title = 'Daftar Akun', onBackPress }: RegisterHeaderProps) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <MaterialCommunityIcons name="chevron-left" size={28} color="#FF6B35" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF3ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 42,
  },
});

export default RegisterHeader;