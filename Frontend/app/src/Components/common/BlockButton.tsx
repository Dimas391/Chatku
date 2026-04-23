import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BlockButtonProps {
  onPress: () => void;
}

const BlockButton: React.FC<BlockButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <MaterialCommunityIcons name="block-helper" size={20} color="#FF6B35" />
      <Text style={styles.text}>Blokir Kontak Baru</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#FFF5F0',
  },
  text: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
  },
});

export default BlockButton;