import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TipsBoxProps {
  tip?: string;
}

const TipsBox = ({ 
  tip = 'Username akan digunakan teman Anda untuk mencari Anda. Pilih username yang mudah diingat!' 
}: TipsBoxProps) => {
  return (
    <View style={styles.tipsBox}>
      <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#FF6B35" />
      <Text style={styles.tipsText}>{tip}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tipsBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    gap: 12,
    alignItems: 'center',
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
});

export default TipsBox;