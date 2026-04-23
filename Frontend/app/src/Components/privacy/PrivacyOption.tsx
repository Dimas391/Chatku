import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface PrivacyOptionProps {
  icon: string;
  label: string;
  value: string;
  onPress: () => void;
}

const PrivacyOption: React.FC<PrivacyOptionProps> = ({
  icon,
  label,
  value,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.container, { borderBottomColor: colors.border }]} 
      onPress={onPress}
    >
      <View style={styles.leftContent}>
        <MaterialCommunityIcons name={icon as any} size={22} color={colors.primary} />
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={[styles.value, { color: colors.textTertiary }]}>{value}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 16,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 14,
  },
});

export default PrivacyOption;