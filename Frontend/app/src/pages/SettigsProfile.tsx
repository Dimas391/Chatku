import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import userService from '@/app/src/services/userService';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';
import { ProfileHeader } from '@/app/src/Components/Profile/ProfileHeader';
import AvatarSection from '@/app/src/Components/Profile/AvatarSection';
import ProfileInfoSection from '@/app/src/Components/Profile/ProfileInfoSection';
import ProfileDetailSection from '@/app/src/Components/Profile/ProfileDetailSection';
import LoadingSpinner from '@/app/src/Components/common/LoadingSpinner';
import { BaseScreen } from '@/app/src/Components/BaseScreen';

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  phone: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    id: '',
    username: '',
    display_name: '',
    avatar_url: '',
    bio: '',
    phone: '',
    email: '',
    is_verified: false,
    created_at: '',
  });
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    bio: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await userService.getMyProfile();
      if (response.success && response.data) {
        setProfile({
          ...profile,
          ...response.data,
          avatar_url: response.data.avatar_url ?? '',
        });
        setFormData({
          display_name: response.data.display_name || '',
          username: response.data.username || '',
          bio: response.data.bio || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert(t('error') || 'Error', t('profile_load_failed') || 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) {
      Alert.alert(t('error') || 'Error', t('name_required') || 'Nama tidak boleh kosong');
      return;
    }

    setSaving(true);
    try {
      const response = await userService.updateProfile({
        display_name: formData.display_name,
        username: formData.username,
        bio: formData.bio,
      });

      if (response.success && response.data) {
        const updatedProfile = {
          ...profile,
          display_name: response.data.display_name || profile.display_name,
          username: response.data.username || profile.username,
          bio: response.data.bio || profile.bio,
        };
        setProfile(updatedProfile);
        setIsEditing(false);
        Alert.alert(t('success') || 'Sukses', t('profile_updated') || 'Profil berhasil diperbarui');
      } else {
        Alert.alert(t('error') || 'Error', response.error || t('update_failed') || 'Gagal memperbarui profil');
      }
    } catch (error) {
      Alert.alert(t('error') || 'Error', t('something_wrong') || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setProfile(prev => ({ ...prev, avatar_url: newAvatarUrl }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <BaseScreen>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ProfileHeader
          isEditing={isEditing}
          isSaving={saving}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          <AvatarSection
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            onAvatarUpdate={handleAvatarUpdate}
          />

          <ProfileInfoSection
            displayName={formData.display_name}
            username={formData.username}
            bio={formData.bio}
            isEditing={isEditing}
            onDisplayNameChange={(text) => setFormData(prev => ({ ...prev, display_name: text }))}
            onUsernameChange={(text) => setFormData(prev => ({ ...prev, username: text }))}
            onBioChange={(text) => setFormData(prev => ({ ...prev, bio: text }))}
          />

          <ProfileDetailSection
            phone={profile.phone}
            email={profile.email}
            isVerified={profile.is_verified}
            createdAt={profile.created_at}
            formatDate={formatDate}
          />
        </ScrollView>
      </View>
    </BaseScreen>
  );
};

export default ProfileScreen;