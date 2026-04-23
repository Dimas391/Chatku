// screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useLanguage } from '@/app/src/context/LanguageContext';
import SettingGroup from '@/app/src/Components/settings/SettingGroup';
import SettingItem from '@/app/src/Components/settings/SettingItem';
import LogoutButton from '@/app/src/Components/settings/LogoutButton';
import VersionInfo from '@/app/src/Components/settings/VersionInfo';
import LanguageModal from '@/app/src/Components/settings/LanguageModal';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { language, t } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const getLanguageDisplay = () => {
    return language === 'id' ? t('indonesian') : t('english');
  };

  const openLanguageModal = () => {
    setLanguageModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* AKUN */}
        <SettingGroup title={t('account')}>
          <SettingItem
            icon="account-circle"
            label={t('profile')}
            type="link"
            onPress={() => navigation.navigate('Profile' as never)}
          />
          <SettingItem
            icon="shield-account"
            label={t('privacy_security')}
            type="link"
            onPress={() => navigation.navigate('PrivacySecurity' as never)}
          />
        </SettingGroup>

        {/* TAMPILAN */}
        <SettingGroup title={t('appearance')}>
          <SettingItem
            icon="theme-light-dark"
            label={t('dark_mode')}
            type="switch"
            value={isDarkMode}
            onValueChange={toggleTheme}
            subtitle={t('dark_mode_subtitle')}
          />
          <SettingItem
            icon="translate"
            label={t('language')}
            type="select"
            value={getLanguageDisplay()}
            onPress={openLanguageModal}
          />
        </SettingGroup>

        {/* LAINNYA */}
        <SettingGroup title={t('others')}>
          <SettingItem
            icon="information"
            label={t('about')}
            type="link"
            onPress={() => navigation.navigate('About' as never)}
          />
          <SettingItem
            icon="help-circle"
            label={t('help_support')}
            type="link"
            onPress={() => navigation.navigate('HelpSupport' as never)}
          />
          <SettingItem
            icon="file-document"
            label={t('privacy_policy')}
            type="link"
            onPress={() => navigation.navigate('PrivacyPolicy' as never)}
          />
        </SettingGroup>

        {/* LOGOUT */}
        <LogoutButton />

        {/* VERSION */}
        <VersionInfo version="1.0.0" />
      </ScrollView>

      {/* Language Modal */}
      <LanguageModal 
        visible={languageModalVisible} 
        onClose={() => setLanguageModalVisible(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SettingsScreen;