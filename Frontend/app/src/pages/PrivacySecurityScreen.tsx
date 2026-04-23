import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, View, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';
import SectionHeader from '@/app/src/Components/common/SectionHeader';
import PrivacyOption from '@/app/src/Components/privacy/PrivacyOption';
import SecurityToggle from '@/app/src/Components/privacy/SecurityToggle';
import DeviceItem from '@/app/src/Components/privacy/DeviceItem';
import DangerOption from '@/app/src/Components/privacy/DangerOption';
import FooterNote from '@/app/src/Components/common/FooterNote';
import privacyService from '@/app/src/services/privacyService';
import { BaseScreen } from '@/app/src/Components/BaseScreen';

const PrivacySecurityScreen = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSeen, setLastSeen] = useState('everyone');
  const [profilePhoto, setProfilePhoto] = useState('everyone');
  const [status, setStatus] = useState('everyone');
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicator, setTypingIndicator] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    loadPrivacySettings();
    loadDevices();
  }, []);

  const loadPrivacySettings = async () => {
    setLoading(true);
    try {
      const response = await privacyService.getPrivacySettings();
      if (response.success && response.data) {
        setLastSeen(response.data.last_seen);
        setProfilePhoto(response.data.profile_photo);
        setStatus(response.data.status);
        setReadReceipts(response.data.read_receipts);
        setTypingIndicator(response.data.typing_indicator);
        setTwoFactorAuth(response.data.two_factor_auth);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      const response = await privacyService.getActiveDevices();
      if (response.success && response.data) {
        setDevices(response.data.devices);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const response = await privacyService.updatePrivacySettings({ [key]: value });
      if (response.success) {
        if (key === 'last_seen') setLastSeen(value);
        if (key === 'profile_photo') setProfilePhoto(value);
        if (key === 'status') setStatus(value);
        if (key === 'read_receipts') setReadReceipts(value);
        if (key === 'typing_indicator') setTypingIndicator(value);
        if (key === 'two_factor_auth') setTwoFactorAuth(value);
      } else {
        Alert.alert(t('error'), response.error || t('update_failed'));
      }
    } catch (error) {
      Alert.alert(t('error'), t('something_wrong'));
    } finally {
      setSaving(false);
    }
  };

  const showPrivacyOptions = (title: string, currentValue: string, options: string[], key: string) => {
    Alert.alert(
      title,
      t('who_can_see'),
      options.map(opt => ({
        text: opt,
        onPress: () => {
          let value = opt;
          if (opt === t('everyone')) value = 'everyone';
          if (opt === t('contacts_only')) value = 'contacts';
          if (opt === t('nobody')) value = 'nobody';
          updateSetting(key, value);
        },
      })),
      { cancelable: true }
    );
  };

  const getPrivacyValue = (value: string): string => {
    return value === 'everyone' ? t('everyone') : value === 'contacts' ? t('contacts_only') : t('nobody');
  };

  const handleClearChatHistory = () => {
    Alert.alert(
      t('clear_chat_history'),
      t('clear_chat_warning'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            const response = await privacyService.clearChatHistory();
            if (response.success) {
              Alert.alert(t('success'), t('chat_history_deleted'));
            } else {
              Alert.alert(t('error'), response.error || t('delete_failed'));
            }
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('delete_account'),
      t('delete_account_warning'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete_account'), 
          style: 'destructive',
          onPress: async () => {
            const response = await privacyService.deleteAccount();
            if (response.success) {
              Alert.alert(t('success'), t('account_deleted'));
            } else {
              Alert.alert(t('error'), response.error || t('delete_failed'));
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <BaseScreen>
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* PRIVASI */}
          <SectionHeader title={t('privacy')} />
          
          <PrivacyOption
            icon="eye"
            label={t('last_seen')}
            value={getPrivacyValue(lastSeen)}
            onPress={() => showPrivacyOptions(t('last_seen'), lastSeen, [t('everyone'), t('contacts_only'), t('nobody')], 'last_seen')}
          />
          
          <PrivacyOption
            icon="account"
            label={t('profile_photo')}
            value={getPrivacyValue(profilePhoto)}
            onPress={() => showPrivacyOptions(t('profile_photo'), profilePhoto, [t('everyone'), t('contacts_only'), t('nobody')], 'profile_photo')}
          />
          
          <PrivacyOption
            icon="information"
            label={t('status')}
            value={getPrivacyValue(status)}
            onPress={() => showPrivacyOptions(t('status'), status, [t('everyone'), t('contacts_only'), t('nobody')], 'status')}
          />

          {/* KEAMANAN */}
          <SectionHeader title={t('security')} />
          
          <SecurityToggle
            icon="check-circle"
            label={t('read_receipts')}
            description={t('read_receipts_desc')}
            value={readReceipts}
            onValueChange={(value) => updateSetting('read_receipts', value)}
          />
          
          <SecurityToggle
            icon="keyboard"
            label={t('typing_indicator')}
            description={t('typing_indicator_desc')}
            value={typingIndicator}
            onValueChange={(value) => updateSetting('typing_indicator', value)}
          />
          
          <SecurityToggle
            icon="shield-lock"
            label={t('two_factor_auth')}
            description={t('two_factor_auth_desc')}
            value={twoFactorAuth}
            onValueChange={(value) => updateSetting('two_factor_auth', value)}
          />

          {/* PERANGKAT TERHUBUNG */}
          <SectionHeader title={t('active_devices')} />
          
          {devices.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              {/* <Text style={{ color: colors.textTertiary }}>{t('no_devices')}</Text> */}
            </View>
          ) : (
            devices.map((device: any) => (
              <DeviceItem
                key={device.id}
                name={device.name}
                location={device.location}
                isCurrent={device.is_current}
              />
            ))
          )}

          {/* LAINNYA */}
          <SectionHeader title={t('others')} />
          
          <DangerOption
            icon="chat-remove"
            label={t('clear_chat_history')}
            onPress={handleClearChatHistory}
          />
          
          <DangerOption
            icon="account-remove"
            label={t('delete_account')}
            isDanger
            onPress={handleDeleteAccount}
          />

          <FooterNote text={t('privacy_footer')} />
        </ScrollView>
      </View>
    </BaseScreen>
  );
};

export default PrivacySecurityScreen;