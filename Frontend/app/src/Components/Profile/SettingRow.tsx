import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/Profile';

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  iconColor = '#FF6B35',
  label,
  sublabel,
  onPress,
  rightElement,
  danger = false,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightElement}
    >
      <View
        style={[
          styles.settingIcon,
          { 
            backgroundColor: iconColor + '18' 
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={danger ? '#FF4444' : iconColor}
        />
      </View>

      <View style={styles.settingLabel}>
        <Text style={[styles.settingLabelText, { color: danger ? '#FF4444' : colors.text }]}>
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.settingSubLabel, { color: colors.textSecondary }]}>
            {sublabel}
          </Text>
        )}
      </View>

      {rightElement ?? (onPress && <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />)}
    </TouchableOpacity>
  );
};