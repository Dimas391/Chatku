import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import InfoDetailRow from './InfoDetailRow';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

interface ProfileDetailSectionProps {
  phone: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  formatDate: (dateString: string) => string;
}

const ProfileDetailSection: React.FC<ProfileDetailSectionProps> = ({
  phone,
  email,
  isVerified,
  createdAt,
  formatDate,
}) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : colors.textSecondary }]}>
        {t('other_info')}
      </Text>
      
      <InfoDetailRow
        icon="phone"
        label={t('phone')}
        value={phone}
      />
      
      <InfoDetailRow
        icon="email"
        label={t('email')}
        value={email}
      />
      
      <InfoDetailRow
        icon="shield-check"
        label={t('verification_status')}
        value={isVerified ? t('verified') : t('not_verified')}
        valueColor={isVerified ? '#4CAF50' : colors.textTertiary}
        isVerified={isVerified}
      />
      
      <InfoDetailRow
        icon="calendar"
        label={t('joined')}
        value={formatDate(createdAt)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
});

export default ProfileDetailSection;