import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface PrivacyListItemProps {
  text: string;
}

const PrivacyListItem: React.FC<PrivacyListItemProps> = ({ text }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="circle-small" size={20} color={colors.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});

export default PrivacyListItem;