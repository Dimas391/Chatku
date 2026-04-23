import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

interface AboutFooterProps {
  year?: number;
  license?: string;
}

const AboutFooter: React.FC<AboutFooterProps> = ({
  year = 2026,
  license = 'MIT License',
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* <View style={styles.heartRow}>
        <Text style={[styles.madeWith, { color: colors.textTertiary }]}>Made with </Text>
        <MaterialCommunityIcons name="heart" size={13} color="#FF6B35" />
        <Text style={[styles.madeWith, { color: colors.textTertiary }]}> in Indonesia</Text>
      </View> */}

      {/* <View style={[styles.divider, { backgroundColor: colors.border }]} /> */}

      {/* <Text style={[styles.copyright, { color: colors.textTertiary }]}>
        © {year} ChatKu — {t('all_rights_reserved')}
      </Text> */}
      {/* <View style={[styles.licenseBadge, { borderColor: colors.border }]}>
        <MaterialCommunityIcons name="scale-balance" size={12} color={colors.textTertiary} />
        <Text style={[styles.licenseText, { color: colors.textTertiary }]}>{license}</Text>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  heartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  madeWith: {
    fontSize: 13,
  },
  divider: {
    width: 32,
    height: 1,
    borderRadius: 1,
    marginVertical: 4,
  },
  copyright: {
    fontSize: 12,
  },
  licenseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  licenseText: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default AboutFooter;