import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface LinkItemProps {
  icon: string;
  label: string;
  url: string;
  iconColor?: string;
  isLast?: boolean;
}

const LinkItem: React.FC<LinkItemProps> = ({
  icon,
  label,
  url,
  iconColor,
  isLast = false,
}) => {
  const { colors } = useTheme();

  const openLink = () => {
    Linking.openURL(url);
  };

  const displayUrl = url.replace(/^https?:\/\//, '');

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
      onPress={openLink}
      activeOpacity={0.65}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor || colors.primary}18` }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={iconColor || colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.url, { color: colors.textTertiary }]}>{displayUrl}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  url: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default LinkItem;