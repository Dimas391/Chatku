import React from 'react';
import { View, StyleSheet } from 'react-native';
import EditableField from './EditableField';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

interface ProfileInfoSectionProps {
  displayName: string;
  username: string;
  bio: string;
  isEditing: boolean;
  onDisplayNameChange: (text: string) => void;
  onUsernameChange: (text: string) => void;
  onBioChange: (text: string) => void;
}

const ProfileInfoSection: React.FC<ProfileInfoSectionProps> = ({
  displayName,
  username,
  bio,
  isEditing,
  onDisplayNameChange,
  onUsernameChange,
  onBioChange,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EditableField
        icon="account"
        label={t('name')}
        value={displayName}
        isEditing={isEditing}
        onChangeText={onDisplayNameChange}
        placeholder={t('name') || 'Nama lengkap'}
      />
      
      <EditableField
        icon="at"
        label={t('username')}
        value={username}
        isEditing={isEditing}
        onChangeText={onUsernameChange}
        placeholder={t('username') || 'Username'}
      />
      
      <EditableField
        icon="text"
        label={t('bio')}
        value={bio}
        isEditing={isEditing}
        onChangeText={onBioChange}
        placeholder={t('bio') || 'Tulis bio singkat...'}
        multiline
        maxLength={200}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default ProfileInfoSection;