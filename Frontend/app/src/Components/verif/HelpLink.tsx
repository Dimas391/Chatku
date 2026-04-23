import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface HelpLinkProps {
  onPress?: () => void;
  text?: string;
}

const HelpLink = ({ onPress, text = 'Tidak menerima kode?' }: HelpLinkProps) => {
  return (
    <TouchableOpacity style={styles.helpContainer} onPress={onPress}>
      <MaterialCommunityIcons name="help-circle-outline" size={16} color="#999" />
      <Text style={styles.helpText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#999999',
  },
});

export default HelpLink;