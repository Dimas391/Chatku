import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { UserProfile } from '@/app/src/hooks/Profile';
import { styles } from '@/app/src/utils/Profile';

interface ProfileStatsProps {
  profile: UserProfile;
  messageCount?: number;
  contactCount?: number;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  profile,
  messageCount = 0,
  contactCount = 0,
}) => {
  const { colors } = useTheme();

  // Format angka dengan ribuan separator
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
      <View style={[styles.statItem, { borderRightWidth: 1, borderRightColor: colors.border }]}>
        <Text style={[styles.statValue, { color: colors.text }]}>{formatNumber(messageCount)}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pesan</Text>
      </View>
      <View style={[styles.statItem, { borderRightWidth: 1, borderRightColor: colors.border }]}>
        <Text style={[styles.statValue, { color: colors.text }]}>{formatNumber(contactCount)}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Kontak</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: colors.text }]}>{profile.joinedAt}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bergabung</Text>
      </View>
    </View>
  );
};