import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface SecurityToggleProps {
  icon: string;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const SecurityToggle: React.FC<SecurityToggleProps> = ({
  icon,
  label,
  description,
  value,
  onValueChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.leftContent}>
        <MaterialCommunityIcons name={icon as any} size={22} color={colors.primary} />
        <View>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {description && <Text style={[styles.description, { color: colors.textTertiary }]}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.textTertiary, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
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
    flex: 1,
  },
  label: {
    fontSize: 16,
  },
  description: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default SecurityToggle;