import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import profileService from '@/app/src/services/profileService';

type ProfileSetupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProfileSetup'>;

export const useProfileSetup = () => {
  const navigation = useNavigation<ProfileSetupScreenNavigationProp>();
  
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Nama lengkap harus diisi');
      return false;
    }
    if (!username.trim()) {
      Alert.alert('Error', 'Username harus diisi');
      return false;
    }
    if (username.length < 3) {
      Alert.alert('Error', 'Username minimal 3 karakter');
      return false;
    }
    if (username.includes(' ')) {
      Alert.alert('Error', 'Username tidak boleh mengandung spasi');
      return false;
    }
    return true;
  };

  const handleAvatarChange = (uri: string | null) => {
    setAvatar(uri);
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 1. Update profile data
      const profileResponse = await profileService.updateProfile({
        display_name: displayName,
        username: username.toLowerCase(),
        bio: bio,
      });

      if (!profileResponse.success) {
        throw new Error(profileResponse.error || 'Gagal menyimpan profil');
      }

      // 2. Upload avatar jika ada
      if (avatar) {
        const avatarResponse = await profileService.uploadAvatar(avatar);
        
        if (!avatarResponse.success) {
          throw new Error(avatarResponse.error || 'Gagal mengunggah foto profil');
        }
      }
      
      // Navigasi ke MainTabs (yang berisi ChatScreen)
      Alert.alert(
        'Sukses',
        'Profil berhasil disimpan',
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('MainTabs'),
          },
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan profil. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Lewati?',
      'Anda bisa mengisi profil nanti di pengaturan',
      [
        { text: 'Tetap Isi', style: 'cancel' },
        {
          text: 'Lewati',
          onPress: () => navigation.replace('MainTabs'),
        },
      ]
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return {
    displayName,
    setDisplayName,
    username,
    setUsername,
    bio,
    setBio,
    avatar,
    loading,
    handleAvatarChange,
    handleSaveProfile,
    handleSkip,
    handleBack,
  };
};