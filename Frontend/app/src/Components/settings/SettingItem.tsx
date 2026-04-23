import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface SettingItemProps {
  icon: string;
  label: string;
  type?: 'switch' | 'select' | 'link';
  value?: boolean | string;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  subtitle?: string;
  disabled?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  label,
  type = 'switch',
  value,
  onValueChange,
  onPress,
  subtitle,
  disabled = false,
}) => {
  const { colors, isDarkMode } = useTheme();

  const renderRightContent = () => {
    switch (type) {
      case 'switch':
        return (
          <Switch
            value={value as boolean}
            onValueChange={onValueChange}
            trackColor={{ false: colors.textTertiary, true: colors.primary }}
            thumbColor="#fff"
            disabled={disabled}
          />
        );
      case 'select':
        return (
          <View style={styles.selectValue}>
            <Text style={[styles.selectText, { color: colors.textSecondary }]}>{value as string}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
          </View>
        );
      case 'link':
        return <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
    style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
    onPress={onPress}
    activeOpacity={(type === 'link' || type === 'select') ? 0.7 : 1}
    disabled={(type !== 'link' && type !== 'select') || disabled} 
  >
      <View style={styles.leftContent}>
        <MaterialCommunityIcons name={icon as any} size={24} color={colors.primary} />
        <View>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>}
        </View>
      </View>
      {renderRightContent()}
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
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  selectValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectText: {
    fontSize: 14,
  },
});

export default SettingItem;