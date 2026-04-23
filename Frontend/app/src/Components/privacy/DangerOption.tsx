import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface DangerOptionProps {
  icon: string;
  label: string;
  isDanger?: boolean;
  onPress: () => void;
}

const DangerOption: React.FC<DangerOptionProps> = ({
  icon,
  label,
  isDanger = false,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.container, { borderBottomColor: colors.border }]} 
      onPress={onPress}
    >
      <View style={styles.leftContent}>
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={isDanger ? '#FF4444' : colors.primary}
        />
        <Text style={[
          styles.label, 
          { color: colors.text },
          isDanger && styles.dangerText
        ]}>
          {label}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
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
  dangerText: {
    color: '#FF4444',
  },
});

export default DangerOption;