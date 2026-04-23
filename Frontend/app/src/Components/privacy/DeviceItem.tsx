import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

interface DeviceItemProps {
  name: string;
  location: string;
  isCurrent?: boolean;
  onPress?: () => void;
}

const DeviceItem: React.FC<DeviceItemProps> = ({
  name,
  location,
  isCurrent = false,
  onPress,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity 
      style={[styles.container, { borderBottomColor: colors.border }]} 
      onPress={onPress}
    >
      <View style={styles.deviceInfo}>
        <MaterialCommunityIcons name="cellphone" size={24} color={colors.primary} />
        <View>
          <Text style={[styles.deviceName, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.deviceDetail, { color: colors.textTertiary }]}>{location}</Text>
        </View>
      </View>
      {isCurrent && <Text style={[styles.currentBadge, { color: colors.success }]}>{t('current_device')}</Text>}
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
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '500',
  },
  deviceDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  currentBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default DeviceItem;