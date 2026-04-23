import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

interface RecentHeaderProps {
  title?: string;
}

const RecentHeader = ({ title }: RecentHeaderProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Gunakan title dari props atau dari translation
  const headerTitle = title || t('recent_chats') || 'Baru-baru ini';

  return (
    <View style={styles.recentHeader}>
      <Text style={[styles.recentTitle, { color: colors.textTertiary }]}>{headerTitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  recentHeader: {
    paddingVertical: 16,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default RecentHeader;