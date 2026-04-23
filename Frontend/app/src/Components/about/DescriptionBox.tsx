import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface DescriptionBoxProps {
  description: string;
}

const DescriptionBox: React.FC<DescriptionBoxProps> = ({ description }) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={[
      styles.container,
      {
        // backgroundColor: isDarkMode ? 'rgba(255,107,53,0.08)' : 'rgba(255,107,53,0.06)',
        borderColor: isDarkMode ? 'rgba(92, 91, 90, 0.2)' : 'rgba(255,107,53,0.15)',
      },
    ]}>
      <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} style={styles.icon} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
});

export default DescriptionBox;