import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface TipsBoxProps {
  tip?: string;
}

const TipsBox = ({ 
  tip = 'Username akan digunakan teman Anda untuk mencari Anda. Pilih username yang mudah diingat!' 
}: TipsBoxProps) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[
      styles.tipsBox, 
      { backgroundColor: isDarkMode ? 'rgba(255, 107, 53, 0.1)' : '#FFF3E0' }
    ]}>
      <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#FF6B35" />
      <Text style={[styles.tipsText, { color: isDarkMode ? colors.text : '#666666' }]}>{tip}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tipsBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 30,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default TipsBox;